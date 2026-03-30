/**
 * Exception Queue Routes (Enterprise-Grade)
 *
 * Provides enterprise exception management with:
 * - Status workflow: open → in_progress → resolved|dismissed
 * - Operator assignment and ownership tracking
 * - Structured resolution reasons
 * - Operator notes and annotations
 * - Severity-based prioritization
 * - Audit trail via provenance service
 *
 * TENANT SAFETY: All queries scoped to req.tenantId
 * FREEZE AWARE: Mutations are freeze-gated; reads are unrestricted
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { enforceFreezeState } from "../middleware/governance";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { Prisma } from "@prisma/client";
import { prisma } from "../infrastructure/db/prisma";
import { ProvenanceService } from "../services/recon-core/provenance-service";
import { ExceptionReviewService } from "../application/services/ExceptionReviewService";

import { handleRouteError } from "../utils/error-handler";
import { NotFoundError, ConflictError } from "../utils/typed-errors";
import { trackEventAsync } from "../utils/event-tracker";
import { logInfo } from "../utils/logger";

type ExceptionForMapping = Prisma.ReconciliationMatchGetPayload<{
  include: {
    run: { select: { id: true } };
    sourceTransaction: {
      select: {
        id: true;
        category: true;
        description: true;
        amount: true;
        currency: true;
        date: true;
      };
    };
  };
}>;

type MemoryForMapping = Prisma.ExceptionAdjudicationMemoryGetPayload<{
  select: {
    id: true;
    resolution: true;
    resolutionReason: true;
    adjudicationType: true;
    adjudicatorId: true;
    adjudicatorType: true;
    outcome: true;
    confidence: true;
    sourceTrustScore: true;
    operatorNotes: true;
    systemNotes: true;
    evidenceIds: true;
    createdAt: true;
    completedAt: true;
    parentMemoryId: true;
  };
}>;

type EvidenceArtifactForMapping = Prisma.EvidenceArtifactGetPayload<{
  select: {
    id: true;
    artifactType: true;
    artifactKey: true;
    capturedAt: true;
    capturedBy: true;
    degraded: true;
    degradedReasons: true;
    attested: true;
    reliabilityScore: true;
  };
}>;

type ProofPackageForMapping = Prisma.ProofPackageGetPayload<{
  select: {
    id: true;
    packageType: true;
    packageKey: true;
    status: true;
    completenessScore: true;
    missingEvidence: true;
    completenessFlags: true;
    evidenceIds: true;
    createdAt: true;
    finalizedAt: true;
  };
}>;

const router: Router = Router();
const provenanceService = new ProvenanceService(prisma);
const exceptionReviewService = new ExceptionReviewService(prisma, provenanceService);

const CANONICAL_EXCEPTION_MATCH_TYPES = ["unmatched", "conflict"] as const;

// ─── Validation Schemas ──────────────────────────────────────────────────────

const listExceptionsSchema = z.object({
  query: z.object({
    jobId: z.string().uuid().optional(),
    status: z.enum(["open", "in_progress", "resolved", "dismissed"]).optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    assignedTo: z.string().uuid().optional(),
    category: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().max(255).optional(),
    sortBy: z
      .enum(["createdAt", "severity", "status", "confidence"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
    offset: z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
  }),
});

const resolveExceptionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    resolution: z.enum(["matched", "manual", "ignored", "duplicate"]),
    resolutionReason: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

const assignExceptionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    assignedTo: z.string().uuid(),
    notes: z.string().max(1000).optional(),
  }),
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(["in_progress", "resolved", "dismissed"]),
    notes: z.string().max(2000).optional(),
    resolutionReason: z.string().max(100).optional(),
  }),
});

const addNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    notes: z.string().min(1).max(2000),
  }),
});

const bulkResolveSchema = z.object({
  body: z.object({
    exceptionIds: z.array(z.string().uuid()).min(1).max(100),
    resolution: z.enum(["matched", "manual", "ignored", "duplicate"]),
    resolutionReason: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

const bulkAssignSchema = z.object({
  body: z.object({
    exceptionIds: z.array(z.string().uuid()).min(1).max(100),
    assignedTo: z.string().uuid(),
  }),
});

const bulkStatusSchema = z.object({
  body: z.object({
    exceptionIds: z.array(z.string().uuid()).min(1).max(100),
    status: z.enum(["open", "in_progress", "resolved", "dismissed"]),
    notes: z.string().max(1000).optional(),
  }),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

function appendAdjudicationHistory(
  metadata: unknown,
  entry: { actorId: string; action: string; details: Record<string, unknown> }
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? ({ ...metadata } as Record<string, unknown>)
      : {};
  const current = Array.isArray(base["adjudicationHistory"])
    ? [...(base["adjudicationHistory"] as unknown[])]
    : [];
  current.push({
    actorId: entry.actorId,
    action: entry.action,
    details: entry.details,
    timestamp: new Date().toISOString(),
  });
  return {
    ...base,
    adjudicationHistory: current.slice(-100),
  };
}

function mapExceptionToResponse(e: ExceptionForMapping) {
  let status: "open" | "in_progress" | "resolved" | "dismissed" = (e.status as any) || "open";
  if (!e.status && e.reviewed) {
    status = e.matchReason?.toLowerCase().includes("ignored") ? "dismissed" : "resolved";
  }

  return {
    id: e.id,
    runId: e.runId,
    jobId: e.runId,
    executionId: e.runId,
    sourceTransactionId: e.sourceTransactionId,
    targetTransactionId: e.targetTransactionId || null,
    matchType: e.matchType,
    confidence: Number(e.confidence),
    severity: e.severity || "medium",
    category: e.sourceTransaction?.category || "uncategorized",
    description: e.sourceTransaction?.description || null,
    amount: e.sourceTransaction?.amount || null,
    currency: e.sourceTransaction?.currency || "USD",
    status,
    assignedTo: e.assignedTo || null,
    resolutionReason: e.resolutionReason || null,
    notes: e.notes || null,
    matchReason: e.matchReason || null,
    amountDiff: e.amountDiff ? Number(e.amountDiff) : null,
    dateDiff: e.dateDiff || null,
    resolvedAt: e.reviewedAt ? e.reviewedAt.toISOString() : null,
    resolvedBy: e.reviewedBy || null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

async function validateExceptionAccess(id: string, tenantId: string) {
  const exception = await prisma.reconciliationMatch.findFirst({
    where: { id, tenantId, matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] } },
    select: { id: true, metadata: true, runId: true, status: true, assignedTo: true },
  });

  if (!exception) {
    throw new NotFoundError("Exception not found", "exception", id);
  }

  return exception;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/exceptions
 * List exceptions with full filtering, sorting, and pagination
 */
