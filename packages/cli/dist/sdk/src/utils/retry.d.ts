import { SettlerError } from "../errors";
export interface RetryConfig {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Initial delay in milliseconds (default: 1000) */
    initialDelay?: number;
    /** Maximum delay in milliseconds (default: 30000) */
    maxDelay?: number;
    /** Multiplier for exponential backoff (default: 2) */
    multiplier?: number;
    /** Whether to retry on rate limit errors (default: true) */
    retryOnRateLimit?: boolean;
    /** Custom retry condition function */
    shouldRetry?: (error: SettlerError, attempt: number) => boolean;
}
/**
 * Executes a function with automatic retry and exponential backoff
 */
export declare function withRetry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>;
//# sourceMappingURL=retry.d.ts.map