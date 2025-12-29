"use strict";
/**
 * Automated Review API Routes
 *
 * Endpoints for automated reconciliation review process.
 * Implements industry-standard automated review according to best practices.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const automated_review_1 = require("../../services/reconciliation/automated-review");
const quality_monitor_1 = require("../../services/reconciliation/quality-monitor");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/automated-review/run/:runId
 * Trigger automated review for a reconciliation run
 */
router.post("/run/:runId", async (req, res) => {
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
        const stats = await (0, automated_review_1.autoReviewRun)(runId, tenantId);
        (0, logger_1.logInfo)("Automated review triggered", {
            runId,
            tenantId,
            traceId: req.traceId,
        });
        return res.json({
            runId,
            reviewed: stats.reviewed,
            autoApproved: stats.autoApproved,
            ruleResolved: stats.ruleResolved,
            exceptionHandled: stats.exceptionHandled,
            systemFlagged: stats.systemFlagged,
            errors: stats.errors,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to trigger automated review", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to trigger automated review",
            traceId: req.traceId,
        });
    }
});
/**
 * POST /api/v1/automated-review/match/:matchId
 * Trigger automated review for a single match
 */
router.post("/match/:matchId", async (req, res) => {
    try {
        const { matchId } = req.params;
        const tenantId = req.tenantId;
        if (!matchId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "matchId is required",
                traceId: req.traceId,
            });
        }
        const result = await (0, automated_review_1.autoReviewMatch)(matchId, tenantId);
        return res.json({
            matchId,
            action: result.action,
            resolutionRule: result.resolutionRule,
            confidence: result.confidence,
            auditEntryId: result.auditEntryId,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to review match", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to review match",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/automated-review/run/:runId/statistics
 * Get review statistics for a reconciliation run
 */
router.get("/run/:runId/statistics", async (req, res) => {
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
        const stats = await (0, automated_review_1.getReviewStatistics)(runId, tenantId);
        return res.json({
            runId,
            ...stats,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get review statistics", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get review statistics",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/automated-review/run/:runId/quality
 * Get quality metrics and alerts for a reconciliation run
 */
router.get("/run/:runId/quality", async (req, res) => {
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
        const metrics = await (0, quality_monitor_1.calculateQualityMetrics)(runId, tenantId);
        const alerts = await (0, quality_monitor_1.checkQualityThresholds)(runId, tenantId);
        return res.json({
            runId,
            metrics,
            alerts,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get quality metrics", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get quality metrics",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/automated-review/run/:runId/report
 * Generate comprehensive quality report for a reconciliation run
 */
router.get("/run/:runId/report", async (req, res) => {
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
        const report = await (0, quality_monitor_1.generateQualityReport)(runId, tenantId);
        return res.json({
            ...report,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to generate quality report", error, {
            traceId: req.traceId,
        });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to generate quality report",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=automated-review.js.map