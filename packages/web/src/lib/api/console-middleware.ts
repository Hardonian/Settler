/**
 * Console API Middleware
 * 
 * Request/response logging and monitoring middleware for console routes.
 * Provides observability and debugging capabilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCorrelationId, addCorrelationHeaders } from '@/lib/monitoring/correlation';
import { trackApiMetric } from '@/lib/monitoring/metrics';

export interface ConsoleMiddlewareConfig {
  /** Log request/response bodies (be careful with sensitive data) */
  logBodies?: boolean;
  /** Log headers */
  logHeaders?: boolean;
  /** Skip logging for these paths */
  skipPaths?: string[];
}

/**
 * Middleware to log console API requests/responses
 */
export function withConsoleLogging(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: ConsoleMiddlewareConfig = {}
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Skip logging for excluded paths
    if (config.skipPaths?.some((skipPath) => path.includes(skipPath))) {
      return handler(req);
    }

    const correlationId = await getCorrelationId();

    // Log request
    const requestLog: Record<string, unknown> = {
      type: 'request',
      correlationId,
      method,
      path,
      timestamp: new Date().toISOString(),
    };

    if (config.logHeaders) {
      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        headers[key] = value;
      });
      requestLog.headers = headers;
    }

    console.log('[Console API Request]', JSON.stringify(requestLog));

    // Execute handler
    let response: NextResponse;
    try {
      response = await handler(req);
    } catch (error) {
      // Log error
      console.error('[Console API Error]', {
        type: 'error',
        correlationId,
        method,
        path,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - startTime,
      });

      throw error;
    }

    // Log response
    const duration = Date.now() - startTime;
    const responseLog: Record<string, unknown> = {
      type: 'response',
      correlationId,
      method,
      path,
      status: response.status,
      duration,
      timestamp: new Date().toISOString(),
    };

    // Track metrics
    await trackApiMetric(path, method, response.status, duration);

    console.log('[Console API Response]', JSON.stringify(responseLog));

    // Add correlation headers
    return addCorrelationHeaders(response, correlationId);
  };
}

/**
 * Middleware to add security headers
 */
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Add CORS headers if needed
    const origin = req.headers.get('origin');
    if (origin && origin.includes('settler.dev')) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  };
}

/**
 * Combine multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: (req: NextRequest) => Promise<NextResponse>) => (req: NextRequest) => Promise<NextResponse>>
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
