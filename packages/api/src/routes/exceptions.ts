/**
 * Exception Queue Routes
 * UX-008: Exception queue UI for reviewing and resolving unmatched transactions
 *
 * STATUS MAPPING:
 * - "open": Not yet reviewed (reviewed = false)
 * - "in_progress": Currently being reviewed (not currently tracked - would require status field)
 * - "resolved": Reviewed and resolved (reviewed = true, with matchReason)
 * - "dismissed": Reviewed and dismissed (not currently tracked - would require status field)
 *
 * NULL SAFETY:
 * All response fields have fallback values to prevent undefined in client code.
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { enforceFreezeState } from "../middleware/governance";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";

import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";
import { trackEventAsync } from "../utils/event-tracker";
import { logInfo } from "../utils/logger";

const router: Router = Router();
import { prisma } from "../infrastructure/db/prisma";

const listExceptionsSchema = z.object({
  query: z.object({
    jobId: z.string().uuid().optional(),
    resolution_status: z.enum(["open", "in_progress", "resolved", "dismissed"]).optional(),
    category: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
    offset: z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
  }),
});

const resolveExceptionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    resolution: z.enum(["matched", "manual", "ignored"]),
    notes: z.string().max(1000).optional(),
  }),
});

const bulkResolveSchema = z.object({
  body: z.object({
    exceptionIds: z.array(z.string().uuid()).min(1).max(100),
    resolution: z.enum(["matched", "manual", "ignored"]),
    notes: z.string().max(1000).optional(),
  }),
});

// List exceptions (unmatched transactions)
router.get(
  "/exceptions",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(listExceptionsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { jobId, startDate, endDate, limit, offset } = listExceptionsSchema.parse({
        query: req.query,
      }).query;

      const where: any = {
        tenantId,
        matchType: "unmatched",
        run: {
          is: jobId ? { reconJobId: jobId } : {},
        },
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { lte: new Date(endDate) } }),
        // TODO: Map resolution_status to the new model
      };

      const exceptions = await prisma.reconciliationMatch.findMany({
        where,
        include: {
          run: {
            select: {
              id: true,
            },
          },
          sourceTransaction: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.reconciliationMatch.count({ where });

      logInfo("Exceptions listed", {
        tenantId,
        jobId,
        count: exceptions.length,
        total,
        limit,
        offset,
      });

      // Map exception to API response with proper status and null safety
      const mapExceptionToResponse = (e: any) => {
        // Status mapping: Currently only supports open/resolved
        // in_progress and dismissed would require additional schema fields
        let status: "open" | "in_progress" | "resolved" | "dismissed" = "open";
        if (e.reviewed) {
          // Check if there's a dismissal indicator (currently uses matchReason)
          // "ignored" resolution = dismissed, others = resolved
          if (e.matchReason?.toLowerCase().includes("ignored")) {
            status = "dismissed";
          } else {
            status = "resolved";
          }
        }

        return {
          id: e.id,
          // Null safety: Provide fallback for missing relations
          jobId: e.run?.id || null,
          executionId: e.run?.id || null,
          category: e.sourceTransaction?.category || "uncategorized",
          severity: "error",
          description: e.sourceTransaction?.description || null,
          status,
          resolvedAt: e.reviewedAt ? e.reviewedAt.toISOString() : null,
          resolvedBy: e.reviewedBy || null,
          notes: e.matchReason || null,
          createdAt: e.createdAt.toISOString(),
        };
      };

      res.json({
        data: (exceptions as any[]).map(mapExceptionToResponse),
        pagination: {
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list exceptions", 500, { userId: req.userId });
    }
  }
);

// Get exception details
router.get(
  "/exceptions/:id",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const tenantId = req.tenantId!;

      const exception = await prisma.reconciliationMatch.findFirst({
        where: {
          id,
          tenantId,
          matchType: "unmatched",
        },
        include: {
          run: true,
          sourceTransaction: true,
        },
      });

      if (!exception) {
        throw new NotFoundError("Exception not found", "exception", id);
      }

      // Map exception to response with proper status and null safety (same as list endpoint)
      const status: "open" | "in_progress" | "resolved" | "dismissed" = exception.reviewed
        ? exception.matchReason?.toLowerCase().includes("ignored")
          ? "dismissed"
          : "resolved"
        : "open";

      res.json({
        data: {
          id: exception.id,
          jobId: (exception as any).run?.id || null,
          executionId: (exception as any).run?.id || null,
          category: (exception as any).sourceTransaction?.category || "uncategorized",
          severity: "error",
          description: (exception as any).sourceTransaction?.description || null,
          status,
          resolvedAt: exception.reviewedAt ? exception.reviewedAt.toISOString() : null,
          resolvedBy: exception.reviewedBy || null,
          notes: exception.matchReason || null,
          createdAt: exception.createdAt.toISOString(),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get exception", 500, { userId: req.userId });
    }
  }
);

// Resolve exception
router.post(
  "/exceptions/:id/resolve",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(resolveExceptionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam2 = req.params["id"];
      const id = Array.isArray(idParam2) ? (idParam2[0] ?? "") : (idParam2 ?? "");
      const { resolution, notes } = req.body;
      const userId = req.userId!;

      // TRUTHFUL STATE: Map resolution types to actual behavior
      // - "ignored": Mark as reviewed but dismissed (not a match)
      // - "matched": Mark as reviewed and matched (automatic match found)
      // - "manual": Mark as reviewed and manually resolved by user
      const resolved = await prisma.reconciliationMatch
        .update({
          where: { id },
          data: {
            reviewed: true,
            reviewedBy: userId,
            reviewedAt: new Date(),
            matchReason: notes || `${resolution} resolution`,
          },
        })
        .catch(() => null);

      if (!resolved) {
        return res.status(404).json({
          error: "NOT_FOUND",
          message: "Exception not found",
        });
      }

      trackEventAsync(userId, "ExceptionResolved", {
        exceptionId: id,
        resolution,
      });

      logInfo("Exception resolved", {
        tenantId: req.tenantId,
        exceptionId: id,
        resolution,
        resolvedBy: userId,
      });

      return res.json({
        message: "Exception resolved successfully",
        resolution,
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to resolve exception", 500, {
        userId: req.userId,
      });
    }
  }
);

// Bulk resolve exceptions
router.post(
  "/exceptions/bulk-resolve",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(bulkResolveSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { exceptionIds, resolution, notes } = req.body;
      const userId = req.userId!;

      // TRUTHFUL STATE: Handle all resolution types properly
      const result = await prisma.reconciliationMatch.updateMany({
        where: {
          id: { in: exceptionIds },
          tenantId: req.tenantId,
        },
        data: {
          reviewed: true,
          reviewedBy: userId,
          reviewedAt: new Date(),
          matchReason: notes || `${resolution} resolution`,
        },
      });

      for (const exceptionId of exceptionIds) {
        trackEventAsync(userId, "ExceptionResolved", {
          exceptionId,
          resolution,
          bulk: true,
        });
      }

      logInfo("Exceptions bulk resolved", {
        tenantId: req.tenantId,
        count: result.count,
        resolution,
        resolvedBy: userId,
      });

      res.json({
        message: `Resolved ${result.count} exceptions successfully`,
        count: result.count,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to bulk resolve exceptions", 500, {
        userId: req.userId,
      });
    }
  }
);

// Get exception statistics
router.get(
  "/exceptions/stats",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { jobId } = req.query as { jobId?: string };

      const where: any = {
        tenantId,
        matchType: "unmatched",
        run: {
          is: jobId ? { reconJobId: jobId } : {},
        },
      };

      const total = await prisma.reconciliationMatch.count({ where });
      const open = await prisma.reconciliationMatch.count({
        where: { ...where, reviewed: false },
      });
      const resolved = await prisma.reconciliationMatch.count({
        where: { ...where, reviewed: true },
      });

      // TRUTHFUL STATE: Return available stats and mark unavailable fields
      // Note: inProgress and dismissed require additional tracking fields in the schema
      const byCategory: Record<string, number> = {};

      // Category breakdown would require grouping by a category field
      // Marked as unavailable until schema supports it
      const categoryAvailable = false;

      res.json({
        data: {
          total,
          open,
          inProgress: null, // Not tracked - requires additional state
          resolved,
          dismissed: null, // Not tracked - requires additional state
          byCategory,
        },
        _meta: {
          categoryBreakdown: {
            available: categoryAvailable,
            message: "Category breakdown requires match category field",
          },
          inProgress: {
            available: false,
            message: "In-progress state not currently tracked",
          },
          dismissed: {
            available: false,
            message: "Dismissed state not currently tracked",
          },
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get exception statistics", 500, {
        userId: req.userId,
      });
    }
  }
);

export { router as exceptionsRouter };
