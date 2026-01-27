"use strict";
/**
 * Automated Review Trigger Service
 *
 * Triggers automated review for reconciliation runs that have completed.
 * Can be called as a scheduled job or webhook handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPendingReviews = processPendingReviews;
exports.triggerAutomatedReview = triggerAutomatedReview;
exports.scheduledReviewProcessor = scheduledReviewProcessor;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const automated_review_1 = require("./automated-review");
const quality_monitor_1 = require("./quality-monitor");
/**
 * Process completed reconciliation runs that haven't been reviewed
 */
async function processPendingReviews(limit = 100) {
    try {
        // Find completed runs that haven't been fully reviewed
        const runs = await (0, db_1.query)(`SELECT id, tenant_id, status, completed_at
       FROM reconciliation_runs
       WHERE status = 'completed'
         AND completed_at IS NOT NULL
         AND completed_at > NOW() - INTERVAL '24 hours'
         AND id NOT IN (
           SELECT DISTINCT run_id
           FROM reconciliation_matches
           WHERE reviewed = true
         )
       ORDER BY completed_at ASC
       LIMIT $1`, [limit]);
        const stats = {
            processed: 0,
            reviewed: 0,
            errors: 0,
        };
        for (const run of runs) {
            try {
                stats.processed++;
                // Auto-review the run
                const reviewStats = await (0, automated_review_1.autoReviewRun)(run.id, run.tenant_id);
                stats.reviewed += reviewStats.reviewed;
                // Check quality and generate report
                await (0, quality_monitor_1.checkQualityThresholds)(run.id, run.tenant_id);
                (0, logger_1.logInfo)("Pending review processed", {
                    runId: run.id,
                    tenantId: run.tenant_id,
                    reviewed: reviewStats.reviewed,
                });
            }
            catch (error) {
                stats.errors++;
                (0, logger_1.logError)("Failed to process pending review", error, {
                    runId: run.id,
                    tenantId: run.tenant_id,
                });
            }
        }
        return stats;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to process pending reviews", error);
        throw error;
    }
}
/**
 * Trigger automated review for a specific reconciliation run
 * Called automatically after reconciliation completes
 */
async function triggerAutomatedReview(runId, tenantId) {
    try {
        // Verify run is completed
        const runResult = await (0, db_1.query)(`SELECT status, completed_at
       FROM reconciliation_runs
       WHERE id = $1 AND tenant_id = $2`, [runId, tenantId]);
        if (runResult.length === 0) {
            throw new Error(`Reconciliation run ${runId} not found`);
        }
        const run = runResult[0];
        if (run.status !== "completed") {
            (0, logger_1.logInfo)("Run not completed, skipping review", {
                runId,
                tenantId,
                status: run.status,
            });
            return;
        }
        // Auto-review the run
        const reviewStats = await (0, automated_review_1.autoReviewRun)(runId, tenantId);
        // Check quality thresholds
        const alerts = await (0, quality_monitor_1.checkQualityThresholds)(runId, tenantId);
        // Generate quality report
        const report = await (0, quality_monitor_1.generateQualityReport)(runId, tenantId);
        (0, logger_1.logInfo)("Automated review triggered", {
            runId,
            tenantId,
            reviewStats,
            alertCount: alerts.length,
            reportStatus: report.status,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to trigger automated review", error, {
            runId,
            tenantId,
        });
        throw error;
    }
}
/**
 * Scheduled job to process pending reviews
 * Should be called periodically (e.g., every 5 minutes)
 */
async function scheduledReviewProcessor() {
    try {
        const stats = await processPendingReviews(100);
        (0, logger_1.logInfo)("Scheduled review processor completed", stats);
    }
    catch (error) {
        (0, logger_1.logError)("Scheduled review processor failed", error);
        throw error;
    }
}
//# sourceMappingURL=automated-review-trigger.js.map