"use strict";
/**
 * Daily Intelligence Service
 * Aggregates key operational metrics for operator visibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorRateSummary = getErrorRateSummary;
exports.getSlowEndpoints = getSlowEndpoints;
exports.getFailedIngestions = getFailedIngestions;
exports.getBillingAnomalies = getBillingAnomalies;
exports.generateDailyIntelligence = generateDailyIntelligence;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
function buildTenantPredicate(tenantId) {
    if (!tenantId) {
        return { clause: "", params: [] };
    }
    return {
        clause: " AND tenant_id = $3",
        params: [tenantId],
    };
}
/**
 * Get error rate summary for the last 24 hours
 */
async function getErrorRateSummary(date = new Date(), tenantId) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date();
    }
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    const tenantPredicate = buildTenantPredicate(tenantId);
    try {
        // Get error rates from audit logs
        const errorStats = await (0, db_1.query)(`SELECT 
        method,
        path,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
        COUNT(*) as total_count
      FROM audit_logs
      WHERE timestamp >= $1 AND timestamp <= $2
        ${tenantPredicate.clause}
        AND method IS NOT NULL
        AND path IS NOT NULL
      GROUP BY method, path
      ORDER BY error_count DESC
      LIMIT 50`, [startDate, endDate, ...tenantPredicate.params]);
        let totalErrors = 0;
        let totalRequests = 0;
        const byEndpoint = (errorStats || [])
            .map((stat) => {
            if (!stat || stat.method === null || stat.path === null) {
                return null;
            }
            const errorCount = Number(stat.error_count) || 0;
            const totalCount = Number(stat.total_count) || 0;
            totalErrors += errorCount;
            totalRequests += totalCount;
            return {
                method: String(stat.method),
                route: String(stat.path),
                errorRate: totalCount > 0 ? errorCount / totalCount : 0,
                errorCount,
                totalRequests: totalCount,
            };
        })
            .filter((item) => item !== null);
        return {
            overall: totalRequests > 0 ? totalErrors / totalRequests : 0,
            byEndpoint,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get error rate summary", error);
        return { overall: 0, byEndpoint: [] };
    }
}
/**
 * Get slow endpoints (P50, P95, P99 latencies)
 */
async function getSlowEndpoints(date = new Date(), tenantId) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date();
    }
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    const tenantPredicate = buildTenantPredicate(tenantId);
    try {
        // Get latency stats from audit logs (if we're tracking duration)
        // For now, we'll use a simplified approach based on status codes and timestamps
        // In production, you'd want to track actual request durations
        const endpointStats = await (0, db_1.query)(`SELECT 
        method,
        path,
        COUNT(*) as request_count,
        AVG(EXTRACT(EPOCH FROM (updated_at - timestamp)) * 1000) as avg_duration_ms
      FROM audit_logs
      WHERE timestamp >= $1 AND timestamp <= $2
        ${tenantPredicate.clause}
        AND method IS NOT NULL
        AND path IS NOT NULL
        AND status_code < 400
      GROUP BY method, path
      HAVING COUNT(*) >= 10
      ORDER BY avg_duration_ms DESC NULLS LAST
      LIMIT 20`, [startDate, endDate, ...tenantPredicate.params]);
        // For now, we'll estimate percentiles based on average
        // In production, you'd want to store actual histogram data
        return (endpointStats || [])
            .map((stat) => {
            if (!stat || stat.method === null || stat.path === null) {
                return null;
            }
            const avgDuration = Number(stat.avg_duration_ms) || 0;
            const requestCount = Number(stat.request_count) || 0;
            return {
                method: String(stat.method),
                route: String(stat.path),
                p50: Math.max(0, avgDuration * 0.7), // Estimate
                p95: Math.max(0, avgDuration * 1.5), // Estimate
                p99: Math.max(0, avgDuration * 2.0), // Estimate
                requestCount,
            };
        })
            .filter((item) => item !== null);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get slow endpoints", error);
        return [];
    }
}
/**
 * Get failed ingestions for the last 24 hours
 */
async function getFailedIngestions(date = new Date(), tenantId) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date();
    }
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    const tenantPredicate = buildTenantPredicate(tenantId);
    try {
        const failed = await (0, db_1.query)(`SELECT 
        id,
        source_id,
        tenant_id,
        error_message,
        updated_at,
        trace_id
      FROM ingestions
      WHERE status = 'failed'
        AND updated_at >= $1 AND updated_at <= $2
        ${tenantPredicate.clause}
      ORDER BY updated_at DESC
      LIMIT 100`, [startDate, endDate, ...tenantPredicate.params]);
        return (failed || [])
            .map((ingestion) => {
            if (!ingestion || !ingestion.id) {
                return null;
            }
            const updatedAt = ingestion.updated_at instanceof Date
                ? ingestion.updated_at
                : new Date(ingestion.updated_at);
            return {
                ingestionId: String(ingestion.id),
                sourceId: String(ingestion.source_id || ""),
                tenantId: String(ingestion.tenant_id || ""),
                errorMessage: ingestion.error_message || "Unknown error",
                failedAt: updatedAt.toISOString(),
                traceId: ingestion.trace_id || undefined,
            };
        })
            .filter((item) => item !== null);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get failed ingestions", error);
        return [];
    }
}
/**
 * Detect billing anomalies
 */
