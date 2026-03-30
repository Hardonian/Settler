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
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";
import { logInfo } from "../utils/logger";

const router: Router = Router();

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
  requirePermission(Permission.OPERATOR_READ),
  validateRequest(findSimilarCasesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.params.exceptionId as string;
      const { limit, includeResolved } = req.query as {
        limit: number;
        includeResolved: boolean;
      };

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
        include: {
          archetypeClassifications: {
            include: { archetype: true },
          },
        },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const resolvedStatuses = includeResolved ? ["resolved", "dismissed"] : ["resolved"];

      const similarMatches = await prisma.reconciliationMatch.findMany({
        where: {
          tenantId,
          status: { in: resolvedStatuses },
          id: { not: exceptionId },
          archetypeClassifications: {
            some: {
              archetypeId: {
                in: exception.archetypeClassifications.map((c) => c.archetypeId),
              },
            },
          },
        },
        include: {
          archetypeClassifications: {
            include: { archetype: true },
          },
          adjudicationMemories: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        take: limit,
        orderBy: { confidence: "desc" },
      });

      const similarCases = similarMatches.map((match) => ({
        id: match.id,
        status: match.status,
        resolution: match.resolutionReason,
        confidence: match.confidence.toNumber(),
        archetype: match.archetypeClassifications[0]?.archetype?.label || "Unknown",
        adjudicatedAt: match.adjudicationMemories[0]?.createdAt || null,
        similarity: match.archetypeClassifications.length > 0 ? 0.8 : 0.5,
      }));

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
  requirePermission(Permission.OPERATOR_READ),
  validateRequest(whyFlaggedSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.params.exceptionId as string;

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
        include: {
          archetypeClassifications: {
            include: { archetype: true },
          },
          run: {
            include: { reconJob: true },
          },
        },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const reasons: { code: string; label: string; confidence: number; details: string }[] = [];

      for (const classification of exception.archetypeClassifications) {
        reasons.push({
          code: classification.archetype.code,
          label: classification.archetype.label,
          confidence: classification.confidence.toNumber(),
          details: classification.archetype.description || "",
        });
      }

      if (exception.metadata) {
        const meta = exception.metadata as {
          amountDiff?: number;
          dateDiff?: number;
          reason?: string;
        };
        if (meta.amountDiff) {
          reasons.push({
            code: "AMOUNT_DIFF",
            label: "Amount difference detected",
            confidence: Math.min(Math.abs(Number(meta.amountDiff)) / 100, 1),
            details: `Difference of ${meta.amountDiff}`,
          });
        }
        if (meta.dateDiff) {
          reasons.push({
            code: "DATE_DIFF",
            label: "Date drift detected",
            confidence: Math.min(Math.abs(meta.dateDiff) / 30, 1),
            details: `Difference of ${meta.dateDiff} days`,
          });
        }
      }

      const explanation = {
        exceptionId,
        reasons,
        summary:
          reasons.length > 0
            ? `This exception was flagged due to ${reasons[0].label.toLowerCase()} with ${Math.round(reasons[0].confidence * 100)}% confidence.`
            : "This exception was flagged based on reconciliation rules.",
        metadata: {
          severity: exception.severity,
          confidence: exception.confidence.toNumber(),
          jobName: exception.run?.reconJob?.name || "Unknown",
        },
      };

      logInfo("Why-flagged explanation generated", {
        tenantId,
        exceptionId,
        reasonCount: reasons.length,
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
  requirePermission(Permission.OPERATOR_READ),
  validateRequest(policyTuningHintsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.params.exceptionId as string;

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
        include: {
          archetypeClassifications: {
            include: { archetype: true },
          },
          run: {
            include: { reconJob: true },
          },
        },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const hints: { type: string; priority: string; suggestion: string; rationale: string }[] = [];

      for (const classification of exception.archetypeClassifications) {
        if (classification.archetype.typicalResolution) {
          hints.push({
            type: "resolution_template",
            priority: "high",
            suggestion: `For ${classification.archetype.label}, consider: ${classification.archetype.typicalResolution}`,
            rationale: `This archetype has historically been resolved with this approach.`,
          });
        }
      }

      const recentSimilarCount = await prisma.reconciliationMatch.count({
        where: {
          tenantId,
          status: { in: ["resolved", "dismissed"] },
          archetypeClassifications: {
            some: {
              archetypeId: {
                in: exception.archetypeClassifications.map((c) => c.archetypeId),
              },
            },
          },
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentSimilarCount > 10) {
        hints.push({
          type: "auto_resolution",
          priority: "medium",
          suggestion: "Consider creating an auto-resolution rule for this pattern.",
          rationale: `${recentSimilarCount} similar exceptions have been resolved in the last 30 days.`,
        });
      }

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
      const runId = req.params.runId as string;
      const previousRunId = (req.query.previousRunId as string) || undefined;

      const run = await prisma.reconResult.findFirst({
        where: { id: runId, tenantId },
        include: { reconJob: true },
      });

      if (!run) {
        throw new NotFoundError("Run not found", "recon_result", runId);
      }

      const storedDelta = await prisma.runDelta.findUnique({
        where: { currentRunId: runId },
      });

      if (storedDelta) {
        logInfo("Stored run delta retrieved", { tenantId, runId });

        return res.json({ data: storedDelta });
      }

      const resolvedPreviousRunId =
        previousRunId ||
        (await prisma.reconResult
          .findFirst({
            where: {
              tenantId,
              reconJobId: run.reconJobId,
              id: { not: runId },
              status: "completed",
              completedAt: { lt: run.startedAt },
            },
            orderBy: { completedAt: "desc" },
          })
          .then((r) => r?.id || null));

      if (!resolvedPreviousRunId) {
        return res.json({
          data: {
            currentRunId: runId,
            message: "No previous run found for comparison",
          },
        });
      }

      const previousRun = await prisma.reconResult.findFirst({
        where: { id: resolvedPreviousRunId, tenantId },
      });

      if (!previousRun) {
        return res.json({
          data: {
            currentRunId: runId,
            message: "Previous run not accessible",
          },
        });
      }

      const sourceDelta = run.sourceCount - previousRun.sourceCount;
      const targetDelta = run.targetCount - previousRun.targetCount;
      const matchedDelta = run.matchedCount - previousRun.matchedCount;
      const exceptionDelta = (run.conflictCount || 0) - (previousRun.conflictCount || 0);

      const delta = await prisma.runDelta.create({
        data: {
          tenantId,
          currentRunId: runId,
          previousRunId: resolvedPreviousRunId,
          jobId: run.reconJobId,
          inputChanged: sourceDelta !== 0 || targetDelta !== 0,
          inputDelta: {
            sourceCount: {
              previous: previousRun.sourceCount,
              current: run.sourceCount,
              delta: sourceDelta,
            },
            targetCount: {
              previous: previousRun.targetCount,
              current: run.targetCount,
              delta: targetDelta,
            },
          } as unknown as Record<string, unknown>,
          sourceDataChanged: sourceDelta !== 0,
          targetDataChanged: targetDelta !== 0,
          totalDelta:
            run.matchedCount +
            run.unmatchedSourceCount +
            run.unmatchedTargetCount -
            (previousRun.matchedCount +
              previousRun.unmatchedSourceCount +
              previousRun.unmatchedTargetCount),
          matchedDelta,
          unmatchedDelta:
            run.unmatchedSourceCount +
            run.unmatchedTargetCount -
            (previousRun.unmatchedSourceCount + previousRun.unmatchedTargetCount),
          exceptionDelta,
          criticalDelta: 0,
          highDelta: 0,
          mediumDelta: 0,
          lowDelta: 0,
          newExceptionPatterns: [] as unknown as Record<string, unknown>,
          resolvedPatterns: [] as unknown as Record<string, unknown>,
          configDriftDetected: false,
          configDriftSummary: [] as unknown as Record<string, unknown>,
          confidenceDelta:
            run.confidenceAvg && previousRun.confidenceAvg
              ? run.confidenceAvg.toNumber() - previousRun.confidenceAvg.toNumber()
              : undefined,
        },
      });

      logInfo("Run delta analysis generated and stored", {
        tenantId,
        runId,
        previousRunId: resolvedPreviousRunId,
      });

      res.json({ data: delta });
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
      const jobId = req.params.jobId as string;
      const runs = (req.query.runs as unknown as number) || 5;

      const job = await prisma.reconJob.findFirst({
        where: { id: jobId, tenantId },
      });

      if (!job) {
        throw new NotFoundError("Job not found", "recon_job", jobId);
      }

      const history = await prisma.runDelta.findMany({
        where: { tenantId, jobId },
        orderBy: { createdAt: "desc" },
        take: runs,
      });

      if (history.length < 2) {
        return res.json({
          data: {
            jobId,
            trendSummary: {
              overallTrend: "stable",
              exceptionTrend: 0,
              qualityTrend: 0,
              volatility: 0,
              avgExceptionRate: 0,
              projectedExceptions: 0,
            },
            history: [],
            message: "Not enough run history for trend analysis",
          },
        });
      }

      const exceptionDeltas = history.map((h) => h.exceptionDelta);
      const avgExceptionRate = exceptionDeltas.reduce((a, b) => a + b, 0) / exceptionDeltas.length;

      let overallTrend: "improving" | "stable" | "degrading" = "stable";
      if (exceptionDeltas[0] < 0 && exceptionDeltas[1] <= 0) {
        overallTrend = "improving";
      } else if (exceptionDeltas[0] > 0 && exceptionDeltas[1] >= 0) {
        overallTrend = "degrading";
      }

      const variance =
        exceptionDeltas.reduce((sum, val) => sum + Math.pow(val - avgExceptionRate, 2), 0) /
        exceptionDeltas.length;
      const volatility = Math.sqrt(variance);

      logInfo("Run trend analysis retrieved", {
        tenantId,
        jobId,
        runCount: history.length,
        overallTrend,
      });

      res.json({
        data: {
          jobId,
          trendSummary: {
            overallTrend,
            exceptionTrend: avgExceptionRate,
            qualityTrend: 0,
            volatility,
            avgExceptionRate,
            projectedExceptions: exceptionDeltas[0] || 0,
          },
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
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;
      const exceptionId = req.params.exceptionId as string;
      const { resolution, reason, notes, override } = req.body as {
        resolution?: string;
        reason?: string;
        notes?: string;
        override?: boolean;
      };

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
        include: {
          archetypeClassifications: {
            include: { archetype: true },
          },
        },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const adjudication = await prisma.exceptionAdjudicationMemory.create({
        data: {
          tenantId,
          exceptionId,
          runId: exception.runId,
          archetypeId: exception.archetypeClassifications[0]?.archetypeId,
          resolution: resolution || "unknown",
          reason: reason || "",
          notes: notes || "",
          adjudicatorId: userId,
          adjudicatorType: "operator",
          adjudicationType: override ? "override" : "standard",
          matchFeatures: exception.metadata as unknown as Record<string, unknown> | undefined,
        },
      });

      logInfo("Adjudication recorded", {
        tenantId,
        exceptionId,
        resolution,
        recordId: adjudication.id,
      });

      res.json({ data: adjudication });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to record adjudication", 500, {
        userId: req.userId,
        exceptionId: req.params.exceptionId,
      });
    }
  }
);

export { router as exceptionIntelligenceRouter };
