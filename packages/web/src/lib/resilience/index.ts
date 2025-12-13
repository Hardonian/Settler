/**
 * Resilience Utilities
 * 
 * Comprehensive resilience patterns for production systems:
 * - Circuit breakers
 * - Retries with exponential backoff
 * - Timeouts
 * - Fallbacks
 */

export * from './circuit-breaker';
export * from './retry';
export * from './timeout';
export * from './fallback';

/**
 * Combined resilience wrapper
 * 
 * Applies circuit breaker, retry, timeout, and fallback in sequence
 */
import { withCircuitBreaker, getCircuitBreaker } from './circuit-breaker';
import { withRetry, RetryConfig } from './retry';
import { withTimeout } from './timeout';
import { withFallback, FallbackConfig } from './fallback';

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
  let operation = fn;
  
  // Apply timeout first (innermost)
  if (config.timeout) {
    operation = () => withTimeout(operation, config.timeout!);
  }
  
  // Apply retry
  if (config.retry) {
    const retryFn = operation;
    operation = () => withRetry(retryFn, config.retry);
  }
  
  // Apply circuit breaker
  if (config.circuitBreaker) {
    const breakerFn = operation;
    operation = () => withCircuitBreaker(
      config.circuitBreaker!.serviceName,
      breakerFn,
      config.circuitBreaker.config
    );
  }
  
  // Apply fallback last (outermost)
  if (config.fallback) {
    return withFallback(operation, config.fallback);
  }
  
  return operation();
}
