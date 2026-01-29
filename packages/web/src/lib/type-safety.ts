/**
 * Type Safety Utilities
 *
 * Comprehensive type guard functions, error handlers, and validation helpers
 * to eliminate common TypeScript errors and ensure type safety consistency
 */

// ==================== TYPE GUARDS ====================

/**
 * Type guard to check if value is not null or undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value != null;
}

/**
 * Type guard to check if value is defined (not undefined)
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Type guard to check if string is not empty
 */
export function isNotEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard to check if array has items
 */
export function hasItems<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Type guard to check if object has property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return obj != null && typeof obj === "object" && prop in obj;
}

/**
 * Type guard to check if value is a non-null object
 */
export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Type guard to check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type guard to check if value is a function
 */
export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === "function";
}

// ==================== ERROR TYPES ====================

/**
 * Standardized error types for consistent error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly resource?: string
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(
    message: string,
    public readonly resource?: string
  ) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly params?: unknown[]
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public readonly service?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

// ==================== ERROR HANDLERS ====================

/**
 * Standardized error context type
 */
export interface ErrorContext {
  field?: string;
  resource?: string;
  action?: string;
  userId?: string;
  tenantId?: string;
  requestId?: string;
}

/**
 * Standard error handler with proper typing
 */
export function handleError(
  error: unknown,
  context?: ErrorContext
): {
  error: Error;
  type: string;
  context: ErrorContext;
  isOperational: boolean;
} {
  // Default context
  const defaultContext: ErrorContext = {
    requestId: crypto.randomUUID?.() || "unknown",
  };

  // Handle known error types
  if (error instanceof Error) {
    return {
      error,
      type: error.name || "Error",
      context: { ...defaultContext, ...context },
      isOperational:
        error.name === "ValidationError" ||
        error.name === "AuthenticationError" ||
        error.name === "AuthorizationError" ||
        error.name === "NotFoundError",
    };
  }

  // Handle unknown errors
  const unknownError = new Error("Unknown error occurred");
  return {
    error: unknownError,
    type: "UnknownError",
    context: { ...defaultContext, ...context },
    isOperational: false,
  };
}

/**
 * Async error wrapper for promises
 */
export async function handleAsyncError<T>(
  promise: Promise<T>,
  context?: ErrorContext
): Promise<{ data?: T; error?: Error; type: string; context: ErrorContext }> {
  try {
    const data = await promise;
    return { data, error: undefined, type: "success", context: context || {} };
  } catch (error) {
    const handled = handleError(error, context);
    return { data: undefined, error: handled.error, type: handled.type, context: handled.context };
  }
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T = unknown>(
  jsonString: string,
  fallbackValue: T = {} as T
): { data?: T; error?: Error } {
  try {
    const data = JSON.parse(jsonString) as T;
    return { data };
  } catch (error) {
    const parseError = error instanceof Error ? error : new Error("JSON parse failed");
    return { error: parseError };
  }
}

// ==================== VALIDATION HELPERS ====================

/**
 * Required field validator
 */
export function validateRequired(value: unknown, fieldName: string, context?: ErrorContext): void {
  if (value == null || value === "") {
    throw new ValidationError(`${fieldName} is required`, fieldName, "REQUIRED");
  }
}

/**
 * String field validator
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: { minLength?: number; maxLength?: number; pattern?: RegExp } = {},
  context?: ErrorContext
): string {
  if (value == null) {
    throw new ValidationError(`${fieldName} is required`, fieldName, "REQUIRED");
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, "INVALID_TYPE");
  }

  if (options.minLength && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`,
      fieldName,
      "MIN_LENGTH"
    );
  }

  if (options.maxLength && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      fieldName,
      "MAX_LENGTH"
    );
  }

  if (options.pattern && !options.pattern.test(value)) {
    throw new ValidationError(`${fieldName} format is invalid`, fieldName, "INVALID_FORMAT");
  }

  return value;
}

/**
 * Email validator
 */
export function validateEmail(value: unknown, fieldName: string, context?: ErrorContext): string {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateString(value, fieldName, { pattern: emailPattern }, context);
}

/**
 * Number field validator
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number; integer?: boolean } = {},
  context?: ErrorContext
): number {
  if (value == null) {
    throw new ValidationError(`${fieldName} is required`, fieldName, "REQUIRED");
  }

  const numValue = typeof value === "number" ? value : Number(value);

  if (isNaN(numValue)) {
    throw new ValidationError(`${fieldName} must be a number`, fieldName, "INVALID_TYPE");
  }

  if (options.min !== undefined && numValue < options.min) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.min}`,
      fieldName,
      "MIN_VALUE"
    );
  }

  if (options.max !== undefined && numValue > options.max) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.max}`,
      fieldName,
      "MAX_VALUE"
    );
  }

  if (options.integer && !Number.isInteger(numValue)) {
    throw new ValidationError(`${fieldName} must be an integer`, fieldName, "INTEGER_REQUIRED");
  }

  return numValue;
}

/**
 * Array validator
 */
export function validateArray<T>(
  value: unknown,
  fieldName: string,
  options: { minLength?: number; maxLength?: number } = {},
  context?: ErrorContext
): T[] {
  if (value == null) {
    throw new ValidationError(`${fieldName} is required`, fieldName, "REQUIRED");
  }

  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName, "INVALID_TYPE");
  }

  if (options.minLength && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must have at least ${options.minLength} items`,
      fieldName,
      "MIN_LENGTH"
    );
  }

  if (options.maxLength && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must have at most ${options.maxLength} items`,
      fieldName,
      "MAX_LENGTH"
    );
  }

  return value as T[];
}

