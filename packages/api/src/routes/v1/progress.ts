/**
 * Progress Tracking API Routes
 * Handles progress tracking endpoints
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { logError, logInfo } from "../../utils/logger";
import {
  getReconciliationProgress,
  getReconciliationResultProgress,
  createCheckpoint,
  getLatestCheckpoint,
  resumeFromCheckpoint,
} from "../../services/progress-tracking";

const router: Router = Router();

/**
 * GET /api/v1/progress/reconciliation-runs/:runId
 * Get progress for a reconciliation run
 */
router.get(
  "/reconciliation-runs/:runId",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
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

      const progress = await getReconciliationProgress(tenantId, runId);

      if (!progress) {
        return res.status(404).json({
          error: "Not Found",
          message: "Reconciliation run not found",
          traceId: req.traceId,
        });
      }

      return res.json({
        ...progress,
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed to get progress", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get progress",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * GET /api/v1/progress/reconciliation-results/:resultId
 * Get progress for a reconciliation result
 */
router.get(
  "/reconciliation-results/:resultId",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const resultIdParam = req.params["resultId"];
      const resultId = Array.isArray(resultIdParam)
        ? (resultIdParam[0] ?? "")
        : (resultIdParam ?? "");
      const tenantId = req.tenantId!;

      if (!resultId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "resultId is required",
          traceId: req.traceId,
        });
      }

      const progress = await getReconciliationResultProgress(tenantId, resultId);

      if (!progress) {
        return res.status(404).json({
          error: "Not Found",
          message: "Reconciliation result not found",
          traceId: req.traceId,
        });
      }

      return res.json({
        ...progress,
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed to get result progress", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get result progress",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * POST /api/v1/progress/checkpoints
 * Create a checkpoint
 */
router.post(
  "/checkpoints",
  enforceFreezeState(),
  requirePermission(Permission.JOBS_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { jobId, checkpointData, transactionsProcessed } = req.body;

      if (!jobId || !checkpointData || transactionsProcessed === undefined) {
        return res.status(400).json({
          error: "Bad Request",
          message: "jobId, checkpointData, and transactionsProcessed are required",
          traceId: req.traceId,
        });
      }

      const checkpointId = await createCheckpoint(
        tenantId,
        jobId,
        checkpointData,
        transactionsProcessed
      );

      logInfo("Checkpoint created", { checkpointId, jobId, tenantId, traceId: req.traceId });

      return res.status(201).json({
        id: checkpointId,
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed to create checkpoint", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create checkpoint",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * GET /api/v1/progress/checkpoints/jobs/:jobId
 * Get latest checkpoint for a job
 */
router.get(
  "/checkpoints/jobs/:jobId",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const jobIdParam = req.params["jobId"];
      const jobId = Array.isArray(jobIdParam) ? (jobIdParam[0] ?? "") : (jobIdParam ?? "");
      const tenantId = req.tenantId!;

      if (!jobId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "jobId is required",
          traceId: req.traceId,
        });
      }

      const checkpoint = await getLatestCheckpoint(tenantId, jobId);

      if (!checkpoint) {
        return res.status(404).json({
          error: "Not Found",
          message: "No checkpoint found for this job",
          traceId: req.traceId,
        });
      }

      return res.json({
        ...checkpoint,
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed to get checkpoint", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get checkpoint",
        traceId: req.traceId,
      });
    }
  }
);

/**
 * POST /api/v1/progress/checkpoints/:checkpointId/resume
 * Resume from a checkpoint
 */
router.post(
  "/checkpoints/:checkpointId/resume",
  enforceFreezeState(),
  requirePermission(Permission.JOBS_EXECUTE),
  async (req: AuthRequest, res: Response) => {
    try {
      const checkpointIdParam = req.params["checkpointId"];
      const checkpointId = Array.isArray(checkpointIdParam)
        ? (checkpointIdParam[0] ?? "")
        : (checkpointIdParam ?? "");
      const tenantId = req.tenantId!;

      if (!checkpointId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "checkpointId is required",
          traceId: req.traceId,
        });
      }

      await resumeFromCheckpoint(tenantId, checkpointId);

      logInfo("Resumed from checkpoint", { checkpointId, tenantId, traceId: req.traceId });

      return res.status(200).json({
        message: "Resumed from checkpoint",
        traceId: req.traceId,
      });
    } catch (error) {
      logError("Failed to resume from checkpoint", error, { traceId: req.traceId });
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to resume from checkpoint",
        traceId: req.traceId,
      });
    }
  }
);

export default router;
