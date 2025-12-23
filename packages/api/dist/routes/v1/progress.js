"use strict";
/**
 * Progress Tracking API Routes
 * Handles progress tracking endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const progress_tracking_1 = require("../../services/progress-tracking");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/progress/reconciliation-runs/:runId
 * Get progress for a reconciliation run
 */
router.get("/reconciliation-runs/:runId", async (req, res) => {
    try {
        const { runId } = req.params;
        const tenantId = req.tenantId;
        if (!runId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "runId is required",
                traceId: req.traceId,
            });
        }
        const progress = await (0, progress_tracking_1.getReconciliationProgress)(tenantId, runId);
        if (!progress) {
            return res.status(404).json({
                error: "Not Found",
                message: "Reconciliation run not found",
                traceId: req.traceId,
            });
        }
        return res.json({
            ...progress,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get progress", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get progress",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/progress/reconciliation-results/:resultId
 * Get progress for a reconciliation result
 */
router.get("/reconciliation-results/:resultId", async (req, res) => {
    try {
        const { resultId } = req.params;
        const tenantId = req.tenantId;
        if (!resultId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "resultId is required",
                traceId: req.traceId,
            });
        }
        const progress = await (0, progress_tracking_1.getReconciliationResultProgress)(tenantId, resultId);
        if (!progress) {
            return res.status(404).json({
                error: "Not Found",
                message: "Reconciliation result not found",
                traceId: req.traceId,
            });
        }
        return res.json({
            ...progress,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get result progress", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get result progress",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/progress/checkpoints
 * Create a checkpoint
 */
router.post("/checkpoints", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { jobId, checkpointData, transactionsProcessed } = req.body;
        if (!jobId || !checkpointData || transactionsProcessed === undefined) {
            return res.status(400).json({
                error: "Bad Request",
                message: "jobId, checkpointData, and transactionsProcessed are required",
                traceId: req.traceId,
            });
        }
        const checkpointId = await (0, progress_tracking_1.createCheckpoint)(tenantId, jobId, checkpointData, transactionsProcessed);
        (0, logger_1.logInfo)("Checkpoint created", { checkpointId, jobId, tenantId, traceId: req.traceId });
        return res.status(201).json({
            id: checkpointId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create checkpoint", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create checkpoint",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/progress/checkpoints/jobs/:jobId
 * Get latest checkpoint for a job
 */
router.get("/checkpoints/jobs/:jobId", async (req, res) => {
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
        const checkpoint = await (0, progress_tracking_1.getLatestCheckpoint)(tenantId, jobId);
        if (!checkpoint) {
            return res.status(404).json({
                error: "Not Found",
                message: "No checkpoint found for this job",
                traceId: req.traceId,
            });
        }
        return res.json({
            ...checkpoint,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get checkpoint", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get checkpoint",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/progress/checkpoints/:checkpointId/resume
 * Resume from a checkpoint
 */
router.post("/checkpoints/:checkpointId/resume", async (req, res) => {
    try {
        const { checkpointId } = req.params;
        const tenantId = req.tenantId;
        if (!checkpointId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "checkpointId is required",
                traceId: req.traceId,
            });
        }
        await (0, progress_tracking_1.resumeFromCheckpoint)(tenantId, checkpointId);
        (0, logger_1.logInfo)("Resumed from checkpoint", { checkpointId, tenantId, traceId: req.traceId });
        return res.status(200).json({
            message: "Resumed from checkpoint",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to resume from checkpoint", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to resume from checkpoint",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=progress.js.map