/**
 * SLO Alert Service
 *
 * Manages alert generation, notification, and lifecycle
 */

import { query } from "../../db";
import { logInfo, logError } from "../../utils/logger";
import {
  SLOAlert,
  SLOAlertRule,
  SLOMetricType,
  AlertSeverity,
  AlertChannel,
  DriftDetectionResult,
  PercentileType,
  MetricSummary,
} from "./types";
import { checkPercentileThreshold } from "./percentiles";
import { getAlertRules } from "./config";

/**
 * Evaluate metrics and generate alerts
 */
export async function evaluateAndAlert(
  tenantId: string,
  metricType: SLOMetricType,
  summary: MetricSummary
): Promise<SLOAlert[]> {
  const alerts: SLOAlert[] = [];

  try {
    // Get alert rules for this metric type
    const rules = await getAlertRules(tenantId);
    const applicableRules = rules.filter((r) => r.metricType === metricType && r.enabled);

    // Check threshold breaches
    if (summary.percentiles.p99 >= summary.thresholdCritical) {
      const alert = await createAlert(
        tenantId,
        metricType,
        "threshold_breach",
        "critical",
        `Critical: p99 (${summary.percentiles.p99.toFixed(0)}ms) exceeds critical threshold (${summary.thresholdCritical}ms)`,
        summary.percentiles.p99,
        summary.thresholdCritical,
        undefined,
        applicableRules
      );
      alerts.push(alert);
    } else if (summary.percentiles.p99 >= summary.thresholdWarning) {
      const alert = await createAlert(
        tenantId,
        metricType,
        "threshold_breach",
        "warning",
        `Warning: p99 (${summary.percentiles.p99.toFixed(0)}ms) exceeds warning threshold (${summary.thresholdWarning}ms)`,
        summary.percentiles.p99,
        summary.thresholdWarning,
        undefined,
        applicableRules
      );
      alerts.push(alert);
    }

    // Check percentile-specific thresholds
    const percentileTypes: PercentileType[] = ["p50", "p90", "p95", "p99"];
    for (const percentileType of percentileTypes) {
      for (const rule of applicableRules) {
        if (
          rule.conditionType === "percentile" &&
          rule.percentile === percentileType &&
          rule.threshold
        ) {
          const check = checkPercentileThreshold(
            summary.percentiles,
            percentileType,
            rule.threshold,
            rule.threshold * 1.5 // Critical is 1.5x warning
          );

          if (check.breached) {
            const alert = await createAlert(
              tenantId,
              metricType,
              "percentile_breach",
              check.severity,
              `${percentileType} (${check.value.toFixed(0)}ms) ${check.severity === "critical" ? "critically exceeds" : "exceeds"} threshold (${rule.threshold}ms)`,
              check.value,
              rule.threshold,
              percentileType,
              applicableRules
            );

            // Avoid duplicate alerts
            if (!alerts.some((a) => a.percentile === percentileType)) {
              alerts.push(alert);
            }
          }
        }
      }
    }

    return alerts;
  } catch (error) {
    logError("Failed to evaluate and alert", error, { tenantId, metricType });
    return alerts;
  }
}

/**
 * Create an alert
 */
async function createAlert(
  tenantId: string,
  metricType: SLOMetricType,
  alertType: "threshold_breach" | "drift_detected" | "percentile_breach",
  severity: AlertSeverity,
  message: string,
  currentValue?: number,
  threshold?: number,
  percentile?: PercentileType,
  rules?: SLOAlertRule[]
): Promise<SLOAlert> {
  // Check if there's already an active alert for this condition
  const existingAlert = await query<Record<string, unknown>>(
    `SELECT id FROM slo_alerts 
     WHERE tenant_id = $1 AND metric_type = $2 AND alert_type = $3 
       AND status = 'firing' 
     ORDER BY triggered_at DESC 
     LIMIT 1`,
    [tenantId, metricType, alertType]
  );

  if (existingAlert.length > 0) {
    // Update existing alert instead of creating new one
    const alertId = existingAlert[0].id as string;

    await query(
      `UPDATE slo_alerts 
       SET current_value = $1, updated_at = now()
       WHERE id = $2`,
      [currentValue, alertId]
    );

    return getAlertById(tenantId, alertId) as Promise<SLOAlert>;
  }

  // Insert new alert
  const result = await query<{ id: string }>(
    `INSERT INTO slo_alerts (
      tenant_id, metric_type, alert_type, severity,
      message, current_value, threshold, percentile,
      status, triggered_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'firing', now())
    RETURNING id`,
    [
      tenantId,
      metricType,
      alertType,
      severity,
      message,
      currentValue ?? null,
      threshold ?? null,
      percentile ?? null,
    ]
  );

  const alertId = result[0]?.id || "";

  // Send notifications
  if (rules && rules.length > 0) {
    await sendAlertNotifications(alertId, rules, {
      tenantId,
      metricType,
      alertType,
      severity,
      message,
      currentValue,
      threshold,
    });
  }

  logInfo("Alert created", { alertId, tenantId, metricType, severity });

  return getAlertById(tenantId, alertId) as Promise<SLOAlert>;
}

