/**
 * Type assertion utilities for safe type guards and validation
 * Reusable type guards and assertion functions for consistent type safety
 */

// ============================================================================
// Object/Array Type Guards
// ============================================================================

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
 * Type guard to check if value is a plain object (not array, not null)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Safely get nested property using path string (e.g., "user.profile.name")
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Safely set nested property using path string
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    current[lastPart] = value;
  }
}

// ============================================================================
// Type Assertion Functions
// ============================================================================

/**
 * Safely asserts that a value is not undefined
 */
export function assertDefined<T>(value: T | undefined, errorMessage?: string): asserts value is T {
  if (value === undefined) {
    throw new Error(errorMessage || `Expected value to be defined, but received undefined`);
  }
}

/**
 * Assert value is not null or undefined
 */
export function assertNonNullable<T>(
  value: T | null | undefined,
  errorMessage?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(errorMessage || `Expected value to be non-null, but received ${value}`);
  }
}

/**
 * Type guard to check if a value is defined
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Type guard to check if value is not null
 */
export function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type guard to check if value is defined and not null
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ============================================================================
// String/Number Helpers
// ============================================================================

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
 * Safely extract string or return default
 */
export function getStringOrDefault(value: string | undefined, defaultValue: string): string {
  return value ?? defaultValue;
}

/**
 * Safely extract number from optional number value
 */
export function getNumber(value: number | undefined): number {
  if (value === undefined) {
    throw new Error("Expected number but received undefined");
  }
  return value;
}

/**
 * Safely extract number or return default
 */
export function getNumberOrDefault(value: number | undefined, defaultValue: number): number {
  return value ?? defaultValue;
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

// ============================================================================
// Error Handling
// ============================================================================

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
 * Convert unknown error to Error instance
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

/**
 * Check if error is instance of specific Error subclass
 */
export function isErrorType<T extends Error>(
  error: unknown,
  errorClass: new (...args: unknown[]) => T
): error is T {
  return error instanceof errorClass;
}

// ============================================================================
// Object Field Validation
// ============================================================================

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

/**
 * Type guard to check if object has required boolean fields
 */
export function hasRequiredBooleanFields(obj: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => typeof obj[field] === "boolean");
}

/**
 * Validate object has at least one of the specified fields
 */
export function hasAtLeastOneField(obj: Record<string, unknown>, fields: string[]): boolean {
  return fields.some((field) => field in obj);
}

/**
 * Validate object has all specified fields (regardless of type)
 */
export function hasAllFields(obj: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => field in obj);
}

// ============================================================================
// Type Narrowing
// ============================================================================

/**
 * Narrow to string type
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Narrow to number type
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * Narrow to boolean type
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Narrow to bigint type
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === "bigint";
}

/**
 * Narrow to date type
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * Narrow to valid Date from string or Date
 */
export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}
