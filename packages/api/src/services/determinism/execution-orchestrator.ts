/**
 * Execution Orchestration Service
 *
 * Handles:
 * - Per-run max records guardrail
 * - Chunking strategy (batch sizes)
 * - Retry policy (bounded retries + exponential backoff)
 * - Circuit breaker behavior
 * - Run status transitions with structured reason codes
 */

import { v4 as uuidv4 } from "uuid";
import { query } from "../../db";
import { logError, logInfo, logWarn } from "../../utils/logger";
import { stableStringify } from "./canonical-input";
/**
 * Run configuration
 */
export interface RunConfig {
  // Guardrails
  max_records: number;
  max_source_records?: number;
  max_target_records?: number;

  // Chunking
  chunk_size: number;

  // Retry policy
  max_retries: number;
  retry_delay_ms: number;
  retry_backoff_multiplier: number;
  max_retry_delay_ms: number;

  // Timeout
  run_timeout_ms: number;
  chunk_timeout_ms: number;

  // Circuit breaker
  circuit_breaker_threshold: number;
  circuit_breaker_timeout_ms: number;
}

/**
 * Default run configuration
 */
export const DEFAULT_RUN_CONFIG: RunConfig = {
  max_records: 100000,
  chunk_size: 1000,
  max_retries: 3,
  retry_delay_ms: 1000,
  retry_backoff_multiplier: 2,
  max_retry_delay_ms: 30000,
  run_timeout_ms: 3600000, // 1 hour
  chunk_timeout_ms: 60000, // 1 minute
  circuit_breaker_threshold: 5,
  circuit_breaker_timeout_ms: 300000, // 5 minutes
};

/**
 * Error reason codes
 */
export type ErrorReasonCode =
  | "VALIDATION_ERROR"
  | "SOURCE_UNAVAILABLE"
  | "TARGET_UNAVAILABLE"
  | "MATCHING_ERROR"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "QUOTA_EXCEEDED"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN_ERROR";

/**
 * Structured error information
 */
export interface StructuredError {
  code: ErrorReasonCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Run execution context
 */
export interface RunExecutionContext {
  snapshot_id: string;
  tenant_id: string;
  job_id: string;
  config: RunConfig;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  started_at: Date;
  error?: StructuredError;
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  failures: number;
  last_failure_time: Date | null;
  is_open: boolean;
}

/**
 * Circuit breaker for connections
 */
export class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map();
  private config: RunConfig;

  constructor(config: RunConfig) {
    this.config = config;
  }

