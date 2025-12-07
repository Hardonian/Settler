/**
 * Route Validation Utilities
 * Common validation schemas for routes
 */

import { z } from "zod";

/**
 * UUID parameter validation
 */
export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid UUID format"),
  }),
});

/**
 * Pagination query parameters
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("100"),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

/**
 * Standard pagination limits
 */
export const PAGINATION_LIMITS = {
  MIN: 1,
  MAX: 1000,
  DEFAULT: 100,
} as const;

/**
 * Validate and normalize pagination parameters
 */
export function normalizePagination(
  page?: number,
  limit?: number,
  offset?: number
): { limit: number; offset: number } {
  const normalizedLimit = Math.min(
    Math.max(limit || PAGINATION_LIMITS.DEFAULT, PAGINATION_LIMITS.MIN),
    PAGINATION_LIMITS.MAX
  );
  const normalizedOffset = offset !== undefined ? offset : page ? (page - 1) * normalizedLimit : 0;

  return {
    limit: normalizedLimit,
    offset: normalizedOffset,
  };
}

/**
 * Admin route parameter validation
 */
export const adminSagaParamSchema = z.object({
  params: z.object({
    sagaType: z.string().min(1),
    sagaId: z.string().uuid("Invalid saga ID format"),
  }),
});

export const adminAggregateParamSchema = z.object({
  params: z.object({
    aggregateType: z.string().min(1),
    aggregateId: z.string().uuid("Invalid aggregate ID format"),
  }),
});

export const adminCorrelationParamSchema = z.object({
  params: z.object({
    correlationId: z.string().min(1),
  }),
});
