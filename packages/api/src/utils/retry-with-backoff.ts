/**
 * Retry with Exponential Backoff
 * Standardized retry logic for external service calls
 */

import { logWarn } from "./logger";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: Array<new (...args: unknown[]) => Error>;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "retryableErrors" | "onRetry">> & {
  retryableErrors: Array<new (...args: unknown[]) => Error>;
  onRetry?: (attempt: number, error: Error) => void;
} = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [],
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable =
        opts.retryableErrors.length === 0 ||
        opts.retryableErrors.some((ErrorClass) => lastError instanceof ErrorClass);

      if (!isRetryable || attempt === opts.maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );

      if (opts.onRetry) {
        opts.onRetry(attempt, lastError);
      } else {
        logWarn("Retrying operation", {
          attempt,
          maxAttempts: opts.maxAttempts,
          delayMs: delay,
          error: lastError.message,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Retry for network errors
 */
export async function retryNetworkOperation<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelayMs: 1000,
    retryableErrors: [Error] as Array<new (...args: unknown[]) => Error>, // Retry on any error for network operations
  });
}

/**
 * Retry for database operations
 */
export async function retryDatabaseOperation<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelayMs: 500,
    retryableErrors: [Error] as Array<new (...args: unknown[]) => Error>,
  });
}
