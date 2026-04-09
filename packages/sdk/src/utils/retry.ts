import { SettlerError, NetworkError, RateLimitError } from "../errors";

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  multiplier?: number;
  /** Whether to retry on rate limit errors (default: true) */
  retryOnRateLimit?: boolean;
  /** Custom retry condition function */
  shouldRetry?: (error: SettlerError, attempt: number) => boolean;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
  retryOnRateLimit: true,
  shouldRetry: () => true,
};

/**
 * Calculates the delay for exponential backoff with jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a function with automatic retry and exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: SettlerError;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError =
        error instanceof SettlerError ? error : new NetworkError(String(error), error as Error);

      // Don't retry on last attempt
      if (attempt === retryConfig.maxRetries) {
        break;
      }

      // Check if we should retry this error
      const isRetryableError =
        lastError instanceof NetworkError ||
        (lastError instanceof RateLimitError && retryConfig.retryOnRateLimit) ||
        (lastError.statusCode !== undefined && lastError.statusCode >= 500);

      const shouldRetry = retryConfig.shouldRetry(lastError, attempt) && isRetryableError;

      if (!shouldRetry) {
        break;
      }

      // Calculate delay
      let delay: number;
      if (lastError instanceof RateLimitError && lastError.retryAfter) {
        delay = lastError.retryAfter * 1000; // Convert to milliseconds
      } else {
        delay = calculateDelay(
          attempt,
          retryConfig.initialDelay,
          retryConfig.maxDelay,
          retryConfig.multiplier
        );
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}
