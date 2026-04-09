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

import { logInfo, logWarn } from "../../utils/logger";

interface RetryConfig {
  maxRetries: number; // Default: 3
  initialDelayMs: number; // Default: 1000
  maxDelayMs: number; // Default: 30000
  backoffMultiplier: number; // Default: 2
  retryableErrors: string[]; // Error patterns that should be retried
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "rate limit",
    "timeout",
    "temporary",
    "retry",
  ],
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  return config.retryableErrors.some(
    (pattern) =>
      errorMessage.includes(pattern.toLowerCase()) || errorName.includes(pattern.toLowerCase())
  );
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Execute function with retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(lastError, finalConfig)) {
        throw lastError; // Don't retry non-retryable errors
      }

      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, finalConfig);
      logInfo(`[RetryLogic] Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        delay,
        errorMessage: lastError.message,
      });
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw lastError || new Error("Retry logic exhausted");
}

/**
 * Execute function with retry and circuit breaker
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: Date | null = null;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private threshold: number = 5,
    private timeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit breaker state
    if (this.state === "open") {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime.getTime() > this.timeoutMs) {
        this.state = "half-open";
        logInfo("[CircuitBreaker] Moving to half-open state");
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();

      // Success - reset failures if in half-open state
      if (this.state === "half-open") {
        this.state = "closed";
        this.failures = 0;
        logInfo("[CircuitBreaker] Circuit breaker closed");
      } else {
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = new Date();

      // Open circuit if threshold exceeded
      if (this.failures >= this.threshold) {
        this.state = "open";
        logWarn("[CircuitBreaker] Circuit breaker opened", {
          failures: this.failures,
          threshold: this.threshold,
        });
      }

      throw error;
    }
  }

  getState(): "closed" | "open" | "half-open" {
    return this.state;
  }

  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.lastFailureTime = null;
  }
}
