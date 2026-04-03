/**
 * Validation Helpers
 * Type-safe validation utilities using Zod
 * Reusable schemas and validation functions for consistent input validation
 */

import { z } from "zod";

/**
 * Common Zod schemas for reuse across the codebase
 * These replace duplicate inline schema definitions
 */

// ============================================================================
// Basic Type Schemas
// ============================================================================

/**
 * Validate UUID string
 * @example z.string().uuid() - for inline use
 */
export const uuidSchema = z.string().uuid();

/**
 * Validate email address
 * @example z.string().email() - for inline use
 */
export const emailSchema = z.string().email();

/**
 * Validate ISO date string
 */
export const isoDateSchema = z.string().datetime({ message: "Must be ISO 8601 datetime" });

/**
 * Validate non-empty string
 */
export const nonEmptyStringSchema = z.string().min(1, "String cannot be empty");

/**
 * Validate positive integer
 */
export const positiveIntSchema = z.number().int().positive();

/**
 * Validate non-negative integer (including zero)
 */
export const nonNegativeIntSchema = z.number().int().min(0);

/**
 * Validate boolean string ("true" | "false")
 */
export const booleanStringSchema = z.enum(["true", "false"]).transform((val) => val === "true");

/**
 * Validate URL string
 */
export const urlSchema = z.string().url();

/**
 * Validate JSON string
 */
export const jsonStringSchema = z.string().refine(
  (val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Must be valid JSON" }
);

// ============================================================================
// Common Composite Schemas
// ============================================================================

/**
 * Pagination params schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(100),
});

/**
 * Date range schema with validation
 */
export const dateRangeSchema = z
  .object({
    start: z.date(),
    end: z.date(),
  })
  .refine((data) => data.end >= data.start, {
    message: "End date must be after start date",
  });

/**
 * Cursor-based pagination params
 */
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(250).default(100),
  direction: z.enum(["next", "prev"]).default("next"),
});

/**
 * ISO date range schema (string-based)
 */
export const isoDateRangeSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate must be after startDate",
  });

/**
 * UUID array schema with limits
 */
export const uuidArraySchema = z.array(uuidSchema).min(1).max(100);

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  q: nonEmptyStringSchema,
  limit: positiveIntSchema.optional(),
});

// ============================================================================
// IDEMPOTENCY & RETRY
// ============================================================================

/**
 * Idempotency key schema
 */
export const idempotencyKeySchema = nonEmptyStringSchema.max(256);

/**
 * Retry configuration schema
 */
export const retryConfigSchema = z.object({
  maxAttempts: positiveIntSchema.max(10).default(3),
  initialDelayMs: positiveIntSchema.max(60000).default(1000),
  maxDelayMs: positiveIntSchema.max(300000).default(30000),
  backoffMultiplier: z.number().positive().max(10).default(2),
});

// ============================================================================
// TENANT & USER CONTEXT
// ============================================================================

/**
 * Tenant ID schema
 */
export const tenantIdSchema = uuidSchema.brand("TenantId");

/**
 * User ID schema
 */
export const userIdSchema = uuidSchema.brand("UserId");

/**
 * API Key schema
 */
export const apiKeySchema = nonEmptyStringSchema.min(32).max(256);

/**
 * Role schema
 */
export const roleSchema = z.enum(["admin", "developer", "viewer", "operator"]);

// ============================================================================
// RESOURCE IDENTIFIERS
// ============================================================================

/**
 * Generic resource identifier
 */
export const resourceIdSchema = z.object({
  id: uuidSchema,
  type: z.string().min(1).max(50),
});

/**
 * Resource list query schema
 */
export const resourceListQuerySchema = z.object({
  ids: uuidArraySchema.optional(),
  limit: positiveIntSchema.optional().default(50),
  cursor: z.string().optional(),
});

// ============================================================================
// STATUS & STATE
// ============================================================================

/**
 * Run status schema
 */
export const runStatusSchema = z.enum(["pending", "running", "completed", "failed", "cancelled"]);

/**
 * Job status schema
 */
export const jobStatusSchema = z.enum(["queued", "processing", "completed", "failed", "cancelled"]);

/**
 * Exception resolution schema
 */
export const exceptionResolutionSchema = z.enum(["matched", "manual", "ignored", "duplicate"]);

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Safe parse with typed error handling
 * @deprecated Use zod's native safeParse instead: schema.safeParse(data)
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result;
}

/**
 * Parse or throw typed error
 * @deprecated Use zod's native parse/parseAsync with try-catch
 */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
  errorMessage?: string
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new z.ZodError(result.error.errors);
    if (errorMessage) {
      const customError = new z.ZodError(result.error.errors);
      Object.defineProperty(customError, "message", {
        value: errorMessage,
        writable: true,
        configurable: true,
      });
      throw customError;
    }
    throw error;
  }
  return result.data;
}

/**
 * Validate and transform a value
 */
export function validateAndTransform<TInput, TOutput>(
  schema: z.ZodType<TInput, z.ZodTypeDef, TInput>,
  data: unknown,
  transformer: (input: TInput) => TOutput
): TOutput {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new z.ZodError(result.error.errors);
  }
  return transformer(result.data);
}

/**
 * Create a refined schema with common validations
 */
export function createOptionalStringField(fieldName: string) {
  return z.string().optional().describe(`${fieldName} (optional)`);
}

export function createRequiredStringField(fieldName: string, minLength = 1) {
  return z.string().min(minLength, `${fieldName} is required`).describe(`${fieldName} (required)`);
}

export function createOptionalNumberField(fieldName: string) {
  return z.number().optional().describe(`${fieldName} (optional)`);
}

export function createRequiredNumberField(fieldName: string) {
  return z.number().describe(`${fieldName} (required)`);
}
