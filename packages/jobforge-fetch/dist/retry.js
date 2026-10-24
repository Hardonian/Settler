/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    shouldRetry: () => true,
};
/**
 * Calculate delay for next retry attempt using exponential backoff with jitter
 */
export function calculateRetryDelay(attempt, config) {
    const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const delayWithCap = Math.min(exponentialDelay, config.maxDelay);
    // Add jitter (±25% randomization) to prevent thundering herd
    const jitter = delayWithCap * 0.25 * (Math.random() * 2 - 1);
    return Math.floor(delayWithCap + jitter);
}
/**
 * Check if an HTTP status code should trigger a retry
 */
export function isRetryableStatus(status, retryableStatusCodes) {
    return retryableStatusCodes.includes(status);
}
/**
 * Check if an error should trigger a retry
 */
export function isRetryableError(error) {
    // Network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
        return true;
    }
    // Timeout errors
    if (error.name === "AbortError" || error.name === "TimeoutError") {
        return true;
    }
    // Connection errors
    if (error.message.includes("ECONNRESET") ||
        error.message.includes("ETIMEDOUT") ||
        error.message.includes("ENOTFOUND")) {
        return true;
    }
    return false;
}
/**
 * Sleep for specified duration
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
