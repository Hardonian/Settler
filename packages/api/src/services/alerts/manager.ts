/**
 * Alert Manager
 * Basic alerting system for operational issues
 */

import { logError, logWarn, logInfo } from "../../utils/logger";
import { query } from "../../db";

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, unknown>;
  resolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * Create an alert
 */
export async function createAlert(
  type: string,
  severity: AlertSeverity,
  message: string,
  details?: Record<string, unknown>
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO alerts (type, severity, message, details, resolved, created_at)
       VALUES ($1, $2, $3, $4, FALSE, NOW())
       RETURNING id`,
      [type, severity, message, details ? JSON.stringify(details) : null]
    );

    const alertId = result[0]?.id;
    if (!alertId) {
      throw new Error("Failed to create alert");
    }

    // Log based on severity
    if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH) {
      logError("Alert created", new Error(message), {
        alertId,
        type,
        severity,
        details,
      });
    } else {
      logWarn("Alert created", {
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
  } catch (error) {
    logError("Failed to create alert", error, { type, severity, message });
    throw error;
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<void> {
  try {
    await query(
      `UPDATE alerts
       SET resolved = TRUE, resolved_at = NOW()
       WHERE id = $1`,
      [alertId]
    );

    logInfo("Alert resolved", { alertId });
  } catch (error) {
    logError("Failed to resolve alert", error, { alertId });
  }
}

/**
 * Get unresolved alerts
 */
export async function getUnresolvedAlerts(severity?: AlertSeverity): Promise<Alert[]> {
  try {
    let queryStr = `SELECT id, type, severity, message, details, resolved, created_at, resolved_at
                    FROM alerts
                    WHERE resolved = FALSE`;

    const params: unknown[] = [];

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

    const results = await query<{
      id: string;
      type: string;
      severity: string;
      message: string;
      details: string | null;
      resolved: boolean;
      created_at: Date;
      resolved_at: Date | null;
    }>(queryStr, params as (string | number | boolean | Date | null)[]);

    return results.map((r) => {
      const alert: Alert = {
        id: r.id,
        type: r.type,
        severity: r.severity as AlertSeverity,
        message: r.message,
        resolved: r.resolved,
        createdAt: r.created_at,
      };
      if (r.details) {
        alert.details = JSON.parse(r.details) as Record<string, unknown>;
      }
      if (r.resolved_at) {
        alert.resolvedAt = r.resolved_at;
      }
      return alert;
    });
  } catch (error) {
    logError("Failed to get unresolved alerts", error);
    return [];
  }
}

/**
 * Check system health and create alerts
 */
export async function checkSystemHealth(): Promise<void> {
  try {
    // Check database connection
    try {
      await query("SELECT 1");
    } catch (error) {
      await createAlert(
        "database_connection",
        AlertSeverity.CRITICAL,
        "Database connection failed",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }

    // Check for high error rate (last hour)
    const errorCount = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM error_logs
       WHERE created_at > NOW() - INTERVAL '1 hour'
         AND severity = 'error'`
    );

    const errors = parseInt(errorCount[0]?.count || "0");
    if (errors > 100) {
      await createAlert(
        "high_error_rate",
        AlertSeverity.HIGH,
        `High error rate detected: ${errors} errors in the last hour`,
        { errorCount: errors }
      );
    }

    // Check for failed webhook deliveries
    const failedWebhooks = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM webhook_deliveries
       WHERE status = 'failed'
         AND next_retry_at IS NULL
         AND created_at > NOW() - INTERVAL '1 hour'`
    );

    const failed = parseInt(failedWebhooks[0]?.count || "0");
    if (failed > 50) {
      await createAlert(
        "webhook_delivery_failure",
        AlertSeverity.MEDIUM,
        `High webhook delivery failure rate: ${failed} failed deliveries`,
        { failedCount: failed }
      );
    }
  } catch (error) {
    logError("System health check failed", error);
  }
}
