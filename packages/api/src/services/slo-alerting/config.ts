/**
 * SLO Configuration Service
 *
 * Manages per-tenant SLO configuration and settings
 */

import { query } from "../../db";
import { logInfo, logError } from "../../utils/logger";
import {
  SLOConfig,
  SLOAlertRule,
  SLOMetricType,
  DEFAULT_SLO_THRESHOLDS,
  DEFAULT_PERCENTILE_THRESHOLDS,
  AlertSeverity,
  AlertChannel,
  PercentileType,
} from "./types";

/**
 * Create or update SLO configuration for a tenant
 */
export async function upsertSLOConfig(
  tenantId: string,
  metricType: SLOMetricType,
  config: Partial<Omit<SLOConfig, "id" | "tenantId" | "metricType" | "createdAt" | "updatedAt">>
): Promise<string> {
  try {
    const defaults = DEFAULT_SLO_THRESHOLDS[metricType];

    const result = await query<{ id: string }>(
      `INSERT INTO slo_configs (
        tenant_id, metric_type, 
        threshold_warning, threshold_critical,
        percentile_threshold, drift_detection,
        enabled, evaluation_interval
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (tenant_id, metric_type) DO UPDATE SET
        threshold_warning = COALESCE(EXCLUDED.threshold_warning, slo_configs.threshold_warning),
        threshold_critical = COALESCE(EXCLUDED.threshold_critical, slo_configs.threshold_critical),
        percentile_threshold = COALESCE(EXCLUDED.percentile_threshold, slo_configs.percentile_threshold),
        drift_detection = COALESCE(EXCLUDED.drift_detection, slo_configs.drift_detection),
        enabled = COALESCE(EXCLUDED.enabled, slo_configs.enabled),
        evaluation_interval = COALESCE(EXCLUDED.evaluation_interval, slo_configs.evaluation_interval),
        updated_at = now()
      RETURNING id`,
      [
        tenantId,
        metricType,
        config.thresholdWarning ?? defaults.warning,
        config.thresholdCritical ?? defaults.critical,
        JSON.stringify(config.percentileThreshold ?? DEFAULT_PERCENTILE_THRESHOLDS[metricType]),
        JSON.stringify(
          config.driftDetection ?? {
            enabled: true,
            sensitivity: "medium",
            windowSize: 10,
            deviationThreshold: 20,
          }
        ),
        config.enabled ?? true,
        config.evaluationInterval ?? 5,
      ]
    );

    const configId = result[0]?.id || "";
    logInfo("SLO config upserted", { configId, tenantId, metricType });
    return configId;
  } catch (error) {
    logError("Failed to upsert SLO config", error, { tenantId, metricType });
    throw error;
  }
}

/**
 * Get SLO configuration for a tenant
 */
export async function getSLOConfigs(tenantId: string): Promise<SLOConfig[]> {
  try {
    const results = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, metric_type, threshold_warning, threshold_critical,
              percentile_threshold, drift_detection, enabled, evaluation_interval,
              created_at, updated_at
       FROM slo_configs
       WHERE tenant_id = $1`,
      [tenantId]
    );

    return results.map((row) => ({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      metricType: row.metric_type as SLOMetricType,
      thresholdWarning: row.threshold_warning as number,
      thresholdCritical: row.threshold_critical as number,
      percentileThreshold: row.percentile_threshold as SLOConfig["percentileThreshold"],
      driftDetection: row.drift_detection as SLOConfig["driftDetection"],
      enabled: row.enabled as boolean,
      evaluationInterval: row.evaluation_interval as number,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    }));
  } catch (error) {
    logError("Failed to get SLO configs", error, { tenantId });
    throw error;
  }
}

/**
 * Get SLO configuration for a specific metric type
 */
export async function getSLOConfig(
  tenantId: string,
  metricType: SLOMetricType
): Promise<SLOConfig | null> {
  try {
    const results = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, metric_type, threshold_warning, threshold_critical,
              percentile_threshold, drift_detection, enabled, evaluation_interval,
              created_at, updated_at
       FROM slo_configs
       WHERE tenant_id = $1 AND metric_type = $2`,
      [tenantId, metricType]
    );

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      metricType: row.metric_type as SLOMetricType,
      thresholdWarning: row.threshold_warning as number,
      thresholdCritical: row.threshold_critical as number,
      percentileThreshold: row.percentile_threshold as SLOConfig["percentileThreshold"],
      driftDetection: row.drift_detection as SLOConfig["driftDetection"],
      enabled: row.enabled as boolean,
      evaluationInterval: row.evaluation_interval as number,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  } catch (error) {
    logError("Failed to get SLO config", error, { tenantId, metricType });
    throw error;
  }
}

/**
 * Delete SLO configuration
 */
export async function deleteSLOConfig(tenantId: string, metricType: SLOMetricType): Promise<void> {
  try {
    await query(`DELETE FROM slo_configs WHERE tenant_id = $1 AND metric_type = $2`, [
      tenantId,
      metricType,
    ]);
    logInfo("SLO config deleted", { tenantId, metricType });
  } catch (error) {
    logError("Failed to delete SLO config", error, { tenantId, metricType });
    throw error;
  }
}

