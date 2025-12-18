/**
 * Ingestion Export API Routes
 * Handles exports for ingestion pipeline (CSV/JSON)
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { logError, logInfo } from "../../utils/logger";
import {
  createExport,
  generateExport,
  ExportOptions,
} from "../../services/ingestion/export-service";
import { query } from "../../db";

const router = Router();

/**
 * POST /api/v1/ingestion/exports
 * Create an export
 */
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { type, format, reconciliationRunId, ingestionId } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    if (!type || !format) {
      return res.status(400).json({
        error: "Bad Request",
        message: "type and format are required",
        traceId: req.traceId,
      });
    }

    if (format !== "all" && !reconciliationRunId && !ingestionId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "reconciliationRunId or ingestionId is required",
        traceId: req.traceId,
      });
    }

    const exportOptions: ExportOptions = {
      type,
      format,
      reconciliationRunId,
      ingestionId,
      tenantId,
      userId,
      traceId: req.traceId,
    };

    const exportId = await createExport(exportOptions);

    // Generate export asynchronously (in production, use a job queue)
    generateExport(exportId).catch((error) => {
      logError("Failed to generate export", error, { exportId });
    });

    logInfo("Export created", { exportId, type, format, traceId: req.traceId });

    res.status(201).json({
      id: exportId,
      type,
      format,
      status: "processing",
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to create export", error, { traceId: req.traceId });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create export",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/ingestion/exports/:exportId
 * Get export details
 */
router.get("/:exportId", async (req: AuthRequest, res: Response) => {
  try {
    const { exportId } = req.params;
    const tenantId = req.tenantId!;

    const results = await query(
      `SELECT 
        id, type, format, status, storage_location, signed_url,
        signed_url_expires_at, file_size_bytes, row_count,
        error_message, created_at, updated_at
      FROM exports
      WHERE id = $1 AND tenant_id = $2`,
      [exportId, tenantId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Export not found",
        traceId: req.traceId,
      });
    }

    const exportRecord = results[0] as Record<string, unknown>;

    res.json({
      id: exportRecord.id,
      type: exportRecord.type,
      format: exportRecord.format,
      status: exportRecord.status,
      signedUrl: exportRecord.signed_url,
      signedUrlExpiresAt: exportRecord.signed_url_expires_at,
      fileSizeBytes: exportRecord.file_size_bytes,
      rowCount: exportRecord.row_count,
      errorMessage: exportRecord.error_message,
      createdAt: exportRecord.created_at,
      updatedAt: exportRecord.updated_at,
    });
  } catch (error) {
    logError("Failed to get export", error, { traceId: req.traceId });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get export",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/ingestion/exports
 * List exports
 */
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const exports = await query(
      `SELECT 
        id, type, format, status, file_size_bytes, row_count,
        created_at, updated_at
      FROM exports
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    const totalResults = await query(
      `SELECT COUNT(*) as count FROM exports WHERE tenant_id = $1`,
      [tenantId]
    );

    const total = (totalResults[0] as { count: string }).count;

    res.json({
      exports: exports.map((e: Record<string, unknown>) => ({
        id: e.id,
        type: e.type,
        format: e.format,
        status: e.status,
        fileSizeBytes: e.file_size_bytes,
        rowCount: e.row_count,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      })),
      pagination: {
        limit,
        offset,
        total: parseInt(total),
      },
    });
  } catch (error) {
    logError("Failed to list exports", error, { traceId: req.traceId });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list exports",
      traceId: req.traceId,
    });
  }
});

export default router;
