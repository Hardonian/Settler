/**
 * Reconciliation Status Routes
 * UX-007: Real-time status updates with progress tracking
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";

const router = Router();

const getStatusSchema = z.object({
  params: z.object({
    executionId: z.string().uuid(),
  }),
});

// Get reconciliation execution status with progress
router.get(
  "/executions/:executionId/status",
  requirePermission(Permission.JOBS_READ),
  validateRequest(getStatusSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { executionId } = req.params;
      const userId = req.userId!;

      if (!executionId || !userId) {
        throw new NotFoundError("Execution ID and User ID are required", "execution", executionId || "unknown");
      }

      // Get execution details
      const executions = await query<{
        id: string;
        job_id: string;
        status: string;
        started_at: Date;
        completed_at: Date | null;
        summary: unknown;
        error: string | null;
      }>(
        `SELECT e.id, e.job_id, e.status, e.started_at, e.completed_at, e.summary, e.error
         FROM executions e
         JOIN jobs j ON e.job_id = j.id
         WHERE e.id = $1 AND j.user_id = $2`,
        [executionId, userId]
      );

      if (executions.length === 0 || !executions[0]) {
        throw new NotFoundError("Execution not found", "execution", executionId);
      }

      const execution = executions[0];

      // Calculate progress
      let progress = 0;
      let progressMessage = "";

      if (execution.status === "completed") {
        progress = 100;
        progressMessage = "Reconciliation completed";
      } else if (execution.status === "failed") {
        progress = 0;
        progressMessage = `Reconciliation failed: ${execution.error || "Unknown error"}`;
      } else if (execution.status === "running") {
        // Estimate progress based on time elapsed (rough estimate)
        const elapsed = Date.now() - execution.started_at.getTime();
        const estimatedDuration = 30000; // 30 seconds average
        progress = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100));
        progressMessage = "Reconciliation in progress...";
      }

      // Get match count (if available)
      const matchCount = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM matches WHERE execution_id = $1`,
        [executionId]
      );

      const summary = execution.summary as {
        matched?: number;
        unmatched?: number;
        total?: number;
      } | null;

      const matchCountValue = matchCount[0]?.count || "0";

      res.json({
        data: {
          executionId: execution.id,
          jobId: execution.job_id,
          status: execution.status,
          progress: {
            percentage: progress,
            message: progressMessage,
            matched: summary?.matched || parseInt(matchCountValue),
            unmatched: summary?.unmatched || 0,
            total: summary?.total || 0,
          },
          startedAt: execution.started_at.toISOString(),
          completedAt: execution.completed_at?.toISOString() || null,
          error: execution.error || null,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get execution status", 500, { userId: req.userId });
    }
  }
);

export { router as reconciliationStatusRouter };
