/**
 * Advanced Audit Trail API Routes
 * Handles audit log queries and compliance exports
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { tenantMiddleware, TenantRequest } from "../../middleware/tenant";
import { logError, logInfo } from "../../utils/logger";
import {
  getAuditLogs,
  createAuditExport,
  getAuditExport,
  type AuditLogFilter,
} from "../../services/audit-trail";
import { query } from "../../db";
import { getBillingAccount } from "../../utils/billing-helpers";

const router = Router();

/**
 * GET /api/v1/audit-trail/logs
 * Get audit logs with filtering
 */
router.get("/logs", tenantMiddleware, async (req: TenantRequest, res: Response) => {
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
router.post("/exports", tenantMiddleware, async (req: TenantRequest, res: Response) => {
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
router.get("/exports/:exportId", tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { exportId } = req.params;
    const tenantId = req.tenantId!;

    if (!exportId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "exportId is required",
        traceId: req.traceId,
      });
    }

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

/**
 * GET /api/v1/audit-trail/export
 * Export audit trail as CSV or JSON
 */
router.get("/export", tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const format = (req.query.format as string) || "csv";
    const {
      actor,
      action,
      schemaName,
      tableName,
      startDate,
      endDate,
      complianceTags,
    } = req.query;

    // Check plan limits for log retention
    const billingAccount = await getBillingAccount(userId, tenantId);
    if (!billingAccount) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Billing account not found. Please contact support.",
        traceId: req.traceId,
      });
    }

    // Get plan limits for log retention
    const planLimits: Record<string, { logRetentionDays: number }> = {
      free: { logRetentionDays: 7 },
      starter: { logRetentionDays: 30 },
      growth: { logRetentionDays: 90 },
      enterprise: { logRetentionDays: 365 },
    };

    const planTier = billingAccount.plan_tier || "free";
    const limits = planLimits[planTier] || planLimits.free;
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - limits.logRetentionDays);

    // Build filters
    const filters: AuditLogFilter = {};
    if (actor) filters.actor = actor as string;
    if (action) filters.action = action as string;
    if (schemaName) filters.schemaName = schemaName as string;
    if (tableName) filters.tableName = tableName as string;
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    } else {
      // Apply retention limit if no start date specified
      filters.startDate = retentionCutoff;
    }
    if (endDate) filters.endDate = new Date(endDate as string);
    if (complianceTags) {
      filters.complianceTags = Array.isArray(complianceTags)
        ? (complianceTags as string[])
        : [complianceTags as string];
    }

    // Get audit logs
    const logs = await getAuditLogs(tenantId, filters, {
      limit: 10000, // Large limit for export
      offset: 0,
    });

    if (format === "csv") {
      // Generate CSV
      const headers = ["Timestamp", "Actor", "Action", "Resource Type", "Resource ID", "Details"];
      const csvRows = [headers.join(",")];

      for (const log of logs) {
        const row = [
          log.timestamp.toISOString(),
          log.actor || "",
          log.action || "",
          log.resourceType || "",
          log.resourceId || "",
          JSON.stringify(log.details || {}).replace(/"/g, '""'), // Escape quotes
        ];
        csvRows.push(`"${row.join('","')}"`);
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-trail-${new Date().toISOString().split("T")[0]}.csv"`
      );
      return res.send(csvRows.join("\n"));
    } else {
      // JSON format
      return res.json({
        data: logs,
        meta: {
          total: logs.length,
          format: "json",
          exportedAt: new Date().toISOString(),
          retentionDays: limits.logRetentionDays,
          traceId: req.traceId,
        },
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("Failed to export audit trail", error, {
      traceId: req.traceId,
      tenantId: req.tenantId,
      userId: req.userId,
    });

    // Check for specific error types
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      return res.status(403).json({
        error: "Forbidden",
        message: `You don't have permission to export audit trail. Please contact support if you believe this is an error.`,
        traceId: req.traceId,
      });
    }

    if (errorMessage.includes("connection") || errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: `Database connection failed while exporting audit trail. Please try again in a few moments.`,
        traceId: req.traceId,
      });
    }

    // Default to 500 only for truly unexpected errors
    return res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to export audit trail: ${errorMessage}. Please contact support with traceId if this persists.`,
      traceId: req.traceId,
    });
  }
});

export default router;
