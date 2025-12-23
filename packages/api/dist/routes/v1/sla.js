"use strict";
/**
 * SLA Monitoring API Routes
 * Handles SLA tracking and violations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const sla_monitoring_1 = require("../../services/sla-monitoring");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/sla/agreements
 * Create SLA agreement
 */
router.post("/agreements", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { slaType, targetValue, measurementPeriod, startDate, endDate } = req.body;
        if (!slaType || targetValue === undefined) {
            return res.status(400).json({
                error: "Bad Request",
                message: "slaType and targetValue are required",
                traceId: req.traceId,
            });
        }
        const agreementId = await (0, sla_monitoring_1.createSLAAgreement)(tenantId, slaType, targetValue, {
            measurementPeriod,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        (0, logger_1.logInfo)("SLA agreement created", {
            agreementId,
            tenantId,
            slaType,
            traceId: req.traceId,
        });
        return res.status(201).json({
            id: agreementId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create SLA agreement", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create SLA agreement",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/sla/metrics
 * Record SLA metric
 */
router.post("/metrics", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { slaAgreementId, metricType, measuredValue, measurementDate, measurementPeriod, } = req.body;
        if (!slaAgreementId ||
            !metricType ||
            measuredValue === undefined ||
            !measurementDate) {
            return res.status(400).json({
                error: "Bad Request",
                message: "slaAgreementId, metricType, measuredValue, and measurementDate are required",
                traceId: req.traceId,
            });
        }
        const metricId = await (0, sla_monitoring_1.recordSLAMetric)(tenantId, slaAgreementId, metricType, measuredValue, new Date(measurementDate), measurementPeriod || "daily");
        (0, logger_1.logInfo)("SLA metric recorded", {
            metricId,
            tenantId,
            slaAgreementId,
            metricType,
            traceId: req.traceId,
        });
        return res.status(201).json({
            id: metricId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to record SLA metric", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to record SLA metric",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/sla/violations
 * Get SLA violations
 */
router.get("/violations", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { resolved, acknowledged, severity, limit = 100, offset = 0 } = req.query;
        const violations = await (0, sla_monitoring_1.getSLAViolations)(tenantId, {
            resolved: resolved === "true" ? true : resolved === "false" ? false : undefined,
            acknowledged: acknowledged === "true" ? true : acknowledged === "false" ? false : undefined,
            severity: severity,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        return res.json({
            data: violations,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: violations.length,
            },
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get SLA violations", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get SLA violations",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/sla/violations/:violationId/acknowledge
 * Acknowledge SLA violation
 */
router.post("/violations/:violationId/acknowledge", async (req, res) => {
    try {
        const { violationId } = req.params;
        const tenantId = req.tenantId;
        const userId = req.userId;
        if (!violationId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "violationId is required",
                traceId: req.traceId,
            });
        }
        await (0, sla_monitoring_1.acknowledgeSLAViolation)(tenantId, violationId, userId);
        (0, logger_1.logInfo)("SLA violation acknowledged", {
            violationId,
            tenantId,
            userId,
            traceId: req.traceId,
        });
        return res.status(200).json({
            message: "Violation acknowledged",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to acknowledge SLA violation", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to acknowledge SLA violation",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=sla.js.map