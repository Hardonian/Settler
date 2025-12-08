/**
 * Validation Helpers
 * Type-safe validation utilities using Zod
 */

import { z } from 'zod';

/**
 * Safe parse with typed error handling
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
      // Create a new error with the custom message since message is read-only
      const customError = new z.ZodError(result.error.errors);
      Object.defineProperty(customError, 'message', {
        value: errorMessage,
        writable: true,
        configurable: true
      });
      throw customError;
    }
    throw error;
  }
  return result.data;
}

/**
 * Validate UUID string
 */
export const uuidSchema = z.string().uuid();

/**
 * Validate email
 */
export const emailSchema = z.string().email();

/**
 * Validate pagination params
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(100),
});

/**
 * Validate date range
 */
export const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine((data) => data.end >= data.start, {
  message: 'End date must be after start date',
});
