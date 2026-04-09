/**
 * Resilience Utilities
 *
 * Comprehensive resilience patterns for production systems:
 * - Circuit breakers
 * - Retries with exponential backoff
 * - Timeouts
 * - Fallbacks
 */

export * from "./circuit-breaker";
export * from "./retry";
export * from "./timeout";
export * from "./fallback";

/**
 * Combined resilience wrapper
 *
 * Applies circuit breaker, retry, timeout, and fallback in sequence
 */
import { withCircuitBreaker, getCircuitBreaker } from "./circuit-breaker";
import { withRetry, RetryConfig } from "./retry";
import { withTimeout } from "./timeout";
import { withFallback, FallbackConfig } from "./fallback";

export interface ResilienceConfig<T> {
  circuitBreaker?: {
    serviceName: string;
    config?: Parameters<typeof getCircuitBreaker>[1];
  };
  retry?: Partial<RetryConfig>;
  timeout?: number;
  fallback?: FallbackConfig<T>;
}

/**
 * Execute function with full resilience stack
 */
export async function withResilience<T>(
  fn: () => Promise<T>,
  config: ResilienceConfig<T>
): Promise<T> {
  // Build the operation chain from innermost to outermost
  let operation: () => Promise<T> = fn;

  // Apply timeout first (innermost) - wraps the original function
  if (config.timeout) {
    const timeoutMs = config.timeout;
    const originalFn = operation;
    operation = () => withTimeout(originalFn, timeoutMs);
  }

  // Apply retry - wraps timeout if present, otherwise wraps original
  if (config.retry) {
    const retryConfig = config.retry;
    const originalFn = operation;
    operation = () => withRetry(originalFn, retryConfig);
  }

  // Apply circuit breaker - wraps retry/timeout/original
  if (config.circuitBreaker) {
    const serviceName = config.circuitBreaker.serviceName;
    const breakerConfig = config.circuitBreaker.config;
    const originalFn = operation;
    operation = () => withCircuitBreaker(serviceName, originalFn, breakerConfig);
  }

  // Apply fallback last (outermost) - wraps everything
  if (config.fallback) {
    return withFallback(operation, config.fallback);
  }

  return operation();
}
