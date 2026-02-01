/**
 * Tenant Containment Middleware
 * 
 * Middleware to enforce tenant quotas and rate limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRequestRateLimit, checkJobQuota, recordUsage } from './tenant-quotas';
import { createLogger } from '@/lib/logger';

export interface ContainmentMiddlewareOptions {
  getTenantId: (request: NextRequest) => Promise<string | null>;
  checkType: 'request' | 'job';
  getJobMetadata?: (request: NextRequest) => Promise<{ estimatedRecords?: number }>;
}

/**
 * Wrap an API handler with tenant containment (rate limiting & quotas)
 */
export function withTenantContainment<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: ContainmentMiddlewareOptions
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const logger = await createLogger({ route: request.nextUrl.pathname });

    try {
      // Get tenant ID
      const tenantId = await options.getTenantId(request);
      if (!tenantId) {
        // No tenant ID - skip containment (e.g., public routes)
        return handler(...args);
      }

      // Check quota based on type
      let quotaCheck;
      if (options.checkType === 'job') {
        const jobMetadata = options.getJobMetadata
          ? await options.getJobMetadata(request)
          : {};
        quotaCheck = await checkJobQuota(tenantId, jobMetadata.estimatedRecords);
      } else {
        quotaCheck = await checkRequestRateLimit(tenantId);
      }

      if (!quotaCheck.allowed) {
        logger.warn('Quota exceeded', {
          tenantId,
          reason: quotaCheck.reason,
          retryAfter: quotaCheck.retryAfter,
        });

        return NextResponse.json(
          {
            error: 'QUOTA_EXCEEDED',
            message: quotaCheck.reason || 'Request quota exceeded',
            retryAfter: quotaCheck.retryAfter,
            currentUsage: quotaCheck.currentUsage,
          },
          {
            status: 429,
            headers: {
              'Retry-After': quotaCheck.retryAfter?.toString() || '60',
            },
          }
        );
      }

      // Execute handler
      const response = await handler(...args);

      // Record usage if successful
      if (response.status >= 200 && response.status < 300) {
        await recordUsage(tenantId, options.checkType).catch(() => {
          // Ignore errors - usage tracking is best-effort
        });
      }

      return response;
    } catch (_error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error in containment middleware', errorObj);
      // On error, allow request (fail open)
      return handler(...args);
    }
  };
}
