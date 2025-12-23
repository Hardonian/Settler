/**
 * Advanced Audit Trail API Routes
 * Handles audit log queries and compliance exports
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { logError, logInfo } from "../../utils/logger";
import {
  getAuditLogs,
  createAuditExport,
  getAuditExport,
  type AuditLogFilter,
} from "../../services/audit-trail";

const router = Router();

/**
 * GET /api/v1/audit-trail/logs
 * Get audit logs with filtering
 */
router.get("/logs", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      actor,
      action,
      schemaName,
      tableName,
      startDate,
      endDate,
      complianceTags,
      limit = 100,
      offset = 0,
    } = req.query;

    const filters: AuditLogFilter = {};
    if (actor) filters.actor = actor as string;
    if (action) filters.action = action as string;
    if (schemaName) filters.schemaName = schemaName as string;
    if (tableName) filters.tableName = tableName as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (complianceTags) {
      filters.complianceTags = Array.isArray(complianceTags)
        ? (complianceTags as string[])
        : [complianceTags as string];
    }

    const logs = await getAuditLogs(tenantId, filters, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    return res.json({
      data: logs,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: logs.length,
      },
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get audit logs", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get audit logs",
      traceId: req.traceId,
    });
  }
});

/**
 * POST /api/v1/audit-trail/exports
 * Create audit export
 */
router.post("/exports", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const { filters, exportFormat = "csv", expiresInDays = 7 } = req.body;

    const exportId = await createAuditExport(
      tenantId,
      userId,
      filters || {},
      exportFormat,
      expiresInDays
    );

    logInfo("Audit export created", { exportId, tenantId, userId, traceId: req.traceId });

    return res.status(201).json({
      id: exportId,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to create audit export", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create audit export",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/audit-trail/exports/:exportId
 * Get audit export
 */
router.get("/exports/:exportId", async (req: AuthRequest, res: Response) => {
  try {
    const { exportId } = req.params;
    const tenantId = req.tenantId!;

    const exportData = await getAuditExport(tenantId, exportId);

    if (!exportData) {
      return res.status(404).json({
        error: "Not Found",
        message: "Audit export not found",
        traceId: req.traceId,
      });
    }

    return res.json({
      ...exportData,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get audit export", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get audit export",
      traceId: req.traceId,
    });
  }
});

export default router;
