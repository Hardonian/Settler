/**
 * Retry Queue System
 *
 * Dedicated retry queue for failed syncs with exponential backoff
 */

import { createClient } from "@supabase/supabase-js";

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

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 3600000, // 1 hour
  backoffMultiplier: 2,
  jitter: true,
};

export class RetryQueue {
  private supabase: ReturnType<typeof createClient>;
  private config: RetryConfig;

  constructor(supabaseUrl: string, supabaseServiceKey: string, config?: Partial<RetryConfig>) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Add failed sync to retry queue
   */
  async enqueue(
    connectorId: string,
    tenantId: string,
    syncRunId: string,
    errorMessage: string,
    errorType: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const nextRetryAt = this.calculateNextRetry(1);

    const { data: job, error } = await this.supabase
      .from("retry_queue")
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
        status: "pending",
      } as never)
      .select("id")
      .single();

    if (error || !job) {
      throw new Error(`Failed to enqueue retry job: ${error?.message}`);
    }

    return (job as { id: string }).id;
  }

  /**
   * Get jobs ready for retry
   */
  async getReadyJobs(limit: number = 100): Promise<RetryJob[]> {
    const now = new Date().toISOString();

    const { data: jobs } = await this.supabase
      .from("retry_queue")
      .select("*")
      .eq("status", "pending")
      .lte("next_retry_at", now)
      .lt("attempt_count", this.config.maxAttempts)
      .order("next_retry_at", { ascending: true })
      .limit(limit);

    return (jobs || []) as RetryJob[];
  }

  /**
   * Process retry job
   */
  async processJob(jobId: string): Promise<{ success: boolean; retryAgain: boolean }> {
    const { data: job } = await this.supabase
      .from("retry_queue")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!job) {
      return { success: false, retryAgain: false };
    }

    // Mark as processing
    await this.supabase
      .from("retry_queue")
      .update({ status: "processing", started_at: new Date().toISOString() } as never)
      .eq("id", jobId);

    // Job will be processed by sync worker
    // This function just marks it as ready
    const jobTyped = job as { attempt_count: number; max_attempts: number };
    return { success: true, retryAgain: jobTyped.attempt_count < jobTyped.max_attempts };
  }

  /**
   * Mark job as completed
   */
  async markCompleted(jobId: string): Promise<void> {
    await this.supabase
      .from("retry_queue")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      } as never)
      .eq("id", jobId);
  }

  /**
   * Mark job as failed (will retry if attempts remaining)
   */
  async markFailed(
    jobId: string,
    errorMessage: string,
    errorType: string
  ): Promise<{ retryAgain: boolean; nextRetryAt?: Date }> {
    const { data: job } = await this.supabase
      .from("retry_queue")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!job) {
      return { retryAgain: false };
    }

    const jobTyped = job as { attempt_count: number; max_attempts: number };
    const newAttemptCount = jobTyped.attempt_count + 1;
    const retryAgain = newAttemptCount < jobTyped.max_attempts;

    if (retryAgain) {
      const nextRetryAt = this.calculateNextRetry(newAttemptCount);
      await this.supabase
        .from("retry_queue")
        .update({
          attempt_count: newAttemptCount,
          next_retry_at: nextRetryAt.toISOString(),
          error_message: errorMessage,
          error_type: errorType,
          status: "pending",
        } as never)
        .eq("id", jobId);

      return { retryAgain: true, nextRetryAt };
    } else {
      // Max attempts reached - mark as failed permanently
      await this.supabase
        .from("retry_queue")
        .update({
          attempt_count: newAttemptCount,
          status: "failed",
          error_message: errorMessage,
          error_type: errorType,
          completed_at: new Date().toISOString(),
        } as never)
        .eq("id", jobId);

      return { retryAgain: false };
    }
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(attemptCount: number): Date {
    let delay =
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attemptCount - 1);

    // Cap at max delay
    delay = Math.min(delay, this.config.maxDelayMs);

    // Add jitter if enabled
    if (this.config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay +=
        ((crypto.getRandomValues(new Uint32Array(1))[0]! / (0xffffffff + 1)) * 2 - 1) *
        jitterAmount;
    }

    return new Date(Date.now() + delay);
  }

  /**
   * Get dead letter queue (failed permanently)
   */
  async getDeadLetterQueue(limit: number = 100): Promise<RetryJob[]> {
    const { data: jobs } = await this.supabase
      .from("retry_queue")
      .select("*")
      .eq("status", "failed")
      .order("completed_at", { ascending: false })
      .limit(limit);

    return (jobs || []) as RetryJob[];
  }

  /**
   * Retry dead letter job manually
   */
  async retryDeadLetter(jobId: string): Promise<void> {
    await this.supabase
      .from("retry_queue")
      .update({
        status: "pending",
        attempt_count: 0,
        next_retry_at: new Date().toISOString(),
        completed_at: null,
      } as never)
      .eq("id", jobId);
  }
}
