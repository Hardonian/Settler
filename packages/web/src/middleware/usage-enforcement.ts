/**
 * Usage Enforcement Middleware
 * 
 * Enforces usage limits before processing API requests.
 * Integrates with usage tracking service for accurate billing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyAuthContext } from '@/shared/auth/apiKey';
import { checkAndIncrementUsage, recordUsageEvent, type ServiceCode } from '@/lib/usage/tracking';
import { createErrorResponse } from '@/lib/api-response';

export interface UsageEnforcementResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  reason?: string;
}

/**
 * Map API route to service code
 */
function getServiceFromRoute(pathname: string): ServiceCode | null {
  if (pathname.includes('/api/v1/recon')) {
    return 'reconcile';
  }
  if (pathname.includes('/api/v1/receipts')) {
    return 'receipts';
  }
  if (pathname.includes('/api/v1/feature-flags')) {
    return 'featureFlags';
  }
  if (pathname.includes('/api/v1/convert')) {
    return 'reconcile'; // Convert uses reconcile entitlement
  }
  return null;
}

/**
 * Enforce usage limits for an API request
 */
export async function enforceUsageLimit(
  request: NextRequest,
  auth: ApiKeyAuthContext,
  quantity: number = 1
): Promise<{ allowed: boolean; response?: NextResponse }> {
  try {
    if (!auth.billingAccountId) {
      // No billing account - allow but don't track
      return { allowed: true };
    }

    const pathname = request.nextUrl.pathname;
    const service = getServiceFromRoute(pathname);

    if (!service) {
      // Unknown service - allow
      return { allowed: true };
    }

    // Check and increment usage (atomic operation)
    const result = await checkAndIncrementUsage(
      auth.billingAccountId,
      service,
      quantity,
      'monthly' // Use monthly limits for API calls
    );

    if (!result.allowed) {
      // Record usage event for analytics (even if blocked)
      await recordUsageEvent(
        auth.billingAccountId,
        service,
        'request_blocked',
        quantity,
        {
          pathname,
          reason: result.reason,
        }
      ).catch(() => {
        // Don't block request if event recording fails
      });

      return {
        allowed: false,
        response: NextResponse.json(
          createErrorResponse(
            'USAGE_LIMIT_EXCEEDED',
            result.reason || 'Usage limit exceeded',
            429
          ),
          { status: 429 }
        ),
      };
    }

    // Record successful usage event (async, non-blocking)
    recordUsageEvent(
      auth.billingAccountId,
      service,
      'request_allowed',
      quantity,
      {
        pathname,
        remaining: result.remaining,
      }
    ).catch(() => {
      // Don't block request if event recording fails
    });

    return { allowed: true };
  } catch (_error) {
    console.error('[Usage Enforcement] Error:', error);
    // Fail closed - deny request if enforcement fails
    return {
      allowed: false,
      response: NextResponse.json(
        createErrorResponse(
          'USAGE_ENFORCEMENT_FAILED',
          'Unable to verify usage limits right now. Please retry in a moment.',
          503
        ),
        { status: 503 }
      ),
    };
  }
}

/**
 * Middleware wrapper for usage enforcement
 * Use this in API routes that need usage enforcement
 */
export function withUsageEnforcement(
  handler: (request: NextRequest, auth: ApiKeyAuthContext) => Promise<NextResponse>,
  options?: {
    quantity?: number;
    service?: ServiceCode;
  }
) {
  return async (request: NextRequest, auth: ApiKeyAuthContext): Promise<NextResponse> => {
    // Enforce usage limits
    const enforcement = await enforceUsageLimit(request, auth, options?.quantity);

    if (!enforcement.allowed && enforcement.response) {
      return enforcement.response;
    }

    // Proceed with handler
    return handler(request, auth);
  };
}
