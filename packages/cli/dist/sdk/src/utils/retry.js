"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const errors_1 = require("../errors");
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 2,
    retryOnRateLimit: true,
    shouldRetry: () => true,
};
/**
 * Calculates the delay for exponential backoff with jitter
 */
function calculateDelay(attempt, initialDelay, maxDelay, multiplier) {
    const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, maxDelay);
}
/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Executes a function with automatic retry and exponential backoff
 */
async function withRetry(fn, config = {}) {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError;
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof errors_1.SettlerError ? error : new errors_1.NetworkError(String(error), error);
            // Don't retry on last attempt
            if (attempt === retryConfig.maxRetries) {
                break;
            }
            // Check if we should retry this error
            const isRetryableError = lastError instanceof errors_1.NetworkError ||
                (lastError instanceof errors_1.RateLimitError && retryConfig.retryOnRateLimit) ||
                (lastError.statusCode !== undefined && lastError.statusCode >= 500);
            const shouldRetry = retryConfig.shouldRetry(lastError, attempt) && isRetryableError;
            if (!shouldRetry) {
                break;
            }
            // Calculate delay
            let delay;
            if (lastError instanceof errors_1.RateLimitError && lastError.retryAfter) {
                delay = lastError.retryAfter * 1000; // Convert to milliseconds
            }
            else {
                delay = calculateDelay(attempt, retryConfig.initialDelay, retryConfig.maxDelay, retryConfig.multiplier);
            }
            await sleep(delay);
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map