"use strict";
/**
 * Usage Tracking Service
 * Tracks user usage for quota enforcement and upgrade nudges
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackUsage = trackUsage;
exports.getCurrentUsage = getCurrentUsage;
exports.checkQuotaExceeded = checkQuotaExceeded;
exports.trackReconciliationExecution = trackReconciliationExecution;
exports.trackExportCreation = trackExportCreation;
exports.trackPlaygroundRun = trackPlaygroundRun;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const events_1 = require("../analytics/events");
const metering_1 = require("./metering");
/**
 * Track usage for a metric
 */
async function trackUsage(userId, tenantId, metricType, increment = 1) {
    try {
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await (0, db_1.query)(`INSERT INTO usage_tracking (user_id, tenant_id, metric_type, metric_value, period_start, period_end, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, metric_type, period_start) 
       DO UPDATE SET 
         metric_value = usage_tracking.metric_value + $4,
         updated_at = NOW()`, [userId, tenantId, metricType, increment, periodStart, periodEnd]);
        // Also track as analytics event
        await (0, events_1.trackUsageEvent)(userId, metricType, increment, { tenantId });
        await (0, metering_1.meterFromLegacyUsageMetric)({
            tenantId,
            metricType,
            quantity: increment,
            metadata: { user_id: userId },
        });
        (0, logger_1.logInfo)("Usage tracked", { userId, tenantId, metricType, increment });
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to track usage", {
            userId,
            metricType,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
/**
 * Get current usage for a metric
 */
async function getCurrentUsage(userId, metricType, period) {
    try {
        const periodStart = period?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const periodEnd = period?.end || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
        const result = await (0, db_1.query)(`SELECT metric_value
       FROM usage_tracking
       WHERE user_id = $1
         AND metric_type = $2
         AND period_start = $3
         AND period_end = $4`, [userId, metricType, periodStart, periodEnd]);
        return result[0]?.metric_value || 0;
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to get current usage", {
            userId,
            metricType,
            error: error instanceof Error ? error.message : String(error),
        });
        return 0;
    }
}
/**
 * Check if user has exceeded quota
 */
async function checkQuotaExceeded(userId, metricType, limit) {
    const current = await getCurrentUsage(userId, metricType);
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    return {
        exceeded: current >= limit,
        current,
        limit,
        percentage: Math.round(percentage * 100) / 100,
    };
}
/**
 * Track reconciliation execution
 */
async function trackReconciliationExecution(userId, tenantId) {
    await trackUsage(userId, tenantId, "reconciliations", 1);
}
/**
 * Track export creation
 */
async function trackExportCreation(userId, tenantId) {
    await trackUsage(userId, tenantId, "exports", 1);
}
/**
 * Track playground run
 */
async function trackPlaygroundRun(userId, tenantId) {
    await trackUsage(userId, tenantId, "playground_runs", 1);
}
//# sourceMappingURL=tracker.js.map