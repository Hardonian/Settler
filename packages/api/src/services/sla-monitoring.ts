/**
 * SLA Monitoring Service
 * Handles SLA tracking, metrics, and violations
 */

import { query } from "../db";
import { logError, logInfo } from "../utils/logger";

export type SLAMetricType = "uptime" | "latency_p95" | "latency_p99" | "error_rate" | "support_response";

export interface SLAAgreement {
  id: string;
  tenantId: string;
  slaType: string;
  targetValue: number;
  measurementPeriod: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface SLAMetric {
  id: string;
  tenantId: string;
  slaAgreementId: string;
  metricType: SLAMetricType;
  measuredValue: number;
  targetValue: number;
  measurementDate: Date;
  measurementPeriod: string;
}

export interface SLAViolation {
  id: string;
  tenantId: string;
  slaAgreementId: string;
  metricType: SLAMetricType;
  measuredValue: number;
  targetValue: number;
  violationDate: Date;
  severity: string;
  acknowledged: boolean;
  resolved: boolean;
}

/**
 * Create SLA agreement
 */
export async function createSLAAgreement(
  tenantId: string,
  slaType: string,
  targetValue: number,
  options: {
    measurementPeriod?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<string> {
  try {
    const startDate = options.startDate || new Date();
    const measurementPeriod = options.measurementPeriod || "monthly";

    const result = await query<{ id: string }>(
      `INSERT INTO sla_agreements (
        tenant_id, sla_type, target_value, measurement_period,
        start_date, end_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (tenant_id, sla_type, start_date) DO UPDATE
      SET target_value = EXCLUDED.target_value,
          measurement_period = EXCLUDED.measurement_period,
          updated_at = now()
      RETURNING id`,
      [
        tenantId,
        slaType,
        targetValue,
        measurementPeriod,
        startDate.toISOString().split("T")[0] as string,
        options.endDate ? (options.endDate.toISOString().split("T")[0] as string) : null,
      ] as (string | number | boolean | null | Date)[]
    );

    const agreementId = result[0]?.id || '';
    logInfo("SLA agreement created", { agreementId, tenantId, slaType, targetValue });
    return agreementId;
  } catch (error) {
    logError("Failed to create SLA agreement", error, { tenantId, slaType });
    throw error;
  }
}

/**
 * Record SLA metric
 */
export async function recordSLAMetric(
  tenantId: string,
  slaAgreementId: string,
  metricType: SLAMetricType,
  measuredValue: number,
  measurementDate: Date,
  measurementPeriod: string
): Promise<string> {
  try {
    // Get target value from agreement
    const agreementResult = await query<{ target_value: number }>(
      `SELECT target_value FROM sla_agreements WHERE id = $1 AND tenant_id = $2`,
      [slaAgreementId, tenantId]
    );

    if (agreementResult.length === 0) {
      throw new Error("SLA agreement not found");
    }

    const targetValue = agreementResult[0]?.target_value || 0;

    const result = await query<{ id: string }>(
      `INSERT INTO sla_metrics (
        tenant_id, sla_agreement_id, metric_type, measured_value,
        target_value, measurement_date, measurement_period
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        tenantId,
        slaAgreementId,
        metricType,
        measuredValue,
        targetValue,
        measurementDate.toISOString().split("T")[0] as string,
        measurementPeriod,
      ] as (string | number | boolean | null | Date)[]
    );

    const metricId = result[0]?.id || '';

    // Check for violation
    const isViolation = checkSLAViolation(metricType, measuredValue, targetValue);
    if (isViolation) {
      await createSLAViolation(
        tenantId,
        slaAgreementId,
        metricType,
        measuredValue,
        targetValue,
        measurementDate,
        measurementPeriod
      );
    }

    logInfo("SLA metric recorded", { metricId, tenantId, slaAgreementId, metricType });
    return metricId;
  } catch (error) {
    logError("Failed to record SLA metric", error, { tenantId, slaAgreementId, metricType });
    throw error;
  }
}

/**
 * Check if a metric value violates SLA
 */
function checkSLAViolation(
  metricType: SLAMetricType,
  measuredValue: number,
  targetValue: number
): boolean {
  switch (metricType) {
    case "uptime":
      // Uptime: measured should be >= target (e.g., 99.9%)
      return measuredValue < targetValue;

    case "latency_p95":
    case "latency_p99":
      // Latency: measured should be <= target (e.g., 2000ms)
      return measuredValue > targetValue;

    case "error_rate":
      // Error rate: measured should be <= target (e.g., 0.01%)
      return measuredValue > targetValue;

    case "support_response":
      // Support response time: measured should be <= target (e.g., 4 hours)
      return measuredValue > targetValue;

    default:
      return false;
  }
}

/**
 * Create SLA violation
 */
async function createSLAViolation(
  tenantId: string,
  slaAgreementId: string,
  metricType: SLAMetricType,
  measuredValue: number,
  targetValue: number,
  violationDate: Date,
  violationPeriod: string
): Promise<string> {
  try {
    // Determine severity
    const deviation = Math.abs(measuredValue - targetValue);
    const deviationPercent = (deviation / targetValue) * 100;
    let severity = "warning";
    if (deviationPercent > 20) {
      severity = "critical";
    } else if (deviationPercent > 10) {
      severity = "high";
    } else if (deviationPercent > 5) {
      severity = "medium";
    }

    const result = await query<{ id: string }>(
      `INSERT INTO sla_violations (
        tenant_id, sla_agreement_id, metric_type, measured_value,
        target_value, violation_date, violation_period, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        tenantId,
        slaAgreementId,
        metricType,
        measuredValue,
        targetValue,
        violationDate.toISOString().split("T")[0] as string,
        violationPeriod,
        severity,
      ] as (string | number | boolean | null | Date)[]
    );

    const violationId = result[0]?.id || '';
    logInfo("SLA violation created", {
      violationId,
      tenantId,
      slaAgreementId,
      metricType,
      severity,
    });

    // TODO: Send notification about violation

    return violationId;
  } catch (error) {
    logError("Failed to create SLA violation", error, { tenantId, slaAgreementId });
    throw error;
  }
}

/**
 * Get SLA violations
 */
export async function getSLAViolations(
  tenantId: string,
  filters: {
    resolved?: boolean;
    acknowledged?: boolean;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<SLAViolation[]> {
  try {
    const conditions: string[] = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters.resolved !== undefined) {
      conditions.push(`resolved = $${paramIndex}`);
      params.push(filters.resolved);
      paramIndex++;
    }

    if (filters.acknowledged !== undefined) {
      conditions.push(`acknowledged = $${paramIndex}`);
      params.push(filters.acknowledged);
      paramIndex++;
    }

    if (filters.severity) {
      conditions.push(`severity = $${paramIndex}`);
      params.push(filters.severity);
      paramIndex++;
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const result = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, sla_agreement_id, metric_type, measured_value,
              target_value, violation_date, violation_period, severity,
              acknowledged, resolved
       FROM sla_violations
       WHERE ${conditions.join(" AND ")}
       ORDER BY violation_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset] as (string | number | boolean | null | Date)[]
    );

    return result.map((row) => ({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      slaAgreementId: row.sla_agreement_id as string,
      metricType: row.metric_type as SLAMetricType,
      measuredValue: row.measured_value as number,
      targetValue: row.target_value as number,
      violationDate: row.violation_date as Date,
      severity: row.severity as string,
      acknowledged: row.acknowledged as boolean,
      resolved: row.resolved as boolean,
    }));
  } catch (error) {
    logError("Failed to get SLA violations", error, { tenantId });
    throw error;
  }
}

/**
 * Acknowledge SLA violation
 */
export async function acknowledgeSLAViolation(
  tenantId: string,
  violationId: string,
  acknowledgedBy: string
): Promise<void> {
  try {
    await query(
      `UPDATE sla_violations
       SET acknowledged = true, acknowledged_by = $1, acknowledged_at = now()
       WHERE id = $2 AND tenant_id = $3`,
      [acknowledgedBy, violationId, tenantId]
    );

    logInfo("SLA violation acknowledged", { violationId, tenantId, acknowledgedBy });
  } catch (error) {
    logError("Failed to acknowledge SLA violation", error, { violationId, tenantId });
    throw error;
  }
}
