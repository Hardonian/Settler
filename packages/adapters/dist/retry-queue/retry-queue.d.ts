/**
 * Retry Queue System
 *
 * Dedicated retry queue for failed syncs with exponential backoff
 */
export interface RetryJob {
    id: string;
    connectorId: string;
    tenantId: string;
    syncRunId: string;
    attemptCount: number;
    maxAttempts: number;
    nextRetryAt: Date;
    errorMessage: string;
    errorType: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    jitter: boolean;
}
export declare class RetryQueue {
    private supabase;
    private config;
    constructor(supabaseUrl: string, supabaseServiceKey: string, config?: Partial<RetryConfig>);
    /**
     * Add failed sync to retry queue
     */
    enqueue(connectorId: string, tenantId: string, syncRunId: string, errorMessage: string, errorType: string, metadata?: Record<string, unknown>): Promise<string>;
    /**
     * Get jobs ready for retry
     */
    getReadyJobs(limit?: number): Promise<RetryJob[]>;
    /**
     * Process retry job
     */
    processJob(jobId: string): Promise<{
        success: boolean;
        retryAgain: boolean;
    }>;
    /**
     * Mark job as completed
     */
    markCompleted(jobId: string): Promise<void>;
    /**
     * Mark job as failed (will retry if attempts remaining)
     */
    markFailed(jobId: string, errorMessage: string, errorType: string): Promise<{
        retryAgain: boolean;
        nextRetryAt?: Date;
    }>;
    /**
     * Calculate next retry time with exponential backoff
     */
    private calculateNextRetry;
    /**
     * Get dead letter queue (failed permanently)
     */
    getDeadLetterQueue(limit?: number): Promise<RetryJob[]>;
    /**
     * Retry dead letter job manually
     */
    retryDeadLetter(jobId: string): Promise<void>;
}
//# sourceMappingURL=retry-queue.d.ts.map