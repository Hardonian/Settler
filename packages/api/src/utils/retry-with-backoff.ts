/**
 * Retry with Exponential Backoff
 * Standardized retry logic for external service calls
 */

import { logWarn, logInfo, logError } from "./logger";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: Array<new (...args: unknown[]) => Error>;
  onRetry?: (attempt: number, error: Error) => void;
  operationName?: string;
  onSuccess?: (attempt: number, durationMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "retryableErrors" | "onRetry" | "onSuccess">> & {
  retryableErrors: Array<new (...args: unknown[]) => Error>;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (attempt: number, durationMs: number) => void;
} = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [],
  operationName: "unnamed-operation",
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
  const startTime = Date.now();

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const attemptStart = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - attemptStart;

      if (attempt > 1 && opts.onSuccess) {
        opts.onSuccess(attempt, durationMs);
      } else if (attempt > 1) {
        logInfo(`Retry operation succeeded on attempt ${attempt}`, {
          operation: opts.operationName,
          attempt,
          durationMs,
        });
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const attemptDuration = Date.now() - attemptStart;

      // Check if error is retryable
      const isRetryable =
        opts.retryableErrors.length === 0 ||
        opts.retryableErrors.some((ErrorClass) => lastError instanceof ErrorClass);

      if (!isRetryable) {
        logError(`Non-retryable error in ${opts.operationName}`, {
          operation: opts.operationName,
          attempt,
          error: lastError.message,
          errorType: lastError.constructor.name,
        });
        throw lastError;
      }

      if (attempt === opts.maxAttempts) {
        logError(`All retry attempts exhausted for ${opts.operationName}`, {
          operation: opts.operationName,
          attempts: opts.maxAttempts,
          finalError: lastError.message,
          totalDurationMs: Date.now() - startTime,
        });
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
        logWarn(`Retrying operation ${opts.operationName}`, {
          operation: opts.operationName,
          attempt,
          maxAttempts: opts.maxAttempts,
          delayMs: delay,
          error: lastError.message,
          attemptDurationMs: attemptDuration,
          remainingAttempts: opts.maxAttempts - attempt,
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
    operationName: "network-operation",
    retryableErrors: [Error] as Array<new (...args: unknown[]) => Error>,
  });
}

/**
 * Retry for database operations
 */
export async function retryDatabaseOperation<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelayMs: 500,
    operationName: "database-operation",
    retryableErrors: [Error] as Array<new (...args: unknown[]) => Error>,
  });
}
