/**
 * Exception Intelligence Routes
 *
 * Provides AI-powered exception intelligence:
 * - Similar case finding
 * - Why-flagged explanations
 * - Policy tuning hints
 * - Run-to-run delta analysis
 *
 * TENANT SAFETY: All queries scoped to req.tenantId
 * FREEZE AWARE: Reads are unrestricted; analytics are always available
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { prisma } from "../infrastructure/db/prisma";
import { AdjudicationMemoryService } from "../services/intelligence/adjudication-memory";
import { RunDeltaIntelligence } from "../services/intelligence/run-delta-intelligence";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";
import { logInfo } from "../utils/logger";

const router: Router = Router();

const adjudicationMemoryService = new AdjudicationMemoryService(prisma);
const runDeltaIntelligence = new RunDeltaIntelligence(prisma);

const findSimilarCasesSchema = z.object({
  params: z.object({
    exceptionId: z.string().uuid(),
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("5"),
    includeResolved: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .default("false"),
  }),
});

const whyFlaggedSchema = z.object({
  params: z.object({
    exceptionId: z.string().uuid(),
  }),
});

const policyTuningHintsSchema = z.object({
  params: z.object({
    exceptionId: z.string().uuid(),
  }),
});

const runDeltaSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
  }),
  query: z.object({
    previousRunId: z.string().uuid().optional(),
  }),
});

const runTrendSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  query: z.object({
    runs: z.string().regex(/^\d+$/).transform(Number).optional().default("5"),
  }),
});

/**
 * GET /api/exceptions/:exceptionId/similar
 * Find similar resolved exceptions for reference
 */
router.get(
  "/:exceptionId/similar",
  requirePermission(Permission.EXCEPTIONS_READ),
  validateRequest(findSimilarCasesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { exceptionId } = req.params;
      const { limit, includeResolved } = req.query as {
        limit: number;
        includeResolved: boolean;
      };

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const similarCases = await adjudicationMemoryService.findSimilarCases(
        tenantId,
        exceptionId,
        limit,
        includeResolved
      );

      logInfo("Similar cases retrieved", {
        tenantId,
        exceptionId,
        count: similarCases.length,
      });

      res.json({
        data: {
          exceptionId,
          similarCases,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to find similar cases", 500, {
        userId: req.userId,
        exceptionId: req.params.exceptionId,
      });
    }
  }
);

/**
 * GET /api/exceptions/:exceptionId/explain
 * Get explanation of why an exception was flagged
 */
router.get(
  "/:exceptionId/explain",
  requirePermission(Permission.EXCEPTIONS_READ),
  validateRequest(whyFlaggedSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { exceptionId } = req.params;

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
        include: {
          archetypeClassifications: {
            include: {
              archetype: true,
            },
          },
        },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const explanation = await adjudicationMemoryService.explainWhyFlagged(tenantId, exceptionId);

      logInfo("Why-flagged explanation generated", {
        tenantId,
        exceptionId,
        reasonCount: explanation.reasons.length,
      });

      res.json({
        data: {
          exceptionId,
          explanation,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to generate explanation", 500, {
        userId: req.userId,
        exceptionId: req.params.exceptionId,
      });
    }
  }
);

/**
 * GET /api/exceptions/:exceptionId/policy-hints
 * Get policy tuning suggestions based on this exception
 */
router.get(
  "/:exceptionId/policy-hints",
  requirePermission(Permission.EXCEPTIONS_READ),
  validateRequest(policyTuningHintsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { exceptionId } = req.params;

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const hints = await adjudicationMemoryService.generatePolicyTuningHints(
        tenantId,
        exceptionId
      );

      logInfo("Policy tuning hints generated", {
        tenantId,
        exceptionId,
        hintCount: hints.length,
      });

      res.json({
        data: {
          exceptionId,
          hints,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to generate policy hints", 500, {
        userId: req.userId,
        exceptionId: req.params.exceptionId,
      });
    }
  }
);

/**
 * GET /api/runs/:runId/delta
 * Get delta analysis between this run and the previous run
 */
router.get(
  "/runs/:runId/delta",
  requirePermission(Permission.JOBS_READ),
  validateRequest(runDeltaSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { runId } = req.params;
      const { previousRunId } = req.query as { previousRunId?: string };

      const run = await prisma.reconResult.findFirst({
        where: { id: runId, tenantId },
      });

      if (!run) {
        throw new NotFoundError("Run not found", "recon_result", runId);
      }

      const storedDelta = await runDeltaIntelligence.getStoredDelta(tenantId, runId);

      if (storedDelta) {
        logInfo("Stored run delta retrieved", {
          tenantId,
          runId,
        });

        return res.json({
          data: storedDelta,
        });
      }

      const resolvedPreviousRunId =
        previousRunId || (await runDeltaIntelligence.getPreviousRunId(tenantId, run.jobId, runId));

      const deltaAnalysis = await runDeltaIntelligence.generateDelta(
        tenantId,
        runId,
        resolvedPreviousRunId
      );

      const stored = await runDeltaIntelligence.storeDelta(tenantId, deltaAnalysis);

      logInfo("Run delta analysis generated and stored", {
        tenantId,
        runId,
        previousRunId: resolvedPreviousRunId,
        processingTimeMs: deltaAnalysis.processingTimeMs,
      });

      res.json({
        data: {
          ...stored,
          analysis: deltaAnalysis,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to generate run delta", 500, {
        userId: req.userId,
        runId: req.params.runId,
      });
    }
  }
);

/**
 * GET /api/jobs/:jobId/delta/trend
 * Get run-to-run trend analysis for a job
 */
router.get(
  "/jobs/:jobId/delta/trend",
  requirePermission(Permission.JOBS_READ),
  validateRequest(runTrendSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { jobId } = req.params;
      const { runs } = req.query as { runs: number };

      const job = await prisma.reconJob.findFirst({
        where: { id: jobId, tenantId },
      });

      if (!job) {
        throw new NotFoundError("Job not found", "recon_job", jobId);
      }

      const [history, trendSummary] = await Promise.all([
        runDeltaIntelligence.getRunTrendHistory(tenantId, jobId, runs),
        runDeltaIntelligence.computeTrendSummary(tenantId, jobId, runs),
      ]);

      logInfo("Run trend analysis retrieved", {
        tenantId,
        jobId,
        runCount: history.length,
        overallTrend: trendSummary.overallTrend,
      });

      res.json({
        data: {
          jobId,
          trendSummary,
          history,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to compute trend", 500, {
        userId: req.userId,
        jobId: req.params.jobId,
      });
    }
  }
);

/**
 * POST /api/exceptions/:exceptionId/record
 * Record adjudication as memory for future reference
 */
router.post(
  "/:exceptionId/record",
  requirePermission(Permission.EXCEPTIONS_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;
      const { exceptionId } = req.params;
      const { resolution, reason, notes, override } = req.body as {
        resolution?: string;
        reason?: string;
        notes?: string;
        override?: boolean;
      };

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const record = await adjudicationMemoryService.recordAdjudication(tenantId, {
        exceptionId,
        jobId: exception.jobId,
        runId: exception.reconResultId,
        resolution: resolution || "unknown",
        reason: reason || "",
        notes,
        adjudicatorId: userId,
        adjudicatorType: "operator",
        adjudicationType: override ? "override" : "standard",
      });

      logInfo("Adjudication recorded", {
        tenantId,
        exceptionId,
        resolution,
        recordId: record.id,
      });

      res.json({
        data: record,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to record adjudication", 500, {
        userId: req.userId,
        exceptionId: req.params.exceptionId,
      });
    }
  }
);

export { router as exceptionIntelligenceRouter };
