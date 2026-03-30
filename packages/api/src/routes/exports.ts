/**
 * Export Routes (Enterprise-Grade)
 *
 * Provides async data export with:
 * - Background job queue integration via ExportJobQueue
 * - Idempotent export creation
 * - Export status polling
 * - Signed URL download with expiration
 * - Tenant-safe export isolation
 *
 * TENANT SAFETY: All queries scoped to tenantId
 * IDEMPOTENCY: Export creation supports idempotency keys
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { enforceFreezeState } from "../middleware/governance";
import { prisma } from "../infrastructure/db/prisma";
import { ExportLifecycleService } from "../application/services/ExportLifecycleService";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";
import { logInfo } from "../utils/logger";
import { trackEventAsync } from "../utils/event-tracker";

const router: Router = Router();
const exportLifecycleService = new ExportLifecycleService(prisma);

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createExportSchema = z.object({
  body: z.object({
    runId: z.string().uuid().optional(),
    format: z.enum(["csv", "json", "xlsx", "pdf"]).default("json"),
    type: z.enum(["reconciliation", "exceptions", "audit", "evidence"]).default("reconciliation"),
    idempotencyKey: z.string().max(255).optional(),
    options: z
      .object({
        includeMatched: z.boolean().optional().default(true),
        includeUnmatched: z.boolean().optional().default(true),
        includeExceptions: z.boolean().optional().default(true),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        fields: z.array(z.string()).optional(),
      })
      .optional()
      .default({}),
  }),
});

const listExportsSchema = z.object({
  query: z.object({
    status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    type: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
    cursor: z.string().optional(),
  }),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/exports
 * Create a new export job
 * Supports idempotency via idempotencyKey header or body
 */
router.post(
  "/exports",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  validateRequest(createExportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;
      const { runId, format, type, idempotencyKey, options } = req.body;

      const exportRequest = await exportLifecycleService.requestExport({
        tenantId,
        userId,
        type,
        runId,
        format,
        idempotencyKey,
        options,
      });

      if (!exportRequest.createdNew) {
        logInfo("Returning canonical export for duplicate request", {
          tenantId,
          idempotencyKey,
          exportId: exportRequest.exportId,
          jobId: exportRequest.jobId,
        });

        return res.status(200).json({
          data: {
            exportId: exportRequest.exportId,
            jobId: exportRequest.jobId,
            status: exportRequest.status,
            idempotent: true,
          },
          message: "Export already exists for this idempotency key",
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "export_created",
          resourceType: "export",
          resourceId: exportRequest.exportId,
          metadata: { format, type, runId, jobId: exportRequest.jobId } as any,
        },
      });

      trackEventAsync(userId, "ExportCreated", {
        exportId: exportRequest.exportId,
        format,
        type,
        jobId: exportRequest.jobId,
      });

      logInfo("Export created", {
        tenantId,
        exportId: exportRequest.exportId,
        format,
        type,
        jobId: exportRequest.jobId,
      });

      return res.status(201).json({
        data: {
          exportId: exportRequest.exportId,
          jobId: exportRequest.jobId,
          format,
          type,
          status: exportRequest.status,
          createdAt: exportRequest.createdAt,
        },
        message: "Export job created",
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to create export", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * GET /api/exports
 * List exports for the current tenant
 */
router.get(
  "/exports",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(listExportsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { status, type, limit, cursor } = listExportsSchema.parse({
        query: req.query,
      }).query;

      const where: any = {
        tenantId,
        ...(status && { status }),
        ...(type && { type }),
      };

      const exports = await prisma.export.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          type: true,
          format: true,
          status: true,
          reconciliationRunId: true,
          fileSizeBytes: true,
          rowCount: true,
          errorMessage: true,
          signedUrlExpiresAt: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (exports.length > limit) {
        const nextItem = exports.pop();
        nextCursor = nextItem!.id;
      }

      res.json({
        data: exports,
        pagination: {
          nextCursor,
          hasMore: !!nextCursor,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list exports", 500, { userId: req.userId });
    }
  }
);

/**
 * GET /api/exports/:id
 * Get export details and status
 */
router.get(
  "/exports/:id",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const tenantId = req.tenantId!;

      const exportRecord = await prisma.export.findFirst({
        where: { id, tenantId },
      });

      if (!exportRecord) {
        throw new NotFoundError("Export not found", "export", id);
      }

      // Determine if download is available
      const isDownloadReady = exportRecord.status === "completed" && exportRecord.signedUrl;
      const isExpired = exportRecord.signedUrlExpiresAt
        ? new Date() > exportRecord.signedUrlExpiresAt
        : false;

      res.json({
        data: {
          id: exportRecord.id,
          type: exportRecord.type,
          format: exportRecord.format,
          status: exportRecord.status,
          runId: exportRecord.reconciliationRunId,
          fileSizeBytes: exportRecord.fileSizeBytes,
          rowCount: exportRecord.rowCount,
          errorMessage: exportRecord.errorMessage,
          downloadAvailable: isDownloadReady && !isExpired,
          downloadExpiresAt: exportRecord.signedUrlExpiresAt?.toISOString() || null,
          expiresAt: exportRecord.expiresAt?.toISOString() || null,
          createdAt: exportRecord.createdAt.toISOString(),
          updatedAt: exportRecord.updatedAt.toISOString(),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get export", 500, { userId: req.userId });
    }
  }
);

/**
 * GET /api/exports/:id/download
 * Download an export file via signed URL
 */
router.get(
  "/exports/:id/download",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const tenantId = req.tenantId!;

      const exportRecord = await prisma.export.findFirst({
        where: { id, tenantId },
      });

      if (!exportRecord) {
        throw new NotFoundError("Export not found", "export", id);
      }

      if (exportRecord.status !== "completed") {
        return res.status(409).json({
          error: "EXPORT_NOT_READY",
          message: `Export is ${exportRecord.status}, not ready for download`,
          status: exportRecord.status,
        });
      }

      if (!exportRecord.signedUrl) {
        return res.status(410).json({
          error: "EXPORT_EXPIRED",
          message: "Export file has expired or is no longer available",
        });
      }

      if (exportRecord.signedUrlExpiresAt && new Date() > exportRecord.signedUrlExpiresAt) {
        return res.status(410).json({
          error: "EXPORT_EXPIRED",
          message: "Download link has expired",
          expiresAt: exportRecord.signedUrlExpiresAt.toISOString(),
        });
      }

      // Return the signed URL for client-side redirect/download
      return res.json({
        data: {
          downloadUrl: exportRecord.signedUrl,
          expiresAt: exportRecord.signedUrlExpiresAt?.toISOString() || null,
          fileSizeBytes: exportRecord.fileSizeBytes,
          format: exportRecord.format,
        },
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to get export download", 500, {
        userId: req.userId,
      });
    }
  }
);

/**
 * POST /api/exports/:id/cancel
 * Cancel a pending export
 */
router.post(
  "/exports/:id/cancel",
  requirePermission(Permission.REPORTS_EXPORT),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      await exportLifecycleService.cancelExport({
        tenantId,
        exportId: id,
        userId,
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "export_cancelled",
          resourceType: "export",
          resourceId: id,
        },
      });

      res.json({
        data: { id, status: "failed", errorMessage: "Cancelled by user" },
        message: "Export cancelled",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to cancel export", 500, { userId: req.userId });
    }
  }
);

export { router as exportsRouter };
