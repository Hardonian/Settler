"use strict";
/**
 * Bulk Operations API Routes
 * Handles bulk operation endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const bulk_operations_1 = require("../../services/bulk-operations");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/bulk-operations
 * Create a bulk operation
 */
router.post("/", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const { operationType, targetType, targetIds, operationConfig } = req.body;
        if (!operationType || !targetType || !targetIds || !Array.isArray(targetIds)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "operationType, targetType, and targetIds array are required",
                traceId: req.traceId,
            });
        }
        const operationId = await (0, bulk_operations_1.createBulkOperation)(tenantId, userId, operationType, targetType, targetIds, operationConfig || {});
        (0, logger_1.logInfo)("Bulk operation created", {
            operationId,
            tenantId,
            userId,
            operationType,
            traceId: req.traceId,
        });
        // Execute asynchronously
        (0, bulk_operations_1.executeBulkOperation)(tenantId, operationId).catch((error) => {
            (0, logger_1.logError)("Bulk operation execution failed", error, { operationId, tenantId });
        });
        return res.status(201).json({
            id: operationId,
            status: "pending",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create bulk operation", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create bulk operation",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/bulk-operations/:operationId
 * Get bulk operation status
 */
router.get("/:operationId", async (req, res) => {
    try {
        const { operationId } = req.params;
        const tenantId = req.tenantId;
        if (!operationId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "operationId is required",
                traceId: req.traceId,
            });
        }
        const status = await (0, bulk_operations_1.getBulkOperationStatus)(tenantId, operationId);
        if (!status) {
            return res.status(404).json({
                error: "Not Found",
                message: "Bulk operation not found",
                traceId: req.traceId,
            });
        }
        return res.json({
            ...status,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get bulk operation status", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get bulk operation status",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=bulk-operations.js.map