  /**
   * Check if circuit is closed (allowing requests)
   */
  isAvailable(connectionId: string): boolean {
    const state = this.states.get(connectionId);

    if (!state) {
      return true;
    }

    if (!state.is_open) {
      return true;
    }

    // Check if timeout has passed
    if (state.last_failure_time) {
      const elapsed = Date.now() - state.last_failure_time.getTime();
      if (elapsed > this.config.circuit_breaker_timeout_ms) {
        // Half-open: allow one request through
        this.states.set(connectionId, {
          ...state,
          is_open: false,
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Record a failure
   */
  recordFailure(connectionId: string): void {
    const state = this.states.get(connectionId) || {
      failures: 0,
      last_failure_time: null,
      is_open: false,
    };

    state.failures++;
    state.last_failure_time = new Date();

    if (state.failures >= this.config.circuit_breaker_threshold) {
      state.is_open = true;
      logWarn("Circuit breaker opened", { connectionId, failures: state.failures });
    }

    this.states.set(connectionId, state);
  }

  /**
   * Record a success
   */
  recordSuccess(connectionId: string): void {
    this.states.delete(connectionId);
  }

  /**
   * Get circuit state
   */
  getState(connectionId: string): CircuitBreakerState | undefined {
    return this.states.get(connectionId);
  }

  /**
   * Reset circuit breaker
   */
  reset(connectionId: string): void {
    this.states.delete(connectionId);
  }
}

/**
 * Retry policy executor
 */
export class RetryPolicy {
  private config: RunConfig;

  constructor(config: RunConfig) {
    this.config = config;
  }

  /**
   * Execute with retry
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: { operation_name: string; record_id?: string }
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.config.retry_delay_ms;

    for (let attempt = 0; attempt <= this.config.max_retries; attempt++) {
      try {
        if (attempt > 0) {
          logInfo("Retrying operation", {
            ...context,
            attempt,
            delay_ms: delay,
          });

          await this.sleep(delay);
          delay = Math.min(
            delay * this.config.retry_backoff_multiplier,
            this.config.max_retry_delay_ms
          );
        }

        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        const isRetryable = this.isRetryableError(lastError);

        if (!isRetryable || attempt >= this.config.max_retries) {
          logError("Operation failed permanently", error, {
            ...context,
            attempts: attempt + 1,
          });
          throw lastError;
        }

        logWarn("Operation failed, will retry", {
          ...context,
          attempt: attempt + 1,
          error: lastError.message,
        });
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "timeout",
      "temporary",
      "unavailable",
      "rate limit",
    ];

    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern.toLowerCase()));
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Execution orchestrator
 */
export class ExecutionOrchestrator {
  private config: RunConfig;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryPolicy: RetryPolicy;

  constructor(config: Partial<RunConfig> = {}) {
    this.config = { ...DEFAULT_RUN_CONFIG, ...config };
    this.retryPolicy = new RetryPolicy(this.config);
  }

  /**
   * Get circuit breaker for a connection
   */
  getCircuitBreaker(connectionId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(connectionId)) {
      this.circuitBreakers.set(connectionId, new CircuitBreaker(this.config));
    }
    return this.circuitBreakers.get(connectionId)!;
  }

  /**
   * Check guardrails before starting run
   */
  async checkGuardrails(
    sourceCount: number,
    targetCount: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    const totalRecords = sourceCount + targetCount;

    if (totalRecords > this.config.max_records) {
      return {
        allowed: false,
        reason: `Total records (${totalRecords}) exceeds maximum allowed (${this.config.max_records})`,
      };
    }

    if (this.config.max_source_records && sourceCount > this.config.max_source_records) {
      return {
        allowed: false,
        reason: `Source records (${sourceCount}) exceeds maximum allowed (${this.config.max_source_records})`,
      };
    }

    if (this.config.max_target_records && targetCount > this.config.max_target_records) {
      return {
        allowed: false,
        reason: `Target records (${targetCount}) exceeds maximum allowed (${this.config.max_target_records})`,
      };
    }

    return { allowed: true };
  }

  /**
   * Chunk records for processing
   */
  chunkRecords<T>(records: T[]): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < records.length; i += this.config.chunk_size) {
      chunks.push(records.slice(i, i + this.config.chunk_size));
    }

    return chunks;
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Validate status transition
   */
  validateStatusTransition(
    currentStatus: string,
    newStatus: string
  ): { valid: boolean; reason?: string } {
    const validTransitions: Record<string, string[]> = {
      QUEUED: ["RUNNING", "CANCELLED"],
      RUNNING: ["SUCCEEDED", "FAILED", "CANCELLED"],
      SUCCEEDED: [],
      FAILED: ["QUEUED"],
      CANCELLED: ["QUEUED"],
    };

    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      return {
        valid: false,
        reason: `Invalid transition from ${currentStatus} to ${newStatus}`,
      };
    }

    return { valid: true };
  }

  /**
   * Create structured error
   */
  createStructuredError(
    code: ErrorReasonCode,
    message: string,
    details?: Record<string, unknown>
  ): StructuredError {
    const retryableCodes: ErrorReasonCode[] = [
      "SOURCE_UNAVAILABLE",
      "TARGET_UNAVAILABLE",
      "TIMEOUT",
      "RATE_LIMIT",
    ];

    return {
      code,
      message,
      retryable: retryableCodes.includes(code),
      details,
    };
  }

  /**
   * Get retry policy
   */
  getRetryPolicy(): RetryPolicy {
    return this.retryPolicy;
  }

  /**
   * Get config
   */
  getConfig(): RunConfig {
    return this.config;
  }

  /**
   * Update config
   */
  updateConfig(updates: Partial<RunConfig>): void {
    this.config = { ...this.config, ...updates };
    this.retryPolicy = new RetryPolicy(this.config);
  }
}

/**
 * Log execution step
 */
export async function logExecutionStep(
  snapshotId: string,
  tenantId: string,
  sequence: number,
  operation: string,
  message: string,
  context: Record<string, unknown> = {},
  durationMs?: number,
  error?: StructuredError
): Promise<void> {
  try {
    await query(
      `INSERT INTO run_execution_log (
        id, snapshot_id, tenant_id, sequence, operation, message,
        context, duration_ms, error_type, error_message, error_stack,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        uuidv4(),
        snapshotId,
        tenantId,
        sequence,
        operation,
        message,
        stableStringify(context),
        durationMs || null,
        error?.code || null,
        error?.message || null,
        error?.stack || error?.message || null,
      ]
    );
  } catch (err) {
    logError("Failed to log execution step", err, { snapshotId, operation });
  }
}

/**
 * Get execution log for a snapshot
 */
export async function getExecutionLog(snapshotId: string): Promise<
  Array<{
    sequence: number;
    operation: string;
    message: string;
    timestamp: Date;
    error?: string;
  }>
> {
  try {
    const results = await query(
      `SELECT sequence, operation, message, timestamp, error_type, error_message
       FROM run_execution_log
       WHERE snapshot_id = $1
       ORDER BY sequence ASC`,
      [snapshotId]
    );

    return results.map((row: Record<string, unknown>) => ({
      sequence: row.sequence as number,
      operation: row.operation as string,
      message: row.message as string,
      timestamp: row.timestamp as Date,
      error: row.error_type ? `${row.error_type}: ${row.error_message}` : undefined,
    }));
  } catch (error) {
    logError("Failed to get execution log", error, { snapshotId });
    throw error;
  }
}
