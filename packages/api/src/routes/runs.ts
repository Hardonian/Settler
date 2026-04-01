/**
 * Runs Routes
 *
 * Operator-facing route for reconciliation run history and detail.
 * Maps "runs" to executions with job context for clearer operator UX.
 *
 * GET /api/runs/:runId returns canonical operator detail via
 * `resolveOperatorRunDetailForTenants` (same read model as Next.js GET /api/runs/[id]),
 * wrapped in `{ data: ... }` for this Express envelope. It is not a second truth source.
 *
 * TENANT SAFETY: All queries scoped to req.tenantId
 * FREEZE AWARE: Retry mutation is freeze-gated; reads are unrestricted
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { enforceFreezeState } from "../middleware/governance";

import {
  decodeMergedRunsCursor,
  encodeMergedRunsCursor,
  fetchMergedReconciliationRunsPage,
  mapCanonicalListItemToApiRunsLegacyRow,
  MergedRunsCursorError,
  type MergedRunsCursorV1,
  resolveOperatorRunDetailForTenants,
} from "@settler/reconciliation-core";
import { handleRouteError } from "../utils/error-handler";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from "../utils/typed-errors";
import { trackEventAsync } from "../utils/event-tracker";
import { logInfo } from "../utils/logger";

const router: Router = Router();
import { prisma } from "../infrastructure/db/prisma";

const MERGED_LIST_BATCH_SIZE = 100;

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

function matchesStatusFilter(statusFilter: string | undefined, status: string): boolean {
  if (!statusFilter) return true;
  return status.toLowerCase() === statusFilter;
}

function matchesSearchFilter(searchFilter: string | undefined, id: string, name: string): boolean {
  if (!searchFilter) return true;
  const haystack = `${id} ${name}`.toLowerCase();
  return haystack.includes(searchFilter);
}

/**
 * GET /api/runs
 * List reconciliation runs from the canonical merged run-list surface, adapted
 * into the historical Express envelope with page/limit pagination.
 */
