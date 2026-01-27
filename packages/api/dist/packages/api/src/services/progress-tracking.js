"use strict";
/**
 * Progress Tracking Service
 * Handles real-time progress tracking for long-running reconciliation jobs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReconciliationProgress = updateReconciliationProgress;
exports.updateReconciliationResultProgress = updateReconciliationResultProgress;
exports.getReconciliationProgress = getReconciliationProgress;
exports.getReconciliationResultProgress = getReconciliationResultProgress;
exports.createCheckpoint = createCheckpoint;
exports.getLatestCheckpoint = getLatestCheckpoint;
exports.resumeFromCheckpoint = resumeFromCheckpoint;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Update progress for a reconciliation run
 */
async function updateReconciliationProgress(tenantId, runId, progress) {
    try {
        const progressPercentage = Math.min(100, Math.max(0, (progress.transactionsProcessed / progress.totalTransactions) * 100));
        // Calculate ETA if not provided
        let estimatedCompletionAt = progress.estimatedCompletionAt;
        if (!estimatedCompletionAt && progress.transactionsProcessed > 0) {
            const runResult = await (0, db_1.query)(`SELECT started_at, last_progress_update_at, transactions_processed
         FROM recon_runs
         WHERE id = $1 AND workspace_id IN (SELECT id FROM tenants WHERE id = $2)`, [runId, tenantId]);
            if (runResult.length > 0) {
                const run = runResult[0];
                const lastUpdate = run.last_progress_update_at || run.started_at;
                if (lastUpdate && progress.transactionsProcessed > run.transactions_processed) {
                    const timeElapsed = Date.now() - new Date(lastUpdate).getTime();
                    const transactionsPerMs = (progress.transactionsProcessed - (run.transactions_processed || 0)) / timeElapsed;
                    const remainingTransactions = progress.totalTransactions - progress.transactionsProcessed;
                    if (transactionsPerMs > 0) {
                        const estimatedMsRemaining = remainingTransactions / transactionsPerMs;
                        estimatedCompletionAt = new Date(Date.now() + estimatedMsRemaining);
                    }
                }
            }
        }
        await (0, db_1.query)(`UPDATE recon_runs
       SET progress_percentage = $1,
           transactions_processed = $2,
           total_transactions = $3,
           estimated_completion_at = $4,
           last_progress_update_at = now()
       WHERE id = $5 AND workspace_id IN (SELECT id FROM tenants WHERE id = $6)`, [
            progressPercentage,
            progress.transactionsProcessed,
            progress.totalTransactions,
            estimatedCompletionAt || null,
            runId,
            tenantId,
        ]);
        (0, logger_1.logInfo)("Progress updated", {
            runId,
            tenantId,
            progressPercentage,
            transactionsProcessed: progress.transactionsProcessed,
            totalTransactions: progress.totalTransactions,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update progress", error, { runId, tenantId });
        throw error;
    }
}
/**
 * Update progress for a reconciliation result
 */
async function updateReconciliationResultProgress(tenantId, resultId, progress) {
    try {
        const progressPercentage = Math.min(100, Math.max(0, (progress.transactionsProcessed / progress.totalTransactions) * 100));
        await (0, db_1.query)(`UPDATE recon_results
       SET progress_percentage = $1,
           transactions_processed = $2,
           estimated_completion_at = $3
       WHERE id = $4 AND tenant_id = $5`, [
            progressPercentage,
            progress.transactionsProcessed,
            progress.estimatedCompletionAt || null,
            resultId,
            tenantId,
        ]);
        (0, logger_1.logInfo)("Result progress updated", {
            resultId,
            tenantId,
            progressPercentage,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update result progress", error, { resultId, tenantId });
        throw error;
    }
}
/**
 * Get progress for a reconciliation run
 */
async function getReconciliationProgress(tenantId, runId) {
    try {
        const result = await (0, db_1.query)(`SELECT progress_percentage, transactions_processed, total_transactions,
              estimated_completion_at, last_progress_update_at
       FROM recon_runs
       WHERE id = $1 AND workspace_id IN (SELECT id FROM tenants WHERE id = $2)`, [runId, tenantId]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            progressPercentage: row.progress_percentage || 0,
            transactionsProcessed: row.transactions_processed || 0,
            totalTransactions: row.total_transactions || 0,
            estimatedCompletionAt: row.estimated_completion_at || undefined,
            lastUpdateAt: row.last_progress_update_at || new Date(),
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get progress", error, { runId, tenantId });
        throw error;
    }
}
/**
 * Get progress for a reconciliation result
 */
async function getReconciliationResultProgress(tenantId, resultId) {
    try {
        const result = await (0, db_1.query)(`SELECT progress_percentage, transactions_processed,
              estimated_completion_at, updated_at
       FROM recon_results
       WHERE id = $1 AND tenant_id = $2`, [resultId, tenantId]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        // Get total from source_count + target_count
        const totalResult = await (0, db_1.query)(`SELECT source_count + target_count as total
       FROM recon_results
       WHERE id = $1 AND tenant_id = $2`, [resultId, tenantId]);
        const totalTransactions = totalResult.length > 0 ? (totalResult[0]?.total || 0) : 0;
        return {
            progressPercentage: row.progress_percentage || 0,
            transactionsProcessed: row.transactions_processed || 0,
            totalTransactions,
            estimatedCompletionAt: row.estimated_completion_at || undefined,
            lastUpdateAt: row.updated_at,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get result progress", error, { resultId, tenantId });
        throw error;
    }
}
/**
 * Create a checkpoint for a job
 */
async function createCheckpoint(tenantId, jobId, checkpointData, transactionsProcessed) {
    try {
        // Expire old checkpoints for this job
        await (0, db_1.query)(`UPDATE checkpoints
       SET status = 'expired', expires_at = now()
       WHERE job_id = $1 AND tenant_id = $2 AND status = 'active'`, [jobId, tenantId]);
        // Create new checkpoint
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const result = await (0, db_1.query)(`INSERT INTO checkpoints (
        tenant_id, job_id, checkpoint_data, transactions_processed, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`, [tenantId, jobId, JSON.stringify(checkpointData), transactionsProcessed, expiresAt]);
        const checkpointId = result[0]?.id || '';
        (0, logger_1.logInfo)("Checkpoint created", { checkpointId, jobId, tenantId });
        return checkpointId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create checkpoint", error, { jobId, tenantId });
        throw error;
    }
}
/**
 * Get latest checkpoint for a job
 */
async function getLatestCheckpoint(tenantId, jobId) {
    try {
        const result = await (0, db_1.query)(`SELECT id, checkpoint_data, transactions_processed, created_at
       FROM checkpoints
       WHERE job_id = $1 AND tenant_id = $2 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`, [jobId, tenantId]);
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            id: row.id,
            checkpointData: row.checkpoint_data,
            transactionsProcessed: row.transactions_processed,
            createdAt: row.created_at,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get checkpoint", error, { jobId, tenantId });
        throw error;
    }
}
/**
 * Resume from checkpoint
 */
async function resumeFromCheckpoint(tenantId, checkpointId) {
    try {
        await (0, db_1.query)(`UPDATE checkpoints
       SET status = 'resumed', resumed_at = now()
       WHERE id = $1 AND tenant_id = $2`, [checkpointId, tenantId]);
        (0, logger_1.logInfo)("Resumed from checkpoint", { checkpointId, tenantId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to resume from checkpoint", error, { checkpointId, tenantId });
        throw error;
    }
}
//# sourceMappingURL=progress-tracking.js.map