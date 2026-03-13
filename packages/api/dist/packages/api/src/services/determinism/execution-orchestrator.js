"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionOrchestrator = exports.RetryPolicy = exports.CircuitBreaker = exports.DEFAULT_RUN_CONFIG = void 0;
exports.logExecutionStep = logExecutionStep;
exports.getExecutionLog = getExecutionLog;
const uuid_1 = require("uuid");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const canonical_input_1 = require("./canonical-input");
/**
 * Default run configuration
 */
exports.DEFAULT_RUN_CONFIG = {
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
 * Circuit breaker for connections
 */
class CircuitBreaker {
    states = new Map();
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Check if circuit is closed (allowing requests)
     */
    isAvailable(connectionId) {
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
    recordFailure(connectionId) {
        const state = this.states.get(connectionId) || {
            failures: 0,
            last_failure_time: null,
            is_open: false,
        };
        state.failures++;
        state.last_failure_time = new Date();
        if (state.failures >= this.config.circuit_breaker_threshold) {
            state.is_open = true;
            (0, logger_1.logWarn)('Circuit breaker opened', { connectionId, failures: state.failures });
        }
        this.states.set(connectionId, state);
    }
    /**
     * Record a success
     */
    recordSuccess(connectionId) {
        this.states.delete(connectionId);
    }
    /**
     * Get circuit state
     */
    getState(connectionId) {
        return this.states.get(connectionId);
    }
    /**
     * Reset circuit breaker
     */
    reset(connectionId) {
        this.states.delete(connectionId);
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Retry policy executor
 */
class RetryPolicy {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Execute with retry
     */
    async executeWithRetry(operation, context) {
        let lastError;
        let delay = this.config.retry_delay_ms;
        for (let attempt = 0; attempt <= this.config.max_retries; attempt++) {
            try {
                if (attempt > 0) {
                    (0, logger_1.logInfo)('Retrying operation', {
                        ...context,
                        attempt,
                        delay_ms: delay,
                    });
                    await this.sleep(delay);
                    delay = Math.min(delay * this.config.retry_backoff_multiplier, this.config.max_retry_delay_ms);
                }
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Check if error is retryable
                const isRetryable = this.isRetryableError(lastError);
                if (!isRetryable || attempt >= this.config.max_retries) {
                    (0, logger_1.logError)('Operation failed permanently', error, {
                        ...context,
                        attempts: attempt + 1,
                    });
                    throw lastError;
                }
                (0, logger_1.logWarn)('Operation failed, will retry', {
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
    isRetryableError(error) {
        const retryablePatterns = [
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'timeout',
            'temporary',
            'unavailable',
            'rate limit',
        ];
        const errorMessage = error.message.toLowerCase();
        return retryablePatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
    }
    /**
     * Sleep for specified duration
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.RetryPolicy = RetryPolicy;
/**
 * Execution orchestrator
 */
class ExecutionOrchestrator {
    config;
    circuitBreakers = new Map();
    retryPolicy;
    constructor(config = {}) {
        this.config = { ...exports.DEFAULT_RUN_CONFIG, ...config };
        this.retryPolicy = new RetryPolicy(this.config);
    }
    /**
     * Get circuit breaker for a connection
     */
    getCircuitBreaker(connectionId) {
        if (!this.circuitBreakers.has(connectionId)) {
            this.circuitBreakers.set(connectionId, new CircuitBreaker(this.config));
        }
        return this.circuitBreakers.get(connectionId);
    }
    /**
     * Check guardrails before starting run
     */
    async checkGuardrails(sourceCount, targetCount) {
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
    chunkRecords(records) {
        const chunks = [];
        for (let i = 0; i < records.length; i += this.config.chunk_size) {
            chunks.push(records.slice(i, i + this.config.chunk_size));
        }
        return chunks;
    }
    /**
     * Execute with timeout
     */
    async executeWithTimeout(operation, timeoutMs, operationName) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });
        return Promise.race([operation(), timeoutPromise]);
    }
    /**
     * Validate status transition
     */
    validateStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            'QUEUED': ['RUNNING', 'CANCELLED'],
            'RUNNING': ['SUCCEEDED', 'FAILED', 'CANCELLED'],
            'SUCCEEDED': [],
            'FAILED': ['QUEUED'],
            'CANCELLED': ['QUEUED'],
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
    createStructuredError(code, message, details) {
        const retryableCodes = [
            'SOURCE_UNAVAILABLE',
            'TARGET_UNAVAILABLE',
            'TIMEOUT',
            'RATE_LIMIT',
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
    getRetryPolicy() {
        return this.retryPolicy;
    }
    /**
     * Get config
     */
    getConfig() {
        return this.config;
    }
    /**
     * Update config
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.retryPolicy = new RetryPolicy(this.config);
    }
}
exports.ExecutionOrchestrator = ExecutionOrchestrator;
/**
 * Log execution step
 */
async function logExecutionStep(snapshotId, tenantId, sequence, operation, message, context = {}, durationMs, error) {
    try {
        await (0, db_1.query)(`INSERT INTO run_execution_log (
        id, snapshot_id, tenant_id, sequence, operation, message,
        context, duration_ms, error_type, error_message, error_stack,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`, [
            (0, uuid_1.v4)(),
            snapshotId,
            tenantId,
            sequence,
            operation,
            message,
            (0, canonical_input_1.stableStringify)(context),
            durationMs || null,
            error?.code || null,
            error?.message || null,
            error?.stack || error?.message || null,
        ]);
    }
    catch (err) {
        (0, logger_1.logError)('Failed to log execution step', err, { snapshotId, operation });
    }
}
/**
 * Get execution log for a snapshot
 */
async function getExecutionLog(snapshotId) {
    try {
        const results = await (0, db_1.query)(`SELECT sequence, operation, message, timestamp, error_type, error_message
       FROM run_execution_log
       WHERE snapshot_id = $1
       ORDER BY sequence ASC`, [snapshotId]);
        return results.map((row) => ({
            sequence: row.sequence,
            operation: row.operation,
            message: row.message,
            timestamp: row.timestamp,
            error: row.error_type ? `${row.error_type}: ${row.error_message}` : undefined,
        }));
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get execution log', error, { snapshotId });
        throw error;
    }
}
//# sourceMappingURL=execution-orchestrator.js.map