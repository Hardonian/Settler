"use strict";
/**
 * Multi-Source Reconciliation Service
 * Handles reconciliation with multiple source adapters against a single target
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMultiSourceJob = createMultiSourceJob;
exports.detectConflicts = detectConflicts;
exports.resolveConflict = resolveConflict;
exports.runMultiSourceReconciliation = runMultiSourceReconciliation;
exports.getMultiSourceJob = getMultiSourceJob;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Create a multi-source reconciliation job
 */
async function createMultiSourceJob(tenantId, userId, config) {
    try {
        const result = await (0, db_1.query)(`INSERT INTO multi_source_jobs (
        tenant_id, user_id, source_adapters, target_adapter,
        conflict_resolution_strategy, duplicate_detection_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`, [
            tenantId,
            userId,
            JSON.stringify(config.sourceAdapters),
            config.targetAdapter,
            config.conflictResolutionStrategy,
            config.duplicateDetectionEnabled,
        ]);
        if (!result[0]?.id) {
            throw new Error("Failed to create multi-source job");
        }
        const jobId = result[0].id;
        (0, logger_1.logInfo)("Multi-source job created", { jobId, tenantId, userId });
        return jobId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create multi-source job", error, { tenantId, userId });
        throw error;
    }
}
/**
 * Detect conflicts between multiple sources
 */
async function detectConflicts(tenantId, multiSourceJobId, transactions) {
    try {
        const conflicts = [];
        const seenTransactions = new Map();
        // Group transactions by external ID or amount+date+description
        for (const tx of transactions) {
            const key = tx.externalId || `${tx.amount}_${tx.date.toISOString()}_${tx.description}`;
            if (!seenTransactions.has(key)) {
                seenTransactions.set(key, []);
            }
            const group = seenTransactions.get(key);
            if (group) {
                group.push(tx);
            }
        }
        // Detect conflicts (same transaction from multiple sources)
        for (const [, txs] of seenTransactions.entries()) {
            if (txs.length > 1) {
                // Multiple sources have the same transaction
                for (let i = 0; i < txs.length; i++) {
                    for (let j = i + 1; j < txs.length; j++) {
                        const tx1 = txs[i];
                        const tx2 = txs[j];
                        const conflictResult = await (0, db_1.query)(`INSERT INTO source_conflicts (
                multi_source_job_id, tenant_id, conflict_type,
                source_adapter_1, source_adapter_2,
                transaction_id_1, transaction_id_2,
                conflict_details
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id`, [
                            multiSourceJobId,
                            tenantId,
                            "duplicate_transaction",
                            tx1.adapter,
                            tx2.adapter,
                            tx1.transactionId,
                            tx2.transactionId,
                            JSON.stringify({
                                amount: tx1.amount,
                                date: tx1.date.toISOString(),
                                description: tx1.description,
                                externalId: tx1.externalId,
                            }),
                        ]);
                        conflicts.push({
                            conflictId: conflictResult[0]?.id || '',
                            conflictType: "duplicate_transaction",
                            sourceAdapter1: tx1.adapter,
                            sourceAdapter2: tx2.adapter,
                            transactionId1: tx1.transactionId,
                            transactionId2: tx2.transactionId,
                            conflictDetails: {
                                amount: tx1.amount,
                                date: tx1.date.toISOString(),
                                description: tx1.description,
                            },
                        });
                    }
                }
            }
        }
        (0, logger_1.logInfo)("Conflicts detected", {
            multiSourceJobId,
            tenantId,
            conflictCount: conflicts.length,
        });
        return conflicts;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to detect conflicts", error, { multiSourceJobId, tenantId });
        throw error;
    }
}
/**
 * Resolve a conflict
 */
async function resolveConflict(tenantId, conflictId, resolutionStrategy, resolvedBy) {
    try {
        await (0, db_1.query)(`UPDATE source_conflicts
       SET resolution_strategy = $1, resolved_by = $2, resolved_at = now()
       WHERE id = $3 AND tenant_id = $4`, [resolutionStrategy, resolvedBy, conflictId, tenantId]);
        (0, logger_1.logInfo)("Conflict resolved", { conflictId, tenantId, resolutionStrategy });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to resolve conflict", error, { conflictId, tenantId });
        throw error;
    }
}
/**
 * Run multi-source reconciliation
 */
async function runMultiSourceReconciliation(tenantId, multiSourceJobId, reconRunId) {
    try {
        // Get job configuration
        const jobResult = await (0, db_1.query)(`SELECT source_adapters, target_adapter, conflict_resolution_strategy, duplicate_detection_enabled
       FROM multi_source_jobs
       WHERE id = $1 AND tenant_id = $2`, [multiSourceJobId, tenantId]);
        if (jobResult.length === 0) {
            throw new Error("Multi-source job not found");
        }
        // TODO: Fetch transactions from all source adapters
        // This would integrate with the adapter system
        const allTransactions = [];
        // Detect conflicts
        const conflicts = await detectConflicts(tenantId, multiSourceJobId, allTransactions);
        // Update job with recon_run_id
        await (0, db_1.query)(`UPDATE multi_source_jobs SET recon_run_id = $1 WHERE id = $2`, [reconRunId, multiSourceJobId]);
        return {
            multiSourceJobId,
            conflicts,
            duplicateCount: conflicts.length,
            consolidatedMatches: 0, // TODO: Calculate from actual reconciliation
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to run multi-source reconciliation", error, {
            multiSourceJobId,
            tenantId,
        });
        throw error;
    }
}
/**
 * Get multi-source job details
 */
async function getMultiSourceJob(tenantId, multiSourceJobId) {
    try {
        const jobResult = await (0, db_1.query)(`SELECT id, source_adapters, target_adapter, conflict_resolution_strategy
       FROM multi_source_jobs
       WHERE id = $1 AND tenant_id = $2`, [multiSourceJobId, tenantId]);
        if (jobResult.length === 0) {
            return null;
        }
        const job = jobResult[0];
        // Get conflicts
        const conflictsResult = await (0, db_1.query)(`SELECT id, conflict_type, source_adapter_1, source_adapter_2,
              transaction_id_1, transaction_id_2, conflict_details
       FROM source_conflicts
       WHERE multi_source_job_id = $1 AND tenant_id = $2 AND resolved_at IS NULL`, [multiSourceJobId, tenantId]);
        const conflicts = conflictsResult.map((row) => ({
            conflictId: row.id,
            conflictType: row.conflict_type,
            sourceAdapter1: row.source_adapter_1,
            sourceAdapter2: row.source_adapter_2,
            transactionId1: row.transaction_id_1 || undefined,
            transactionId2: row.transaction_id_2 || undefined,
            conflictDetails: row.conflict_details,
        }));
        return {
            id: job.id,
            sourceAdapters: job.source_adapters,
            targetAdapter: job.target_adapter,
            conflictResolutionStrategy: job.conflict_resolution_strategy,
            conflicts,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get multi-source job", error, { multiSourceJobId, tenantId });
        throw error;
    }
}
//# sourceMappingURL=multi-source-reconciliation.js.map