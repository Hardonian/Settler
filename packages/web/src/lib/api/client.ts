/**
 * Defensive API Client
 * 
 * Wraps fetch with retries, timeouts, error handling, and telemetry.
 */

import { logger } from '../logging/logger';
import { diagnostics } from '../diagnostics';
import { analytics } from '../analytics';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryOn?: number[]; // HTTP status codes to retry on
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second
const DEFAULT_RETRY_ON = [408, 429, 500, 502, 503, 504];

/**
 * Fetch with timeout
 */
function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    fetch(url, {
      ...options,
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Exponential backoff delay
 */
function getRetryDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Defensive fetch with retries and error handling
 */
export async function defensiveFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const startTime = Date.now();
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
  const retryOn = options.retryOn ?? DEFAULT_RETRY_ON;
  
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      const duration = Date.now() - startTime;

      // Track slow responses
      if (duration > 1000) {
        diagnostics.trackSlowResponse(url, duration);
      }

      // Track successful request
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`API request: ${url}`, {
          status: response.status,
          duration,
          attempt,
        });
      }

      // If response is not ok and we should retry
      if (!response.ok && retryOn.includes(response.status) && attempt < retries) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        options.onRetry?.(attempt + 1, error);
        
        await new Promise((resolve) =>
          setTimeout(resolve, getRetryDelay(attempt, retryDelay))
        );
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      // Track fetch failure
      diagnostics.trackFetchFailure(url, lastError, {
        attempt,
        duration,
      });

      // If we have retries left and error is retryable
      if (attempt < retries && !(error instanceof DOMException && error.name === 'AbortError')) {
        options.onRetry?.(attempt + 1, lastError);
        
        await new Promise((resolve) =>
          setTimeout(resolve, getRetryDelay(attempt, retryDelay))
        );
        continue;
      }

      // Final attempt failed
      logger.error(`API request failed after ${attempt + 1} attempts: ${url}`, lastError, {
        duration,
        attempt,
      });

      throw lastError;
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * Fetch JSON with error handling
 */
export async function fetchJSON<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await defensiveFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  try {
    return await response.json();
  } catch (error) {
    logger.error(`Failed to parse JSON response from ${url}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error('Invalid JSON response');
  }
}

/**
 * Fetch with fallback data
 */
export async function fetchWithFallback<T>(
  url: string,
  fallback: T,
  options: FetchOptions = {}
): Promise<T> {
  try {
    return await fetchJSON<T>(url, options);
  } catch (error) {
    logger.warn(`Using fallback data for ${url}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    analytics.trackEvent('api_fallback_used', { url });
    return fallback;
  }
}
