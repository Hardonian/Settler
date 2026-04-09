/**
 * Safe fetch wrapper that never throws unhandled errors
 * Returns typed error objects instead
 */

export interface SafeFetchResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
}

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Safe fetch that returns typed result objects
 */
export async function safeFetch<T = unknown>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const { timeout = 30000, ...fetchOptions } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      return {
        success: false,
        error: {
          message: errorMessage,
          status: response.status,
          code: response.statusText,
        },
      };
    }

    const data = (await response.json()) as T;

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: {
            message: "Request timeout",
            code: "TIMEOUT",
          },
        };
      }

      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      };
    }

    return {
      success: false,
      error: {
        message: "Unknown error occurred",
        code: "UNKNOWN",
      },
    };
  }
}

/**
 * Mask sensitive tokens (show last 4 only)
 */
export function maskToken(token: string): string {
  if (!token || token.length < 4) {
    return "****";
  }
  return `****${token.slice(-4)}`;
}

/**
 * Check if a string contains secrets (for logging)
 */
export function containsSecrets(str: string): boolean {
  const secretPatterns = [
    /sk_live_/i,
    /sk_test_/i,
    /pk_live_/i,
    /pk_test_/i,
    /whsec_/i,
    /Bearer\s+[A-Za-z0-9]{20,}/i,
    /api[_-]?key\s*[:=]\s*[A-Za-z0-9]{20,}/i,
  ];

  return secretPatterns.some((pattern) => pattern.test(str));
}

/**
 * Sanitize string for logging (remove secrets)
 */
export function sanitizeForLogging(str: string): string {
  if (!containsSecrets(str)) {
    return str;
  }

  // Mask API keys
  let sanitized = str.replace(
    /(sk_live_|sk_test_|pk_live_|pk_test_|whsec_)([A-Za-z0-9]+)/gi,
    (match, prefix) => `${prefix}${maskToken(match.slice(prefix.length))}`
  );

  // Mask Bearer tokens
  sanitized = sanitized.replace(
    /Bearer\s+([A-Za-z0-9]{20,})/gi,
    (_match, token) => `Bearer ${maskToken(token)}`
  );

  // Mask API key patterns
  sanitized = sanitized.replace(/api[_-]?key\s*[:=]\s*([A-Za-z0-9]{20,})/gi, (match, key) =>
    match.replace(key, maskToken(key))
  );

  return sanitized;
}