/**
 * Create alert rule
 */
export async function createAlertRule(
  tenantId: string,
  rule: {
    name: string;
    metricType: SLOMetricType;
    conditionType: "threshold" | "percentile" | "drift";
    threshold?: number;
    percentile?: PercentileType;
    driftEnabled?: boolean;
    warningSeverity: AlertSeverity;
    criticalSeverity: AlertSeverity;
    channels: AlertChannel[];
    enabled?: boolean;
  }
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO slo_alert_rules (
        tenant_id, name, metric_type, condition_type,
        threshold, percentile, drift_enabled,
        warning_severity, critical_severity,
        channels, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        tenantId,
        rule.name,
        rule.metricType,
        rule.conditionType,
        rule.threshold ?? null,
        rule.percentile ?? null,
        rule.driftEnabled ?? false,
        rule.warningSeverity,
        rule.criticalSeverity,
        JSON.stringify(rule.channels),
        rule.enabled ?? true,
      ]
    );

    const ruleId = result[0]?.id || "";
    logInfo("Alert rule created", { ruleId, tenantId, name: rule.name });
    return ruleId;
  } catch (error) {
    logError("Failed to create alert rule", error, { tenantId, name: rule.name });
    throw error;
  }
}

/**
 * Get alert rules for a tenant
 */
export async function getAlertRules(tenantId: string): Promise<SLOAlertRule[]> {
  try {
    const results = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, name, metric_type, condition_type,
              threshold, percentile, drift_enabled,
              warning_severity, critical_severity,
              channels, enabled, created_at, updated_at
       FROM slo_alert_rules
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    return results.map((row) => ({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      name: row.name as string,
      metricType: row.metric_type as SLOMetricType,
      conditionType: row.condition_type as "threshold" | "percentile" | "drift",
      threshold: row.threshold as number | undefined,
      percentile: row.percentile as PercentileType | undefined,
      driftEnabled: row.drift_enabled as boolean | undefined,
      warningSeverity: row.warning_severity as AlertSeverity,
      criticalSeverity: row.critical_severity as AlertSeverity,
      channels: row.channels as AlertChannel[],
      enabled: row.enabled as boolean,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    }));
  } catch (error) {
    logError("Failed to get alert rules", error, { tenantId });
    throw error;
  }
}

/**
 * Update alert rule
 */
export async function updateAlertRule(
  tenantId: string,
  ruleId: string,
  updates: Partial<Omit<SLOAlertRule, "id" | "tenantId" | "createdAt" | "updatedAt">>
): Promise<void> {
  try {
    const sets: string[] = [];
    const params: unknown[] = [tenantId, ruleId];
    let paramIndex = 3;

    if (updates.name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }
    if (updates.threshold !== undefined) {
      sets.push(`threshold = $${paramIndex++}`);
      params.push(updates.threshold);
    }
    if (updates.percentile !== undefined) {
      sets.push(`percentile = $${paramIndex++}`);
      params.push(updates.percentile);
    }
    if (updates.driftEnabled !== undefined) {
      sets.push(`drift_enabled = $${paramIndex++}`);
      params.push(updates.driftEnabled);
    }
    if (updates.warningSeverity !== undefined) {
      sets.push(`warning_severity = $${paramIndex++}`);
      params.push(updates.warningSeverity);
    }
    if (updates.criticalSeverity !== undefined) {
      sets.push(`critical_severity = $${paramIndex++}`);
      params.push(updates.criticalSeverity);
    }
    if (updates.channels !== undefined) {
      sets.push(`channels = $${paramIndex++}`);
      params.push(JSON.stringify(updates.channels));
    }
    if (updates.enabled !== undefined) {
      sets.push(`enabled = $${paramIndex++}`);
      params.push(updates.enabled);
    }

    if (sets.length === 0) return;

    sets.push(`updated_at = now()`);

    await query(
      `UPDATE slo_alert_rules SET ${sets.join(", ")} WHERE tenant_id = $1 AND id = $2`,
      params
    );

    logInfo("Alert rule updated", { ruleId, tenantId });
  } catch (error) {
    logError("Failed to update alert rule", error, { ruleId, tenantId });
    throw error;
  }
}

/**
 * Delete alert rule
 */
export async function deleteAlertRule(tenantId: string, ruleId: string): Promise<void> {
  try {
    await query(`DELETE FROM slo_alert_rules WHERE tenant_id = $1 AND id = $2`, [tenantId, ruleId]);
    logInfo("Alert rule deleted", { ruleId, tenantId });
  } catch (error) {
    logError("Failed to delete alert rule", error, { ruleId, tenantId });
    throw error;
  }
}

/**
 * Initialize default SLO configs for a tenant
 */
export async function initializeDefaultSLOConfigs(tenantId: string): Promise<void> {
  const metricTypes: SLOMetricType[] = [
    "usage.api.latency_ms",
    "usage.api.query_rows",
    "usage.export.duration_ms",
  ];

  for (const metricType of metricTypes) {
    await upsertSLOConfig(tenantId, metricType, {});
  }

  logInfo("Default SLO configs initialized", { tenantId });
}