router.get(
  "/",
  requirePermission(Permission.JOBS_READ),
  validateRequest(listRunsQuerySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;

      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const normalizedStatus = status?.trim().toLowerCase() || undefined;
      const normalizedSearch = search?.trim().toLowerCase() || undefined;
      const page = parseInt((req.query.page as string) || "1");
      const limit = Math.min(parseInt((req.query.limit as string) || "50"), 100);
      const offset = (page - 1) * limit;
      const data: Array<ReturnType<typeof mapCanonicalListItemToApiRunsLegacyRow>> = [];
      let total = 0;
      let pagesScanned = 0;
      let cursorState: MergedRunsCursorV1 | null = null;

      while (true) {
        const mergedPage = await fetchMergedReconciliationRunsPage({
          prisma,
          tenantId,
          limit: MERGED_LIST_BATCH_SIZE,
          cursorState,
          runKind: "all",
          encodeCursor: encodeMergedRunsCursor,
        });
        pagesScanned += 1;

        for (const row of mergedPage.runs) {
          const legacy = mapCanonicalListItemToApiRunsLegacyRow(row);
          if (!matchesStatusFilter(normalizedStatus, legacy.status)) continue;
          if (!matchesSearchFilter(normalizedSearch, legacy.id, legacy.name)) continue;

          if (total >= offset && data.length < limit) {
            data.push(legacy);
          }
          total += 1;
        }

        if (!mergedPage.next_cursor) {
          break;
        }

        try {
          cursorState = decodeMergedRunsCursor(mergedPage.next_cursor);
        } catch (error) {
          throw new InternalServerError(
            error instanceof MergedRunsCursorError
              ? `Canonical merged run pagination drift: ${error.message}`
              : "Canonical merged run pagination drift"
          );
        }
      }

      logInfo("Runs listed", {
        tenantId,
        status: normalizedStatus,
        search: normalizedSearch,
        count: data.length,
        total,
        page,
        limit,
        pagesScanned,
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
 *
 * Canonical operator run detail (OperatorRunDetail) from reconciliation-core, same resolver as
 * Next GET /api/runs/[id]. Response is wrapped as `{ data: detail }` for the Express API envelope.
 */
router.get(
  "/:runId",
  requirePermission(Permission.JOBS_READ),
  validateRequest(getRunSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const runIdParam = req.params["runId"];
      const runId = Array.isArray(runIdParam) ? (runIdParam[0] ?? "") : (runIdParam ?? "");
      const tenantId = req.tenantId!;

      const outcome = await resolveOperatorRunDetailForTenants(prisma, [tenantId], runId);

      if (outcome.kind === "ambiguous_uuid_collision") {
        throw new ConflictError("Ambiguous run identifier", {
          code: "RUN_ID_COLLISION",
          detail:
            "The same UUID exists as both a recon job and an ingestion reconciliation run; disambiguate in the database or use tenant-scoped APIs that return a single kind.",
          recon_job_id: outcome.jobId,
          ingestion_run_id: outcome.ingestionRunId,
        });
      }

      if (outcome.kind === "not_found") {
        throw new NotFoundError("Run not found or access denied", "run", runId);
      }

      if (outcome.kind === "recon_enrichment_failed") {
        throw new InternalServerError(outcome.message);
      }

      const detail = outcome.detail;

      logInfo("Run detail fetched", {
        tenantId,
        runId: detail.id,
        jobName: detail.name,
        status: detail.status,
        hasError: !!detail.error,
      });

      res.json({ data: detail });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch run detail", 500, {
        userId: req.userId,
        runId: req.params.runId,
      });
    }
  }
);

/**
 * POST /api/runs/:runId/retry
 * Retry a failed run by creating a new execution for the same job
 */
router.post(
  "/:runId/retry",
  requirePermission(Permission.JOBS_WRITE),
  enforceFreezeState(),
  validateRequest(getRunSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const runIdParam2 = req.params["runId"];
      const runId2 = Array.isArray(runIdParam2) ? (runIdParam2[0] ?? "") : (runIdParam2 ?? "");
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const originalRun = await prisma.reconResult.findFirst({
        where: {
          id: runId2,
          tenantId,
        },
        include: {
          reconJob: true,
        },
      });

      if (!originalRun) {
        throw new NotFoundError("Run not found or access denied", "run", runId2);
      }

      if (originalRun.status !== "failed") {
        throw new ValidationError("Can only retry failed runs", "status", [
          {
            field: "status",
            message: `Run is ${originalRun.status}, not failed`,
            code: "INVALID_STATUS",
          },
        ]);
      }

      // Wrap duplicate-check + create in a Serializable transaction to prevent
      // TOCTOU race: two concurrent retry requests could both pass the findFirst
      // check before either creates, resulting in duplicate running retries.
      const newRun = await prisma.$transaction(
        async (tx) => {
          const existingRetry = await tx.reconResult.findFirst({
            where: {
              tenantId,
              reconJobId: originalRun.reconJobId,
              status: "running",
              metadata: {
                path: ["retryOfRunId"],
                equals: runId2,
              },
            },
            select: {
              id: true,
            },
          });

          if (existingRetry) {
            throw new ConflictError("Retry already in progress for this run", {
              code: "RETRY_ALREADY_IN_PROGRESS",
              runId: runId2,
              retryRunId: existingRetry.id,
            });
          }

          return tx.reconResult.create({
            data: {
              reconJob: {
                connect: {
                  id: originalRun.reconJobId,
                },
              },
              tenantId,
              status: "running",
              metadata: {
                retryOfRunId: runId2,
                retryTriggeredBy: userId,
                retryTriggeredAt: new Date().toISOString(),
              },
            },
          });
        },
        { isolationLevel: "Serializable" }
      );

      // Track event
      trackEventAsync(userId, "RunRetried", {
        originalRunId: runId2,
        newExecutionId: newRun.id,
        jobId: newRun.reconJobId,
      });

      logInfo("Run retry initiated", {
        tenantId,
        originalRunId: runId2,
        newExecutionId: newRun.id,
        jobId: newRun.reconJobId,
        triggeredBy: userId,
      });

      res.status(201).json({
        message: "Run retry initiated successfully",
        data: {
          id: newRun.id,
          name: originalRun.reconJob.name,
          status: "running",
          triggeredBy: userId,
          triggeredAt: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retry run", 500, {
        userId: req.userId,
        runId: req.params.runId,
      });
    }
  }
);

export { router as runsRouter };
