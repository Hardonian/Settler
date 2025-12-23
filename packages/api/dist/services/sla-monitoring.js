"use strict";
/**
 * SLA Monitoring Service
 * Handles SLA tracking, metrics, and violations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSLAAgreement = createSLAAgreement;
exports.recordSLAMetric = recordSLAMetric;
exports.getSLAViolations = getSLAViolations;
exports.acknowledgeSLAViolation = acknowledgeSLAViolation;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Create SLA agreement
 */
async function createSLAAgreement(tenantId, slaType, targetValue, options = {}) {
    try {
        const startDate = options.startDate || new Date();
        const measurementPeriod = options.measurementPeriod || "monthly";
        const result = await (0, db_1.query)(`INSERT INTO sla_agreements (
        tenant_id, sla_type, target_value, measurement_period,
        start_date, end_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (tenant_id, sla_type, start_date) DO UPDATE
      SET target_value = EXCLUDED.target_value,
          measurement_period = EXCLUDED.measurement_period,
          updated_at = now()
      RETURNING id`, [
            tenantId,
            slaType,
            targetValue,
            measurementPeriod,
            startDate.toISOString().split("T")[0],
            options.endDate ? options.endDate.toISOString().split("T")[0] : null,
        ]);
        const agreementId = result[0]?.id || '';
        (0, logger_1.logInfo)("SLA agreement created", { agreementId, tenantId, slaType, targetValue });
        return agreementId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create SLA agreement", error, { tenantId, slaType });
        throw error;
    }
}
/**
 * Record SLA metric
 */
async function recordSLAMetric(tenantId, slaAgreementId, metricType, measuredValue, measurementDate, measurementPeriod) {
    try {
        // Get target value from agreement
        const agreementResult = await (0, db_1.query)(`SELECT target_value FROM sla_agreements WHERE id = $1 AND tenant_id = $2`, [slaAgreementId, tenantId]);
        if (agreementResult.length === 0) {
            throw new Error("SLA agreement not found");
        }
        const targetValue = agreementResult[0]?.target_value || 0;
        const result = await (0, db_1.query)(`INSERT INTO sla_metrics (
        tenant_id, sla_agreement_id, metric_type, measured_value,
        target_value, measurement_date, measurement_period
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`, [
            tenantId,
            slaAgreementId,
            metricType,
            measuredValue,
            targetValue,
            measurementDate.toISOString().split("T")[0],
            measurementPeriod,
        ]);
        const metricId = result[0]?.id || '';
        // Check for violation
        const isViolation = checkSLAViolation(metricType, measuredValue, targetValue);
        if (isViolation) {
            await createSLAViolation(tenantId, slaAgreementId, metricType, measuredValue, targetValue, measurementDate, measurementPeriod);
        }
        (0, logger_1.logInfo)("SLA metric recorded", { metricId, tenantId, slaAgreementId, metricType });
        return metricId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to record SLA metric", error, { tenantId, slaAgreementId, metricType });
        throw error;
    }
}
/**
 * Check if a metric value violates SLA
 */
function checkSLAViolation(metricType, measuredValue, targetValue) {
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
async function createSLAViolation(tenantId, slaAgreementId, metricType, measuredValue, targetValue, violationDate, violationPeriod) {
    try {
        // Determine severity
        const deviation = Math.abs(measuredValue - targetValue);
        const deviationPercent = (deviation / targetValue) * 100;
        let severity = "warning";
        if (deviationPercent > 20) {
            severity = "critical";
        }
        else if (deviationPercent > 10) {
            severity = "high";
        }
        else if (deviationPercent > 5) {
            severity = "medium";
        }
        const result = await (0, db_1.query)(`INSERT INTO sla_violations (
        tenant_id, sla_agreement_id, metric_type, measured_value,
        target_value, violation_date, violation_period, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`, [
            tenantId,
            slaAgreementId,
            metricType,
            measuredValue,
            targetValue,
            violationDate.toISOString().split("T")[0],
            violationPeriod,
            severity,
        ]);
        const violationId = result[0]?.id || '';
        (0, logger_1.logInfo)("SLA violation created", {
            violationId,
            tenantId,
            slaAgreementId,
            metricType,
            severity,
        });
        // TODO: Send notification about violation
        return violationId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create SLA violation", error, { tenantId, slaAgreementId });
        throw error;
    }
}
/**
 * Get SLA violations
 */
async function getSLAViolations(tenantId, filters = {}) {
    try {
        const conditions = ["tenant_id = $1"];
        const params = [tenantId];
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
        const result = await (0, db_1.query)(`SELECT id, tenant_id, sla_agreement_id, metric_type, measured_value,
              target_value, violation_date, violation_period, severity,
              acknowledged, resolved
       FROM sla_violations
       WHERE ${conditions.join(" AND ")}
       ORDER BY violation_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        return result.map((row) => ({
            id: row.id,
            tenantId: row.tenant_id,
            slaAgreementId: row.sla_agreement_id,
            metricType: row.metric_type,
            measuredValue: row.measured_value,
            targetValue: row.target_value,
            violationDate: row.violation_date,
            severity: row.severity,
            acknowledged: row.acknowledged,
            resolved: row.resolved,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get SLA violations", error, { tenantId });
        throw error;
    }
}
/**
 * Acknowledge SLA violation
 */
async function acknowledgeSLAViolation(tenantId, violationId, acknowledgedBy) {
    try {
        await (0, db_1.query)(`UPDATE sla_violations
       SET acknowledged = true, acknowledged_by = $1, acknowledged_at = now()
       WHERE id = $2 AND tenant_id = $3`, [acknowledgedBy, violationId, tenantId]);
        (0, logger_1.logInfo)("SLA violation acknowledged", { violationId, tenantId, acknowledgedBy });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to acknowledge SLA violation", error, { violationId, tenantId });
        throw error;
    }
}
//# sourceMappingURL=sla-monitoring.js.map