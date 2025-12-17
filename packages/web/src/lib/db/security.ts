/**
 * Database Security Utilities
 * 
 * Provides security-focused database utilities:
 * - SQL injection prevention
 * - Input sanitization
 * - Query parameter validation
 * - Rate limiting per query type
 */

import { z } from 'zod';

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Sanitize string input for database queries
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[;\x00\n\r\\'"\x1a]/g, '') // Remove SQL injection chars
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validate pagination parameters
 */
export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Validate and sanitize pagination params
 */
export function validatePagination(params: {
  limit?: number | string;
  offset?: number | string;
}): PaginationParams {
  const parsed = PaginationSchema.parse({
    limit: typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit,
    offset: typeof params.offset === 'string' ? parseInt(params.offset, 10) : params.offset,
  });
  return parsed;
}

/**
 * Validate billing account ID format
 */
export function validateBillingAccountId(id: string): boolean {
  return isValidUUID(id);
}

/**
 * Validate user ID format
 */
export function validateUserId(id: string): boolean {
  return isValidUUID(id);
}

/**
 * Escape special characters for LIKE queries
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}
