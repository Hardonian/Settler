/**
 * Apply Middleware to API Routes
 * 
 * Centralized middleware application for all API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, getRateLimitTypeForRoute } from './rate-limit-wrapper';
import { addCorsHeaders, handleCors } from '@/lib/api/cors';
import { withCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { withIdempotency } from '@/lib/api/idempotency';
import { withRetry } from '@/lib/db/retry';

export interface MiddlewareOptions {
  rateLimit?: boolean | 'auth' | 'api' | 'billing' | 'webhook' | 'public';
  cors?: boolean;
  circuitBreaker?: string | false; // Service name or false to disable
  idempotency?: boolean;
  dbRetry?: boolean;
}

/**
 * Apply all configured middleware to an API route handler
 */
export function applyMiddleware<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options: MiddlewareOptions = {}
): (request: NextRequest) => Promise<NextResponse<T>> {
  let wrappedHandler = handler;

  // Apply CORS
  if (options.cors !== false) {
    const originalHandler = wrappedHandler;
    wrappedHandler = async (request: NextRequest) => {
      const corsResponse = handleCors(request);
      if (corsResponse) return corsResponse as NextResponse<T>;

      const response = await originalHandler(request);
      return addCorsHeaders(response, request);
    };
  }

  // Apply rate limiting
  if (options.rateLimit !== false) {
    const rateLimitType = typeof options.rateLimit === 'string' 
      ? options.rateLimit 
      : getRateLimitTypeForRoute(typeof window === 'undefined' ? '' : window.location.pathname);
    
    wrappedHandler = withRateLimit(wrappedHandler, rateLimitType);
  }

  // Apply circuit breaker
  if (options.circuitBreaker && typeof options.circuitBreaker === 'string') {
    const serviceName = options.circuitBreaker;
    const originalHandler = wrappedHandler;
    wrappedHandler = async (request: NextRequest) => {
      return withCircuitBreaker(serviceName, async () => {
        return originalHandler(request);
      });
    };
  }

  // Apply idempotency
  if (options.idempotency) {
    const originalHandler = wrappedHandler;
    wrappedHandler = async (request: NextRequest) => {
      return withIdempotency(
        async (req: Request) => {
          return originalHandler(req as NextRequest);
        },
        { required: false }
      )(request as unknown as Request) as Promise<NextResponse<T>>;
    };
  }

  return wrappedHandler;
}

/**
 * Pre-configured middleware presets
 */
export const middlewarePresets = {
  // Public API endpoint
  public: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    applyMiddleware(handler, {
      rateLimit: 'public',
      cors: true,
      circuitBreaker: 'supabase',
    }),

  // Authenticated API endpoint
  authenticated: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    applyMiddleware(handler, {
      rateLimit: 'api',
      cors: true,
      circuitBreaker: 'database',
      dbRetry: true,
      idempotency: true,
    }),

  // Billing endpoint
  billing: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    applyMiddleware(handler, {
      rateLimit: 'billing',
      cors: true,
      circuitBreaker: 'stripe',
      idempotency: true,
    }),

  // Webhook endpoint
  webhook: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    applyMiddleware(handler, {
      rateLimit: 'webhook',
      cors: false, // Webhooks don't need CORS
      circuitBreaker: false, // Webhooks handle their own retries
      idempotency: true, // Critical for webhooks
    }),

  // Auth endpoint
  auth: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    applyMiddleware(handler, {
      rateLimit: 'auth',
      cors: true,
      circuitBreaker: 'supabase',
    }),
};
