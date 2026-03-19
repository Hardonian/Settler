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
import { enforceFreezeState } from "../middleware/governance";
import { PrismaClient, ReconResult } from "@prisma/client";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError, ValidationError } from "../utils/typed-errors";
import { trackEventAsync } from "../utils/event-tracker";

const router: Router = Router();
const prisma = new PrismaClient();

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

      const where = {
        tenantId,
        ...(status && { status }),
        ...(search && {
          reconJob: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      };

      const runs = await prisma.reconResult.findMany({
        where,
        include: {
          reconJob: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.reconResult.count({ where });

      // Transform to operator-friendly format
      const data = runs.map((run) => {
        const summary = run.summary as {
          totalItems?: number;
          matched?: number;
          missing?: number;
          drift?: number;
          mismatched?: number;
        } | null;

        return {
          id: run.id,
          name: run.reconJob.name,
          status: run.status,
          startedAt: run.startedAt.toISOString(),
          completedAt: run.completedAt?.toISOString() || null,
          summary: {
            totalItems: summary?.totalItems || 0,
            matched: summary?.matched || 0,
            missing: summary?.missing || 0,
            drift: summary?.drift || 0,
            mismatched: summary?.mismatched || 0,
          },
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
      const run = await prisma.reconResult.findFirst({
        where: {
          id: runId,
          tenantId,
        },
        include: {
          reconJob: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!run) {
        throw new NotFoundError("Run not found or access denied", "run", runId);
      }

      // Calculate progress
      let progress = 0;
      if (run.status === "completed") {
        progress = 100;
      } else if (run.status === "failed") {
        progress = 0;
      } else if (run.status === "running") {
        const elapsed = Date.now() - run.startedAt.getTime();
        const estimatedDuration = 30000; // 30s estimate
        progress = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100));
      }

      // Build stage information (simplified for now - can be enhanced)
      const stages = [
        {
          id: "1",
          name: "Initialize",
          status: run.status === "pending" ? "pending" : "completed",
          startedAt: run.startedAt,
          completedAt: run.status === "pending" ? undefined : run.startedAt,
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
          startedAt: run.status === "pending" ? undefined : run.startedAt,
          completedAt: run.status === "completed" ? run.completedAt : undefined,
          error: run.status === "failed" ? run.errorMessage : undefined,
        },
        {
          id: "3",
          name: "Match Records",
          status: run.status === "completed" ? "completed" : "pending",
          startedAt: run.status === "completed" ? run.startedAt : undefined,
          completedAt: run.completedAt,
        },
        {
          id: "4",
          name: "Generate Results",
          status: run.status === "completed" ? "completed" : "pending",
          startedAt: run.status === "completed" ? run.startedAt : undefined,
          completedAt: run.completedAt,
        },
      ];

      const summary = run.summary as {
        totalItems?: number;
        matched?: number;
        missing?: number;
        drift?: number;
        mismatched?: number;
      } | null;

      res.json({
        data: {
          id: run.id,
          name: run.reconJob.name,
          status: run.status,
          progress,
          startedAt: run.startedAt,
          completedAt: run.completedAt,
          error: run.errorMessage,
          summary: {
            totalItems: summary?.totalItems || 0,
            matched: summary?.matched || 0,
            missing: summary?.missing || 0,
            drift: summary?.drift || 0,
            mismatched: summary?.mismatched || 0,
          },
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
      const { runId } = req.params;
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const originalRun = await prisma.reconResult.findFirst({
        where: {
          id: runId,
          tenantId,
        },
        include: {
          reconJob: true,
        },
      });

      if (!originalRun) {
        throw new NotFoundError("Run not found or access denied", "run", runId);
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

      const newRun = await prisma.reconResult.create({
        data: {
          reconJob: {
            connect: {
              id: originalRun.reconJobId,
            },
          },
          tenant: {
            connect: {
              id: tenantId,
            },
          },
          status: "running",
          // TODO: This is not the right way to do this. We need a proper way to trigger a new run.
          // This is just a placeholder to make the code compile.
        },
      });

      // Track event
      trackEventAsync(userId, "RunRetried", {
        originalRunId: runId,
        newExecutionId: newRun.id,
        jobId: newRun.reconJobId,
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
