/**
 * Usage Limit Enforcement Middleware
 * 
 * Enforces usage limits at the API level before processing requests.
 * This is a critical production guardrail to prevent overage charges.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyAuthContext } from '@/shared/auth/apiKey';
import { checkEntitlement, ServiceCode } from '@/domain/billing/entitlements';
import { getAccountUsage } from '@/domain/billing/usageService';
import { getPlanConfig } from '@/domain/billing/planConfig';
import { getAccountPlanCode } from '@/domain/billing/entitlements';

export interface UsageLimitResult {
  allowed: boolean;
  error?: {
    code: string;
    message: string;
    details: {
      service: ServiceCode;
      currentUsage: number;
      limit: number;
      planCode: string;
      upgradeUrl: string;
    };
  };
}

/**
 * Check if request is within usage limits
 * This is called BEFORE processing the request to prevent overage
 */
export async function checkUsageLimit(
  billingAccountId: string,
  service: ServiceCode
): Promise<UsageLimitResult> {
  try {
    // Get current plan and limits
    const planCode = await getAccountPlanCode(billingAccountId);
    const planConfig = getPlanConfig(planCode);
    
    if (!planConfig) {
      // Fail open - allow request if plan config missing
      console.warn('[Usage Limit] Plan config not found, allowing request', { billingAccountId, planCode });
      return { allowed: true };
    }

    // Get current usage
    const usage = await getAccountUsage(billingAccountId);
    
    // Get limit for this service
    let limit: number;
    switch (service) {
      case 'reconcile':
        limit = planConfig.limits.reconcile.monthlyCalls;
        break;
      case 'receipts':
        limit = planConfig.limits.receipts.monthlyCalls;
        break;
      case 'featureFlags':
        limit = planConfig.limits.featureFlags.monthlyEvaluations;
        break;
      default:
        return { allowed: true }; // Unknown service, allow
    }

    // Get current usage for this service
    const currentUsage = usage.services[service];

    // Check if limit exceeded
    if (currentUsage >= limit) {
      return {
        allowed: false,
        error: {
          code: 'USAGE_LIMIT_EXCEEDED',
          message: `You have exceeded your monthly quota for ${service}. Current usage: ${currentUsage}/${limit}. Please upgrade your plan.`,
          details: {
            service,
            currentUsage,
            limit,
            planCode,
            upgradeUrl: '/console/billing',
          },
        },
      };
    }

    // Check if approaching limit (warn at 90%)
    if (currentUsage >= limit * 0.9) {
      console.warn('[Usage Limit] Approaching limit', {
        billingAccountId,
        service,
        currentUsage,
        limit,
        percentage: (currentUsage / limit) * 100,
      });
    }

    return { allowed: true };
  } catch (error) {
    // Fail open on errors - allow request if check fails
    // This prevents service disruption due to billing system issues
    console.error('[Usage Limit] Error checking usage limit:', {
      billingAccountId,
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { allowed: true };
  }
}

/**
 * Create usage limit error response
 */
export function createUsageLimitErrorResponse(error: UsageLimitResult['error']): NextResponse {
  return NextResponse.json(
    {
      error: error?.code || 'USAGE_LIMIT_EXCEEDED',
      message: error?.message || 'Usage limit exceeded',
      details: error?.details,
    },
    { status: 429 } // 429 Too Many Requests
  );
}

/**
 * Middleware wrapper for usage limit enforcement
 * Use this in API routes before processing requests
 */
export async function withUsageLimit<T>(
  billingAccountId: string,
  service: ServiceCode,
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const limitCheck = await checkUsageLimit(billingAccountId, service);
  
  if (!limitCheck.allowed && limitCheck.error) {
    return createUsageLimitErrorResponse(limitCheck.error);
  }

  return handler();
}
