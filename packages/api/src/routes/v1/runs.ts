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
import { enforceFreezeState } from "../../middleware/governance";

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

const getExceptionsSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 50))
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

const resolveExceptionSchema = z.object({
  body: z.object({
    status: z.enum(["resolved", "dismissed"]),
    notes: z.string().optional(),
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
 * Returns detailed information about a specific run, including provenance from recon_results
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

      // Query specific run with tenant scoping and LEFT JOIN to recon_results for provenance
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
        // Provenance fields from recon_results.summary->_provenance
        provenance_amount_tolerance: string | null;
        provenance_date_tolerance_days: string | null;
        provenance_config_version: string | null;
        provenance_config_source: string | null;
        provenance_template_id: string | null;
        provenance_matching_rule_ids: string | null;
      }>(
        `SELECT
          rr.id,
          rr.tenant_id,
          rr.created_at,
          rr.updated_at,
          rr.status,
          rr.policy_name,
          rr.total_records,
          rr.matched_count,
          rr.mismatched_count,
          rr.error_message,
          recon_results.summary -> 'provenance' ->> 'amountTolerance' as provenance_amount_tolerance,
          recon_results.summary -> 'provenance' ->> 'dateToleranceDays' as provenance_date_tolerance_days,
          recon_results.summary -> 'provenance' ->> 'configVersion' as provenance_config_version,
          recon_results.summary -> 'provenance' ->> 'configSource' as provenance_config_source,
          recon_results.summary -> 'provenance' ->> 'templateId' as provenance_template_id,
          recon_results.summary -> 'provenance' ->> 'matchingRuleIds' as provenance_matching_rule_ids
         FROM reconciliation_runs rr
         LEFT JOIN recon_results ON recon_results.recon_job_id = rr.id AND recon_results.tenant_id = rr.tenant_id
         WHERE rr.id = $1 AND rr.tenant_id = $2`,
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

      // Build provenance object if provenance data exists
      const provenance =
        run.provenance_amount_tolerance !== null ||
        run.provenance_date_tolerance_days !== null ||
        run.provenance_config_version !== null
          ? {
              amountTolerance:
                run.provenance_amount_tolerance !== null
                  ? Number(run.provenance_amount_tolerance)
                  : null,
              dateToleranceDays:
                run.provenance_date_tolerance_days !== null
                  ? Number(run.provenance_date_tolerance_days)
                  : null,
              configVersion: run.provenance_config_version,
              configSource: run.provenance_config_source,
              templateId: run.provenance_template_id,
              matchingRuleIds: run.provenance_matching_rule_ids
                ? JSON.parse(run.provenance_matching_rule_ids)
                : null,
            }
          : null;

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
          provenance,
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

/**
 * GET /api/v1/runs/:id/exceptions
 * Returns paginated list of exceptions generated by a specific run
 */
router.get(
  "/runs/:id/exceptions",
  requirePermission(Permission.JOBS_READ),
  validateRequest(getExceptionsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const runId = req.params.id;

      if (!tenantId || !runId) {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: "Tenant context and Run ID are required",
        });
        return;
      }

      const limit = (req.query.limit as unknown as number) || 50;
      const offset = (req.query.offset as unknown as number) || 0;

      // Invariant: Verify run exists and belongs to tenant
      const runCheck = await query<{ status: string }>(
        `SELECT status FROM reconciliation_runs WHERE id = $1 AND tenant_id = $2`,
        [runId, tenantId]
      );

      if (runCheck.length === 0) {
        res.status(404).json({
          error: "NOT_FOUND",
          message: "Run not found or unauthorized",
        });
        return;
      }

      // Query exceptions tied directly to this execution
      const exceptions = await query<{
        exception_id: string;
        execution_id: string;
        source_record_id: string;
        target_record_id: string | null;
        exception_type: string;
        status: string;
        confidence_score: number | null;
        created_at: string;
        resolved_at: string | null;
        resolved_by: string | null;
      }>(
        `SELECT
           id as exception_id,
           run_id as execution_id,
           source_record_id,
           target_record_id,
           exception_type,
           status,
           confidence_score,
           created_at,
           resolved_at,
           resolved_by
         FROM exceptions
         WHERE run_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [runId, tenantId, limit, offset]
      );

      const countRes = await query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM exceptions WHERE run_id = $1 AND tenant_id = $2`,
        [runId, tenantId]
      );
      const totalCount = countRes[0] ? parseInt(countRes[0].count, 10) : 0;

      res.json({
        run_status: runCheck[0]?.status ?? "unknown",
        data: exceptions,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retrieve run exceptions", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
        runId: req.params.id,
      });
    }
  }
);

/**
 * POST /api/v1/runs/:id/retry
 * Retries a failed or completed reconciliation run natively
 */
router.post(
  "/runs/:id/retry",
  requirePermission(Permission.JOBS_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const runId = req.params.id;

      if (!tenantId || !runId) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "Tenant context and Run ID are required" });
        return;
      }

      const runs = await query<{ id: string; status: string }>(
        `SELECT id, status FROM reconciliation_runs WHERE id = $1 AND tenant_id = $2`,
        [runId, tenantId]
      );

      if (runs.length === 0) {
        res.status(404).json({ error: "NOT_FOUND", message: "Run not found or access denied" });
        return;
      }

      if (["pending", "running"].includes(runs[0]?.status ?? "")) {
        res.status(400).json({
          error: "INVALID_STATE",
          message: "Cannot retry a run that is currently in progress",
        });
        return;
      }

      // Enforce Consequence: Trigger retry
      await query(
        `UPDATE reconciliation_runs SET status = 'pending', error_message = NULL, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
        [runId, tenantId]
      );

      // Audit record
      await query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tenantId,
          req.userId || null,
          "retry_run",
          "reconciliation_run",
          runId,
          JSON.stringify({ previous_status: runs[0]?.status ?? "unknown" }),
        ]
      );

      res.json({
        success: true,
        message: "Run queued for retry",
        data: { run_id: runId, status: "pending" },
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retry run", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
        runId: req.params.id,
      });
    }
  }
);

/**
 * POST /api/v1/runs/:id/exceptions/:exceptionId/resolve
 * Resolves or dismisses a specific exception linked to an execution
 */
router.post(
  "/runs/:id/exceptions/:exceptionId/resolve",
  requirePermission(Permission.JOBS_WRITE),
  enforceFreezeState(),
  validateRequest(resolveExceptionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const { id: runId, exceptionId } = req.params;
      const { status, notes } = req.body;

      if (!tenantId || !runId || !exceptionId) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Required parameters missing" });
        return;
      }

      const exceptions = await query<{ id: string; status: string }>(
        `SELECT id, status FROM exceptions WHERE id = $1 AND run_id = $2 AND tenant_id = $3`,
        [exceptionId, runId, tenantId]
      );

      if (exceptions.length === 0) {
        res
          .status(404)
          .json({ error: "NOT_FOUND", message: "Exception not found or unauthorized" });
        return;
      }

      await query(
        `UPDATE exceptions SET status = $1, resolution_notes = $2, resolved_by = $3, resolved_at = NOW(), updated_at = NOW() WHERE id = $4 AND tenant_id = $5`,
        [status, notes || null, req.userId || null, exceptionId, tenantId]
      );

      await query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tenantId,
          req.userId || null,
          "resolve_exception",
          "exception",
          exceptionId,
          JSON.stringify({
            new_status: status,
            notes,
            run_id: runId,
            previous_status: exceptions[0]?.status ?? "unknown",
          }),
        ]
      );

      res.json({
        success: true,
        message: `Exception marked as ${status}`,
        data: { exception_id: exceptionId, status, resolved_at: new Date().toISOString() },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to resolve exception", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
        exceptionId: req.params.exceptionId,
      });
    }
  }
);

export { router as runsRouter };
