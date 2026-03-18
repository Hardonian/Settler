/**
 * Runs API Route
 * Exposes reconciliation run history and status
 */

import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { handleRouteError } from "../../utils/error-handler";
import { validateRequest } from "../../middleware/validation";
import { query } from "../../db";

const router: Router = Router();

const getRunsSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= 100, {
        message: "Limit must be between 1 and 100",
      }),
    offset: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 0))
      .refine((val) => val >= 0, {
        message: "Offset must be non-negative",
      }),
  }),
});

/**
 * GET /api/v1/runs
 * Returns paginated list of reconciliation runs for the authenticated tenant
 */
router.get(
  "/runs",
  requirePermission(Permission.JOBS_READ),
  validateRequest(getRunsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
        return;
      }

      const limit = (req.query.limit as unknown as number) || 20;
      const offset = (req.query.offset as unknown as number) || 0;

      // Query runs from reconciliation_runs table with tenant scoping
      const runs = await query<{
        id: string;
        tenant_id: string;
        created_at: string;
        updated_at: string;
        status: string;
        policy_name: string | null;
        total_records: number | null;
        matched_count: number | null;
        mismatched_count: number | null;
      }>(
        `SELECT
          id,
          tenant_id,
          created_at,
          updated_at,
          status,
          policy_name,
          total_records,
          matched_count,
          mismatched_count
         FROM reconciliation_runs
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset]
      );

      // Get total count for pagination
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM reconciliation_runs WHERE tenant_id = $1`,
        [tenantId]
      );
      const totalCount = countResult[0] ? parseInt(countResult[0].count, 10) : 0;

      // Transform to frontend-expected format
      const rows = runs.map((run) => ({
        run_id: run.id,
        created_at: run.created_at,
        status: run.status,
        policy: run.policy_name,
        total_records: run.total_records,
        matched: run.matched_count,
        mismatched: run.mismatched_count,
      }));

      res.json({
        rows,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retrieve runs", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

/**
 * GET /api/v1/runs/:id
 * Returns detailed information about a specific run
 */
router.get(
  "/runs/:id",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
        return;
      }

      const runId = req.params.id;
      if (!runId) {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: "Run ID is required",
        });
        return;
      }

      // Query specific run with tenant scoping
      const runs = await query<{
        id: string;
        tenant_id: string;
        created_at: string;
        updated_at: string;
        status: string;
        policy_name: string | null;
        total_records: number | null;
        matched_count: number | null;
        mismatched_count: number | null;
        error_message: string | null;
      }>(
        `SELECT
          id,
          tenant_id,
          created_at,
          updated_at,
          status,
          policy_name,
          total_records,
          matched_count,
          mismatched_count,
          error_message
         FROM reconciliation_runs
         WHERE id = $1 AND tenant_id = $2`,
        [runId, tenantId]
      );

      if (runs.length === 0) {
        res.status(404).json({
          error: "NOT_FOUND",
          message: "Run not found or access denied",
        });
        return;
      }

      const run = runs[0];
      if (!run) {
        res.status(404).json({
          error: "NOT_FOUND",
          message: "Run not found",
        });
        return;
      }

      res.json({
        data: {
          run_id: run.id,
          created_at: run.created_at,
          updated_at: run.updated_at,
          status: run.status,
          policy: run.policy_name,
          total_records: run.total_records,
          matched: run.matched_count,
          mismatched: run.mismatched_count,
          error_message: run.error_message,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retrieve run details", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
        runId: req.params.id,
      });
    }
  }
);

export { router as runsRouter };
