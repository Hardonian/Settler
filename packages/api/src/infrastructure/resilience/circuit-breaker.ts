/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by opening circuit after threshold failures
 */

import { CircuitBreaker, CircuitBreakerOptions } from 'opossum';
import { logError, logWarn, logInfo } from '../../utils/logger';

export interface CircuitBreakerConfig {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  name?: string;
}

const DEFAULT_CONFIG: Required<CircuitBreakerConfig> = {
  timeout: 30000, // 30 seconds
  errorThresholdPercentage: 50, // Open circuit after 50% failures
  resetTimeout: 60000, // Try again after 60 seconds
  name: 'circuit-breaker',
};

/**
 * Create a circuit breaker for a function
 */
export function createCircuitBreaker<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  config: CircuitBreakerConfig = {}
): CircuitBreaker<R> {
  const opts = { ...DEFAULT_CONFIG, ...config };
  
  const breakerOptions: CircuitBreakerOptions = {
    timeout: opts.timeout,
    errorThresholdPercentage: opts.errorThresholdPercentage,
    resetTimeout: opts.resetTimeout,
    name: opts.name,
  };

  const breaker = new CircuitBreaker(fn, breakerOptions);

  // Event handlers
  breaker.on('open', () => {
    logWarn('Circuit breaker opened', {
      name: opts.name,
      failures: breaker.stats.failures,
      fires: breaker.stats.fires,
    });
  });

  breaker.on('halfOpen', () => {
    logInfo('Circuit breaker half-open', {
      name: opts.name,
    });
  });

  breaker.on('close', () => {
    logInfo('Circuit breaker closed', {
      name: opts.name,
    });
  });

  breaker.on('reject', (error: Error) => {
    logWarn('Circuit breaker rejected request', {
      name: opts.name,
      error: error.message,
    });
  });

  breaker.on('failure', (error: Error) => {
    logError('Circuit breaker failure', error, {
      name: opts.name,
    });
  });

  return breaker;
}

/**
 * Circuit breaker for external API calls
 */
export function createApiCircuitBreaker<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  apiName: string
): CircuitBreaker<R> {
  return createCircuitBreaker(fn, {
    name: `api-${apiName}`,
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 60000,
  });
}
