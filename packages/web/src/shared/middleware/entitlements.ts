/**
 * Entitlement Middleware
 * 
 * Middleware to check service entitlements before processing API requests.
 * Includes proper error handling and security measures.
 */

import { NextResponse } from 'next/server';
import { ApiKeyAuthContext } from '@/shared/auth/apiKey';
import { checkEntitlement, ServiceCode } from '@/domain/billing/entitlements';

export interface EntitlementError {
  error: string;
  code: string;
  message: string;
  status?: number;
  details?: {
    currentPlan: string;
    currentUsage: number;
    limit: number;
    upgradeUrl?: string;
  };
}

/**
 * Map service from eventType to ServiceCode
 */
export function getServiceFromEventType(eventType: string): ServiceCode | null {
  if (eventType.startsWith('settler-reconcile')) {
    return 'reconcile';
  }
  if (eventType.startsWith('settler-exception:review')) {
    return 'exceptions';
  }
  return null;
}

/**
 * Check entitlement for an API request
 */
export async function checkRequestEntitlement(
  auth: ApiKeyAuthContext,
  service: ServiceCode
): Promise<{ allowed: boolean; error?: EntitlementError }> {
  // Validate inputs
  if (!auth || !auth.billingAccountId) {
    return {
      allowed: false,
      error: {
        error: 'Unauthorized',
        code: 'no_billing_account',
        message: 'No billing account found. Please contact support.',
        status: 401,
      },
    };
  }

  if (!['reconcile', 'exceptions'].includes(service)) {
    return {
      allowed: false,
      error: {
        error: 'Invalid Service',
        code: 'invalid_service',
        message: `Invalid service code: ${service}. Only 'reconcile' and 'exceptions' are supported.`,
        status: 400,
      },
    };
  }

  try {
    const entitlement = await checkEntitlement(auth.billingAccountId, service);

    if (!entitlement.allowed) {
      return {
        allowed: false,
        error: {
          error: 'Plan Limit Exceeded',
          code: 'plan_limit_exceeded',
          message: `You have exceeded your monthly quota for ${service}. Current usage: ${entitlement.currentUsage}/${entitlement.limit}.`,
          status: 403,
          details: {
            currentPlan: entitlement.planCode,
            currentUsage: entitlement.currentUsage,
            limit: entitlement.limit,
            upgradeUrl: '/console/billing',
          },
        },
      };
    }

    return { allowed: true };
  } catch {
    // Fail closed on errors - deny request if entitlement check fails
    // This prevents users from bypassing plan enforcement
    console.error('[Entitlement Middleware] Error checking entitlement:', {
      billingAccountId: auth.billingAccountId,
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      allowed: false,
      error: {
        error: 'Entitlement Check Failed',
        code: 'entitlement_check_failed',
        message: 'Unable to verify your plan limits right now. Please retry in a moment.',
        status: 503,
      },
    };
  }
}

/**
 * Create entitlement error response
 */
export function createEntitlementErrorResponse(error: EntitlementError): NextResponse {
  return NextResponse.json(error, { status: error.status ?? 403 });
}
