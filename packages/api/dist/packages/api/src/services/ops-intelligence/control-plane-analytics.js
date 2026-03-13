"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlatformOverview = buildPlatformOverview;
exports.loadTenantTelemetry = loadTenantTelemetry;
const db_1 = require("../../db");
function percentile(values, p) {
    if (!values.length)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx] ?? 0;
}
function trend(before, after) {
    const delta = after - before;
    if (Math.abs(delta) < Math.max(5, before * 0.05))
        return "stable";
    return delta > 0 ? "degrading" : "improving";
}
function buildPlatformOverview(records) {
    const total = records.length;
    const successes = records.filter((r) => r.status === "success").length;
    const failed = records.filter((r) => r.status === "failed");
    const replays = records.filter((r) => r.isReplay).length;
    const latencies = records.map((r) => r.latencyMs);
    const queueLatencies = records.map((r) => r.queueMs);
    const failureTrends = {};
    for (const row of failed) {
        const key = row.failureClass || "UNCLASSIFIED";
        failureTrends[key] = (failureTrends[key] || 0) + 1;
    }
    const executionWindowMinutes = Math.max(1, Math.ceil((Date.now() -
        (records.reduce((min, r) => Math.min(min, new Date(r.timestamp).getTime()), Date.now()) ||
            Date.now())) /
        60000));
    const firstHalf = records.slice(0, Math.floor(total / 2));
    const secondHalf = records.slice(Math.floor(total / 2));
    const firstLatency = firstHalf.length
        ? firstHalf.reduce((acc, r) => acc + r.latencyMs, 0) / firstHalf.length
        : 0;
    const secondLatency = secondHalf.length
        ? secondHalf.reduce((acc, r) => acc + r.latencyMs, 0) / secondHalf.length
        : 0;
    const firstUtil = firstHalf.length
        ? firstHalf.reduce((acc, r) => acc + r.computeMs + r.queueMs, 0) / firstHalf.length
        : 0;
    const secondUtil = secondHalf.length
        ? secondHalf.reduce((acc, r) => acc + r.computeMs + r.queueMs, 0) / secondHalf.length
        : 0;
    const mttrMinutes = failed.length
        ? failed.reduce((acc, r) => acc + Math.max(1, Math.round(r.queueMs / 60000)), 0) / failed.length
        : 0;
    const endpointAdoptionMap = {};
    records.forEach((r) => {
        const endpoint = r.component || "unknown";
        endpointAdoptionMap[endpoint] = (endpointAdoptionMap[endpoint] || 0) + 1;
    });
    const workflowStats = new Map();
    records.forEach((r) => {
        const key = r.workflowKey || "default";
        const current = workflowStats.get(key) || {
            total: 0,
            failed: 0,
            latency: 0,
            resources: 0,
            compute: 0,
        };
        current.total += 1;
        current.failed += r.status === "failed" ? 1 : 0;
        current.latency += r.latencyMs;
        current.resources += r.storageBytes + r.networkEgressBytes + r.loggingBytes;
        current.compute += r.computeMs;
        workflowStats.set(key, current);
    });
    const totalCost = records.reduce((acc, r) => {
        const compute = (r.computeMs / 1000) * 0.00002;
        const queue = (r.queueMs / 1000) * 0.000005;
        const storage = (r.storageBytes / 1_000_000_000) * 0.02;
        const network = (r.networkEgressBytes / 1_000_000_000) * 0.09;
        const logging = (r.loggingBytes / 1_000_000_000) * 0.5;
        return acc + compute + queue + storage + network + logging;
    }, 0);
    const policyViolationCount = records.reduce((acc, r) => acc + r.policyViolationCount, 0);
    const recommendations = [];
    if (trend(firstLatency, secondLatency) === "degrading") {
        recommendations.push({
            type: "scaling",
            reason: "Latency trend is degrading across the selected interval",
            evidence: `avg_latency_first=${firstLatency.toFixed(2)} avg_latency_second=${secondLatency.toFixed(2)}`,
        });
    }
    if (policyViolationCount > 0) {
        recommendations.push({
            type: "policy",
            reason: "Policy violations detected in execution stream",
            evidence: `violations=${policyViolationCount}`,
        });
    }
    if ((failureTrends["QUEUE_LOCK_STALE"] || 0) > 3) {
        recommendations.push({
            type: "reliability",
            reason: "Recurring stale queue lock failures",
            evidence: `QUEUE_LOCK_STALE=${failureTrends["QUEUE_LOCK_STALE"]}`,
        });
    }
    const controlledAutoRemediation = [];
    if ((failureTrends["IDEMPOTENT_RETRYABLE"] || 0) > 0) {
        controlledAutoRemediation.push({
            action: "retry_idempotent_jobs",
            reason: "Detected retryable idempotent failures",
            maxRetries: 3,
        });
    }
    if ((failureTrends["QUEUE_LOCK_STALE"] || 0) > 0) {
        controlledAutoRemediation.push({
            action: "clear_stale_queue_locks",
            reason: "Stale lock failures observed",
            maxRetries: 1,
        });
    }
    return {
        telemetry: {
            systemHealth: total ? Number(((successes / total) * 100).toFixed(2)) : 100,
            executionThroughputPerMinute: Number((total / executionWindowMinutes).toFixed(2)),
            replayRate: total ? Number(((replays / total) * 100).toFixed(2)) : 0,
            policyViolations: policyViolationCount,
            failureTrends,
            infrastructureUtilization: {
                avgLatencyMs: total
                    ? Number((latencies.reduce((acc, v) => acc + v, 0) / total).toFixed(2))
                    : 0,
                p95LatencyMs: percentile(latencies, 95),
                avgQueueMs: total
                    ? Number((queueLatencies.reduce((acc, v) => acc + v, 0) / total).toFixed(2))
                    : 0,
            },
        },
        analytics: {
            executionSuccessRate: total ? Number(((successes / total) * 100).toFixed(2)) : 100,
            mttrMinutes: Number(mttrMinutes.toFixed(2)),
            failureRecurrenceClusters: Object.entries(failureTrends)
                .map(([failureClass, occurrences]) => ({ failureClass, occurrences }))
                .sort((a, b) => b.occurrences - a.occurrences),
            apiEndpointAdoption: Object.entries(endpointAdoptionMap)
                .map(([endpoint, count]) => ({ endpoint, count }))
                .sort((a, b) => b.count - a.count),
            latencyTrend: trend(firstLatency, secondLatency),
            infrastructureTrend: trend(firstUtil, secondUtil),
        },
        costs: {
            perExecutionAverageUsd: total ? Number((totalCost / total).toFixed(6)) : 0,
            totalUsd: Number(totalCost.toFixed(4)),
            byTenantUsd: Number(totalCost.toFixed(4)),
        },
        autonomousOperations: {
            recommendations,
            controlledAutoRemediation,
        },
        leaderboard: Array.from(workflowStats.entries())
            .map(([workflowKey, s]) => {
            const avgLatency = s.latency / s.total;
            const failureRate = (s.failed / s.total) * 100;
            const efficiency = 100 - Math.min(100, avgLatency / 50) - failureRate;
            const resourceScore = Math.max(0, 100 - (s.resources / s.total) * 0.00001);
            return {
                workflowKey,
                executionEfficiency: Number(efficiency.toFixed(2)),
                failureRate: Number(failureRate.toFixed(2)),
                latencyScore: Number((100 - Math.min(100, avgLatency / 50)).toFixed(2)),
                resourceUtilizationScore: Number(resourceScore.toFixed(2)),
            };
        })
            .sort((a, b) => b.executionEfficiency - a.executionEfficiency),
    };
}
async function loadTenantTelemetry(tenantId, days) {
    const records = await (0, db_1.queryWithTenant)(tenantId, `SELECT
      e.id::text as execution_id,
      e.tenant_id::text as tenant_id,
      COALESCE(e.trace_id::text, '') as trace_id,
      COALESCE(e.started_at, e.created_at) as started_at,
      COALESCE(j.path, 'execution') as component,
      CASE WHEN e.status IN ('completed', 'success') THEN 'success'
           WHEN e.status IN ('failed', 'error') THEN 'failed'
           ELSE 'running' END as status,
      COALESCE(e.duration_ms, EXTRACT(EPOCH FROM (COALESCE(e.completed_at, NOW()) - COALESCE(e.started_at, e.created_at))) * 1000)::int as duration_ms,
      COALESCE(e.queue_time_ms, 0)::int as queue_delay_ms,
      COALESCE(e.duration_ms, 0)::int as compute_ms,
      COALESCE(e.result_size_bytes, 0)::bigint as storage_bytes,
      COALESCE(e.network_egress_bytes, 0)::bigint as network_egress_bytes,
      COALESCE(e.log_bytes, 0)::bigint as logging_bytes,
      COALESCE(e.is_replay, false) as is_replay,
      COALESCE(e.policy_violations, 0)::int as policy_violations,
      e.failure_classification as failure_class,
      COALESCE(j.name, 'default') as workflow_key
    FROM executions e
    LEFT JOIN jobs j ON e.job_id = j.id
    WHERE e.tenant_id = $1
      AND COALESCE(e.started_at, e.created_at) >= NOW() - ($2::int || ' days')::interval
    ORDER BY COALESCE(e.started_at, e.created_at) ASC`, [tenantId, days]);
    return records.map((r) => ({
        executionId: r.execution_id,
        tenantId: r.tenant_id,
        traceId: r.trace_id || r.execution_id,
        timestamp: r.started_at.toISOString(),
        component: r.component,
        status: r.status || "running",
        latencyMs: r.duration_ms || 0,
        queueMs: r.queue_delay_ms || 0,
        computeMs: r.compute_ms || 0,
        storageBytes: r.storage_bytes || 0,
        networkEgressBytes: r.network_egress_bytes || 0,
        loggingBytes: r.logging_bytes || 0,
        isReplay: Boolean(r.is_replay),
        policyViolationCount: r.policy_violations || 0,
        failureClass: r.failure_class || undefined,
        workflowKey: r.workflow_key || undefined,
    }));
}
//# sourceMappingURL=control-plane-analytics.js.map