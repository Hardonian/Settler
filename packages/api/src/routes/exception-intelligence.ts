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
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { prisma } from "../infrastructure/db/prisma";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";
import { logInfo } from "../utils/logger";

const router: Router = Router();

/**
 * GET /api/exceptions/:exceptionId/similar
 * Find similar resolved exceptions for reference
 */
router.get(
  "/:exceptionId/similar",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.params.exceptionId as string;
      const limit = parseInt(req.query.limit as string) || 5;
      const includeResolved = req.query.includeResolved === "true";

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
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
        },
        take: limit,
        orderBy: { confidence: "desc" },
      });

      const similarCases = similarMatches.map((match) => ({
        id: match.id,
        status: match.status,
        resolution: match.resolutionReason,
        confidence: match.confidence.toNumber(),
        severity: match.severity,
        adjudicatedAt: match.reviewedAt,
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
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.params.exceptionId as string;

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const reasons: { code: string; label: string; confidence: number; details: string }[] = [];

      const meta = exception.metadata as {
        amountDiff?: number;
        dateDiff?: number;
        reason?: string;
      } | null;
      if (meta?.amountDiff) {
        reasons.push({
          code: "AMOUNT_DIFF",
          label: "Amount difference detected",
          confidence: Math.min(Math.abs(Number(meta.amountDiff)) / 100, 1),
          details: `Difference of ${meta.amountDiff}`,
        });
      }
      if (meta?.dateDiff) {
        reasons.push({
          code: "DATE_DIFF",
          label: "Date drift detected",
          confidence: Math.min(Math.abs(meta.dateDiff) / 30, 1),
          details: `Difference of ${meta.dateDiff} days`,
        });
      }

      if (!exception.targetTransactionId) {
        reasons.push({
          code: "MISSING_IN_TARGET",
          label: "No matching record found in target",
          confidence: 0.9,
          details: "Source transaction has no counterpart in target",
        });
      }

      const explanation = {
        exceptionId,
        reasons,
        summary:
          reasons.length > 0 && reasons[0]
            ? `This exception was flagged due to ${reasons[0].label.toLowerCase()}.`
            : "This exception was flagged based on reconciliation rules.",
        metadata: {
          severity: exception.severity,
          confidence: exception.confidence.toNumber(),
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
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const exceptionId = req.params.exceptionId as string;

      const exception = await prisma.reconciliationMatch.findFirst({
        where: { id: exceptionId, tenantId },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const hints: { type: string; priority: string; suggestion: string; rationale: string }[] = [];

      const recentCount = await prisma.reconciliationMatch.count({
        where: {
          tenantId,
          status: { in: ["resolved", "dismissed"] },
          severity: exception.severity,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentCount > 10) {
        hints.push({
          type: "auto_resolution",
          priority: "medium",
          suggestion: "Consider creating an auto-resolution rule for this severity level.",
          rationale: `${recentCount} similar exceptions have been resolved in the last 30 days.`,
        });
      }

      if (exception.confidence.toNumber() < 0.7) {
        hints.push({
          type: "threshold_adjustment",
          priority: "high",
          suggestion: "Review confidence threshold for this match type.",
          rationale: "Low confidence matches may indicate need for threshold tuning.",
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
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const runId = req.params.runId as string;
      const previousRunId = req.query.previousRunId as string | undefined;

      const run = await prisma.reconResult.findFirst({
        where: { id: runId, tenantId },
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
          } as unknown as Prisma.InputJsonValue,
          sourceDataChanged: sourceDelta !== 0,
          targetDataChanged: targetDelta !== 0,
          totalDelta:
            run.matchedCount +
            run.unmatchedSourceCount +
            run.unmatchedTargetCount -
            (previousRun.matchedCount +
              previousRun.unmatchedSourceCount +
              previousRun.unmatchedTargetCount),
          matchedDelta: run.matchedCount - previousRun.matchedCount,
          unmatchedDelta:
            run.unmatchedSourceCount +
            run.unmatchedTargetCount -
            (previousRun.unmatchedSourceCount + previousRun.unmatchedTargetCount),
          exceptionDelta: (run.conflictCount || 0) - (previousRun.conflictCount || 0),
          newExceptionPatterns: [] as unknown as Prisma.InputJsonValue,
          resolvedPatterns: [] as unknown as Prisma.InputJsonValue,
          configDriftDetected: false,
          configDriftSummary: [] as unknown as Prisma.InputJsonValue,
          confidenceDelta:
            run.confidenceAvg && previousRun.confidenceAvg
              ? run.confidenceAvg.toNumber() - previousRun.confidenceAvg.toNumber()
              : undefined,
        },
      });

      logInfo("Run delta analysis generated", {
        tenantId,
        runId,
        previousRunId: resolvedPreviousRunId,
      });

      return res.json({ data: delta });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to generate run delta", 500, {
        userId: req.userId,
        runId: req.params.runId,
      });
      return;
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
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const jobId = req.params.jobId as string;
      const runs = parseInt(req.query.runs as string) || 5;

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
              volatility: 0,
              avgExceptionRate: 0,
            },
            history: [],
            message: "Not enough run history for trend analysis",
          },
        });
      }

      const exceptionDeltas = history.map((h) => h.exceptionDelta);
      const avgExceptionRate = exceptionDeltas.reduce((a, b) => a + b, 0) / exceptionDeltas.length;

      let overallTrend: "improving" | "stable" | "degrading" = "stable";
      if (
        exceptionDeltas.length >= 2 &&
        exceptionDeltas[0] !== undefined &&
        exceptionDeltas[1] !== undefined
      ) {
        if (exceptionDeltas[0] < 0 && exceptionDeltas[1] <= 0) {
          overallTrend = "improving";
        } else if (exceptionDeltas[0] > 0 && exceptionDeltas[1] >= 0) {
          overallTrend = "degrading";
        }
      }

      const variance =
        exceptionDeltas.reduce((sum, val) => sum + Math.pow(val - avgExceptionRate, 2), 0) /
        exceptionDeltas.length;

      logInfo("Run trend analysis retrieved", {
        tenantId,
        jobId,
        runCount: history.length,
        overallTrend,
      });

      return res.json({
        data: {
          jobId,
          trendSummary: {
            overallTrend,
            exceptionTrend: avgExceptionRate,
            volatility: Math.sqrt(variance),
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
      return;
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
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "reconciliation_match", exceptionId);
      }

      const adjudication = await prisma.exceptionAdjudicationMemory.create({
        data: {
          tenantId,
          exceptionId,
          resolution: resolution || "unknown",
          resolutionReason: reason || "",
          operatorNotes: notes || "",
          adjudicatorId: userId,
          adjudicatorType: "operator",
          adjudicationType: override ? "override" : "standard",
          annotations: (exception.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          entryHash: crypto
            .createHash("sha256")
            .update(
              JSON.stringify({
                exceptionId,
                tenantId,
                resolution: resolution || "unknown",
                at: new Date().toISOString(),
              })
            )
            .digest("hex"),
        },
      });

      logInfo("Adjudication recorded", {
        tenantId,
        exceptionId,
        resolution,
        recordId: adjudication.id,
      });

      return res.json({ data: adjudication });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to record adjudication", 500, {
        userId: req.userId,
        exceptionId: req.params.exceptionId,
      });
      return;
    }
  }
);

export { router as exceptionIntelligenceRouter };
