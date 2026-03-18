/**
 * Runs Routes
 *
 * Operator-facing route for reconciliation run history and detail.
 * Maps "runs" to executions with job context for clearer operator UX.
 *
 * TENANT SAFETY: All queries scoped to req.tenantId
 * FREEZE AWARE: No mutations, read-only operator surface
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

const router: Router = Router();

const getRunSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
  }),
});

const listRunsQuerySchema = z.object({
  query: z.object({
    status: z.enum(["pending", "running", "completed", "failed"]).optional(),
    search: z.string().max(255).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

/**
 * GET /api/runs
 * List reconciliation runs (executions) with job context
 */
router.get(
  "/",
  requirePermission(Permission.JOBS_READ),
  validateRequest(listRunsQuerySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const page = parseInt((req.query.page as string) || "1");
      const limit = Math.min(parseInt((req.query.limit as string) || "50"), 100);
      const offset = (page - 1) * limit;

      // Build query with filters
      const conditions: string[] = ["j.tenant_id = $1"];
      const params: (string | number)[] = [tenantId];
      let paramIndex = 2;

      if (status) {
        conditions.push(`e.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (search) {
        conditions.push(`j.name ILIKE $${paramIndex}`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = conditions.join(" AND ");

      // Get runs with job context
      const runs = await query<{
        id: string;
        job_id: string;
        job_name: string;
        status: string;
        started_at: Date;
        completed_at: Date | null;
        summary: unknown;
        error: string | null;
      }>(
        `SELECT
          e.id,
          e.job_id,
          j.name as job_name,
          e.status,
          e.started_at,
          e.completed_at,
          e.summary,
          e.error
        FROM executions e
        JOIN jobs j ON e.job_id = j.id
        WHERE ${whereClause}
        ORDER BY e.started_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset] as (string | number)[]
      );

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM executions e
         JOIN jobs j ON e.job_id = j.id
         WHERE ${whereClause}`,
        params as (string | number)[]
      );

      const total = parseInt(countResult[0]?.count || "0");

      // Transform to operator-friendly format
      const data = runs.map((run) => {
        const summary = run.summary as {
          total?: number;
          matched?: number;
          unmatched?: number;
          conflicts?: number;
        } | null;

        return {
          id: run.id,
          name: run.job_name,
          status: run.status,
          startedAt: run.started_at.toISOString(),
          completedAt: run.completed_at?.toISOString() || null,
          summary: summary
            ? {
                total: summary.total || 0,
                matched: summary.matched || 0,
                unmatched: summary.unmatched || 0,
                conflicts: summary.conflicts || 0,
              }
            : undefined,
        };
      });

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch runs", 500, { userId: req.userId });
    }
  }
);

/**
 * GET /api/runs/:runId
 * Get detailed run information including stages and progress
 */
router.get(
  "/:runId",
  requirePermission(Permission.JOBS_READ),
  validateRequest(getRunSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { runId } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      // Get run with job context - tenant-scoped
      const runs = await query<{
        id: string;
        job_id: string;
        job_name: string;
        status: string;
        started_at: Date;
        completed_at: Date | null;
        summary: unknown;
        error: string | null;
      }>(
        `SELECT
          e.id,
          e.job_id,
          j.name as job_name,
          e.status,
          e.started_at,
          e.completed_at,
          e.summary,
          e.error
        FROM executions e
        JOIN jobs j ON e.job_id = j.id
        WHERE e.id = $1 AND j.tenant_id = $2`,
        [runId, tenantId] as (string | number)[]
      );

      if (runs.length === 0 || !runs[0]) {
        throw new NotFoundError("Run not found or access denied", "run", runId);
      }

      const run = runs[0];

      // Calculate progress
      let progress = 0;
      if (run.status === "completed") {
        progress = 100;
      } else if (run.status === "failed") {
        progress = 0;
      } else if (run.status === "running") {
        const elapsed = Date.now() - run.started_at.getTime();
        const estimatedDuration = 30000; // 30s estimate
        progress = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100));
      }

      // Build stage information (simplified for now - can be enhanced)
      const stages = [
        {
          id: "1",
          name: "Initialize",
          status: run.status === "pending" ? "pending" : "completed",
          startedAt: run.started_at,
          completedAt: run.status === "pending" ? undefined : run.started_at,
        },
        {
          id: "2",
          name: "Extract Source Data",
          status:
            run.status === "pending"
              ? "pending"
              : run.status === "running"
                ? "running"
                : run.status === "failed"
                  ? "failed"
                  : "completed",
          startedAt: run.status === "pending" ? undefined : run.started_at,
          completedAt: run.status === "completed" ? run.completed_at : undefined,
          error: run.status === "failed" ? run.error : undefined,
        },
        {
          id: "3",
          name: "Match Records",
          status: run.status === "completed" ? "completed" : "pending",
          startedAt: run.status === "completed" ? run.started_at : undefined,
          completedAt: run.completed_at,
        },
        {
          id: "4",
          name: "Generate Results",
          status: run.status === "completed" ? "completed" : "pending",
          startedAt: run.status === "completed" ? run.started_at : undefined,
          completedAt: run.completed_at,
        },
      ];

      const summary = run.summary as {
        total?: number;
        matched?: number;
        unmatched?: number;
        conflicts?: number;
      } | null;

      res.json({
        data: {
          id: run.id,
          name: run.job_name,
          status: run.status,
          progress,
          startedAt: run.started_at,
          completedAt: run.completed_at,
          error: run.error,
          summary: summary
            ? {
                total: summary.total || 0,
                matched: summary.matched || 0,
                unmatched: summary.unmatched || 0,
                conflicts: summary.conflicts || 0,
              }
            : undefined,
          stages,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch run detail", 500, {
        userId: req.userId,
        runId: req.params.runId,
      });
    }
  }
);

export { router as runsRouter };
