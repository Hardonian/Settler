"use strict";
/**
 * Adapter Retry Logic Service
 *
 * Provides automatic retry logic for adapter connections with:
 * - Exponential backoff
 * - Configurable retry attempts
 * - Transient error detection
 * - Idempotent operations
 *
 * Enterprise-ready with:
 * - Type-safe error handling
 * - Comprehensive logging
 * - Circuit breaker pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
exports.executeWithRetry = executeWithRetry;
const DEFAULT_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'rate limit',
        'timeout',
        'temporary',
        'retry',
    ],
};
/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Check if error is retryable
 */
function isRetryableError(error, config) {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    return config.retryableErrors.some((pattern) => errorMessage.includes(pattern.toLowerCase()) || errorName.includes(pattern.toLowerCase()));
}
/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt, config) {
    const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelayMs);
}
/**
 * Execute function with retry logic
 */
async function executeWithRetry(fn, config = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError = null;
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry on last attempt
            if (attempt === finalConfig.maxRetries) {
                break;
            }
            // Check if error is retryable
            if (!isRetryableError(lastError, finalConfig)) {
                throw lastError; // Don't retry non-retryable errors
            }
            // Calculate delay and wait
            const delay = calculateBackoffDelay(attempt, finalConfig);
            console.log(`[RetryLogic] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
            await sleep(delay);
        }
    }
    // All retries exhausted
    throw lastError || new Error('Retry logic exhausted');
}
/**
 * Execute function with retry and circuit breaker
 */
class CircuitBreaker {
    threshold;
    timeoutMs;
    failures = 0;
    lastFailureTime = null;
    state = 'closed';
    constructor(threshold = 5, timeoutMs = 60000) {
        this.threshold = threshold;
        this.timeoutMs = timeoutMs;
    }
    async execute(fn) {
        // Check circuit breaker state
        if (this.state === 'open') {
            if (this.lastFailureTime && Date.now() - this.lastFailureTime.getTime() > this.timeoutMs) {
                this.state = 'half-open';
                console.log('[CircuitBreaker] Moving to half-open state');
            }
            else {
                throw new Error('Circuit breaker is open');
            }
        }
        try {
            const result = await fn();
            // Success - reset failures if in half-open state
            if (this.state === 'half-open') {
                this.state = 'closed';
                this.failures = 0;
                console.log('[CircuitBreaker] Circuit breaker closed');
            }
            else {
                this.failures = 0;
            }
            return result;
        }
        catch (error) {
            this.failures++;
            this.lastFailureTime = new Date();
            // Open circuit if threshold exceeded
            if (this.failures >= this.threshold) {
                this.state = 'open';
                console.log('[CircuitBreaker] Circuit breaker opened');
            }
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    reset() {
        this.state = 'closed';
        this.failures = 0;
        this.lastFailureTime = null;
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=retry.js.map