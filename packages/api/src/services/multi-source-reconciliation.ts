/**
 * Multi-Source Reconciliation Service
 * Handles reconciliation with multiple source adapters against a single target
 */

import { query } from "../db";
import { logError, logInfo } from "../utils/logger";

export interface MultiSourceConfig {
  sourceAdapters: Array<{
    adapter: string;
    config: Record<string, unknown>;
  }>;
  targetAdapter: string;
  targetConfig: Record<string, unknown>;
  conflictResolutionStrategy: "first_wins" | "last_wins" | "highest_amount" | "lowest_amount" | "manual";
  duplicateDetectionEnabled: boolean;
}

export interface ConflictDetectionResult {
  conflictId: string;
  conflictType: string;
  sourceAdapter1: string;
  sourceAdapter2: string;
  transactionId1?: string;
  transactionId2?: string;
  conflictDetails: Record<string, unknown>;
}

export interface MultiSourceReconciliationResult {
  multiSourceJobId: string;
  conflicts: ConflictDetectionResult[];
  duplicateCount: number;
  consolidatedMatches: number;
}

/**
 * Create a multi-source reconciliation job
 */
export async function createMultiSourceJob(
  tenantId: string,
  userId: string,
  config: MultiSourceConfig
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO multi_source_jobs (
        tenant_id, user_id, source_adapters, target_adapter,
        conflict_resolution_strategy, duplicate_detection_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        tenantId,
        userId,
        JSON.stringify(config.sourceAdapters),
        config.targetAdapter,
        config.conflictResolutionStrategy,
        config.duplicateDetectionEnabled,
      ] as (string | number | boolean | null | Date)[]
    );

    if (!result[0]?.id) {
      throw new Error("Failed to create multi-source job");
    }
    const jobId = result[0].id;
    logInfo("Multi-source job created", { jobId, tenantId, userId });
    return jobId;
  } catch (error) {
    logError("Failed to create multi-source job", error, { tenantId, userId });
    throw error;
  }
}

/**
 * Detect conflicts between multiple sources
 */
export async function detectConflicts(
  tenantId: string,
  multiSourceJobId: string,
  transactions: Array<{
    adapter: string;
    transactionId: string;
    amount: number;
    date: Date;
    description: string;
    externalId?: string;
  }>
): Promise<ConflictDetectionResult[]> {
  try {
    const conflicts: ConflictDetectionResult[] = [];
    const seenTransactions = new Map<string, Array<typeof transactions[0]>>();

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
            const tx1 = txs[i]!;
            const tx2 = txs[j]!;

            const conflictResult = await query<{ id: string }>(
              `INSERT INTO source_conflicts (
                multi_source_job_id, tenant_id, conflict_type,
                source_adapter_1, source_adapter_2,
                transaction_id_1, transaction_id_2,
                conflict_details
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id`,
              [
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
              ] as (string | number | boolean | null | Date)[]
            );

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

    logInfo("Conflicts detected", {
      multiSourceJobId,
      tenantId,
      conflictCount: conflicts.length,
    });

    return conflicts;
  } catch (error) {
    logError("Failed to detect conflicts", error, { multiSourceJobId, tenantId });
    throw error;
  }
}

/**
 * Resolve a conflict
 */
export async function resolveConflict(
  tenantId: string,
  conflictId: string,
  resolutionStrategy: "first_wins" | "last_wins" | "highest_amount" | "lowest_amount" | "manual",
  resolvedBy: string
): Promise<void> {
  try {
    await query(
      `UPDATE source_conflicts
       SET resolution_strategy = $1, resolved_by = $2, resolved_at = now()
       WHERE id = $3 AND tenant_id = $4`,
      [resolutionStrategy, resolvedBy, conflictId, tenantId]
    );

    logInfo("Conflict resolved", { conflictId, tenantId, resolutionStrategy });
  } catch (error) {
    logError("Failed to resolve conflict", error, { conflictId, tenantId });
    throw error;
  }
}

/**
 * Run multi-source reconciliation
 */
export async function runMultiSourceReconciliation(
  tenantId: string,
  multiSourceJobId: string,
  reconRunId: string
): Promise<MultiSourceReconciliationResult> {
  try {
    // Get job configuration
    const jobResult = await query<{
      source_adapters: Array<{ adapter: string; config: Record<string, unknown> }>;
      target_adapter: string;
      conflict_resolution_strategy: string;
      duplicate_detection_enabled: boolean;
    }>(
      `SELECT source_adapters, target_adapter, conflict_resolution_strategy, duplicate_detection_enabled
       FROM multi_source_jobs
       WHERE id = $1 AND tenant_id = $2`,
      [multiSourceJobId, tenantId]
    );

    if (jobResult.length === 0) {
      throw new Error("Multi-source job not found");
    }

    // TODO: Fetch transactions from all source adapters
    // This would integrate with the adapter system
    const allTransactions: Array<{
      adapter: string;
      transactionId: string;
      amount: number;
      date: Date;
      description: string;
      externalId?: string;
    }> = [];

    // Detect conflicts
    const conflicts = await detectConflicts(tenantId, multiSourceJobId, allTransactions);

    // Update job with recon_run_id
    await query(
      `UPDATE multi_source_jobs SET recon_run_id = $1 WHERE id = $2`,
      [reconRunId, multiSourceJobId]
    );

    return {
      multiSourceJobId,
      conflicts,
      duplicateCount: conflicts.length,
      consolidatedMatches: 0, // TODO: Calculate from actual reconciliation
    };
  } catch (error) {
    logError("Failed to run multi-source reconciliation", error, {
      multiSourceJobId,
      tenantId,
    });
    throw error;
  }
}

/**
 * Get multi-source job details
 */
export async function getMultiSourceJob(
  tenantId: string,
  multiSourceJobId: string
): Promise<{
  id: string;
  sourceAdapters: Array<{ adapter: string; config: Record<string, unknown> }>;
  targetAdapter: string;
  conflictResolutionStrategy: string;
  conflicts: ConflictDetectionResult[];
} | null> {
  try {
    const jobResult = await query<{
      id: string;
      source_adapters: Array<{ adapter: string; config: Record<string, unknown> }>;
      target_adapter: string;
      conflict_resolution_strategy: string;
    }>(
      `SELECT id, source_adapters, target_adapter, conflict_resolution_strategy
       FROM multi_source_jobs
       WHERE id = $1 AND tenant_id = $2`,
      [multiSourceJobId, tenantId]
    );

    if (jobResult.length === 0) {
      return null;
    }

    const job = jobResult[0]!;

    // Get conflicts
    const conflictsResult = await query<{
      id: string;
      conflict_type: string;
      source_adapter_1: string;
      source_adapter_2: string;
      transaction_id_1: string | null;
      transaction_id_2: string | null;
      conflict_details: Record<string, unknown>;
    }>(
      `SELECT id, conflict_type, source_adapter_1, source_adapter_2,
              transaction_id_1, transaction_id_2, conflict_details
       FROM source_conflicts
       WHERE multi_source_job_id = $1 AND tenant_id = $2 AND resolved_at IS NULL`,
      [multiSourceJobId, tenantId]
    );

    const conflicts: ConflictDetectionResult[] = conflictsResult.map((row) => ({
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
  } catch (error) {
    logError("Failed to get multi-source job", error, { multiSourceJobId, tenantId });
    throw error;
  }
}