// ==================== API ROUTE HELPERS ====================

/**
 * Type-safe route parameter extraction
 */
export function getRouteParam<T extends string = string>(
  request: Request,
  paramName: string,
  defaultValue?: T
): T {
  const url = new URL(request.url);
  const value = url.searchParams.get(paramName);

  if (value === null) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new ValidationError(
      `Missing required parameter: ${paramName}`,
      paramName,
      "MISSING_PARAM"
    );
  }

  return value as T;
}

/**
 * Safe header extraction with typing
 */
export function getHeader<T extends string = string>(
  request: Request,
  headerName: string,
  defaultValue?: T
): T | null {
  const value = request.headers.get(headerName);
  return (value as T) || defaultValue || null;
}

/**
 * Type-safe request body parsing
 */
export async function parseRequestBody<T extends Record<string, unknown>>(
  request: Request
): Promise<{ data?: T; error?: Error }> {
  try {
    const body = await request.json();
    return { data: body as T };
  } catch (error) {
    const parseError = error instanceof Error ? error : new Error("Invalid JSON body");
    return { error: parseError };
  }
}

/**
 * Validate request body with schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: {
    [K in keyof T]: {
      required?: boolean;
      type: "string" | "number" | "boolean" | "object" | "array";
      validate?: (value: unknown) => void;
    };
  }
): T {
  const result = {} as T;
  const schemaRules = schema as Record<
    string,
    {
      required?: boolean;
      type: "string" | "number" | "boolean" | "object" | "array";
      validate?: (value: unknown) => void;
    }
  >;

  for (const [key, fieldRules] of Object.entries(schemaRules)) {
    const fieldKey = key as keyof T;
    let value = (body as any)?.[key];

    if (fieldRules.required && (value == null || value === "")) {
      throw new ValidationError(`Field ${key} is required`, key, "REQUIRED");
    }

    if (value != null) {
      switch (fieldRules.type) {
        case "string":
          value = validateString(value, key);
          break;
        case "number":
          value = validateNumber(value, key);
          break;
        case "boolean":
          if (!isBoolean(value)) {
            throw new ValidationError(`Field ${key} must be a boolean`, key, "INVALID_TYPE");
          }
          break;
        case "object":
          if (!isNonNullObject(value)) {
            throw new ValidationError(`Field ${key} must be an object`, key, "INVALID_TYPE");
          }
          break;
        case "array":
          if (!Array.isArray(value)) {
            throw new ValidationError(`Field ${key} must be an array`, key, "INVALID_TYPE");
          }
          break;
      }

      if (fieldRules.validate) {
        fieldRules.validate(value);
      }
    }

    (result as any)[fieldKey] = value;
  }

  return result;
}

// ==================== RESULT TYPES ====================

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

/**
 * Create a successful result
 */
export function createSuccess<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function createError<E extends Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Unwrap result with type safety
 */
export function unwrapResult<T, E extends Error>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

// ==================== ASYNC UTILITIES ====================

/**
 * Safe async operation with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Operation failed");
  }
}

/**
 * Retry async operation with exponential backoff
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2 } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Operation failed");

      if (attempt === maxAttempts) {
        break;
      }

      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// ==================== MISCELLANEOUS ====================

/**
 * Type-safe object partial update
 */
export function createUpdate<T extends Record<string, unknown>>(
  updates: Partial<T>
): { data: Partial<T>; validate: () => T } {
  return {
    data: updates,
    validate: () => {
      // This would be implemented based on specific validation needs
      return updates as T;
    },
  };
}

/**
 * Get nested property safely
 */
export function getSafe<T>(obj: unknown, path: string[], fallbackValue: T): T {
  try {
    return path.reduce((current: unknown, key: string) => {
      if (current && typeof current === "object" && key in current) {
        return (current as any)[key];
      }
      return fallbackValue;
    }, obj) as T;
  } catch {
    return fallbackValue;
  }
}

/**
 * Type assertion with runtime check
 */
export function assertType<T>(
  value: unknown,
  predicate: (v: unknown) => v is T,
  errorMessage?: string
): asserts value is T {
  if (!predicate(value)) {
    throw new Error(errorMessage || `Type assertion failed`);
  }
}
