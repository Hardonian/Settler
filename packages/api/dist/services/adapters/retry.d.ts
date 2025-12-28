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
interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrors: string[];
}
/**
 * Execute function with retry logic
 */
export declare function executeWithRetry<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
/**
 * Execute function with retry and circuit breaker
 */
export declare class CircuitBreaker {
    private threshold;
    private timeoutMs;
    private failures;
    private lastFailureTime;
    private state;
    constructor(threshold?: number, timeoutMs?: number);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    getState(): 'closed' | 'open' | 'half-open';
    reset(): void;
}
export {};
//# sourceMappingURL=retry.d.ts.map