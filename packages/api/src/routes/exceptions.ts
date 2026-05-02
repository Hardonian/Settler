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

import { Router, Response, Request } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { enforceFreezeState } from "../middleware/governance";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { prisma } from "../infrastructure/db/prisma";
import { Prisma } from "@prisma/client";
import { ProvenanceService } from "../services/recon-core/provenance-service";
import { ExceptionReviewService } from "../application/services/ExceptionReviewService";
import { AdjudicationMemoryService } from "../services/intelligence/adjudication-memory";

import { handleRouteError } from "../utils/error-handler";
import { NotFoundError, ConflictError } from "../utils/typed-errors";
import { trackEventAsync } from "../utils/event-tracker";
import { logInfo } from "../utils/logger";

type ExceptionRequest = AuthRequest & Request;

type ExceptionForMapping = Prisma.ReconciliationMatchGetPayload<{
  include: {
    run: {
      select: {
        id: true;
        status: true;
        startedAt: true;
        completedAt: true;
      };
    };
    sourceTransaction: true;
    targetTransaction: {
      select: {
        id: true;
        category: true;
        description: true;
        amount: true;
        currency: true;
        date: true;
      };
    };
    adjudicationMemories: true;
    archetypeClassifications: {
      include: { archetype: true };
      orderBy: { confidence: "desc" };
      take: 5;
    };
  };
}>;

