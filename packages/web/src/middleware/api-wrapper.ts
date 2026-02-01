/**
 * API Route Wrapper
 * 
 * Provides common middleware for API routes:
 * - Request size limits
 * - Rate limiting
 * - Error handling
 * - Metrics tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisRateLimiters } from '@/lib/security/rate-limiter-redis';
import { trackApiMetric } from '@/lib/monitoring/metrics';
import { createErrorResponse } from '@/lib/server-error-handler';
import { getApiVersion } from '@/lib/api/versioning';
import { checkRequestSize } from './request-size-limit';

export interface ApiWrapperConfig {
  rateLimiter?: (req: NextRequest) => Promise<NextResponse | null>;
  maxSizeBytes?: number;
  requireAuth?: boolean;
}

/**
 * Wrap API route handler with common middleware
 */
export function withApiWrapper<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  config: ApiWrapperConfig = {}
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();
    const path = request.nextUrl.pathname;

    try {
      // Check request size
      const maxSize = config.maxSizeBytes || 10 * 1024 * 1024; // 10MB default
      const sizeCheck = checkRequestSize(request, maxSize);
      if (sizeCheck) {
        await trackApiMetric(path, request.method, 413, Date.now() - startTime);
        return sizeCheck;
      }

      // Apply rate limiting
      const rateLimiter = config.rateLimiter || redisRateLimiters.api;
      const rateLimitCheck = await rateLimiter(request);
      if (rateLimitCheck) {
        await trackApiMetric(path, request.method, 429, Date.now() - startTime);
        return rateLimitCheck;
      }

      // Execute handler
      const response = await handler(...args);

      // Add version headers
      const version = getApiVersion(request);
      response.headers.set('X-API-Version', version);

      // Track metrics
      const status = response.status;
      await trackApiMetric(path, request.method, status, Date.now() - startTime);

      return response;
    } catch (_error) {
      // Track error metrics
      await trackApiMetric(path, request.method, 500, Date.now() - startTime);

      // Return error response
      return createErrorResponse(error);
    }
  }) as T;
}

