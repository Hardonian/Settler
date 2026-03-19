/**
 * Exception Queue Routes
 * UX-008: Exception queue UI for reviewing and resolving unmatched transactions
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

      res.json({
        data: (exceptions as any[]).map((e) => ({
          id: e.id,
          jobId: e.run?.id,
          executionId: e.run?.id,
          category: e.sourceTransaction?.category,
          severity: "error",
          description: e.sourceTransaction?.description,
          status: e.reviewed ? "resolved" : "open",
          resolvedAt: e.reviewedAt?.toISOString() || null,
          resolvedBy: e.reviewedBy || null,
          notes: e.matchReason || null,
          createdAt: e.createdAt.toISOString(),
        })),
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
      const { id } = req.params;
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

      res.json({
        data: {
          id: exception.id,
          jobId: (exception as any).run?.id,
          executionId: (exception as any).run?.id,
          category: (exception as any).sourceTransaction?.category,
          severity: "error",
          description: (exception as any).sourceTransaction?.description,
          status: exception.reviewed ? "resolved" : "open",
          resolvedAt: exception.reviewedAt?.toISOString() || null,
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
      const { id } = req.params;
      const { resolution, notes } = req.body;
      const userId = req.userId!;

      if (resolution === "ignored") {
        await prisma.reconciliationMatch.update({
          where: {
            id,
          },
          data: {
            reviewed: true,
            reviewedBy: userId,
            reviewedAt: new Date(),
            matchReason: notes,
          },
        });

        trackEventAsync(userId, "ExceptionResolved", {
          exceptionId: id,
          resolution,
        });

        res.json({
          message: "Exception resolved successfully",
        });
      } else {
        throw new Error("Resolution type not yet implemented");
      }
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to resolve exception", 500, { userId: req.userId });
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

      if (resolution === "ignored") {
        await prisma.reconciliationMatch.updateMany({
          where: {
            id: {
              in: exceptionIds,
            },
            tenantId: req.tenantId,
          },
          data: {
            reviewed: true,
            reviewedBy: userId,
            reviewedAt: new Date(),
            matchReason: notes,
          },
        });

        for (const exceptionId of exceptionIds) {
          trackEventAsync(userId, "ExceptionResolved", {
            exceptionId,
            resolution,
            bulk: true,
          });
        }

        res.json({
          message: `Resolved ${exceptionIds.length} exceptions successfully`,
          count: exceptionIds.length,
        });
      } else {
        throw new Error("Resolution type not yet implemented");
      }
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

      // TODO: Get stats by category
      const byCategory = {};

      res.json({
        data: {
          total,
          open,
          inProgress: 0, // TODO
          resolved,
          dismissed: 0, // TODO
          byCategory,
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
