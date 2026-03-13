"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitOperatorRuntimeEvent = void 0;
exports.emitRuntimeEvent = emitRuntimeEvent;
exports.getRunExplorer = getRunExplorer;
exports.getSystemHealthSnapshot = getSystemHealthSnapshot;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
async function emitRuntimeEvent(event) {
    try {
        await (0, db_1.query)(`INSERT INTO operator_runtime_events (
        event_type,
        tenant_id,
        run_id,
        records_processed,
        duration_ms,
        classification_counts,
        manual_review_count,
        error_id,
        metadata,
        occurred_at,
        created_at
      ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb,$10,NOW())`, [
            event.eventType,
            event.tenantId,
            event.runId ?? null,
            event.recordsProcessed ?? null,
            event.durationMs ?? null,
            JSON.stringify(event.classificationCounts ?? {}),
            event.manualReviewCount ?? null,
            event.errorId ?? null,
            JSON.stringify(event.metadata ?? {}),
            event.occurredAt ?? new Date(),
        ]);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to persist operator runtime event", error, {
            eventType: event.eventType,
            tenantId: event.tenantId,
            runId: event.runId,
        });
    }
}
exports.emitOperatorRuntimeEvent = emitRuntimeEvent;
async function getRunExplorer(tenantId, filters) {
    const rows = await (0, db_1.queryWithTenant)(tenantId, `SELECT
      r.id::text as run_id,
      r.tenant_id::text as tenant_id,
      COALESCE(r.source_count, 0) as records_processed,
      CASE WHEN COALESCE(r.source_count, 0) > 0 THEN ROUND((COALESCE(r.matched_count, 0)::numeric / r.source_count::numeric) * 100, 2) ELSE 0 END as match_rate,
      (
        SELECT COUNT(*)::int
        FROM reconciliation_matches m
        WHERE m.run_id = r.id
          AND m.tenant_id = r.tenant_id
          AND m.reviewed = false
          AND m.match_type IN ('manual', 'unmatched')
      ) as manual_review_count,
      COALESCE(
        EXTRACT(EPOCH FROM (COALESCE(r.completed_at, NOW()) - COALESCE(r.started_at, r.created_at))) * 1000,
        0
      )::int as duration_ms,
      r.status as execution_status,
      COALESCE(r.started_at, r.created_at) as started_at,
      r.completed_at,
      r.error_message
    FROM reconciliation_runs r
    WHERE r.tenant_id = $1
      AND ($2::text IS NULL OR r.status = $2::text)
      AND ($3::text IS NULL OR r.id::text = $3::text)
    ORDER BY COALESCE(r.started_at, r.created_at) DESC
    LIMIT $4`, [tenantId, filters.status ?? null, filters.runId ?? null, Math.min(filters.limit ?? 50, 200)]);
    return rows.map((r) => ({
        runId: r.run_id,
        tenantId: r.tenant_id,
        recordsProcessed: r.records_processed,
        matchRate: Number(r.match_rate),
        manualReviewCount: r.manual_review_count,
        durationMs: r.duration_ms,
        executionStatus: r.execution_status,
        startedAt: r.started_at.toISOString(),
        completedAt: r.completed_at ? r.completed_at.toISOString() : null,
        errorMessage: r.error_message,
    }));
}
async function getSystemHealthSnapshot(tenantId, days = 7) {
    const [runStats] = await (0, db_1.queryWithTenant)(tenantId, `WITH base_runs AS (
      SELECT
        r.id,
        r.status,
        COALESCE(r.source_count, 0) as records_processed,
        COALESCE(r.matched_count, 0) as matched_count,
        COALESCE(EXTRACT(EPOCH FROM (COALESCE(r.completed_at, NOW()) - COALESCE(r.started_at, r.created_at))) * 1000, 0)::numeric as duration_ms,
        (
          SELECT COUNT(*)::numeric
          FROM reconciliation_matches m
          WHERE m.run_id = r.id
            AND m.tenant_id = r.tenant_id
            AND m.reviewed = false
            AND m.match_type IN ('manual', 'unmatched')
        ) as manual_review_count
      FROM reconciliation_runs r
      WHERE r.tenant_id = $1
        AND COALESCE(r.started_at, r.created_at) >= NOW() - ($2::int || ' days')::interval
    )
    SELECT
      COALESCE(COUNT(*)::numeric / GREATEST($2::numeric, 1), 0) as runs_per_day,
      COALESCE(SUM(records_processed), 0)::numeric as records_processed,
      COALESCE((SUM(matched_count)::numeric / NULLIF(SUM(records_processed), 0)) * 100, 0) as match_rate,
      COALESCE((SUM(manual_review_count)::numeric / NULLIF(SUM(records_processed), 0)) * 100, 0) as manual_review_rate,
      COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms), 0) as run_duration_p50,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0) as run_duration_p95,
      COALESCE((COUNT(*) FILTER (WHERE status = 'failed')::numeric / NULLIF(COUNT(*), 0)) * 100, 0) as run_failure_rate
    FROM base_runs`, [tenantId, days]);
    const [apiStats] = await (0, db_1.query)(`SELECT
      COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms), 0) as p50_latency,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) as p95_latency,
      COALESCE((COUNT(*) FILTER (WHERE status_code >= 500)::numeric / NULLIF(COUNT(*), 0)) * 100, 0) as error_rate
    FROM request_metrics
    WHERE tenant_id = $1
      AND created_at >= NOW() - ($2::int || ' days')::interval`, [tenantId, days]);
    return {
        runsPerDay: Number(runStats?.runs_per_day ?? 0),
        recordsProcessed: Number(runStats?.records_processed ?? 0),
        matchRate: Number(runStats?.match_rate ?? 0),
        manualReviewRate: Number(runStats?.manual_review_rate ?? 0),
        runDurationMsP50: Number(runStats?.run_duration_p50 ?? 0),
        runDurationMsP95: Number(runStats?.run_duration_p95 ?? 0),
        runFailureRate: Number(runStats?.run_failure_rate ?? 0),
        apiLatencyMsP50: Number(apiStats?.p50_latency ?? 0),
        apiLatencyMsP95: Number(apiStats?.p95_latency ?? 0),
        errorRate: Number(apiStats?.error_rate ?? 0),
    };
}
//# sourceMappingURL=runtime-events.js.map