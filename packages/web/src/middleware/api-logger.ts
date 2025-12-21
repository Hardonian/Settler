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

export interface ApiLogContext {
  tenantId?: string;
  userId?: string;
  apiKeyId?: string;
  startTime: number;
}

/**
 * Extract tenant ID from request
 */
async function getTenantFromRequest(request: NextRequest): Promise<string | undefined> {
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
    
    return billingAccount?.tenant_id;
  } catch (error) {
    console.error('[api-logger] Failed to get tenant:', error);
    return undefined;
  }
}

/**
 * Extract API key ID from Authorization header
 */
function getApiKeyId(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  
  // Extract API key (we'll need to look it up to get the ID)
  // For now, return undefined - we'll enhance this later
  return undefined;
}

/**
 * Get user ID from request
 */
async function getUserId(request: NextRequest): Promise<string | undefined> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch (error) {
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
  } catch (error) {
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
    } catch (error) {
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
  } catch (error) {
    // Don't let logging errors break the request
    console.error('[api-logger] Failed to log API call:', error);
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
    } catch (error) {
      // Create error response
      response = NextResponse.json(
        { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Log the API call (async, don't wait)
    logApiRequest(request, response, context).catch(err => {
      console.error('[api-logger] Failed to log request:', err);
    });
    
    return response;
  };
}
