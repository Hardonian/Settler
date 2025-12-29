"use strict";
/**
 * Reconciliation Quality Monitor
 *
 * Monitors reconciliation quality metrics and triggers alerts when thresholds are exceeded.
 * Implements industry-standard quality monitoring practices.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateQualityMetrics = calculateQualityMetrics;
exports.checkQualityThresholds = checkQualityThresholds;
exports.generateQualityReport = generateQualityReport;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
// Industry-standard quality thresholds
const QUALITY_THRESHOLDS = {
    MATCH_RATE_MIN: 0.90, // Minimum 90% match rate
    AUTO_RESOLUTION_RATE_MIN: 0.90, // Minimum 90% auto-resolution rate
    EXCEPTION_RATE_MAX: 0.10, // Maximum 10% exception rate
    CONFIDENCE_AVG_MIN: 0.75, // Minimum 0.75 average confidence
    RESOLUTION_TIME_MAX_MINUTES: 10, // Maximum 10 minutes resolution time
};
/**
 * Calculate quality metrics for a reconciliation run
 */
async function calculateQualityMetrics(runId, tenantId) {
    try {
        // Get run details
        const runResults = await (0, db_1.query)(`SELECT 
        started_at, completed_at,
        source_count, target_count, matched_count,
        unmatched_source_count, unmatched_target_count,
        confidence_avg
      FROM reconciliation_runs
      WHERE id = $1 AND tenant_id = $2`, [runId, tenantId]);
        if (runResults.length === 0) {
            throw new Error(`Reconciliation run ${runId} not found`);
        }
        const run = runResults[0];
        // Get match statistics
        const matchStats = await (0, db_1.query)(`SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE reviewed = true) as reviewed,
        COUNT(*) FILTER (WHERE metadata->>'review_action' = 'auto_approved') as auto_approved,
        COUNT(*) FILTER (WHERE metadata->>'review_action' = 'rule_resolved') as rule_resolved,
        COUNT(*) FILTER (WHERE metadata->>'review_action' = 'exception_handled') as exception_handled,
        COUNT(*) FILTER (WHERE metadata->>'review_action' = 'system_flagged') as system_flagged
      FROM reconciliation_matches
      WHERE run_id = $1 AND tenant_id = $2`, [runId, tenantId]);
        const stats = matchStats[0];
        const totalMatches = parseInt(stats.total);
        const reviewedMatches = parseInt(stats.reviewed);
        const autoApprovedMatches = parseInt(stats.auto_approved);
        const ruleResolvedMatches = parseInt(stats.rule_resolved);
        const exceptionHandledMatches = parseInt(stats.exception_handled);
        const systemFlaggedMatches = parseInt(stats.system_flagged);
        // Calculate metrics
        const matchedTransactions = run.matched_count;
        const unmatchedTransactions = run.unmatched_source_count + run.unmatched_target_count;
        const totalProcessed = matchedTransactions + unmatchedTransactions;
        const matchRate = totalProcessed > 0 ? matchedTransactions / totalProcessed : 0;
        const autoResolutionRate = totalMatches > 0
            ? (autoApprovedMatches + ruleResolvedMatches) / totalMatches
            : 0;
        const exceptionRate = totalMatches > 0
            ? (exceptionHandledMatches + systemFlaggedMatches) / totalMatches
            : 0;
        const averageConfidence = run.confidence_avg ? Number(run.confidence_avg) : 0;
        // Calculate resolution time
        const startedAt = new Date(run.started_at);
        const completedAt = run.completed_at ? new Date(run.completed_at) : new Date();
        const resolutionTimeMs = completedAt.getTime() - startedAt.getTime();
        const resolutionTimeMinutes = resolutionTimeMs / (1000 * 60);
        return {
            matchRate,
            autoResolutionRate,
            exceptionRate,
            averageConfidence,
            resolutionTimeMinutes,
            totalMatches,
            reviewedMatches,
            autoApprovedMatches,
            ruleResolvedMatches,
            exceptionHandledMatches,
            systemFlaggedMatches,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to calculate quality metrics", error, { runId, tenantId });
        throw error;
    }
}
/**
 * Check quality metrics against thresholds and generate alerts
 */
async function checkQualityThresholds(runId, tenantId) {
    try {
        const metrics = await calculateQualityMetrics(runId, tenantId);
        const alerts = [];
        // Check match rate
        if (metrics.matchRate < QUALITY_THRESHOLDS.MATCH_RATE_MIN) {
            alerts.push({
                runId,
                tenantId,
                alertType: "match_rate_low",
                severity: metrics.matchRate < 0.80 ? "critical" : "warning",
                message: `Match rate ${(metrics.matchRate * 100).toFixed(1)}% is below threshold ${(QUALITY_THRESHOLDS.MATCH_RATE_MIN * 100).toFixed(1)}%`,
                currentValue: metrics.matchRate,
                threshold: QUALITY_THRESHOLDS.MATCH_RATE_MIN,
                metrics,
            });
        }
        // Check auto-resolution rate
        if (metrics.autoResolutionRate < QUALITY_THRESHOLDS.AUTO_RESOLUTION_RATE_MIN) {
            alerts.push({
                runId,
                tenantId,
                alertType: "auto_resolution_rate_low",
                severity: metrics.autoResolutionRate < 0.80 ? "critical" : "warning",
                message: `Auto-resolution rate ${(metrics.autoResolutionRate * 100).toFixed(1)}% is below threshold ${(QUALITY_THRESHOLDS.AUTO_RESOLUTION_RATE_MIN * 100).toFixed(1)}%`,
                currentValue: metrics.autoResolutionRate,
                threshold: QUALITY_THRESHOLDS.AUTO_RESOLUTION_RATE_MIN,
                metrics,
            });
        }
        // Check exception rate
        if (metrics.exceptionRate > QUALITY_THRESHOLDS.EXCEPTION_RATE_MAX) {
            alerts.push({
                runId,
                tenantId,
                alertType: "exception_rate_high",
                severity: metrics.exceptionRate > 0.20 ? "critical" : "warning",
                message: `Exception rate ${(metrics.exceptionRate * 100).toFixed(1)}% exceeds threshold ${(QUALITY_THRESHOLDS.EXCEPTION_RATE_MAX * 100).toFixed(1)}%`,
                currentValue: metrics.exceptionRate,
                threshold: QUALITY_THRESHOLDS.EXCEPTION_RATE_MAX,
                metrics,
            });
        }
        // Check average confidence
        if (metrics.averageConfidence < QUALITY_THRESHOLDS.CONFIDENCE_AVG_MIN) {
            alerts.push({
                runId,
                tenantId,
                alertType: "confidence_low",
                severity: metrics.averageConfidence < 0.65 ? "critical" : "warning",
                message: `Average confidence ${(metrics.averageConfidence * 100).toFixed(1)}% is below threshold ${(QUALITY_THRESHOLDS.CONFIDENCE_AVG_MIN * 100).toFixed(1)}%`,
                currentValue: metrics.averageConfidence,
                threshold: QUALITY_THRESHOLDS.CONFIDENCE_AVG_MIN,
                metrics,
            });
        }
        // Check resolution time
        if (metrics.resolutionTimeMinutes > QUALITY_THRESHOLDS.RESOLUTION_TIME_MAX_MINUTES) {
            alerts.push({
                runId,
                tenantId,
                alertType: "resolution_time_high",
                severity: metrics.resolutionTimeMinutes > 30 ? "critical" : "warning",
                message: `Resolution time ${metrics.resolutionTimeMinutes.toFixed(1)} minutes exceeds threshold ${QUALITY_THRESHOLDS.RESOLUTION_TIME_MAX_MINUTES} minutes`,
                currentValue: metrics.resolutionTimeMinutes,
                threshold: QUALITY_THRESHOLDS.RESOLUTION_TIME_MAX_MINUTES,
                metrics,
            });
        }
        // Log alerts
        if (alerts.length > 0) {
            (0, logger_1.logWarn)("Quality thresholds exceeded", {
                runId,
                tenantId,
                alertCount: alerts.length,
                alerts: alerts.map(a => a.alertType),
            });
        }
        else {
            (0, logger_1.logInfo)("Quality metrics within thresholds", {
                runId,
                tenantId,
                metrics,
            });
        }
        return alerts;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to check quality thresholds", error, { runId, tenantId });
        throw error;
    }
}
/**
 * Generate quality report for a reconciliation run
 */
async function generateQualityReport(runId, tenantId) {
    try {
        const metrics = await calculateQualityMetrics(runId, tenantId);
        const alerts = await checkQualityThresholds(runId, tenantId);
        // Determine overall status
        const criticalAlerts = alerts.filter(a => a.severity === "critical");
        const warningAlerts = alerts.filter(a => a.severity === "warning");
        let status;
        if (criticalAlerts.length > 0) {
            status = "critical";
        }
        else if (warningAlerts.length > 0) {
            status = "warning";
        }
        else {
            status = "pass";
        }
        return {
            runId,
            tenantId,
            metrics,
            alerts,
            status,
            timestamp: new Date(),
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to generate quality report", error, { runId, tenantId });
        throw error;
    }
}
//# sourceMappingURL=quality-monitor.js.map