/**
 * Input Validation Utilities
 * 
 * Sanitization and validation for admin inputs.
 */

import { z } from 'zod';

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000); // Max length
}

/**
 * Validate UUID
 */
export function validateUUID(input: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input);
}

/**
 * Validate date string
 */
export function validateDateString(input: string): boolean {
  const date = new Date(input);
  return !isNaN(date.getTime());
}

/**
 * Validate pagination parameters
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Validate time range
 */
export const TimeRangeSchema = z.enum(['24h', '7d', '30d', 'custom']);

/**
 * Validate status filter
 */
export const StatusFilterSchema = z.enum(['all', 'new', 'in_review', 'resolved', 'exported']).optional();

/**
 * Validate severity filter
 */
export const SeverityFilterSchema = z.enum(['all', 'info', 'warn', 'critical']).optional();

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return sanitizeString(query)
    .replace(/[%_]/g, '') // Remove SQL wildcards
    .slice(0, 200); // Max length
}
