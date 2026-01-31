/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelay?: number
  /** Maximum delay in ms between retries (default: 30000) */
  maxDelay?: number
  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number
  /** HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatusCodes?: number[]
  /** Custom function to determine if error should be retried */
  shouldRetry?: (error: Error, attempt: number) => boolean
}

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  /** Request timeout in ms (default: 30000) */
  timeout?: number
  /** Whether to abort the request on timeout (default: true) */
  abortOnTimeout?: boolean
}

/**
 * Fetch options with timeout and retry support
 */
export interface ResilientFetchOptions extends RequestInit {
  timeout?: number
  retry?: RetryConfig
  correlationId?: string
}

/**
 * Fetch response with additional metadata
 */
export interface FetchMetadata {
  /** Number of retry attempts made */
  attempts: number
  /** Total duration including retries */
  duration: number
  /** Correlation ID for tracing */
  correlationId?: string
}
