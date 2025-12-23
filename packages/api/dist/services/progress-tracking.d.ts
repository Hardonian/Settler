/**
 * Progress Tracking Service
 * Handles real-time progress tracking for long-running reconciliation jobs
 */
export interface ProgressUpdate {
    progressPercentage: number;
    transactionsProcessed: number;
    totalTransactions: number;
    estimatedCompletionAt?: Date;
    lastUpdateAt: Date;
}
/**
 * Update progress for a reconciliation run
 */
export declare function updateReconciliationProgress(tenantId: string, runId: string, progress: {
    transactionsProcessed: number;
    totalTransactions: number;
    estimatedCompletionAt?: Date;
}): Promise<void>;
/**
 * Update progress for a reconciliation result
 */
export declare function updateReconciliationResultProgress(tenantId: string, resultId: string, progress: {
    transactionsProcessed: number;
    totalTransactions: number;
    estimatedCompletionAt?: Date;
}): Promise<void>;
/**
 * Get progress for a reconciliation run
 */
export declare function getReconciliationProgress(tenantId: string, runId: string): Promise<ProgressUpdate | null>;
/**
 * Get progress for a reconciliation result
 */
export declare function getReconciliationResultProgress(tenantId: string, resultId: string): Promise<ProgressUpdate | null>;
/**
 * Create a checkpoint for a job
 */
export declare function createCheckpoint(tenantId: string, jobId: string, checkpointData: Record<string, unknown>, transactionsProcessed: number): Promise<string>;
/**
 * Get latest checkpoint for a job
 */
export declare function getLatestCheckpoint(tenantId: string, jobId: string): Promise<{
    id: string;
    checkpointData: Record<string, unknown>;
    transactionsProcessed: number;
    createdAt: Date;
} | null>;
/**
 * Resume from checkpoint
 */
export declare function resumeFromCheckpoint(tenantId: string, checkpointId: string): Promise<void>;
//# sourceMappingURL=progress-tracking.d.ts.map