router.get(
  "/exceptions",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(listExceptionsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const {
        jobId,
        status,
        severity,
        assignedTo,
        startDate,
        endDate,
        search,
        sortBy,
        sortOrder,
        limit,
        offset,
      } = listExceptionsSchema.parse({ query: req.query }).query;

      const where: Prisma.ReconciliationMatchWhereInput = {
        tenantId,
        matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] },
        ...(jobId && { runId: jobId }),
        ...(status && { status }),
        ...(severity && { severity }),
        ...(assignedTo && { assignedTo }),
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { lte: new Date(endDate) } }),
      };

      if (search) {
        where.OR = [
          { notes: { contains: search, mode: "insensitive" } },
          { matchReason: { contains: search, mode: "insensitive" } },
        ];
      }

      const orderByMap: Record<string, any> = {
        createdAt: { createdAt: sortOrder },
        severity: { severity: sortOrder },
        status: { status: sortOrder },
        confidence: { confidence: sortOrder },
      };

      const [exceptions, total] = await Promise.all([
        prisma.reconciliationMatch.findMany({
          where,
          include: {
            run: { select: { id: true } },
            sourceTransaction: {
              select: {
                id: true,
                category: true,
                description: true,
                amount: true,
                currency: true,
                date: true,
              },
            },
          },
          orderBy: orderByMap[sortBy] || { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.reconciliationMatch.count({ where }),
      ]);

      logInfo("Exceptions listed", {
        tenantId,
        jobId,
        status,
        severity,
        assignedTo,
        count: exceptions.length,
        total,
        limit,
        offset,
      });

      res.json({
        data: exceptions.map(mapExceptionToResponse),
        pagination: {
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list exceptions", 500, { userId: req.userId });
    }
  }
);

/**
 * GET /api/exceptions/stats
 * Exception statistics with proper status breakdown
 * Must be defined BEFORE /:id to avoid shadowing
 */
router.get(
  "/exceptions/stats",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { jobId } = req.query as { jobId?: string };

      const whereBase: Prisma.ReconciliationMatchWhereInput = {
        tenantId,
        matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] },
        ...(jobId && { runId: jobId }),
      };

      const [statusCounts, severityCounts, unassigned] = await Promise.all([
        prisma.reconciliationMatch.groupBy({
          by: ["status"],
          where: whereBase,
          _count: { _all: true },
        }),
        prisma.reconciliationMatch.groupBy({
          by: ["severity"],
          where: whereBase,
          _count: { _all: true },
        }),
        prisma.reconciliationMatch.count({
          where: { ...whereBase, assignedTo: null, status: { notIn: ["resolved", "dismissed"] } },
        }),
      ]);

      const counts = statusCounts.reduce(
        (acc: Record<string, number>, curr: any) => {
          acc[curr.status || "open"] = curr._count._all;
          return acc;
        },
        { open: 0, in_progress: 0, resolved: 0, dismissed: 0 }
      );

      const severities = severityCounts.reduce(
        (acc: Record<string, number>, curr: any) => {
          acc[curr.severity || "medium"] = curr._count._all;
          return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0 }
      );

      const total = statusCounts.reduce((sum: number, curr: any) => sum + curr._count._all, 0);
      const { open, in_progress: inProgress, resolved, dismissed } = counts;
      const { critical, high, medium, low } = severities;

      const resolvedExceptions = await prisma.reconciliationMatch.findMany({
        where: {
          ...whereBase,
          status: { in: ["resolved", "dismissed"] },
          reviewedAt: { not: null },
        },
        select: { createdAt: true, reviewedAt: true },
        take: 1000,
        orderBy: { reviewedAt: "desc" },
      });

      let avgResolutionMs: number | null = null;
      if (resolvedExceptions.length > 0) {
        const totalMs = resolvedExceptions.reduce(
          (sum: number, e: { reviewedAt: Date | null; createdAt: Date }) => {
            if (!e.reviewedAt) return sum;
            return sum + (e.reviewedAt.getTime() - e.createdAt.getTime());
          },
          0
        );
        avgResolutionMs = Math.round(totalMs / resolvedExceptions.length);
      }

      res.json({
        data: {
          total,
          byStatus: { open, inProgress, resolved, dismissed },
          bySeverity: { critical, high, medium, low },
          unassigned,
          avgResolutionMs,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get exception statistics", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * GET /api/exceptions/:id
 * Get exception details with full workflow state
 */
router.get(
  "/exceptions/:id",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const tenantId = req.tenantId!;

      const [exception, memories, evidenceArtifacts, proofPackages, provenance] = await Promise.all(
        [
          prisma.reconciliationMatch.findFirst({
            where: {
              id,
              tenantId,
              matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] },
            },
            include: {
              run: {
                select: {
                  id: true,
                  status: true,
                  startedAt: true,
                  completedAt: true,
                },
              },
              sourceTransaction: true,
            },
          }),
          prisma.exceptionAdjudicationMemory.findMany({
            where: { tenantId, exceptionId: id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              resolution: true,
              resolutionReason: true,
              adjudicationType: true,
              adjudicatorId: true,
              adjudicatorType: true,
              outcome: true,
              confidence: true,
              sourceTrustScore: true,
              operatorNotes: true,
              systemNotes: true,
              evidenceIds: true,
              createdAt: true,
              completedAt: true,
              parentMemoryId: true,
            },
          }),
          prisma.evidenceArtifact.findMany({
            where: { tenantId, exceptionId: id },
            orderBy: { capturedAt: "desc" },
            select: {
              id: true,
              artifactType: true,
              artifactKey: true,
              capturedAt: true,
              capturedBy: true,
              degraded: true,
              degradedReasons: true,
              attested: true,
              reliabilityScore: true,
            },
          }),
          prisma.proofPackage.findMany({
            where: {
              tenantId,
              packageKey: {
                startsWith: `exception:${id}:`,
              },
            },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              packageType: true,
              packageKey: true,
              status: true,
              completenessScore: true,
              missingEvidence: true,
              completenessFlags: true,
              evidenceIds: true,
              createdAt: true,
              finalizedAt: true,
            },
          }),
          prisma.reconciliationProvenance.findMany({
            where: { tenantId, matchId: id },
            orderBy: { sequence: "asc" },
            select: {
              id: true,
              sequence: true,
              eventType: true,
              actorType: true,
              actorUserId: true,
              details: true,
              createdAt: true,
            },
          }),
        ]
      );

      if (!exception) {
        throw new NotFoundError("Exception not found", "exception", id);
      }

      const metadata = exception.metadata as Prisma.JsonObject;

      const adjudicationHistory =
        memories.length > 0
          ? memories
              .slice()
              .reverse()
              .map((memory: MemoryForMapping) => ({
                actorId: memory.adjudicatorId,
                action:
                  memory.outcome === "reopened"
                    ? "reopened"
                    : memory.resolution === "ignored"
                      ? "ignored"
                      : "resolved",
                details: {
                  resolution: memory.resolution,
                  resolutionReason: memory.resolutionReason,
                  notes: memory.operatorNotes,
                  memoryId: memory.id,
                },
                timestamp:
                  memory.completedAt?.toISOString?.() ?? memory.createdAt.toISOString?.() ?? null,
              }))
          : (metadata?.adjudicationHistory as any[]) || [];

      res.json({
        data: {
          ...mapExceptionToResponse(exception as any),
          run: exception.run,
          sourceTransaction: exception.sourceTransaction,
          adjudicationHistory,
          adjudicationMemories: memories.map((memory: MemoryForMapping) => ({
            id: memory.id,
            resolution: memory.resolution,
            resolutionReason: memory.resolutionReason,
            adjudicationType: memory.adjudicationType,
            adjudicatorId: memory.adjudicatorId,
            adjudicatorType: memory.adjudicatorType,
            outcome: memory.outcome,
            confidence: memory.confidence != null ? Number(memory.confidence) : null,
            sourceTrustScore:
              memory.sourceTrustScore != null ? Number(memory.sourceTrustScore) : null,
            operatorNotes: memory.operatorNotes,
            systemNotes: memory.systemNotes,
            evidenceIds: Array.isArray(memory.evidenceIds) ? memory.evidenceIds : [],
            createdAt: memory.createdAt.toISOString(),
            completedAt: memory.completedAt?.toISOString?.() ?? null,
            parentMemoryId: memory.parentMemoryId,
          })),
          decisionMemory: memories.map((memory: MemoryForMapping) => ({
            id: memory.id,
            resolution: memory.resolution,
            resolutionReason: memory.resolutionReason,
            adjudicationType: memory.adjudicationType,
            adjudicatorId: memory.adjudicatorId,
            adjudicatorType: memory.adjudicatorType,
            outcome: memory.outcome,
            confidence: memory.confidence != null ? Number(memory.confidence) : null,
            sourceTrustScore:
              memory.sourceTrustScore != null ? Number(memory.sourceTrustScore) : null,
            operatorNotes: memory.operatorNotes,
            systemNotes: memory.systemNotes,
            evidenceIds: Array.isArray(memory.evidenceIds) ? memory.evidenceIds : [],
            createdAt: memory.createdAt.toISOString(),
            completedAt: memory.completedAt?.toISOString?.() ?? null,
            parentMemoryId: memory.parentMemoryId,
          })),
          evidenceSummary: {
            total: evidenceArtifacts.length,
            degraded: evidenceArtifacts.filter((item: any) => item.degraded).length,
            attested: evidenceArtifacts.filter((item: any) => item.attested).length,
            latestCapturedAt: evidenceArtifacts[0]?.capturedAt?.toISOString?.() ?? null,
            items: evidenceArtifacts.map((item: EvidenceArtifactForMapping) => ({
              id: item.id,
              artifactType: item.artifactType,
              artifactKey: item.artifactKey,
              capturedAt: item.capturedAt?.toISOString?.() ?? null,
              capturedBy: item.capturedBy,
              degraded: Boolean(item.degraded),
              degradedReasons: Array.isArray(item.degradedReasons) ? item.degradedReasons : [],
              attested: Boolean(item.attested),
              reliabilityScore:
                item.reliabilityScore != null ? Number(item.reliabilityScore) : null,
            })),
          },
          proofSummary: {
            total: proofPackages.length,
            finalized: proofPackages.filter((item: any) => item.status === "finalized").length,
            latestCreatedAt: proofPackages[0]?.createdAt?.toISOString?.() ?? null,
            items: proofPackages.map((item: ProofPackageForMapping) => ({
              id: item.id,
              packageType: item.packageType,
              packageKey: item.packageKey,
              status: item.status,
              completenessScore:
                item.completenessScore != null ? Number(item.completenessScore) : 0,
              missingEvidence: Array.isArray(item.missingEvidence) ? item.missingEvidence : [],
              completenessFlags: Array.isArray(item.completenessFlags)
                ? item.completenessFlags
                : [],
              evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds : [],
              createdAt: item.createdAt?.toISOString?.() ?? null,
              finalizedAt: item.finalizedAt?.toISOString?.() ?? null,
            })),
          },
          provenance,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get exception", 500, { userId: req.userId });
    }
  }
);

/**
 * POST /api/exceptions/:id/resolve
 * Resolve an exception with structured resolution reason and audit trail
 */
router.post(
  "/exceptions/:id/resolve",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(resolveExceptionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const { resolution, resolutionReason, notes } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;
      const result = await exceptionReviewService.resolveException({
        tenantId,
        userId,
        exceptionId: id,
        resolution,
        resolutionReason,
        notes,
        traceId: req.traceId,
        requestId: req.requestId,
        ipAddress: req.ip,
        userAgent:
          typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
      });

      if (result.outcome !== "already_resolved") {
        trackEventAsync(userId, "ExceptionResolved", {
          exceptionId: id,
          resolution,
          resolutionReason: result.resolutionReason,
          outcome: result.outcome,
        });
      }

      logInfo("Exception resolved", {
        tenantId,
        exceptionId: id,
        resolution,
        resolutionReason: result.resolutionReason,
        outcome: result.outcome,
        resolvedBy: userId,
        traceId: req.traceId,
        requestId: req.requestId,
      });

      return res.json({
        data: {
          id,
          status: result.status,
          resolvedAt: result.reviewedAt,
          resolution: result.resolution,
          resolutionReason: result.resolutionReason,
          outcome: result.outcome,
        },
        message:
          result.outcome === "already_resolved"
            ? "Exception already resolved"
            : result.outcome === "re_adjudicated"
              ? "Exception review updated successfully"
              : `Exception ${result.status} successfully`,
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to resolve exception", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * POST /api/exceptions/:id/assign
 * Assign an exception to an operator
 */
router.post(
  "/exceptions/:id/assign",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(assignExceptionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const { assignedTo, notes } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const existing = await validateExceptionAccess(id, tenantId);

      if (existing.status === "resolved" || existing.status === "dismissed") {
        throw new ConflictError("Cannot assign a resolved exception", {
          code: "EXCEPTION_ALREADY_RESOLVED",
          currentStatus: existing.status,
        });
      }

      const newStatus = existing.status === "open" ? "in_progress" : existing.status;
      const updateResult = await prisma.reconciliationMatch.updateMany({
        where: { id, tenantId, matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] } },
        data: {
          assignedTo,
          status: newStatus,
          metadata: appendAdjudicationHistory(existing.metadata, {
            actorId: userId,
            action: "assign",
            details: { assignedTo, previousAssignee: existing.assignedTo, notes: notes || null },
          }) as Prisma.JsonObject,
        },
      });

      if (updateResult.count !== 1) {
        throw new NotFoundError("Exception not found", "exception", id);
      }

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "exception_assigned",
          resourceType: "reconciliation_match",
          resourceId: id,
          metadata: { assignedTo, previousAssignee: existing.assignedTo, notes },
        },
      });

      trackEventAsync(userId, "ExceptionAssigned", { exceptionId: id, assignedTo });

      logInfo("Exception assigned", { tenantId, exceptionId: id, assignedTo, assignedBy: userId });

      return res.json({
        data: { id, assignedTo, status: newStatus },
        message: "Exception assigned successfully",
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to assign exception", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * PUT /api/exceptions/:id/status
 * Update exception status with validation of state transitions
 */
router.put(
  "/exceptions/:id/status",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(updateStatusSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const { status, notes, resolutionReason } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const existing = await validateExceptionAccess(id, tenantId);

      const validTransitions: Record<string, string[]> = {
        open: ["in_progress", "resolved", "dismissed"],
        in_progress: ["open", "resolved", "dismissed"],
        resolved: ["open"],
        dismissed: ["open"],
      };

      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(status)) {
        throw new ConflictError(`Cannot transition from '${existing.status}' to '${status}'`, {
          code: "INVALID_STATE_TRANSITION",
          currentStatus: existing.status,
          requestedStatus: status,
          allowedTransitions: allowed,
        });
      }

      const updateResult = await prisma.reconciliationMatch.updateMany({
        where: { id, tenantId, matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] } },
        data: {
          status,
          reviewed: status === "resolved" || status === "dismissed",
          reviewedBy: status === "resolved" || status === "dismissed" ? userId : undefined,
          reviewedAt: status === "resolved" || status === "dismissed" ? new Date() : undefined,
          resolutionReason: resolutionReason || undefined,
          notes: notes || undefined,
          metadata: appendAdjudicationHistory(existing.metadata, {
            actorId: userId,
            action: "status_change",
            details: {
              fromStatus: existing.status,
              toStatus: status,
              notes: notes || null,
              resolutionReason: resolutionReason || null,
            },
          }) as Prisma.JsonObject,
        },
      });

      if (updateResult.count !== 1) {
        throw new NotFoundError("Exception not found", "exception", id);
      }

      await provenanceService.recordStatusTransition({
        tenantId,
        runId: existing.runId,
        fromStatus: existing.status,
        toStatus: status,
        actorType: "human",
        actorUserId: userId,
        reason: notes || null,
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "exception_status_changed",
          resourceType: "reconciliation_match",
          resourceId: id,
          metadata: {
            fromStatus: existing.status,
            toStatus: status,
            notes,
            resolutionReason,
          },
        },
      });

      logInfo("Exception status updated", {
        tenantId,
        exceptionId: id,
        fromStatus: existing.status,
        toStatus: status,
        updatedBy: userId,
      });

      return res.json({
        data: { id, status, previousStatus: existing.status },
        message: `Exception status changed to ${status}`,
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to update exception status", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * POST /api/exceptions/:id/notes
 * Add an operator note to an exception
 */
router.post(
  "/exceptions/:id/notes",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(addNoteSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const { notes } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const existing = await validateExceptionAccess(id, tenantId);

      const updateResult = await prisma.reconciliationMatch.updateMany({
        where: { id, tenantId, matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] } },
        data: {
          notes,
          metadata: appendAdjudicationHistory(existing.metadata, {
            actorId: userId,
            action: "note_added",
            details: { notes },
          }) as Prisma.JsonObject,
        },
      });

      if (updateResult.count !== 1) {
        throw new NotFoundError("Exception not found", "exception", id);
      }

      logInfo("Exception note added", { tenantId, exceptionId: id, addedBy: userId });

      return res.json({
        data: { id, notes },
        message: "Note added successfully",
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to add note", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * POST /api/exceptions/bulk-resolve
 * Bulk resolve exceptions with audit trail
 */
router.post(
  "/exceptions/bulk-resolve",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(bulkResolveSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { exceptionIds, resolution, resolutionReason, notes } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;
      const result = await exceptionReviewService.resolveExceptions({
        tenantId,
        userId,
        exceptionIds,
        resolution,
        resolutionReason,
        notes,
        traceId: req.traceId,
        requestId: req.requestId,
        ipAddress: req.ip,
        userAgent:
          typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
      });

      for (const entry of result.results) {
        if (entry.outcome === "already_resolved") {
          continue;
        }

        trackEventAsync(userId, "ExceptionResolved", {
          exceptionId: entry.exceptionId,
          resolution: entry.resolution,
          resolutionReason: entry.resolutionReason,
          outcome: entry.outcome,
          bulk: true,
        });
      }

      const resolved = result.resolvedCount + result.reAdjudicatedCount;
      const skipped =
        result.alreadyResolvedCount + result.notFoundCount + result.duplicateRequestCount;

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "exceptions_bulk_resolved",
          resourceType: "reconciliation_match",
          resourceId: null,
          metadata: {
            resolution,
            resolutionReason: result.results[0]?.resolutionReason ?? resolutionReason ?? resolution,
            resolved,
            reAdjudicated: result.reAdjudicatedCount,
            alreadyResolved: result.alreadyResolvedCount,
            notFound: result.notFoundCount,
            duplicateRequestCount: result.duplicateRequestCount,
            requestedCount: result.requestedCount,
            uniqueExceptionCount: result.uniqueExceptionCount,
          },
          traceId: req.traceId ?? null,
          requestId: req.requestId ?? null,
          actorType: "user",
          actorId: userId,
          reason: result.results[0]?.resolutionReason ?? resolutionReason ?? resolution,
        },
      });

      logInfo("Exceptions bulk resolved", {
        tenantId,
        resolved,
        reAdjudicated: result.reAdjudicatedCount,
        alreadyResolved: result.alreadyResolvedCount,
        notFound: result.notFoundCount,
        duplicateRequestCount: result.duplicateRequestCount,
        resolution,
        resolutionReason,
        resolvedBy: userId,
        traceId: req.traceId,
        requestId: req.requestId,
      });

      return res.json({
        data: {
          resolved,
          reAdjudicated: result.reAdjudicatedCount,
          alreadyResolved: result.alreadyResolvedCount,
          notFound: result.notFoundCount,
          duplicateRequestCount: result.duplicateRequestCount,
          skipped,
        },
        message:
          resolved > 0
            ? `Resolved ${resolved} exceptions`
            : "No exception state changes were required",
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to bulk resolve exceptions", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * POST /api/exceptions/bulk-assign
 * Bulk assign exceptions to an operator
 */
router.post(
  "/exceptions/bulk-assign",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(bulkAssignSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { exceptionIds, assignedTo } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const result = await prisma.reconciliationMatch.updateMany({
        where: {
          id: { in: exceptionIds },
          tenantId,
          matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] },
          status: { notIn: ["resolved", "dismissed"] },
        },
        data: { assignedTo },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "exceptions_bulk_assigned",
          resourceType: "reconciliation_match",
          resourceId: null,
          metadata: { assignedTo, exceptionCount: result.count },
        },
      });

      logInfo("Exceptions bulk assigned", {
        tenantId,
        count: result.count,
        assignedTo,
        assignedBy: userId,
      });

      return res.json({
        data: { assigned: result.count },
        message: `Assigned ${result.count} exceptions`,
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to bulk assign exceptions", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * POST /api/exceptions/bulk-status
 * Bulk update exception status
 */
router.post(
  "/exceptions/bulk-status",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(bulkStatusSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { exceptionIds, status, notes } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const result = await prisma.reconciliationMatch.updateMany({
        where: {
          id: { in: exceptionIds },
          tenantId,
          matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] },
        },
        data: {
          status,
          reviewed: status === "resolved" || status === "dismissed",
          reviewedBy: status === "resolved" || status === "dismissed" ? userId : undefined,
          reviewedAt: status === "resolved" || status === "dismissed" ? new Date() : undefined,
          notes: notes || undefined,
        },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "exceptions_bulk_status_changed",
          resourceType: "reconciliation_match",
          resourceId: null,
          metadata: { newStatus: status, exceptionCount: result.count, notes },
        },
      });

      logInfo("Exceptions bulk status updated", {
        tenantId,
        count: result.count,
        status,
        updatedBy: userId,
      });

      return res.json({
        data: { updated: result.count },
        message: `Updated ${result.count} exceptions to ${status}`,
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to bulk update exception status", 500, {
        userId: req.userId,
      });
    }
  }
);

export { router as exceptionsRouter };
