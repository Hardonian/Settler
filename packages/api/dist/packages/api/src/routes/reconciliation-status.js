"use strict";
/**
 * Reconciliation Status Routes
 * UX-007: Real-time status updates with progress tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconciliationStatusRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const typed_errors_1 = require("../utils/typed-errors");
const router = (0, express_1.Router)();
exports.reconciliationStatusRouter = router;
const getStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        executionId: zod_1.z.string().uuid(),
    }),
});
// Get reconciliation execution status with progress
router.get("/executions/:executionId/status", (0, authorization_1.requirePermission)(Permissions_1.Permission.JOBS_READ), (0, validation_1.validateRequest)(getStatusSchema), async (req, res) => {
    try {
        const { executionId } = req.params;
        const userId = req.userId;
        if (!executionId || !userId) {
            throw new typed_errors_1.NotFoundError("Execution ID and User ID are required", "execution", executionId || "unknown");
        }
        // Get execution details
        const executions = await (0, db_1.query)(`SELECT e.id, e.job_id, e.status, e.started_at, e.completed_at, e.summary, e.error
         FROM executions e
         JOIN jobs j ON e.job_id = j.id
         WHERE e.id = $1 AND j.user_id = $2`, [executionId, userId]);
        if (executions.length === 0 || !executions[0]) {
            throw new typed_errors_1.NotFoundError("Execution not found", "execution", executionId);
        }
        const execution = executions[0];
        // Calculate progress
        let progress = 0;
        let progressMessage = "";
        if (execution.status === "completed") {
            progress = 100;
            progressMessage = "Reconciliation completed";
        }
        else if (execution.status === "failed") {
            progress = 0;
            progressMessage = `Reconciliation failed: ${execution.error || "Unknown error"}`;
        }
        else if (execution.status === "running") {
            // Estimate progress based on time elapsed (rough estimate)
            const elapsed = Date.now() - execution.started_at.getTime();
            const estimatedDuration = 30000; // 30 seconds average
            progress = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100));
            progressMessage = "Reconciliation in progress...";
        }
        // Get match count (if available)
        const matchCount = await (0, db_1.query)(`SELECT COUNT(*) as count FROM matches WHERE execution_id = $1`, [executionId]);
        const summary = execution.summary;
        const matchCountValue = matchCount[0]?.count || "0";
        res.json({
            data: {
                executionId: execution.id,
                jobId: execution.job_id,
                status: execution.status,
                progress: {
                    percentage: progress,
                    message: progressMessage,
                    matched: summary?.matched || parseInt(matchCountValue),
                    unmatched: summary?.unmatched || 0,
                    total: summary?.total || 0,
                },
                startedAt: execution.started_at.toISOString(),
                completedAt: execution.completed_at?.toISOString() || null,
                error: execution.error || null,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get execution status", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=reconciliation-status.js.map