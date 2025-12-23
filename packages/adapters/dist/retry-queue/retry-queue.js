"use strict";
/**
 * Retry Queue System
 *
 * Dedicated retry queue for failed syncs with exponential backoff
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryQueue = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const DEFAULT_RETRY_CONFIG = {
    maxAttempts: 5,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 3600000, // 1 hour
    backoffMultiplier: 2,
    jitter: true,
};
class RetryQueue {
    supabase;
    config;
    constructor(supabaseUrl, supabaseServiceKey, config) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    }
    /**
     * Add failed sync to retry queue
     */
    async enqueue(connectorId, tenantId, syncRunId, errorMessage, errorType, metadata) {
        const nextRetryAt = this.calculateNextRetry(1);
        const { data: job, error } = await this.supabase
            .from('retry_queue')
            .insert({
            connector_id: connectorId,
            tenant_id: tenantId,
            sync_run_id: syncRunId,
            attempt_count: 1,
            max_attempts: this.config.maxAttempts,
            next_retry_at: nextRetryAt.toISOString(),
            error_message: errorMessage,
            error_type: errorType,
            metadata: metadata || {},
            status: 'pending',
        })
            .select('id')
            .single();
        if (error || !job) {
            throw new Error(`Failed to enqueue retry job: ${error?.message}`);
        }
        return job.id;
    }
    /**
     * Get jobs ready for retry
     */
    async getReadyJobs(limit = 100) {
        const now = new Date().toISOString();
        const { data: jobs } = await this.supabase
            .from('retry_queue')
            .select('*')
            .eq('status', 'pending')
            .lte('next_retry_at', now)
            .lt('attempt_count', this.config.maxAttempts)
            .order('next_retry_at', { ascending: true })
            .limit(limit);
        return (jobs || []);
    }
    /**
     * Process retry job
     */
    async processJob(jobId) {
        const { data: job } = await this.supabase
            .from('retry_queue')
            .select('*')
            .eq('id', jobId)
            .single();
        if (!job) {
            return { success: false, retryAgain: false };
        }
        // Mark as processing
        await this.supabase
            .from('retry_queue')
            .update({ status: 'processing', started_at: new Date().toISOString() })
            .eq('id', jobId);
        // Job will be processed by sync worker
        // This function just marks it as ready
        const jobTyped = job;
        return { success: true, retryAgain: jobTyped.attempt_count < jobTyped.max_attempts };
    }
    /**
     * Mark job as completed
     */
    async markCompleted(jobId) {
        await this.supabase
            .from('retry_queue')
            .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
        })
            .eq('id', jobId);
    }
    /**
     * Mark job as failed (will retry if attempts remaining)
     */
    async markFailed(jobId, errorMessage, errorType) {
        const { data: job } = await this.supabase
            .from('retry_queue')
            .select('*')
            .eq('id', jobId)
            .single();
        if (!job) {
            return { retryAgain: false };
        }
        const jobTyped = job;
        const newAttemptCount = jobTyped.attempt_count + 1;
        const retryAgain = newAttemptCount < jobTyped.max_attempts;
        if (retryAgain) {
            const nextRetryAt = this.calculateNextRetry(newAttemptCount);
            await this.supabase
                .from('retry_queue')
                .update({
                attempt_count: newAttemptCount,
                next_retry_at: nextRetryAt.toISOString(),
                error_message: errorMessage,
                error_type: errorType,
                status: 'pending',
            })
                .eq('id', jobId);
            return { retryAgain: true, nextRetryAt };
        }
        else {
            // Max attempts reached - mark as failed permanently
            await this.supabase
                .from('retry_queue')
                .update({
                attempt_count: newAttemptCount,
                status: 'failed',
                error_message: errorMessage,
                error_type: errorType,
                completed_at: new Date().toISOString(),
            })
                .eq('id', jobId);
            return { retryAgain: false };
        }
    }
    /**
     * Calculate next retry time with exponential backoff
     */
    calculateNextRetry(attemptCount) {
        let delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attemptCount - 1);
        // Cap at max delay
        delay = Math.min(delay, this.config.maxDelayMs);
        // Add jitter if enabled
        if (this.config.jitter) {
            const jitterAmount = delay * 0.1; // 10% jitter
            delay += (Math.random() * 2 - 1) * jitterAmount;
        }
        return new Date(Date.now() + delay);
    }
    /**
     * Get dead letter queue (failed permanently)
     */
    async getDeadLetterQueue(limit = 100) {
        const { data: jobs } = await this.supabase
            .from('retry_queue')
            .select('*')
            .eq('status', 'failed')
            .order('completed_at', { ascending: false })
            .limit(limit);
        return (jobs || []);
    }
    /**
     * Retry dead letter job manually
     */
    async retryDeadLetter(jobId) {
        await this.supabase
            .from('retry_queue')
            .update({
            status: 'pending',
            attempt_count: 0,
            next_retry_at: new Date().toISOString(),
            completed_at: null,
        })
            .eq('id', jobId);
    }
}
exports.RetryQueue = RetryQueue;
//# sourceMappingURL=retry-queue.js.map