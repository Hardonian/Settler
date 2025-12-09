/**
 * Retry with Exponential Backoff
 * Standardized retry logic for external service calls
 */
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    retryableErrors?: Array<new (...args: unknown[]) => Error>;
    onRetry?: (attempt: number, error: Error) => void;
}
/**
 * Retry a function with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Retry for network errors
 */
export declare function retryNetworkOperation<T>(fn: () => Promise<T>): Promise<T>;
/**
 * Retry for database operations
 */
export declare function retryDatabaseOperation<T>(fn: () => Promise<T>): Promise<T>;
//# sourceMappingURL=retry-with-backoff.d.ts.map