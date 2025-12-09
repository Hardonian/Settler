"use strict";
/**
 * Alert Manager
 * Basic alerting system for operational issues
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSeverity = void 0;
exports.createAlert = createAlert;
exports.resolveAlert = resolveAlert;
exports.getUnresolvedAlerts = getUnresolvedAlerts;
exports.checkSystemHealth = checkSystemHealth;
const logger_1 = require("../../utils/logger");
const db_1 = require("../../db");
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
/**
 * Create an alert
 */
async function createAlert(type, severity, message, details) {
    try {
        const result = await (0, db_1.query)(`INSERT INTO alerts (type, severity, message, details, resolved, created_at)
       VALUES ($1, $2, $3, $4, FALSE, NOW())
       RETURNING id`, [type, severity, message, details ? JSON.stringify(details) : null]);
        const alertId = result[0]?.id;
        if (!alertId) {
            throw new Error("Failed to create alert");
        }
        // Log based on severity
        if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH) {
            (0, logger_1.logError)("Alert created", new Error(message), {
                alertId,
                type,
                severity,
                details,
            });
        }
        else {
            (0, logger_1.logWarn)("Alert created", {
                alertId,
                type,
                severity,
                message,
                details,
            });
        }
        // TODO: Send to external alerting service (PagerDuty, Slack, etc.)
        // if (severity === AlertSeverity.CRITICAL) {
        //   await sendPagerDutyAlert(alertId, type, message, details);
        // }
        return alertId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create alert", error, { type, severity, message });
        throw error;
    }
}
/**
 * Resolve an alert
 */
async function resolveAlert(alertId) {
    try {
        await (0, db_1.query)(`UPDATE alerts
       SET resolved = TRUE, resolved_at = NOW()
       WHERE id = $1`, [alertId]);
        (0, logger_1.logInfo)("Alert resolved", { alertId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to resolve alert", error, { alertId });
    }
}
/**
 * Get unresolved alerts
 */
async function getUnresolvedAlerts(severity) {
    try {
        let queryStr = `SELECT id, type, severity, message, details, resolved, created_at, resolved_at
                    FROM alerts
                    WHERE resolved = FALSE`;
        const params = [];
        if (severity) {
            queryStr += ` AND severity = $1`;
            params.push(severity);
        }
        queryStr += ` ORDER BY 
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      created_at DESC`;
        const results = await (0, db_1.query)(queryStr, params);
        return results.map((r) => {
            const alert = {
                id: r.id,
                type: r.type,
                severity: r.severity,
                message: r.message,
                resolved: r.resolved,
                createdAt: r.created_at,
            };
            if (r.details) {
                alert.details = JSON.parse(r.details);
            }
            if (r.resolved_at) {
                alert.resolvedAt = r.resolved_at;
            }
            return alert;
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get unresolved alerts", error);
        return [];
    }
}
/**
 * Check system health and create alerts
 */
async function checkSystemHealth() {
    try {
        // Check database connection
        try {
            await (0, db_1.query)("SELECT 1");
        }
        catch (error) {
            await createAlert("database_connection", AlertSeverity.CRITICAL, "Database connection failed", { error: error instanceof Error ? error.message : String(error) });
        }
        // Check for high error rate (last hour)
        const errorCount = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM error_logs
       WHERE created_at > NOW() - INTERVAL '1 hour'
         AND severity = 'error'`);
        const errors = parseInt(errorCount[0]?.count || "0");
        if (errors > 100) {
            await createAlert("high_error_rate", AlertSeverity.HIGH, `High error rate detected: ${errors} errors in the last hour`, { errorCount: errors });
        }
        // Check for failed webhook deliveries
        const failedWebhooks = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM webhook_deliveries
       WHERE status = 'failed'
         AND next_retry_at IS NULL
         AND created_at > NOW() - INTERVAL '1 hour'`);
        const failed = parseInt(failedWebhooks[0]?.count || "0");
        if (failed > 50) {
            await createAlert("webhook_delivery_failure", AlertSeverity.MEDIUM, `High webhook delivery failure rate: ${failed} failed deliveries`, { failedCount: failed });
        }
    }
    catch (error) {
        (0, logger_1.logError)("System health check failed", error);
    }
}
//# sourceMappingURL=manager.js.map