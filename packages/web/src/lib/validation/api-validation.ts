/**
 * API Request Validation
 * 
 * Comprehensive validation for all API inputs with:
 * - Type checking
 * - Format validation
 * - Business rule validation
 * - Sanitization
 */

import { z } from 'zod';
import { sanitizeString, sanitizeUrl, isValidUUID } from '@/lib/security/input-sanitization';

/**
 * Validate and sanitize API key input
 */
export function validateApiKeyInput(input: unknown): {
  valid: boolean;
  data?: {
    name?: string;
    scopes?: string[];
    expiresAt?: Date;
  };
  errors?: string[];
} {
  const schema = z.object({
    name: z.string().max(100).optional(),
    scopes: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional(),
  });

  const result = schema.safeParse(input);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Sanitize string inputs
  const sanitized = {
    ...result.data,
    name: result.data.name ? sanitizeString(result.data.name, 100) : undefined,
  };

  return {
    valid: true,
    data: {
      ...sanitized,
      expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : undefined,
    },
  };
}

/**
 * Validate webhook URL
 */
export function validateWebhookUrl(url: unknown): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (typeof url !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }

  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow HTTPS in production
  if (process.env.NODE_ENV === 'production' && !sanitized.startsWith('https://')) {
    return { valid: false, error: 'Webhook URLs must use HTTPS in production' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate UUID
 */
export function validateUUID(id: unknown): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (typeof id !== 'string') {
    return { valid: false, error: 'ID must be a string' };
  }

  if (!isValidUUID(id)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true, sanitized: id };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: {
  limit?: unknown;
  offset?: unknown;
}): {
  valid: boolean;
  data?: { limit: number; offset: number };
  errors?: string[];
} {
  const schema = z.object({
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
  });

  const result = schema.safeParse({
    limit: typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit,
    offset: typeof params.offset === 'string' ? parseInt(params.offset, 10) : params.offset,
  });

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    valid: true,
    data: result.data,
  };
}

/**
 * Validate date range
 */
export function validateDateRange(params: {
  startDate?: unknown;
  endDate?: unknown;
}): {
  valid: boolean;
  data?: { startDate: Date; endDate: Date };
  errors?: string[];
} {
  const schema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const startDate = result.data.startDate ? new Date(result.data.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = result.data.endDate ? new Date(result.data.endDate) : new Date();

  if (startDate > endDate) {
    return {
      valid: false,
      errors: ['Start date must be before end date'],
    };
  }

  // Limit to 1 year max
  const maxRange = 365 * 24 * 60 * 60 * 1000;
  if (endDate.getTime() - startDate.getTime() > maxRange) {
    return {
      valid: false,
      errors: ['Date range cannot exceed 1 year'],
    };
  }

  return {
    valid: true,
    data: { startDate, endDate },
  };
}
