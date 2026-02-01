/**
 * Console API Route Handler
 * 
 * Standardized handler for all /api/console routes with:
 * - Unified authentication (session + API key)
 * - Input validation (Zod)
 * - Error handling
 * - Rate limiting
 * - Request/response logging
 * - Type-safe responses
 * - Caching support
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, UnifiedAuthContext } from '@/lib/api/unified-auth';
import { createErrorResponse, ErrorCodes } from '@/lib/server-error-handler';
import { getCorrelationId, addCorrelationHeaders, createLogger } from '@/lib/monitoring/correlation';
import { redisRateLimiters } from '@/lib/security/rate-limiter-redis';
import { trackApiMetric } from '@/lib/monitoring/metrics';

export interface ConsoleApiContext {
  auth: UnifiedAuthContext;
  correlationId: string;
  logger: ReturnType<typeof createLogger> extends Promise<infer T> ? T : never;
  request: NextRequest;
}

export interface ConsoleApiResponse<T = unknown> {
  data?: T;
  error?: string;
  meta?: {
    correlationId: string;
    timestamp: string;
    cached?: boolean;
  };
}

type ConsoleApiHandler<TInput = unknown, TOutput = unknown> = (
  context: ConsoleApiContext,
  input: TInput
) => Promise<TOutput>;

interface ConsoleApiConfig<TInput = unknown> {
  /** Zod schema for input validation */
  schema?: z.ZodSchema<TInput>;
  /** Rate limiter function */
  rateLimiter?: (req: NextRequest) => Promise<NextResponse | null>;
  /** Cache TTL in seconds (0 = no cache) */
  cacheTtl?: number;
  /** Require specific scopes for API key auth */
  requiredScopes?: string[];
  /** Custom error handler */
  onError?: <TOutput = unknown>(error: unknown, context: ConsoleApiContext) => NextResponse<ConsoleApiResponse<TOutput>>;
}

/**
 * Create a standardized console API route handler
 */
export function createConsoleHandler<TInput = unknown, TOutput = unknown>(
  handler: ConsoleApiHandler<TInput, TOutput>,
  config: ConsoleApiConfig<TInput> = {}
) {
  return async (request: NextRequest): Promise<NextResponse<ConsoleApiResponse<TOutput>>> => {
    const startTime = Date.now();
    const correlationId = await getCorrelationId();
    const logger = await createLogger({ route: request.nextUrl.pathname, method: request.method });

    try {
      // 1. Rate limiting
      const rateLimiter = config.rateLimiter || redisRateLimiters.api;
      const rateLimitResponse = await rateLimiter(request);
      if (rateLimitResponse) {
        await trackApiMetric(request.nextUrl.pathname, request.method, 429, Date.now() - startTime);
        return rateLimitResponse as NextResponse<ConsoleApiResponse<TOutput>>;
      }

      // 2. Authentication
      let auth: UnifiedAuthContext;
      try {
        auth = await requireAuth(request);
      } catch (_error) {
        logger.warn('Authentication failed', { error: error instanceof Error ? error.message : 'Unknown' });
        const response = NextResponse.json<ConsoleApiResponse>(
          { error: 'Unauthorized', meta: { correlationId, timestamp: new Date().toISOString() } },
          { status: 401 }
        );
        return addCorrelationHeaders(response, correlationId) as NextResponse<ConsoleApiResponse<TOutput>>;
      }

      // 3. Scope checking (for API key auth)
      if (auth.type === 'api_key' && config.requiredScopes) {
        const hasScope = config.requiredScopes.some(
          (scope) => auth.scopes?.includes(scope) || auth.scopes?.includes('*')
        );
        if (!hasScope) {
          logger.warn('Insufficient scopes', { requiredScopes: config.requiredScopes, userScopes: auth.scopes });
          const response = NextResponse.json<ConsoleApiResponse>(
            { error: 'Forbidden: Insufficient permissions', meta: { correlationId, timestamp: new Date().toISOString() } },
            { status: 403 }
          );
          return addCorrelationHeaders(response, correlationId) as NextResponse<ConsoleApiResponse<TOutput>>;
        }
      }

      // 4. Input validation
      let input: TInput;
      if (config.schema) {
        try {
          const body = await request.json().catch(() => ({}));
          const parsed = config.schema.safeParse(body);
          if (!parsed.success) {
            logger.warn('Validation failed', { errors: parsed.error.issues });
            const response = NextResponse.json<ConsoleApiResponse>(
              {
                error: 'Validation failed',
                meta: { correlationId, timestamp: new Date().toISOString() },
              },
              { status: 400 }
            );
            return addCorrelationHeaders(response, correlationId) as NextResponse<ConsoleApiResponse<TOutput>>;
          }
          input = parsed.data;
        } catch (_error) {
          logger.warn('Failed to parse request body', { error: error instanceof Error ? error.message : 'Unknown' });
          const response = NextResponse.json<ConsoleApiResponse>(
            {
              error: 'Invalid request body',
              meta: { correlationId, timestamp: new Date().toISOString() },
            },
            { status: 400 }
          );
          return addCorrelationHeaders(response, correlationId) as NextResponse<ConsoleApiResponse<TOutput>>;
        }
      } else {
        input = {} as TInput;
      }

      // 5. Execute handler
      const context: ConsoleApiContext = {
        auth,
        correlationId,
        logger,
        request,
      };

      const result = await handler(context, input);

      // 6. Track metrics
      await trackApiMetric(request.nextUrl.pathname, request.method, 200, Date.now() - startTime);

      // 7. Return success response
      const response = NextResponse.json<ConsoleApiResponse<TOutput>>(
        {
          data: result,
          meta: {
            correlationId,
            timestamp: new Date().toISOString(),
            cached: false, // TODO: Implement caching
          },
        },
        { status: 200 }
      );

      return addCorrelationHeaders(response, correlationId);
    } catch (_error) {
      // Track error metrics
      await trackApiMetric(request.nextUrl.pathname, request.method, 500, Date.now() - startTime);

      // Custom error handler
      if (config.onError) {
        const context: ConsoleApiContext = {
          auth: {} as UnifiedAuthContext, // May not be set if error occurred early
          correlationId,
          logger,
          request,
        };
        return config.onError<TOutput>(error, context);
      }

      // Default error handling
      logger.error('Handler error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      const response = createErrorResponse(error, 500, ErrorCodes.INTERNAL_ERROR);
      return addCorrelationHeaders(response, correlationId) as NextResponse<ConsoleApiResponse<TOutput>>;
    }
  };
}

/**
 * Helper for GET requests (no body validation)
 */
export function createConsoleGetHandler<TOutput = unknown>(
  handler: (context: ConsoleApiContext) => Promise<TOutput>,
  config: Omit<ConsoleApiConfig, 'schema'> = {}
) {
  return createConsoleHandler(async (context) => handler(context), config);
}

/**
 * Helper for POST/PUT/PATCH requests (with body validation)
 */
export function createConsoleMutationHandler<TInput = unknown, TOutput = unknown>(
  handler: ConsoleApiHandler<TInput, TOutput>,
  schema: z.ZodSchema<TInput>,
  config: Omit<ConsoleApiConfig<TInput>, 'schema'> = {}
) {
  return createConsoleHandler(handler, { ...config, schema });
}
