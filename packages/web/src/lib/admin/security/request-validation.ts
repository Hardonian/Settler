/**
 * Request Validation Utilities
 * 
 * Validates and sanitizes incoming requests for admin endpoints.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }
    return {
      success: false,
      error: 'Invalid request body',
    };
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }
    return {
      success: false,
      error: 'Invalid query parameters',
    };
  }
}

/**
 * Check request size limit
 */
export function checkRequestSize(request: NextRequest, maxSizeBytes: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSizeBytes;
  }
  return true; // Unknown size, allow but could be checked in handler
}
