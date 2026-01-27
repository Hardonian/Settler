"use strict";
/**
 * Retry with Exponential Backoff
 * Standardized retry logic for external service calls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWithBackoff = retryWithBackoff;
exports.retryNetworkOperation = retryNetworkOperation;
exports.retryDatabaseOperation = retryDatabaseOperation;
const logger_1 = require("./logger");
const DEFAULT_OPTIONS = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: [],
};
/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError = null;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Check if error is retryable
            const isRetryable = opts.retryableErrors.length === 0 ||
                opts.retryableErrors.some((ErrorClass) => lastError instanceof ErrorClass);
            if (!isRetryable || attempt === opts.maxAttempts) {
                throw lastError;
            }
            // Calculate delay with exponential backoff
            const delay = Math.min(opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1), opts.maxDelayMs);
            if (opts.onRetry) {
                opts.onRetry(attempt, lastError);
            }
            else {
                (0, logger_1.logWarn)("Retrying operation", {
                    attempt,
                    maxAttempts: opts.maxAttempts,
                    delayMs: delay,
                    error: lastError.message,
                });
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError || new Error("Retry failed");
}
/**
 * Retry for network errors
 */
async function retryNetworkOperation(fn) {
    return retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 1000,
        retryableErrors: [Error], // Retry on any error for network operations
    });
}
/**
 * Retry for database operations
 */
async function retryDatabaseOperation(fn) {
    return retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 500,
        retryableErrors: [Error],
    });
}
//# sourceMappingURL=retry-with-backoff.js.map