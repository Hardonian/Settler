/**
 * Database Retry Logic
 * 
 * Implements exponential backoff retry for database operations.
 * Critical for 24/7 operations to handle transient failures.
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 100, // ms
  maxDelay: 5000, // ms
  backoffMultiplier: 2,
  retryableErrors: [
    'P1001', // Connection error
    'P1008', // Operation timed out
    'P1017', // Server closed connection
    'P2024', // Timed out fetching new connection
    'P2034', // Transaction failed due to a write conflict
  ],
};

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const errorMessage = error.message;
  const errorCode = (error as any).code || '';
  
  return (
    DEFAULT_OPTIONS.retryableErrors.some((code) => errorCode.includes(code)) ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ETIMEDOUT')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a database operation with exponential backoff
 */
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let currentDelay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (_error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Wait before retrying
      await delay(currentDelay);
      currentDelay = Math.min(
        currentDelay * config.backoffMultiplier,
        config.maxDelay
      );

      console.warn(`Database operation failed, retrying (attempt ${attempt + 1}/${config.maxRetries}):`, {
        error: lastError.message,
        delay: currentDelay,
      });
    }
  }

  // All retries exhausted
  throw new Error(
    `Database operation failed after ${config.maxRetries} retries: ${lastError?.message}`
  );
}

/**
 * Wrapper for Prisma operations with automatic retry
 */
export function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryDbOperation(operation, options);
}
