/**
 * SLA Monitoring API Routes
 * Handles SLA tracking and violations
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { tenantMiddleware, TenantRequest } from "../../middleware/tenant";
import { featureGate } from "../../middleware/billing-gating";
import { logError, logInfo } from "../../utils/logger";
import {
  createSLAAgreement,
  recordSLAMetric,
  getSLAViolations,
  acknowledgeSLAViolation,
  type SLAMetricType,
} from "../../services/sla-monitoring";

const router = Router();

/**
 * POST /api/v1/sla/agreements
 * Create SLA agreement
 */
router.post("/agreements", tenantMiddleware, featureGate("sla"), async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { slaType, targetValue, measurementPeriod, startDate, endDate } = req.body;

    if (!slaType || targetValue === undefined) {
      return res.status(400).json({
        error: "Bad Request",
        message: "slaType and targetValue are required",
        traceId: req.traceId,
      });
    }

    const agreementId = await createSLAAgreement(tenantId, slaType, targetValue, {
      measurementPeriod,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    logInfo("SLA agreement created", {
      agreementId,
      tenantId,
      slaType,
      traceId: req.traceId,
    });

    return res.status(201).json({
      id: agreementId,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to create SLA agreement", error, { traceId: req.traceId });
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
router.post("/metrics", tenantMiddleware, featureGate("sla"), async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      slaAgreementId,
      metricType,
      measuredValue,
      measurementDate,
      measurementPeriod,
    } = req.body;

    if (
      !slaAgreementId ||
      !metricType ||
      measuredValue === undefined ||
      !measurementDate
    ) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "slaAgreementId, metricType, measuredValue, and measurementDate are required",
        traceId: req.traceId,
      });
    }

    const metricId = await recordSLAMetric(
      tenantId,
      slaAgreementId,
      metricType as SLAMetricType,
      measuredValue,
      new Date(measurementDate),
      measurementPeriod || "daily"
    );

    logInfo("SLA metric recorded", {
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
  } catch (error) {
    logError("Failed to record SLA metric", error, { traceId: req.traceId });
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
router.get("/violations", tenantMiddleware, featureGate("sla"), async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { resolved, acknowledged, severity, limit = 100, offset = 0 } = req.query;

    const violations = await getSLAViolations(tenantId, {
      resolved: resolved === "true" ? true : resolved === "false" ? false : undefined,
      acknowledged:
        acknowledged === "true" ? true : acknowledged === "false" ? false : undefined,
      severity: severity as string | undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    return res.json({
      data: violations,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: violations.length,
      },
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get SLA violations", error, { traceId: req.traceId });
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
router.post("/violations/:violationId/acknowledge", tenantMiddleware, featureGate("sla"), async (req: TenantRequest, res: Response) => {
  try {
    const { violationId } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    if (!violationId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "violationId is required",
        traceId: req.traceId,
      });
    }

    await acknowledgeSLAViolation(tenantId, violationId, userId);

    logInfo("SLA violation acknowledged", {
      violationId,
      tenantId,
      userId,
      traceId: req.traceId,
    });

    return res.status(200).json({
      message: "Violation acknowledged",
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to acknowledge SLA violation", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to acknowledge SLA violation",
      traceId: req.traceId,
    });
  }
});

export default router;
