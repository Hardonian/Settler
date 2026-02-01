/**
 * Performance Guardrails
 * 
 * Implements timeouts, retries, circuit breakers, and rate limiting
 * to ensure system reliability and prevent cascading failures.
 */

import { logger } from '@/lib/observability/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export interface TimeoutOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
}

/**
 * Retry with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (_error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      const errorMessage = lastError.message;
      const isRetryable = retryableErrors.some((retryableError) =>
        errorMessage.includes(retryableError)
      );

      if (!isRetryable) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      await logger.warn('Retrying after error', {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: errorMessage,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const { timeoutMs = 30000, signal } = options;

  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Operation aborted'));
        });
      }
    }),
  ]);
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailureTime: number | null = null;

  constructor(
    private options: CircuitBreakerOptions = {},
    private name: string = 'circuit-breaker'
  ) {
    const {
      failureThreshold = 5,
      successThreshold = 2,
      resetTimeout = 60000,
    } = options;

    this.options = {
      failureThreshold,
      successThreshold,
      resetTimeout,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open' && this.lastFailureTime) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= (this.options.resetTimeout || 60000)) {
        this.state = 'half-open';
        this.successes = 0;
        await logger.info('Circuit breaker entering half-open state', {
          name: this.name,
        });
      } else {
        throw new Error(
          `Circuit breaker is open. Retry after ${Math.ceil(
            ((this.options.resetTimeout || 60000) - timeSinceFailure) / 1000
          )} seconds`
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (_error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= (this.options.successThreshold || 2)) {
        this.state = 'closed';
        this.successes = 0;
        logger.info('Circuit breaker closed (recovered)', {
          name: this.name,
        });
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= (this.options.failureThreshold || 5)) {
      this.state = 'open';
      logger.error('Circuit breaker opened', {
        name: this.name,
        failures: this.failures,
      });
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number,
    private name: string = 'rate-limiter'
  ) {}

  async checkLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => time > windowStart);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      if (!oldestRequest) {
        throw new Error('Rate limit exceeded');
      }
      const waitTime = oldestRequest + this.windowMs - now;

      await logger.warn('Rate limit exceeded', {
        name: this.name,
        maxRequests: this.maxRequests,
        windowMs: this.windowMs,
        waitTime,
      });

      throw new Error(
        `Rate limit exceeded. Retry after ${Math.ceil(waitTime / 1000)} seconds`
      );
    }

    this.requests.push(now);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    this.requests = this.requests.filter((time) => time > windowStart);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

/**
 * Combined guardrails: retry + timeout + circuit breaker
 */
export async function withGuardrails<T>(
  fn: () => Promise<T>,
  options: {
    retry?: RetryOptions;
    timeout?: TimeoutOptions;
    circuitBreaker?: CircuitBreaker;
  } = {}
): Promise<T> {
  const { retry, timeout, circuitBreaker } = options;

  let operation = fn;

  // Apply circuit breaker
  if (circuitBreaker) {
    operation = () => circuitBreaker.execute(fn);
  }

  // Apply timeout
  if (timeout) {
    const timeoutFn = operation;
    operation = () => withTimeout(timeoutFn, timeout);
  }

  // Apply retry
  if (retry) {
    const retryFn = operation;
    operation = () => withRetry(retryFn, retry);
  }

  return operation();
}
