/**
 * Result Types - Discriminated Unions for Error Handling
 *
 * Scale-Readiness: Railway-oriented programming for predictable error handling at scale
 *
 * WHY THIS HELPS AT SCALE:
 * - No more try/catch hell - errors are values
 * - Type-safe error handling - exhaustive pattern matching
 * - Composable error handling - chain operations safely
 * - Better telemetry - structured error information
 * - Prevents silent failures - all errors must be handled
 *
 * Usage:
 * ```ts
 * function processPayment(amount: number): Result<Payment, PaymentError> {
 *   if (amount <= 0) {
 *     return err({ code: 'INVALID_AMOUNT', message: 'Amount must be positive' });
 *   }
 *   return ok({ id: '123', amount });
 * }
 *
 * const result = processPayment(100);
 * if (result.success) {
 *   console.log('Payment:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */

/**
 * Success result
 */
export interface Success<T> {
  success: true;
  data: T;
}

/**
 * Error result with structured error information
 */
export interface Failure<E> {
  success: false;
  error: E;
}

/**
 * Result type - discriminated union for success/failure
 * Use this instead of throwing exceptions for better type safety
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Create a success result
 */
export function ok<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * Check if result is successful
 * Type guard for narrowing Result types
 */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Check if result is an error
 * Type guard for narrowing Result types
 */
export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Map over the success value
 * Leaves errors unchanged
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Map over the error value
 * Leaves success unchanged
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chain operations that return Results
 * Short-circuits on first error
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

/**
 * Unwrap success value or throw error
 * Use sparingly - prefer pattern matching
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwrap success value or return default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Structured application error
 * Use this for domain errors that need context
 */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
}

/**
 * Create an application error
 */
export function appError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error
): AppError {
  return { code, message, details, cause };
}

/**
 * Common error codes for consistency
 * Extend this enum as needed for your domain
 */
export const ErrorCode = {
  // Validation errors (4xx)
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',

  // System errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Business logic errors
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FEATURE_DISABLED: 'FEATURE_DISABLED',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Convert an unknown error to AppError
 * Use in catch blocks to normalize errors
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return appError(
      ErrorCode.INTERNAL_ERROR,
      error.message,
      { name: error.name },
      error
    );
  }

  return appError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    { error: String(error) }
  );
}

/**
 * Type guard for AppError
 */
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}

/**
 * Async Result - for operations that can fail
 */
export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>;

/**
 * Wrap an async operation in a Result
 * Catches errors and converts them to Result
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): AsyncResult<T, AppError> {
  try {
    const data = await fn();
    return ok(data);
  } catch (_error) {
    return err(toAppError(error));
  }
}

/**
 * Wrap a sync operation in a Result
 * Catches errors and converts them to Result
 */
export function tryCatchSync<T>(
  fn: () => T
): Result<T, AppError> {
  try {
    const data = fn();
    return ok(data);
  } catch (_error) {
    return err(toAppError(error));
  }
}
