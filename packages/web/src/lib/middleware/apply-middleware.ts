/**
 * Apply Middleware to API Routes
 * 
 * Centralized middleware application for all API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from './rate-limit-wrapper';
import { addCorsHeaders, handleCors } from '@/lib/api/cors';
import { withCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { withIdempotency } from '@/lib/api/idempotency';

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
      return addCorsHeaders(response, request) as NextResponse<T>;
    };
  }

  // Apply rate limiting
  if (options.rateLimit !== false) {
    const rateLimitType = typeof options.rateLimit === 'string' 
      ? options.rateLimit 
      : 'api'; // Default to 'api' for server-side routes
    
    wrappedHandler = withRateLimit(wrappedHandler, rateLimitType) as typeof wrappedHandler;
  }

  // Apply circuit breaker
  if (options.circuitBreaker && typeof options.circuitBreaker === 'string') {
    const serviceName = options.circuitBreaker;
    const originalHandler = wrappedHandler;
    wrappedHandler = async (request: NextRequest) => {
      return withCircuitBreaker(serviceName, async () => {
        return originalHandler(request);
      }) as Promise<NextResponse<T>>;
    };
  }

  // Apply idempotency
  if (options.idempotency) {
    const originalHandler = wrappedHandler;
    wrappedHandler = async (request: NextRequest) => {
      const idempotentHandler = withIdempotency(
        async (req: Request) => {
          return originalHandler(req as unknown as NextRequest);
        },
        { required: false }
      );
      return idempotentHandler(request as unknown as Request) as Promise<NextResponse<T>>;
    };
  }

  return wrappedHandler;
}

/**
 * Pre-configured middleware presets
 */
export const middlewarePresets = {
  // Public API endpoint
  public: <T = unknown>(handler: (req: NextRequest) => Promise<NextResponse<T>>) =>
    applyMiddleware<T>(handler, {
      rateLimit: 'public',
      cors: true,
      circuitBreaker: 'supabase',
    }),

  // Authenticated API endpoint
  authenticated: <T = unknown>(handler: (req: NextRequest) => Promise<NextResponse<T>>) =>
    applyMiddleware<T>(handler, {
      rateLimit: 'api',
      cors: true,
      circuitBreaker: 'database',
      dbRetry: true,
      idempotency: true,
    }),

  // Billing endpoint
  billing: <T = unknown>(handler: (req: NextRequest) => Promise<NextResponse<T>>) =>
    applyMiddleware<T>(handler, {
      rateLimit: 'billing',
      cors: true,
      circuitBreaker: 'stripe',
      idempotency: true,
    }),

  // Webhook endpoint
  webhook: <T = unknown>(handler: (req: NextRequest) => Promise<NextResponse<T>>) =>
    applyMiddleware<T>(handler, {
      rateLimit: 'webhook',
      cors: false, // Webhooks don't need CORS
      circuitBreaker: false, // Webhooks handle their own retries
      idempotency: true, // Critical for webhooks
    }),

  // Auth endpoint
  auth: <T = unknown>(handler: (req: NextRequest) => Promise<NextResponse<T>>) =>
    applyMiddleware<T>(handler, {
      rateLimit: 'auth',
      cors: true,
      circuitBreaker: 'supabase',
    }),
};
