"use strict";
/**
 * Advanced Audit Trail API Routes
 * Handles audit log queries and compliance exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const audit_trail_1 = require("../../services/audit-trail");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/audit-trail/logs
 * Get audit logs with filtering
 */
router.get("/logs", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { actor, action, schemaName, tableName, startDate, endDate, complianceTags, limit = 100, offset = 0, } = req.query;
        const filters = {};
        if (actor)
            filters.actor = actor;
        if (action)
            filters.action = action;
        if (schemaName)
            filters.schemaName = schemaName;
        if (tableName)
            filters.tableName = tableName;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (complianceTags) {
            filters.complianceTags = Array.isArray(complianceTags)
                ? complianceTags
                : [complianceTags];
        }
        const logs = await (0, audit_trail_1.getAuditLogs)(tenantId, filters, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        return res.json({
            data: logs,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: logs.length,
            },
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get audit logs", error, { traceId: req.traceId });
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
router.post("/exports", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const { filters, exportFormat = "csv", expiresInDays = 7 } = req.body;
        const exportId = await (0, audit_trail_1.createAuditExport)(tenantId, userId, filters || {}, exportFormat, expiresInDays);
        (0, logger_1.logInfo)("Audit export created", { exportId, tenantId, userId, traceId: req.traceId });
        return res.status(201).json({
            id: exportId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create audit export", error, { traceId: req.traceId });
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
router.get("/exports/:exportId", async (req, res) => {
    try {
        const { exportId } = req.params;
        const tenantId = req.tenantId;
        if (!exportId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "exportId is required",
                traceId: req.traceId,
            });
        }
        const exportData = await (0, audit_trail_1.getAuditExport)(tenantId, exportId);
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
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get audit export", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get audit export",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=audit-trail.js.map