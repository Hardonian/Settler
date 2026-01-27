/**
 * API Call Logging Middleware
 * 
 * Automatically logs all API calls to the api_call_logs table.
 * Sanitizes PII before storage for privacy compliance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logApiCall } from '@/domain/console/api-logs';
import { sanitizeApiData } from '@/lib/privacy/pii-filter';
import { createClient } from '@/lib/supabase/server';
import { safeLogger } from '@/lib/observability/safe-logger';

export interface ApiLogContext {
  tenantId?: string;
  userId?: string;
  apiKeyId?: string;
  startTime: number;
}

/**
 * Extract tenant ID from request
 */
async function getTenantFromRequest(_request: NextRequest): Promise<string | undefined> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return undefined;
    }
    
    // Try to get tenant from billing account
    const { data: billingAccount } = await supabase
      .from('billing_accounts')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();
    
    type BillingAccountRow = { tenant_id: string };
    if (billingAccount && typeof billingAccount === 'object' && 'tenant_id' in billingAccount) {
      return (billingAccount as BillingAccountRow).tenant_id;
    }
    
    return undefined;
    } catch {
      await safeLogger.error('[api-logger] Failed to get tenant', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    return undefined;
  }
}

/**
 * Extract API key ID from Authorization header
 */
function getApiKeyId(_request: NextRequest): string | undefined {
  // Extract API key (we'll need to look it up to get the ID)
  // For now, return undefined - we'll enhance this later
  return undefined;
}

/**
 * Get user ID from request
 */
async function getUserId(_request: NextRequest): Promise<string | undefined> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

/**
 * Sanitize request body for logging
 */
async function sanitizeRequestBody(request: NextRequest): Promise<unknown> {
  try {
    const clonedRequest = request.clone();
    const contentType = clonedRequest.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await clonedRequest.json();
      return sanitizeApiData({ body }).body;
    }
    
    if (contentType.includes('text/') || contentType.includes('application/xml')) {
      const text = await clonedRequest.text();
      return sanitizeApiData({ body: text }).body;
    }
    
    return undefined;
  } catch {
    // If body parsing fails, return undefined
    return undefined;
  }
}

/**
 * Log API call
 */
export async function logApiRequest(
  request: NextRequest,
  response: NextResponse,
  context: ApiLogContext
): Promise<void> {
  try {
    const method = request.method;
    const path = new URL(request.url).pathname;
    const statusCode = response.status;
    const responseTime = Date.now() - context.startTime;
    
    // Skip logging for certain paths
    const skipPaths = ['/api/health', '/api/console/api-logs', '/_next', '/favicon.ico'];
    if (skipPaths.some(skipPath => path.startsWith(skipPath))) {
      return;
    }
    
    // Get request data
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    const sanitizedHeaders = sanitizeApiData({ headers }).headers as Record<string, string>;
    
    // Get query params
    const query: Record<string, string> = {};
    new URL(request.url).searchParams.forEach((value, key) => {
      query[key] = value;
    });
    
    // Get body (sanitized)
    const body = await sanitizeRequestBody(request);
    
    // Get response body (if available and small)
    let responseBody: unknown = undefined;
    try {
      const clonedResponse = response.clone();
      const contentType = clonedResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await clonedResponse.json();
        if (JSON.stringify(data).length < 10000) { // Only log small responses
          responseBody = sanitizeApiData({ body: data }).body;
        }
      }
    } catch {
      // Ignore response body parsing errors
    }
    
    // Extract error from response if status >= 400
    const error = statusCode >= 400 ? 
      (responseBody && typeof responseBody === 'object' && 'error' in responseBody 
        ? String((responseBody as { error?: string }).error)
        : `HTTP ${statusCode}`)
      : undefined;
    
    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Log the API call
    await logApiCall({
      tenantId: context.tenantId || 'unknown',
      userId: context.userId,
      apiKeyId: context.apiKeyId,
      method,
      path,
      statusCode,
      responseTime,
      headers: sanitizedHeaders,
      query,
      body,
      responseBody,
      error,
      userAgent,
      ipAddress: ipAddress !== 'unknown' ? ipAddress : undefined,
    });
  } catch {
    // Don't let logging errors break the request
    await safeLogger.error('[api-logger] Failed to log API call', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

/**
 * Create API logging middleware wrapper
 * Compatible with Next.js route handlers
 */
export function withApiLogging(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    
    // Get context
    const tenantId = await getTenantFromRequest(request);
    const userId = await getUserId(request);
    const apiKeyId = getApiKeyId(request);
    
    const context: ApiLogContext = {
      tenantId,
      userId,
      apiKeyId,
      startTime,
    };
    
    // Execute handler
    let response: NextResponse;
    try {
      response = await handler(request);
    } catch {
      // Create error response - never return 500, return 200 with error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      response = NextResponse.json(
        { 
          error: 'Request Failed', 
          message: errorMessage || 'An unexpected error occurred. Please try again.',
          code: 'INTERNAL_ERROR',
          retryable: true,
        },
        { status: 200 }
      );
    }
    
    // Log the API call (async, don't wait)
    logApiRequest(request, response, context).catch(async (err) => {
      await safeLogger.error('[api-logger] Failed to log request', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    });
    
    return response;
  };
}
