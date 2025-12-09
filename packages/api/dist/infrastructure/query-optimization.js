"use strict";
/**
 * Query Optimization Layer
 * Uses materialized views and optimized queries for performant data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReconciliationSummary = getReconciliationSummary;
exports.getJobPerformance = getJobPerformance;
exports.getTenantUsage = getTenantUsage;
exports.getMatchAccuracy = getMatchAccuracy;
exports.refreshMaterializedView = refreshMaterializedView;
exports.refreshAllMaterializedViews = refreshAllMaterializedViews;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Get reconciliation summary using materialized view
 * Much faster than querying raw reconciliation data
 */
async function getReconciliationSummary(jobId, dateRange, options = {}) {
    const { useMaterializedView = true, refreshView = false } = options;
    if (refreshView && useMaterializedView) {
        await refreshMaterializedView('mv_reconciliation_summary_daily');
    }
    if (useMaterializedView) {
        // Use materialized view for fast aggregation
        const viewQuery = `
      SELECT 
        job_id,
        date,
        total_matched,
        total_unmatched_source,
        total_unmatched_target,
        total_errors,
        accuracy_percentage,
        avg_processing_time_ms
      FROM mv_reconciliation_summary_daily
      WHERE job_id = $1
      ${dateRange ? 'AND date BETWEEN $2 AND $3' : ''}
      ORDER BY date DESC
      LIMIT 100
    `;
        const params = dateRange
            ? [jobId, dateRange.start, dateRange.end]
            : [jobId];
        const result = await (0, db_1.query)(viewQuery, params);
        (0, logger_1.logDebug)('Used materialized view for reconciliation summary', { jobId });
        return result;
    }
    // Fallback to regular query
    const regularQuery = `
    SELECT 
      job_id,
      DATE(created_at) as date,
      COUNT(*) FILTER (WHERE status = 'matched') as total_matched,
      COUNT(*) FILTER (WHERE status = 'unmatched_source') as total_unmatched_source,
      COUNT(*) FILTER (WHERE status = 'unmatched_target') as total_unmatched_target,
      COUNT(*) FILTER (WHERE status = 'error') as total_errors,
      AVG(confidence_score) * 100 as accuracy_percentage,
      AVG(processing_time_ms) as avg_processing_time_ms
    FROM reconciliation_results
    WHERE job_id = $1
    ${dateRange ? 'AND created_at BETWEEN $2 AND $3' : ''}
    GROUP BY job_id, DATE(created_at)
    ORDER BY date DESC
    LIMIT 100
  `;
    const params = dateRange
        ? [jobId, dateRange.start, dateRange.end]
        : [jobId];
    return (0, db_1.query)(regularQuery, params);
}
/**
 * Get job performance metrics using materialized view
 */
async function getJobPerformance(jobId, options = {}) {
    const { useMaterializedView = true, refreshView = false } = options;
    if (refreshView && useMaterializedView) {
        await refreshMaterializedView('mv_job_performance');
    }
    if (useMaterializedView) {
        const result = await (0, db_1.query)(`
      SELECT 
        job_id,
        total_executions,
        successful_executions,
        failed_executions,
        avg_execution_time_ms,
        last_execution_at,
        last_execution_status
      FROM mv_job_performance
      WHERE job_id = $1
    `, [jobId]);
        (0, logger_1.logDebug)('Used materialized view for job performance', { jobId });
        return result[0] || null;
    }
    // Fallback to regular query
    return (0, db_1.query)(`
    SELECT 
      job_id,
      COUNT(*) as total_executions,
      COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
      AVG(execution_time_ms) as avg_execution_time_ms,
      MAX(created_at) as last_execution_at,
      (SELECT status FROM job_executions WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1) as last_execution_status
    FROM job_executions
    WHERE job_id = $1
    GROUP BY job_id
    `, [jobId]).then((results) => results[0] || null);
}
/**
 * Get tenant usage metrics using materialized view
 */
