import type { RetryConfig } from "./types";
/**
 * Default retry configuration
 */
export declare const DEFAULT_RETRY_CONFIG: Required<RetryConfig>;
/**
 * Calculate delay for next retry attempt using exponential backoff with jitter
 */
export declare function calculateRetryDelay(attempt: number, config: Required<RetryConfig>): number;
/**
 * Check if an HTTP status code should trigger a retry
 */
export declare function isRetryableStatus(status: number, retryableStatusCodes: number[]): boolean;
/**
 * Check if an error should trigger a retry
 */
export declare function isRetryableError(error: Error): boolean;
/**
 * Sleep for specified duration
 */
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=retry.d.ts.map