/**
 * Create alert from drift detection result
 */
export async function createDriftAlert(
  tenantId: string,
  metricType: SLOMetricType,
  driftResult: DriftDetectionResult,
  rules?: SLOAlertRule[]
): Promise<SLOAlert | null> {
  if (!driftResult.detected) {
    return null;
  }

  const existingAlert = await query<Record<string, unknown>>(
    `SELECT id FROM slo_alerts 
     WHERE tenant_id = $1 AND metric_type = $2 AND alert_type = 'drift_detected' 
       AND status = 'firing' 
     ORDER BY triggered_at DESC 
     LIMIT 1`,
    [tenantId, metricType]
  );

  if (existingAlert.length > 0) {
    return null; // Already have an active drift alert
  }

  const result = await query<{ id: string }>(
    `INSERT INTO slo_alerts (
      tenant_id, metric_type, alert_type, severity,
      message, drift_data, status, triggered_at
    ) VALUES ($1, $2, 'drift_detected', $3, $4, $5, 'firing', now())
    RETURNING id`,
    [
      tenantId,
      metricType,
      driftResult.severity,
      driftResult.description,
      JSON.stringify(driftResult),
    ]
  );

  const alertId = result[0]?.id || "";

  // Send notifications
  if (rules && rules.length > 0) {
    await sendAlertNotifications(alertId, rules, {
      tenantId,
      metricType,
      alertType: "drift_detected",
      severity: driftResult.severity,
      message: driftResult.description,
    });
  }

  return getAlertById(tenantId, alertId);
}

/**
 * Get alert by ID
 */
export async function getAlertById(tenantId: string, alertId: string): Promise<SLOAlert | null> {
  const results = await query<Record<string, unknown>>(
    `SELECT id, tenant_id, metric_type, alert_type, severity,
            message, current_value, threshold, percentile,
            drift_data, status, triggered_at, acknowledged_at,
            acknowledged_by, resolved_at, runbook_url, dashboard_url
     FROM slo_alerts
     WHERE tenant_id = $1 AND id = $2`,
    [tenantId, alertId]
  );

  if (results.length === 0) {
    return null;
  }

  return mapRowToAlert(results[0]);
}

/**
 * Get active alerts for a tenant
 */
export async function getActiveAlerts(
  tenantId: string,
  metricType?: SLOMetricType
): Promise<SLOAlert[]> {
  let queryStr = `
    SELECT id, tenant_id, metric_type, alert_type, severity,
           message, current_value, threshold, percentile,
           drift_data, status, triggered_at, acknowledged_at,
           acknowledged_by, resolved_at, runbook_url, dashboard_url
    FROM slo_alerts
    WHERE tenant_id = $1 AND status = 'firing'
  `;
  const params: unknown[] = [tenantId];

  if (metricType) {
    queryStr += ` AND metric_type = $2`;
    params.push(metricType);
  }

  queryStr += ` ORDER BY triggered_at DESC`;

  const results = await query<Record<string, unknown>>(queryStr, params);
  return results.map(mapRowToAlert);
}

/**
 * Get alert history
 */
