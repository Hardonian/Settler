/**
 * Retry Logic with Exponential Backoff
 * Implements retry logic with jitter for external API calls
 */

import pRetry, { AbortError } from "p-retry";
import { logWarn } from "../../utils/logger";

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  onFailedAttempt?: (error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 10000,
  factor: 2,
  onFailedAttempt: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return pRetry(
    async () => {
      try {
        return await fn();
      } catch (error: unknown) {
        // Don't retry on certain errors
        if (error instanceof AbortError) {
          throw error;
        }

        const err = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        if (!isRetryableError(err)) {
          throw new AbortError(err);
        }

        throw err;
      }
    },
    {
      retries: opts.retries,
      minTimeout: opts.minTimeout,
      maxTimeout: opts.maxTimeout,
      factor: opts.factor,
      onFailedAttempt: (error) => {
        logWarn("Retry attempt failed", {
          attempt: error.attemptNumber,
          retriesLeft: error.retriesLeft,
          error: error.message,
        });
        opts.onFailedAttempt?.(error);
      },
    }
  );
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    "timeout",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
    "EAI_AGAIN",
  ];

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors are retryable
  if (retryableMessages.some((msg) => message.includes(msg) || name.includes(msg))) {
    return true;
  }

  // HTTP status codes that are retryable
  const statusCode = (error as any).statusCode || (error as any).status;
  if (statusCode) {
    // 429 (Too Many Requests), 503 (Service Unavailable), 502 (Bad Gateway), 504 (Gateway Timeout)
    return [429, 502, 503, 504].includes(statusCode);
  }

  return false;
}

/**
 * Add jitter to delay to prevent thundering herd
 */
export function addJitter(delay: number, jitterPercent: number = 0.1): number {
  const jitter = delay * jitterPercent * Math.random();
  return delay + jitter - delay * jitterPercent * 0.5;
}
