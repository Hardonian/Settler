/**
 * Runs API Route v1
 * Exposes reconciliation run history and status
 *
 * Supports both offset-based and cursor-based pagination.
 * Cursor pagination is recommended for large datasets.
 *
 * @deprecated This is the v1 API. New code should use /api/runs which uses the
 * canonical response format with { data, pagination } instead of { rows, pagination }.
 */

import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { handleRouteError } from "../../utils/error-handler";
import { validateRequest } from "../../middleware/validation";
import { query } from "../../db";
import { logError } from "../../utils/logger";
import { enforceFreezeState } from "../../middleware/governance";
import {
  decodeCursor,
  encodeCursor,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from "../../utils/pagination";

const router: Router = Router();

const getRunsSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(parseInt(val, 10), MAX_PAGE_LIMIT) : DEFAULT_PAGE_LIMIT))
      .refine((val) => val > 0, {
        message: "Limit must be positive",
      }),
    offset: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 0))
      .refine((val) => val >= 0, {
        message: "Offset must be non-negative",
      }),
    cursor: z.string().optional(), // Base64 cursor for cursor-based pagination
    direction: z.enum(["next", "prev"]).optional().default("next"),
    status: z.enum(["pending", "running", "completed", "failed"]).optional(),
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

      const { limit, cursor, direction, status } = getRunsSchema.parse({ query: req.query }).query;

      // Build WHERE clause
      let whereClause = "WHERE tenant_id = $1";
      const params: (string | number)[] = [tenantId];
      if (status) {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      // Cursor-based pagination: add cursor condition
      let cursorPagination = false;
      if (cursor) {
        const decoded = decodeCursor(cursor);
        if (decoded) {
          cursorPagination = true;
          if (direction === "next") {
            whereClause += ` AND (created_at, id) < ($${params.length + 1}, $${params.length + 2})`;
            params.push(decoded.created_at, decoded.id);
          } else {
            whereClause += ` AND (created_at, id) > ($${params.length + 1}, $${params.length + 2})`;
            params.push(decoded.created_at, decoded.id);
          }
        }
      }

      // ORDER BY: cursor pagination uses time-desc, offset uses created_at desc
      const orderByClause = cursorPagination
        ? direction === "next"
          ? "ORDER BY created_at DESC, id DESC"
          : "ORDER BY created_at ASC, id ASC"
        : "ORDER BY created_at DESC";

      // Fetch one extra row to determine hasMore
      const fetchLimit = limit + 1;

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
        unmatched_source_count: number | null;
        unmatched_target_count: number | null;
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
          unmatched_source_count,
          unmatched_target_count
         FROM reconciliation_runs
         ${whereClause}
         ${orderByClause}
         LIMIT $${params.length + 1}`,
        [...params, fetchLimit]
      );

      // Determine hasMore and trim to requested limit
      const hasMore = runs.length > limit;
      const paginatedRuns = hasMore ? runs.slice(0, limit) : runs;

      // Build cursor response
      let nextCursor: string | undefined;
      let prevCursor: string | undefined;

      if (paginatedRuns.length > 0) {
        const firstItem = paginatedRuns[0]!;
        const lastItem = paginatedRuns[paginatedRuns.length - 1]!;

        if (cursorPagination) {
          if (direction === "next") {
            if (hasMore) {
              nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
            }
            prevCursor = encodeCursor(firstItem.created_at, firstItem.id);
          } else {
            if (hasMore) {
              prevCursor = encodeCursor(firstItem.created_at, firstItem.id);
            }
            nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
          }
        } else {
          // For offset, still provide cursor for clients that want to switch
          nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
        }
      }

      // Transform to frontend-expected format using canonical contract terminology
      const rows = paginatedRuns.map((run) => ({
        run_id: run.id,
        created_at: run.created_at,
        status: run.status,
        policy: run.policy_name,
        total_records: run.total_records,
        matched: run.matched_count,
        unmatched: (run.unmatched_source_count || 0) + (run.unmatched_target_count || 0),
        unmatchedSourceCount: run.unmatched_source_count,
        unmatchedTargetCount: run.unmatched_target_count,
      }));

      // Get total count only for offset pagination (cursor pagination doesn't need it)
      let totalCount: number | undefined;
      if (!cursorPagination) {
        const countResult = await query<{ count: string }>(
          `SELECT COUNT(*)::text as count FROM reconciliation_runs WHERE tenant_id = $1`,
          [tenantId]
        );
        totalCount = countResult[0] ? parseInt(countResult[0].count, 10) : 0;
      }

      const response: any = {
        rows,
        pagination: cursorPagination
          ? {
              limit,
              hasMore,
              ...(nextCursor && { nextCursor }),
              ...(prevCursor && { prevCursor }),
            }
          : {
              limit,
              offset: getRunsSchema.parse({ query: req.query }).query.offset,
              total: totalCount,
              hasMore,
              ...(nextCursor && { nextCursor }),
            },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
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
        unmatched_source_count: number | null;
        unmatched_target_count: number | null;
        error_message: string | null;
        // Run-level fields
        source_adapter: string | null;
        target_adapter: string | null;
        template_id: string | null;
        // Provenance fields from recon_results
        result_id: string | null;
        snapshot_id: string | null;
        input_hash: string | null;
        started_at: string | null;
        completed_at: string | null;
        provenance_config_version: string | null;
        provenance_config_source: string | null;
        provenance_template_id: string | null;
        provenance_matching_rule_ids: string | null;
        provenance_rule_version_count: string | null;
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
          rr.unmatched_source_count,
          rr.unmatched_target_count,
          rr.error_message,
          rr.source_adapter,
          rr.target_adapter,
          rr.template_id,
          recon_results.id as result_id,
          recon_results.snapshot_id,
          recon_results.input_hash,
          recon_results.started_at,
          recon_results.completed_at,
          recon_results.summary -> 'provenance' ->> 'configVersion' as provenance_config_version,
          recon_results.summary -> 'provenance' ->> 'configSource' as provenance_config_source,
          recon_results.summary -> 'provenance' ->> 'templateId' as provenance_template_id,
          recon_results.summary -> 'provenance' ->> 'matchingRuleIds' as provenance_matching_rule_ids,
          recon_results.summary -> 'provenance' ->> 'ruleVersionCount' as provenance_rule_version_count
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

      // Build provenance object matching CanonicalRunProvenance contract
      const hasProvenanceData =
        run.provenance_config_version !== null ||
        run.provenance_config_source !== null ||
        run.snapshot_id !== null;

      const matchingRuleIds = run.provenance_matching_rule_ids
        ? JSON.parse(run.provenance_matching_rule_ids)
        : [];

      const sourceAdapter = run.source_adapter || null;
      const targetAdapter = run.target_adapter || null;

      const provenance = hasProvenanceData
        ? {
            runId: run.id,
            runResultId: run.result_id,
            snapshotId: run.snapshot_id,
            inputHash: run.input_hash,
            executedAt: run.started_at,
            completedAt: run.completed_at,
            configSource: run.provenance_config_source,
            configVersion: run.provenance_config_version,
            templateId: run.provenance_template_id,
            matchingRuleIds,
            ruleVersionCount: run.provenance_rule_version_count
              ? Number(run.provenance_rule_version_count)
              : 0,
            sourceAdapter,
            targetAdapter,
            sourceReference: [
              sourceAdapter || "source",
              targetAdapter || "target",
              run.result_id || "result",
            ].join(":"),
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
          // Canonical contract fields
          matched: run.matched_count,
          unmatched: (run.unmatched_source_count || 0) + (run.unmatched_target_count || 0),
          unmatchedSourceCount: run.unmatched_source_count,
          unmatchedTargetCount: run.unmatched_target_count,
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

// ---- Added for 2026 API Product Spine ----

import { idempotencyMiddleware } from "../../middleware/idempotency";

/**
 * Creates a new reconciliation run
 */
router.post(
  "/runs",
  requirePermission(Permission.JOBS_WRITE),
  idempotencyMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_ACCESS_DENIED",
          message: "Tenant context is required",
        });
        return;
      }

      // Stub implementation for creating run
      res.status(201).json({
        id: `run_${Date.now()}`,
        status: "pending",
        message: "Run created successfully",
      });
    } catch {
      logError("Error creating run", { error: _error });
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
);

/**
 * Gets the proofpack for a run
 */
router.get(
  "/runs/:id/proofpack",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_ACCESS_DENIED",
          message: "Tenant context is required",
        });
        return;
      }

      // Stub implementation for proofpack
      res.status(200).json({
        runId: req.params.id,
        auditTrail: [],
        evidence: [],
      });
    } catch {
      logError("Error fetching proofpack", { error: _error });
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
);

/**
 * Gets the deltas for a run
 */
router.get(
  "/runs/:id/delta",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_ACCESS_DENIED",
          message: "Tenant context is required",
        });
        return;
      }

      res.status(200).json({
        runId: req.params.id,
        deltas: [],
      });
    } catch {
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
);

/**
 * Records an adjudication decision
 */
router.post(
  "/runs/:id/adjudications",
  requirePermission(Permission.JOBS_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_ACCESS_DENIED",
          message: "Tenant context is required",
        });
        return;
      }

      res.status(201).json({
        id: `adj_${Date.now()}`,
        status: "recorded",
      });
    } catch {
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
);

export { router as runsRouter };