const router: Router = Router();
const provenanceService = new ProvenanceService(prisma);
const exceptionReviewService = new ExceptionReviewService(prisma, provenanceService);
const adjudicationMemoryService = new AdjudicationMemoryService(prisma);

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
      .enum([
        "createdAt",
        "severity",
        "status",
        "confidence",
        "recurrence",
        "lineage",
        "proofCompleteness",
      ])
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
    archetypes:
      e.archetypeClassifications?.map((c: any) => ({
        code: c.archetype.code,
        label: c.archetype.label,
        confidence: Number(c.confidence),
      })) || [],
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
  async (req: ExceptionRequest, res: Response) => {
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
        recurrence: { archetypeClassifications: { _count: sortOrder } },
        lineage: { adjudicationMemories: { _count: sortOrder } },
        proofCompleteness: { confidence: sortOrder }, // Proxied to confidence for now
      };

      const { exceptions, total } = await exceptionQueryService.listExceptions(
        tenantId,
        where,
        orderByMap[sortBy] || { createdAt: "desc" },
        limit,
        offset
      );

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
  async (req: ExceptionRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { jobId } = req.query as { jobId?: string };

      const whereBase: Prisma.ReconciliationMatchWhereInput = {
        tenantId,
        matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] },
        ...(jobId && { runId: jobId }),
      };

      const [
        total,
        open,
        inProgress,
        resolved,
        dismissed,
        critical,
        high,
        medium,
        low,
        unassigned,
      ] = await Promise.all([
        prisma.reconciliationMatch.count({ where: whereBase }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, status: "open" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, status: "in_progress" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, status: "resolved" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, status: "dismissed" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, severity: "critical" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, severity: "high" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, severity: "medium" } }),
        prisma.reconciliationMatch.count({ where: { ...whereBase, severity: "low" } }),
        prisma.reconciliationMatch.count({
          where: { ...whereBase, assignedTo: null, status: { notIn: ["resolved", "dismissed"] } },
        }),
      ]);

      const avgResolutionMs = null;

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
  async (req: ExceptionRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const tenantId = req.tenantId!;

      const exception = await prisma.reconciliationMatch.findFirst({
        where: {
          id,
          tenantId,
          matchType: { in: [...CANONICAL_EXCEPTION_MATCH_TYPES] },
        },
        include: {
          sourceTransaction: true,
          run: {
            select: {
              id: true,
              status: true,
              startedAt: true,
              completedAt: true,
            },
          },
          archetypeClassifications: {
            include: { archetype: true },
            orderBy: { confidence: "desc" },
            take: 5,
          },
        },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "exception", id);
      }

      const [provenance, adjudicationMemories, proofPackages, intelligenceResult] =
        await Promise.all([
          prisma.reconciliationProvenance.findMany({
            where: { tenantId, matchId: id },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          prisma.exceptionAdjudicationMemory.findMany({
            where: { tenantId, exceptionId: id },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
          prisma.proofPackage.findMany({
            where: { tenantId, scope: "exception" },
            orderBy: { createdAt: "desc" },
            take: 50,
          }),
          adjudicationMemoryService.explainWhyFlagged(id, tenantId).catch(() => null),
        ]);

      const metadata = (exception.metadata ?? {}) as Record<string, unknown>;
      const adjudicationHistoryFromMetadata = Array.isArray(metadata.adjudicationHistory)
        ? metadata.adjudicationHistory
        : [];
      const adjudicationHistoryFromMemory = adjudicationMemories.map((memory: any) => ({
        actorId: memory.adjudicatorId,
        action: memory.outcome,
        timestamp: memory.completedAt?.toISOString() ?? memory.createdAt.toISOString(),
      }));
      const adjudicationHistoryFromProvenance = provenance.map((entry: any) => ({
        actorId: entry.actorUserId ?? entry.actorType,
        action: entry.eventType,
        timestamp: entry.createdAt.toISOString(),
        details: entry.details,
      }));
      const adjudicationHistory =
        adjudicationHistoryFromMemory.length > 0
          ? adjudicationHistoryFromMemory
          : adjudicationHistoryFromMetadata.length > 0
            ? adjudicationHistoryFromMetadata
            : adjudicationHistoryFromProvenance;
      const scopedProofPackages = proofPackages.filter((pkg: any) => {
        const scopeIds = Array.isArray(pkg.scopeIds) ? pkg.scopeIds : [];
        return scopeIds.length === 0 || scopeIds.some((scopeId: any) => String(scopeId) === id);
      });
      const proofSummary = {
        total: scopedProofPackages.length,
        finalized: scopedProofPackages.filter((item: any) => item.status === "finalized").length,
      };

      res.json({
        data: {
          ...mapExceptionToResponse(exception as any),
          run: (exception as any).run,
          sourceTransaction: exception.sourceTransaction,
          targetTransaction: null,
          institutionalMemory: adjudicationMemories,
          adjudicationHistory,
          adjudicationMemories,
          proofSummary,
          intelligence: intelligenceResult || undefined,
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
  async (req: ExceptionRequest, res: Response) => {
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
  async (req: ExceptionRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const { assignedTo, notes } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      await exceptionReviewService.assignException({
        tenantId,
        userId,
        exceptionId: id,
        assignedTo,
        notes,
      });

      return res.json({
        data: { id, assignedTo },
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
  async (req: ExceptionRequest, res: Response) => {
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

      const count = await exceptionQueryService.updateExceptionStatus(
        id,
        tenantId,
        status,
        userId,
        resolutionReason,
        notes,
        appendAdjudicationHistory(existing.metadata, {
          actorId: userId,
          action: "status_change",
          details: {
            fromStatus: existing.status,
            toStatus: status,
            notes: notes || null,
            resolutionReason: resolutionReason || null,
          },
        }) as Prisma.JsonObject
      );

      if (count !== 1) {
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
  async (req: ExceptionRequest, res: Response) => {
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
  async (req: ExceptionRequest, res: Response) => {
    try {
      const { exceptionIds, resolution, resolutionReason, notes } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const result = await exceptionReviewService.bulkResolveExceptions({
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
  async (req: ExceptionRequest, res: Response) => {
    try {
      const { exceptionIds, assignedTo } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const assignedCount = await exceptionReviewService.bulkAssignExceptions({
        tenantId,
        userId,
        exceptionIds,
        assignedTo,
      });

      return res.json({
        data: { assigned: assignedCount },
        message: `Assigned ${assignedCount} exceptions to ${assignedTo} successfully`,
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
  async (req: ExceptionRequest, res: Response) => {
    try {
      const { exceptionIds, status, notes } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId!;

      const updatedCount = await exceptionReviewService.bulkUpdateExceptionStatus({
        tenantId,
        userId,
        exceptionIds,
        status,
        notes,
      });

      return res.json({
        data: { updated: updatedCount },
        message: `Updated ${updatedCount} exceptions to ${status} successfully`,
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to bulk update exception status", 500, {
        userId: req.userId,
      });
    }
  }
);

export { router as exceptionsRouter };