export async function getAlertHistory(
  tenantId: string,
  options: {
    metricType?: SLOMetricType;
    status?: "firing" | "acknowledged" | "resolved";
    limit?: number;
    offset?: number;
  } = {}
): Promise<SLOAlert[]> {
  const conditions: string[] = ["tenant_id = $1"];
  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  if (options.metricType) {
    conditions.push(`metric_type = $${paramIndex++}`);
    params.push(options.metricType);
  }

  if (options.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(options.status);
  }

  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const results = await query<Record<string, unknown>>(
    `SELECT id, tenant_id, metric_type, alert_type, severity,
            message, current_value, threshold, percentile,
            drift_data, status, triggered_at, acknowledged_at,
            acknowledged_by, resolved_at, runbook_url, dashboard_url
     FROM slo_alerts
     WHERE ${conditions.join(" AND ")}
     ORDER BY triggered_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return results.map(mapRowToAlert);
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  tenantId: string,
  alertId: string,
  acknowledgedBy: string
): Promise<void> {
  await query(
    `UPDATE slo_alerts
     SET status = 'acknowledged', acknowledged_at = now(), acknowledged_by = $1
     WHERE tenant_id = $2 AND id = $3`,
    [acknowledgedBy, tenantId, alertId]
  );

  logInfo("Alert acknowledged", { alertId, tenantId, acknowledgedBy });
}

/**
 * Resolve an alert
 */
export async function resolveAlert(
  tenantId: string,
  alertId: string,
  resolvedBy?: string
): Promise<void> {
  await query(
    `UPDATE slo_alerts
     SET status = 'resolved', resolved_at = now()
     WHERE tenant_id = $1 AND id = $2`,
    [tenantId, alertId]
  );

  logInfo("Alert resolved", { alertId, tenantId, resolvedBy });
}

/**
 * Get alert summary for dashboard
 */
export async function getAlertSummary(tenantId: string): Promise<{
  total: number;
  active: number;
  critical: number;
  warning: number;
  resolvedToday: number;
}> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const results = await query<Record<string, unknown>>(
    `SELECT 
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'firing') as active,
       COUNT(*) FILTER (WHERE status = 'firing' AND severity = 'critical') as critical,
       COUNT(*) FILTER (WHERE status = 'firing' AND severity = 'warning') as warning,
       COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at >= $2) as resolved_today
     FROM slo_alerts
     WHERE tenant_id = $1`,
    [tenantId, todayStart.toISOString()]
  );

  const row = results[0];
  return {
    total: parseInt((row?.total as string) || "0", 10),
    active: parseInt((row?.active as string) || "0", 10),
    critical: parseInt((row?.critical as string) || "0", 10),
    warning: parseInt((row?.warning as string) || "0", 10),
    resolvedToday: parseInt((row?.resolved_today as string) || "0", 10),
  };
}

/**
 * Map database row to SLOAlert object
 */
function mapRowToAlert(row: Record<string, unknown>): SLOAlert {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    metricType: row.metric_type as SLOMetricType,
    alertType: row.alert_type as "threshold_breach" | "drift_detected" | "percentile_breach",
    severity: row.severity as AlertSeverity,
    message: row.message as string,
    currentValue: row.current_value as number | undefined,
    threshold: row.threshold as number | undefined,
    percentile: row.percentile as PercentileType | undefined,
    driftResult: row.drift_data ? JSON.parse(row.drift_data as string) : undefined,
    status: row.status as "firing" | "acknowledged" | "resolved",
    triggeredAt: row.triggered_at as Date,
    acknowledgedAt: row.acknowledged_at as Date | undefined,
    acknowledgedBy: row.acknowledged_by as string | undefined,
    resolvedAt: row.resolved_at as Date | undefined,
    runbookUrl: row.runbook_url as string | undefined,
    dashboardUrl: row.dashboard_url as string | undefined,
  };
}

/**
 * Send alert notifications to configured channels
 */
async function sendAlertNotifications(
  alertId: string,
  rules: SLOAlertRule[],
  alertData: {
    tenantId: string;
    metricType: SLOMetricType;
    alertType: string;
    severity: AlertSeverity;
    message: string;
    currentValue?: number;
    threshold?: number;
  }
): Promise<void> {
  // Collect all unique channels from rules
  const channels = new Map<string, AlertChannel>();
  for (const rule of rules) {
    for (const channel of rule.channels) {
      const key = `${channel.type}-${"address" in channel ? channel.address : "webhook"}`;
      if (!channels.has(key)) {
        channels.set(key, channel);
      }
    }
  }

  // Send to each channel
  for (const channel of channels.values()) {
    try {
      switch (channel.type) {
        case "email":
          // Would integrate with email service
          logInfo("Would send email alert", { alertId, channel: channel.address });
          break;
        case "slack":
          // Would integrate with Slack webhook
          logInfo("Would send Slack alert", { alertId, channel: channel.channel });
          break;
        case "pagerduty":
          // Would integrate with PagerDuty
          logInfo("Would send PagerDuty alert", { alertId });
          break;
        case "webhook":
          // Would send to webhook URL
          logInfo("Would send webhook alert", { alertId, url: channel.url });
          break;
      }
    } catch (error) {
      logError("Failed to send alert notification", error, { alertId, channelType: channel.type });
    }
  }
}
