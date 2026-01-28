/**
 * Request Validation Utilities
 * 
 * Provides validation and sanitization for API requests.
 */

import { NextRequest } from 'next/server';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  sanitized?: Record<string, unknown>;
}

/**
 * Validate and sanitize request body
 */
export function validateRequestBody<T extends Record<string, unknown>>(
  body: unknown,
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      sanitize?: (value: unknown) => T[K];
    };
  }
): ValidationResult {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }
  
  const bodyObj = body as Record<string, unknown>;
  
  for (const [key, rule] of Object.entries(schema)) {
    const value = bodyObj[key];
    
    // Check required
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`Field '${key}' is required`);
      continue;
    }
    
    // Skip if not required and not present
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Type checking
    if (rule.type === 'string' && typeof value !== 'string') {
      errors.push(`Field '${key}' must be a string`);
      continue;
    }
    
    if (rule.type === 'number' && typeof value !== 'number') {
      errors.push(`Field '${key}' must be a number`);
      continue;
    }
    
    if (rule.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Field '${key}' must be a boolean`);
      continue;
    }
    
    if (rule.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      errors.push(`Field '${key}' must be an object`);
      continue;
    }
    
    if (rule.type === 'array' && !Array.isArray(value)) {
      errors.push(`Field '${key}' must be an array`);
      continue;
    }
    
    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`Field '${key}' must be at least ${rule.minLength} characters`);
        continue;
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`Field '${key}' must be at most ${rule.maxLength} characters`);
        continue;
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`Field '${key}' does not match required pattern`);
        continue;
      }
    }
    
    // Sanitize if custom sanitizer provided
    if (rule.sanitize) {
      try {
        sanitized[key] = rule.sanitize(value);
      } catch (error) {
        errors.push(`Field '${key}' failed sanitization: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    sanitized: errors.length === 0 ? sanitized as T : undefined,
  };
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email (basic)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: {
  limit?: string;
  offset?: string;
}): { limit: number; offset: number; errors?: string[] } {
  const errors: string[] = [];
  
  let limit = 100;
  if (params.limit) {
    const parsedLimit = parseInt(params.limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      errors.push('Limit must be between 1 and 1000');
    } else {
      limit = parsedLimit;
    }
  }
  
  let offset = 0;
  if (params.offset) {
    const parsedOffset = parseInt(params.offset, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      errors.push('Offset must be a non-negative integer');
    } else {
      offset = parsedOffset;
    }
  }
  
  return {
    limit,
    offset,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Extract and validate tenant ID from request
 */
export async function getTenantIdFromRequest(request: NextRequest): Promise<{
  tenantId: string | null;
  error?: string;
}> {
  // Try from query params
  const queryTenantId = new URL(request.url).searchParams.get('tenantId');
  if (queryTenantId) {
    if (!isValidUUID(queryTenantId)) {
      return { tenantId: null, error: 'Invalid tenant ID format' };
    }
    return { tenantId: queryTenantId };
  }
  
  // Try from headers
  const headerTenantId = request.headers.get('x-tenant-id');
  if (headerTenantId) {
    if (!isValidUUID(headerTenantId)) {
      return { tenantId: null, error: 'Invalid tenant ID format' };
    }
    return { tenantId: headerTenantId };
  }
  
  // Try from auth user's billing account
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: billingAccount } = await supabase
        .from('billing_accounts')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      
      type BillingAccountRow = { tenant_id: string };
      if (billingAccount && typeof billingAccount === 'object' && 'tenant_id' in billingAccount) {
        const tenantId = (billingAccount as BillingAccountRow).tenant_id;
        if (tenantId) {
          return { tenantId };
        }
      }
    }
  } catch (error) {
    // Ignore errors, return null
  }
  
  return { tenantId: null };
}
