"use strict";
/**
 * Multi-Source Reconciliation API Routes
 * Handles multi-source reconciliation endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const multi_source_reconciliation_1 = require("../../services/multi-source-reconciliation");
const router = (0, express_1.Router)();
// Helper function to validate userId exists
function isValidUserId(userId) {
    return typeof userId === 'string' && userId.length > 0;
}
/**
 * POST /api/v1/multi-source-reconciliation/jobs
 * Create a multi-source reconciliation job
 */
router.post("/jobs", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const { sourceAdapters, targetAdapter, targetConfig, conflictResolutionStrategy = "manual", duplicateDetectionEnabled = true, } = req.body;
        if (!sourceAdapters || !Array.isArray(sourceAdapters) || sourceAdapters.length < 2) {
            return res.status(400).json({
                error: "Bad Request",
                message: "At least 2 source adapters are required",
                traceId: req.traceId,
            });
        }
        if (!targetAdapter) {
            return res.status(400).json({
                error: "Bad Request",
                message: "targetAdapter is required",
                traceId: req.traceId,
            });
        }
        const config = {
            sourceAdapters,
            targetAdapter,
            targetConfig: targetConfig || {},
            conflictResolutionStrategy,
            duplicateDetectionEnabled,
        };
        const jobId = await (0, multi_source_reconciliation_1.createMultiSourceJob)(tenantId, userId, config);
        (0, logger_1.logInfo)("Multi-source job created", { jobId, tenantId, userId, traceId: req.traceId });
        return res.status(201).json({
            id: jobId,
            config,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create multi-source job", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create multi-source job",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/multi-source-reconciliation/jobs/:jobId
 * Get multi-source job details
 */
router.get("/jobs/:jobId", async (req, res) => {
    try {
        const { jobId } = req.params;
        const tenantId = req.tenantId;
        if (!jobId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "jobId is required",
                traceId: req.traceId,
            });
        }
        const job = await (0, multi_source_reconciliation_1.getMultiSourceJob)(tenantId, jobId);
        if (!job) {
            return res.status(404).json({
                error: "Not Found",
                message: "Multi-source job not found",
                traceId: req.traceId,
            });
        }
        return res.json({
            ...job,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get multi-source job", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get multi-source job",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/multi-source-reconciliation/jobs/:jobId/run
 * Run multi-source reconciliation
 */
router.post("/jobs/:jobId/run", async (req, res) => {
    try {
        const { jobId } = req.params;
        const { reconRunId } = req.body;
        const tenantId = req.tenantId;
        if (!reconRunId || typeof reconRunId !== 'string') {
            return res.status(400).json({
                error: "Bad Request",
                message: "reconRunId is required",
                traceId: req.traceId,
            });
        }
        if (!jobId || typeof jobId !== 'string') {
            return res.status(400).json({
                error: "Bad Request",
                message: "jobId is required",
                traceId: req.traceId,
            });
        }
        const result = await (0, multi_source_reconciliation_1.runMultiSourceReconciliation)(tenantId, jobId, reconRunId);
        (0, logger_1.logInfo)("Multi-source reconciliation started", {
            jobId,
            reconRunId,
            tenantId,
            traceId: req.traceId,
        });
        return res.status(200).json({
            ...result,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to run multi-source reconciliation", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to run multi-source reconciliation",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/multi-source-reconciliation/conflicts/:conflictId/resolve
 * Resolve a conflict
 */
router.post("/conflicts/:conflictId/resolve", async (req, res) => {
    try {
        const { conflictId } = req.params;
        const { resolutionStrategy } = req.body;
        const tenantId = req.tenantId;
        if (!resolutionStrategy) {
            return res.status(400).json({
                error: "Bad Request",
                message: "resolutionStrategy is required",
                traceId: req.traceId,
            });
        }
        const userId = req.userId;
        if (!isValidUserId(userId)) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "User ID is required",
                traceId: req.traceId,
            });
        }
        // Type assertion is safe here because isValidUserId check above guarantees userId is string
        // @ts-expect-error - TypeScript doesn't narrow optional properties, but isValidUserId guarantees it's a string
        await (0, multi_source_reconciliation_1.resolveConflict)(tenantId, conflictId, resolutionStrategy, userId);
        (0, logger_1.logInfo)("Conflict resolved", { conflictId, tenantId, userId, traceId: req.traceId });
        return res.status(200).json({
            message: "Conflict resolved",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to resolve conflict", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to resolve conflict",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=multi-source-reconciliation.js.map