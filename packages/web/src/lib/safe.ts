/**
 * Safe Data Layer
 * 
 * Provides safe async wrappers that never throw during render.
 * All errors are classified and returned as result objects.
 */

export type ErrorCode = 
  | 'ENV_MISSING'
  | 'AUTH_MISSING'
  | 'NETWORK_ERROR'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface SafeResult<T> {
  ok: true;
  data: T;
}

export interface SafeError {
  ok: false;
  error: string;
  code: ErrorCode;
  details?: unknown;
}

export type SafeAsyncResult<T> = SafeResult<T> | SafeError;

/**
 * Wrap an async function to return a safe result object instead of throwing
 */
export async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<SafeAsyncResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    return classifyError(error);
  }
}

/**
 * Wrap a sync function to return a safe result object instead of throwing
 */
export function safeSync<T>(fn: () => T): SafeResult<T> | SafeError {
  try {
    const data = fn();
    return { ok: true, data };
  } catch (error) {
    return classifyError(error);
  }
}

/**
 * Classify errors into known categories
 */
function classifyError(error: unknown): SafeError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for environment variable errors
  if (
    errorMessage.includes('NEXT_PUBLIC_') ||
    errorMessage.includes('SUPABASE_') ||
    errorMessage.includes('DATABASE_URL') ||
    errorMessage.includes('missing environment variable')
  ) {
    return {
      ok: false,
      error: errorMessage,
      code: 'ENV_MISSING',
      details: error,
    };
  }
  
  // Check for auth errors
  if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('not authenticated') ||
    errorMessage.includes('session')
  ) {
    return {
      ok: false,
      error: errorMessage,
      code: 'AUTH_MISSING',
      details: error,
    };
  }
  
  // Check for network errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('timeout')
  ) {
    return {
      ok: false,
      error: errorMessage,
      code: 'NETWORK_ERROR',
      details: error,
    };
  }
  
  // Check for database errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('prisma') ||
    errorMessage.includes('postgres') ||
    errorMessage.includes('connection')
  ) {
    return {
      ok: false,
      error: errorMessage,
      code: 'DATABASE_ERROR',
      details: error,
    };
  }
  
  // Check for validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required')
  ) {
    return {
      ok: false,
      error: errorMessage,
      code: 'VALIDATION_ERROR',
      details: error,
    };
  }
  
  // Unknown error
  return {
    ok: false,
    error: errorMessage,
    code: 'UNKNOWN_ERROR',
    details: error,
  };
}

/**
 * Check if a result is an error
 */
export function isError<T>(result: SafeAsyncResult<T>): result is SafeError {
  return !result.ok;
}

/**
 * Check if a result is successful
 */
export function isSuccess<T>(result: SafeAsyncResult<T>): result is SafeResult<T> {
  return result.ok;
}

/**
 * Extract data from result, throwing if error
 * Use only when you're certain the result is successful
 */
export function unwrap<T>(result: SafeAsyncResult<T>): T {
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data;
}

/**
 * Extract data from result with fallback
 */
export function unwrapOr<T>(result: SafeAsyncResult<T>, fallback: T): T {
  if (!result.ok) {
    return fallback;
  }
  return result.data;
}
