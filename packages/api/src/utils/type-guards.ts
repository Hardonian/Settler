/**
 * Type assertion utilities for safe type guards and validation
 */

/**
 * Safely cast unknown to object
 */
export function toObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/**
 * Safely cast unknown to array
 */
export function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Safely asserts that a value is not undefined
 */
export function assertDefined<T>(value: T | undefined, errorMessage?: string): asserts value is T {
  if (value === undefined) {
    throw new Error(errorMessage || `Expected value to be defined, but received undefined`);
  }
}

/**
 * Type guard to check if a value is defined
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Safely extract string from optional string value
 */
export function getString(value: string | undefined): string {
  if (value === undefined) {
    throw new Error("Expected string but received undefined");
  }
  return value;
}

/**
 * Type guard for Next.js route parameters
 */
export function getRouteParam<T extends string>(param: T | undefined, paramName: string): string {
  if (param === undefined) {
    throw new Error(`Route parameter "${paramName}" is required but not provided`);
  }
  return param;
}

/**
 * Safe error handler that ensures error variable is defined
 */
export function safeErrorHandler(errorHandler: (error: Error) => void): (error: unknown) => void {
  return (error: unknown) => {
    if (error instanceof Error) {
      errorHandler(error);
    } else {
      errorHandler(new Error(String(error)));
    }
  };
}

/**
 * Type guard to check if object has required string fields
 */
export function hasRequiredStringFields(obj: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => typeof obj[field] === "string");
}

/**
 * Type guard to check if object has required number fields
 */
export function hasRequiredNumberFields(obj: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => typeof obj[field] === "number");
}
