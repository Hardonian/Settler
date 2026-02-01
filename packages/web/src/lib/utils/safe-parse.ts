/**
 * Safe JSON Parse Utilities
 * Prevents runtime crashes from malformed JSON
 *
 * Usage:
 * - Use safeJsonParse() for nullable results with error logging
 * - Use safeJsonParseWithDefault() when you need a fallback value
 * - Use safeJsonParseOrThrow() when you want explicit error handling
 */

export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * Safely parse JSON string, returns null on failure
 * Logs errors for debugging
 */
export function safeJsonParse<T = unknown>(
  text: string,
  context?: string
): T | null {
  try {
    return JSON.parse(text) as T;
  } catch (_error) {
    const parseError = error instanceof Error ? error : new Error(String(error));
    console.warn(
      `[SafeParse] JSON parse failed in ${context || "unknown"}:`,
      parseError.message,
      `Text preview: ${text.substring(0, 100)}`
    );
    return null;
  }
}

/**
 * Safely parse JSON string with a default fallback value
 */
export function safeJsonParseWithDefault<T>(
  text: string,
  defaultValue: T,
  context?: string
): T {
  const result = safeJsonParse<T>(text, context);
  return result ?? defaultValue;
}

/**
 * Safely parse JSON string, returns result object with success flag
 * Useful when you need to distinguish between parse failures and null values
 */
export function safeJsonParseResult<T = unknown>(
  text: string,
  context?: string
): SafeParseResult<T> {
  try {
    const data = JSON.parse(text) as T;
    return { success: true, data };
  } catch (_error) {
    const parseError = error instanceof Error ? error : new Error(String(error));
    console.warn(
      `[SafeParse] JSON parse failed in ${context || "unknown"}:`,
      parseError.message,
      `Text preview: ${text.substring(0, 100)}`
    );
    return {
      success: false,
      error: parseError,
    };
  }
}

/**
 * Parse JSON and throw descriptive error on failure
 * Use when you need to fail fast with clear error messages
 */
export function safeJsonParseOrThrow<T = unknown>(
  text: string,
  context: string
): T {
  try {
    return JSON.parse(text) as T;
  } catch (_error) {
    const parseError = error instanceof Error ? error : new Error(String(error));
    console.error(
      `[SafeParse] Critical JSON parse failure in ${context}:`,
      parseError.message,
      `Text preview: ${text.substring(0, 100)}`
    );
    throw new Error(
      `Failed to parse JSON in ${context}: ${parseError.message}`
    );
  }
}

/**
 * Safely stringify JSON, returns fallback string on failure
 */
export function safeJsonStringify<T = unknown>(
  value: T,
  fallback: string = "{}",
  context?: string
): string {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    const stringifyError =
      error instanceof Error ? error : new Error(String(error));
    console.warn(
      `[SafeParse] JSON stringify failed in ${context || "unknown"}:`,
      stringifyError.message
    );
    return fallback;
  }
}
