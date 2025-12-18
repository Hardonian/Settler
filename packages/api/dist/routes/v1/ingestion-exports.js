"use strict";
/**
 * Ingestion Export API Routes
 * Handles exports for ingestion pipeline (CSV/JSON)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const export_service_1 = require("../../services/ingestion/export-service");
const db_1 = require("../../db");
const usage_enforcement_1 = require("../../middleware/usage-enforcement");
const usage_tracking_1 = require("../../utils/usage-tracking");
const billing_helpers_1 = require("../../utils/billing-helpers");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/ingestion/exports
 * Create an export
 */
router.post("/", (0, usage_enforcement_1.checkExportLimit)(), async (req, res) => {
    try {
        const { type, format, reconciliationRunId, ingestionId } = req.body;
        const tenantId = req.tenantId;
        const userId = req.userId;
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
        const exportOptions = {
            type,
            format,
            reconciliationRunId,
            ingestionId,
            tenantId,
            userId,
            traceId: req.traceId,
        };
        const exportId = await (0, export_service_1.createExport)(exportOptions);
        // Track usage
        const billingAccount = await (0, billing_helpers_1.getBillingAccount)(userId, tenantId);
        if (billingAccount) {
            await (0, usage_tracking_1.trackExportUsage)({
                billingAccountId: billingAccount.id,
                userId,
                tenantId,
                exportId,
            });
        }
        // Generate export asynchronously (in production, use a job queue)
        (0, export_service_1.generateExport)(exportId).catch((error) => {
            (0, logger_1.logError)("Failed to generate export", error, { exportId });
        });
        (0, logger_1.logInfo)("Export created", { exportId, type, format, traceId: req.traceId });
        return res.status(201).json({
            id: exportId,
            type,
            format,
            status: "processing",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create export", error, { traceId: req.traceId });
        return res.status(500).json({
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
router.get("/:exportId", async (req, res) => {
    try {
        const { exportId } = req.params;
        const tenantId = req.tenantId;
        const results = await (0, db_1.query)(`SELECT 
        id, type, format, status, storage_location, signed_url,
        signed_url_expires_at, file_size_bytes, row_count,
        error_message, created_at, updated_at
      FROM exports
      WHERE id = $1 AND tenant_id = $2`, [exportId || "", tenantId]);
        if (results.length === 0) {
            return res.status(404).json({
                error: "Not Found",
                message: "Export not found",
                traceId: req.traceId,
            });
        }
        const exportRecord = results[0];
        return res.json({
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
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get export", error, { traceId: req.traceId });
        return res.status(500).json({
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
router.get("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const exports = await (0, db_1.query)(`SELECT 
        id, type, format, status, file_size_bytes, row_count,
        created_at, updated_at
      FROM exports
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`, [tenantId, limit.toString(), offset.toString()]);
        const totalResults = await (0, db_1.query)(`SELECT COUNT(*) as count FROM exports WHERE tenant_id = $1`, [tenantId]);
        const total = totalResults[0].count;
        return res.json({
            exports: exports.map((e) => ({
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
    }
    catch (error) {
        (0, logger_1.logError)("Failed to list exports", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to list exports",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=ingestion-exports.js.map