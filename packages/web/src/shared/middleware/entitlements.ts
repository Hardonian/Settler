/**
 * Entitlement Middleware
 * 
 * Middleware to check service entitlements before processing API requests.
 * Includes proper error handling and security measures.
 */

import { NextResponse } from 'next/server';
import { ApiKeyAuthContext } from '@/shared/auth/apiKey';
import { checkEntitlement, ServiceCode } from '@/domain/billing/entitlements';
import { checkUsageLimit } from './usageLimit';
import { trackUsageLimitExceeded } from '@/lib/monitoring/alerts';

export interface EntitlementError {
  error: string;
  code: string;
  message: string;
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
  if (eventType.startsWith('settler-receipts')) {
    return 'receipts';
  }
  if (eventType.startsWith('settler-feature-flags')) {
    return 'featureFlags';
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
      },
    };
  }

  if (!['reconcile', 'receipts', 'featureFlags'].includes(service)) {
    return {
      allowed: false,
      error: {
        error: 'Invalid Service',
        code: 'invalid_service',
        message: `Invalid service code: ${service}`,
      },
    };
  }

  try {
    // First check entitlement (plan support)
    const entitlement = await checkEntitlement(auth.billingAccountId, service);

    if (!entitlement.allowed) {
      return {
        allowed: false,
        error: {
          error: 'Plan Limit Exceeded',
          code: 'plan_limit_exceeded',
          message: `You have exceeded your monthly quota for ${service}. Current usage: ${entitlement.currentUsage}/${entitlement.limit}.`,
          details: {
            currentPlan: entitlement.planCode,
            currentUsage: entitlement.currentUsage,
            limit: entitlement.limit,
            upgradeUrl: '/console/billing',
          },
        },
      };
    }

    // Then check usage limit (enforcement at API level)
    const usageLimit = await checkUsageLimit(auth.billingAccountId, service);
    
    if (!usageLimit.allowed && usageLimit.error) {
      // Track usage limit exceeded event
      trackUsageLimitExceeded(
        auth.billingAccountId,
        service,
        usageLimit.error.details.currentUsage,
        usageLimit.error.details.limit,
        usageLimit.error.details.planCode
      );

      return {
        allowed: false,
        error: {
          error: 'Usage Limit Exceeded',
          code: usageLimit.error.code,
          message: usageLimit.error.message,
          details: {
            currentPlan: usageLimit.error.details.planCode,
            currentUsage: usageLimit.error.details.currentUsage,
            limit: usageLimit.error.details.limit,
            upgradeUrl: usageLimit.error.details.upgradeUrl,
          },
        },
      };
    }

    return { allowed: true };
  } catch (error) {
    // Fail open on errors - allow request if entitlement check fails
    // This prevents service disruption due to billing system issues
    // eslint-disable-next-line no-console
    console.error('[Entitlement Middleware] Error checking entitlement:', {
      billingAccountId: auth.billingAccountId,
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { allowed: true };
  }
}

/**
 * Create entitlement error response
 */
export function createEntitlementErrorResponse(error: EntitlementError): NextResponse {
  return NextResponse.json(error, { status: 403 });
}