async function getBillingAnomalies(date = new Date(), tenantId) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date();
    }
    try {
        // Get usage aggregates for today
        const dateStr = date.toISOString().split("T")[0];
        if (!dateStr) {
            return [];
        }
        const tenantPredicate = tenantId ? " AND tenant_id = $2" : "";
        const tenantParams = tenantId ? [tenantId] : [];
        const todayUsage = await (0, db_1.query)(`SELECT 
        billing_account_id,
        tenant_id,
        SUM(total_quantity) as total_quantity,
        event_type
      FROM usage_aggregate_daily
      WHERE date = $1
      ${tenantPredicate}
      GROUP BY billing_account_id, tenant_id, event_type`, [dateStr, ...tenantParams]);
        // Get average usage for the last 7 days (excluding today)
        const startDateStr = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
        const endDateStr = date.toISOString().split("T")[0];
        if (!startDateStr || !endDateStr) {
            return [];
        }
        const historicalTenantPredicate = tenantId ? " AND tenant_id = $3" : "";
        const historicalAvg = await (0, db_1.query)(`SELECT 
        billing_account_id,
        tenant_id,
        AVG(total_quantity) as avg_quantity,
        event_type
      FROM usage_aggregate_daily
      WHERE date >= $1 AND date < $2
      ${historicalTenantPredicate}
      GROUP BY billing_account_id, tenant_id, event_type`, [startDateStr, endDateStr, ...tenantParams]);
        const anomalies = [];
        for (const today of todayUsage || []) {
            if (!today || !today.billing_account_id || !today.tenant_id || !today.event_type) {
                continue;
            }
            const historical = (historicalAvg || []).find((h) => h &&
                h.billing_account_id === today.billing_account_id &&
                h.tenant_id === today.tenant_id &&
                h.event_type === today.event_type);
            if (historical && historical.avg_quantity) {
                const avgQuantity = Number(historical.avg_quantity);
                const currentValue = Number(today.total_quantity) || 0;
                if (avgQuantity > 0 && currentValue > 0) {
                    const expectedValue = avgQuantity;
                    const percentageChange = ((currentValue - expectedValue) / expectedValue) * 100;
                    // Flag if usage is 200% higher than average (spike)
                    if (!isNaN(percentageChange) && percentageChange > 200) {
                        anomalies.push({
                            tenantId: String(today.tenant_id),
                            billingAccountId: String(today.billing_account_id),
                            anomalyType: "usage_spike",
                            currentValue,
                            expectedValue,
                            percentageChange,
                            detectedAt: new Date().toISOString(),
                        });
                    }
                }
            }
        }
        return anomalies;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get billing anomalies", error);
        return [];
    }
}
/**
 * Generate daily intelligence report
 */
async function generateDailyIntelligence(date = new Date(), tenantId) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date();
    }
    const dateStr = date.toISOString().split("T")[0];
    if (!dateStr) {
        throw new Error("Failed to generate date string");
    }
    (0, logger_1.logInfo)("Generating daily intelligence report", { date: dateStr });
    let errorRate;
    let slowEndpoints;
    let failedIngestions;
    let billingAnomalies;
    try {
        [errorRate, slowEndpoints, failedIngestions, billingAnomalies] = await Promise.allSettled([
            getErrorRateSummary(date, tenantId),
            getSlowEndpoints(date, tenantId),
            getFailedIngestions(date, tenantId),
            getBillingAnomalies(date, tenantId),
        ]).then((results) => [
            results[0].status === "fulfilled" ? results[0].value : { overall: 0, byEndpoint: [] },
            results[1].status === "fulfilled" ? results[1].value : [],
            results[2].status === "fulfilled" ? results[2].value : [],
            results[3].status === "fulfilled" ? results[3].value : [],
        ]);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to generate daily intelligence components", error);
        // Return safe defaults
        errorRate = { overall: 0, byEndpoint: [] };
        slowEndpoints = [];
        failedIngestions = [];
        billingAnomalies = [];
    }
    const intelligence = {
        date: dateStr,
        errorRate: errorRate || { overall: 0, byEndpoint: [] },
        slowEndpoints: slowEndpoints || [],
        failedIngestions: failedIngestions || [],
        billingAnomalies: billingAnomalies || [],
    };
    (0, logger_1.logInfo)("Daily intelligence report generated", {
        date: intelligence.date,
        errorRate: intelligence.errorRate.overall,
        slowEndpointsCount: intelligence.slowEndpoints.length,
        failedIngestionsCount: intelligence.failedIngestions.length,
        billingAnomaliesCount: intelligence.billingAnomalies.length,
    });
    return intelligence;
}
//# sourceMappingURL=daily-intelligence.js.map