async function getTenantUsage(tenantId, timeRange = 'hour', options = {}) {
    const { useMaterializedView = true, refreshView = false } = options;
    if (refreshView && useMaterializedView) {
        await refreshMaterializedView('mv_tenant_usage_hourly');
    }
    let viewName = 'mv_tenant_usage_hourly';
    let groupBy = 'hour';
    if (timeRange === 'day') {
        // Aggregate hourly data by day
        viewName = 'mv_tenant_usage_hourly';
        groupBy = 'day';
    }
    if (useMaterializedView) {
        const result = await (0, db_1.query)(`
      SELECT 
        tenant_id,
        ${groupBy === 'hour' ? 'hour' : "DATE_TRUNC('day', hour) as day"},
        total_requests,
        total_reconciliations,
        total_errors,
        avg_response_time_ms
      FROM ${viewName}
      WHERE tenant_id = $1
      ORDER BY ${groupBy === 'hour' ? 'hour' : 'day'} DESC
      LIMIT 100
    `, [tenantId]);
        (0, logger_1.logDebug)('Used materialized view for tenant usage', { tenantId, timeRange });
        return result;
    }
    // Fallback to regular query
    return (0, db_1.query)(`
    SELECT 
      tenant_id,
      DATE_TRUNC('${timeRange}', created_at) as time_period,
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE endpoint LIKE '%/reconciliations%') as total_reconciliations,
      COUNT(*) FILTER (WHERE status_code >= 400) as total_errors,
      AVG(response_time_ms) as avg_response_time_ms
    FROM api_logs
    WHERE tenant_id = $1
    AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY tenant_id, DATE_TRUNC('${timeRange}', created_at)
    ORDER BY time_period DESC
    LIMIT 100
    `, [tenantId]);
}
/**
 * Get match accuracy by job using materialized view
 */
async function getMatchAccuracy(jobId, options = {}) {
    const { useMaterializedView = true, refreshView = false } = options;
    if (refreshView && useMaterializedView) {
        await refreshMaterializedView('mv_match_accuracy_by_job');
    }
    if (useMaterializedView) {
        const queryStr = jobId
            ? `
        SELECT 
          job_id,
          total_matches,
          accurate_matches,
          inaccurate_matches,
          accuracy_percentage,
          avg_confidence_score
        FROM mv_match_accuracy_by_job
        WHERE job_id = $1
      `
            : `
        SELECT 
          job_id,
          total_matches,
          accurate_matches,
          inaccurate_matches,
          accuracy_percentage,
          avg_confidence_score
        FROM mv_match_accuracy_by_job
        ORDER BY accuracy_percentage DESC
        LIMIT 100
      `;
        const params = jobId ? [jobId] : [];
        const result = await (0, db_1.query)(queryStr, params);
        (0, logger_1.logDebug)('Used materialized view for match accuracy', { jobId });
        return jobId ? result[0] || null : result;
    }
    // Fallback to regular query
    const fallbackQuery = jobId
        ? `
      SELECT 
        job_id,
        COUNT(*) as total_matches,
        COUNT(*) FILTER (WHERE confidence_score >= 0.95) as accurate_matches,
        COUNT(*) FILTER (WHERE confidence_score < 0.95) as inaccurate_matches,
        AVG(confidence_score) * 100 as accuracy_percentage,
        AVG(confidence_score) as avg_confidence_score
      FROM reconciliation_results
      WHERE job_id = $1
      GROUP BY job_id
    `
        : `
      SELECT 
        job_id,
        COUNT(*) as total_matches,
        COUNT(*) FILTER (WHERE confidence_score >= 0.95) as accurate_matches,
        COUNT(*) FILTER (WHERE confidence_score < 0.95) as inaccurate_matches,
        AVG(confidence_score) * 100 as accuracy_percentage,
        AVG(confidence_score) as avg_confidence_score
      FROM reconciliation_results
      GROUP BY job_id
      ORDER BY accuracy_percentage DESC
      LIMIT 100
    `;
    const params = jobId ? [jobId] : [];
    return (0, db_1.query)(fallbackQuery, params).then((results) => jobId ? results[0] || null : results);
}
/**
 * Refresh a materialized view
 */
async function refreshMaterializedView(viewName) {
    try {
        await (0, db_1.query)(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`);
        (0, logger_1.logInfo)('Materialized view refreshed', { viewName });
    }
    catch (error) {
        // If CONCURRENTLY fails (no unique index), try without it
        if (error.message.includes('CONCURRENTLY')) {
            await (0, db_1.query)(`REFRESH MATERIALIZED VIEW ${viewName}`);
            (0, logger_1.logInfo)('Materialized view refreshed (non-concurrent)', { viewName });
        }
        else {
            throw error;
        }
    }
}
/**
 * Refresh all materialized views
 */
async function refreshAllMaterializedViews() {
    const views = [
        'mv_reconciliation_summary_daily',
        'mv_job_performance',
        'mv_tenant_usage_hourly',
        'mv_match_accuracy_by_job',
    ];
    for (const view of views) {
        try {
            await refreshMaterializedView(view);
        }
        catch (error) {
            (0, logger_1.logDebug)('Failed to refresh materialized view', { view, error });
        }
    }
    (0, logger_1.logInfo)('All materialized views refreshed');
}
//# sourceMappingURL=query-optimization.js.map