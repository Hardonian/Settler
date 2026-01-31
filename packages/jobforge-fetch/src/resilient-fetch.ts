import {
  createTimeoutError,
  createExternalServiceError,
  getCurrentCorrelationId,
} from '@jobforge/errors'
import type { ResilientFetchOptions, FetchMetadata } from './types'
import {
  DEFAULT_RETRY_CONFIG,
  calculateRetryDelay,
  isRetryableStatus,
  isRetryableError,
  sleep,
} from './retry'

const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Resilient fetch with timeout and retry support.
 * Automatically handles transient failures with exponential backoff.
 */
export async function resilientFetch(
  url: string | URL,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, retry, correlationId, ...fetchOptions } = options

  // Use provided correlation ID or get from context
  const requestCorrelationId = correlationId ?? getCurrentCorrelationId()

  // Add correlation ID to headers
  const headers = new Headers(fetchOptions.headers)
  if (requestCorrelationId) {
    headers.set('x-correlation-id', requestCorrelationId)
  }

  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retry }
  const startTime = Date.now()
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        ...fetchOptions,
        headers,
        timeout,
      })

      // Check if response status is retryable
      if (
        attempt <= retryConfig.maxRetries &&
        isRetryableStatus(response.status, retryConfig.retryableStatusCodes)
      ) {
        const shouldRetry = retryConfig.shouldRetry(new Error(`HTTP ${response.status}`), attempt)

        if (shouldRetry) {
          const delay = calculateRetryDelay(attempt, retryConfig)
          await sleep(delay)
          continue
        }
      }

      // Attach metadata to response
      Object.defineProperty(response, 'metadata', {
        value: {
          attempts: attempt,
          duration: Date.now() - startTime,
          correlationId: requestCorrelationId,
        } satisfies FetchMetadata,
        enumerable: false,
      })

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      const isLastAttempt = attempt > retryConfig.maxRetries
      const shouldRetry =
        !isLastAttempt && isRetryableError(lastError) && retryConfig.shouldRetry(lastError, attempt)

      if (!shouldRetry) {
        break
      }

      // Wait before retry
      const delay = calculateRetryDelay(attempt, retryConfig)
      await sleep(delay)
    }
  }

  // All retries exhausted
  throw createExternalServiceError(String(url), {
    correlationId: requestCorrelationId,
    cause: lastError ?? undefined,
  })
}

/**
 * Fetch with timeout support using AbortController
 */
async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit & { timeout: number }
): Promise<Response> {
  const { timeout, signal: externalSignal, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // Combine external signal with timeout signal
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort())
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createTimeoutError(`Request to ${String(url)}`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Type guard to check if response has metadata
 */
export function hasMetadata(
  response: Response
): response is Response & { metadata: FetchMetadata } {
  return 'metadata' in response
}
