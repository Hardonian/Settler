/**
 * Automated Review API Routes
 *
 * Endpoints for automated reconciliation review process.
 * Implements industry-standard automated review according to best practices.
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { logError, logInfo } from "../../utils/logger";
import {
  autoReviewMatch,
  autoReviewRun,
  getReviewStatistics,
} from "../../services/reconciliation/automated-review";
import {
  calculateQualityMetrics,
  checkQualityThresholds,
  generateQualityReport,
} from "../../services/reconciliation/quality-monitor";

const router: Router = Router();

/**
 * POST /api/v1/automated-review/run/:runId
 * Trigger automated review for a reconciliation run
 */
router.post("/run/:runId", enforceFreezeState(), async (req: AuthRequest, res: Response) => {
  try {
    const runIdParam = req.params["runId"];
    const runId = Array.isArray(runIdParam) ? (runIdParam[0] ?? "") : (runIdParam ?? "");
    const tenantId = req.tenantId!;

    if (!runId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "runId is required",
        traceId: req.traceId,
      });
    }

    const stats = await autoReviewRun(runId, tenantId);

    logInfo("Automated review triggered", {
      runId,
      tenantId,
      traceId: req.traceId,
    });

    return res.json({
      runId,
      reviewed: stats.reviewed,
      autoApproved: stats.autoApproved,
      ruleResolved: stats.ruleResolved,
      exceptionHandled: stats.exceptionHandled,
      systemFlagged: stats.systemFlagged,
      errors: stats.errors,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to trigger automated review", error, {
      traceId: req.traceId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to trigger automated review",
      traceId: req.traceId,
    });
  }
});

/**
 * POST /api/v1/automated-review/match/:matchId
 * Trigger automated review for a single match
 */
router.post("/match/:matchId", enforceFreezeState(), async (req: AuthRequest, res: Response) => {
  try {
    const matchIdParam = req.params["matchId"];
    const matchId = Array.isArray(matchIdParam) ? (matchIdParam[0] ?? "") : (matchIdParam ?? "");
    const tenantId = req.tenantId!;

    if (!matchId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "matchId is required",
        traceId: req.traceId,
      });
    }

    const result = await autoReviewMatch(matchId, tenantId);

    return res.json({
      matchId,
      action: result.action,
      resolutionRule: result.resolutionRule,
      confidence: result.confidence,
      auditEntryId: result.auditEntryId,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to review match", error, {
      traceId: req.traceId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to review match",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/automated-review/run/:runId/statistics
 * Get review statistics for a reconciliation run
 */
router.get("/run/:runId/statistics", async (req: AuthRequest, res: Response) => {
  try {
    const runIdParam2 = req.params["runId"];
    const runId = Array.isArray(runIdParam2) ? (runIdParam2[0] ?? "") : (runIdParam2 ?? "");
    const tenantId = req.tenantId!;

    if (!runId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "runId is required",
        traceId: req.traceId,
      });
    }

    const stats = await getReviewStatistics(runId, tenantId);

    return res.json({
      runId,
      ...stats,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get review statistics", error, {
      traceId: req.traceId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get review statistics",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/automated-review/run/:runId/quality
 * Get quality metrics and alerts for a reconciliation run
 */
router.get("/run/:runId/quality", async (req: AuthRequest, res: Response) => {
  try {
    const runIdParam3 = req.params["runId"];
    const runId = Array.isArray(runIdParam3) ? (runIdParam3[0] ?? "") : (runIdParam3 ?? "");
    const tenantId = req.tenantId!;

    if (!runId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "runId is required",
        traceId: req.traceId,
      });
    }

    const metrics = await calculateQualityMetrics(runId, tenantId);
    const alerts = await checkQualityThresholds(runId, tenantId);

    return res.json({
      runId,
      metrics,
      alerts,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get quality metrics", error, {
      traceId: req.traceId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get quality metrics",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/automated-review/run/:runId/report
 * Generate comprehensive quality report for a reconciliation run
 */
router.get("/run/:runId/report", async (req: AuthRequest, res: Response) => {
  try {
    const runIdParam4 = req.params["runId"];
    const runId = Array.isArray(runIdParam4) ? (runIdParam4[0] ?? "") : (runIdParam4 ?? "");
    const tenantId = req.tenantId!;

    if (!runId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "runId is required",
        traceId: req.traceId,
      });
    }

    const report = await generateQualityReport(runId, tenantId);

    return res.json({
      ...report,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to generate quality report", error, {
      traceId: req.traceId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to generate quality report",
      traceId: req.traceId,
    });
  }
});

export default router;
