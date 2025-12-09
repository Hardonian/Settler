/**
 * Entitlement Checking
 * 
 * Checks if an account has permission to use a service based on plan and usage.
 * Includes proper error handling and validation.
 */

import { prisma } from '@/shared/db/prismaClient';
import { getPlanConfig, PlanCode, ServiceCode, mapLegacyPlanId } from './planConfig';
import { getAccountUsage } from './usageService';

// Re-export ServiceCode for middleware
export type { ServiceCode } from './planConfig';

export interface EntitlementResult {
  allowed: boolean;
  reason: 'within_limits' | 'over_quota' | 'no_subscription' | 'plan_not_supported';
  remainingQuota: number;
  currentUsage: number;
  limit: number;
  planCode: PlanCode;
}

/**
 * Validate billing account ID format
 */
function isValidBillingAccountId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && /^[0-9a-f-]{36}$/i.test(id);
}

/**
 * Get plan code for a billing account
 */
export async function getAccountPlanCode(
  billingAccountId: string
): Promise<PlanCode> {
  // Validate input
  if (!isValidBillingAccountId(billingAccountId)) {
    throw new Error('Invalid billing account ID');
  }

  // Get active subscription with optimized query
  const subscription = await prisma.subscription.findFirst({
    where: {
      billingAccountId,
      status: {
        in: ['active', 'trialing'],
      },
    },
    select: {
      planId: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (subscription) {
    // Map legacy planId to planCode
    return mapLegacyPlanId(subscription.planId);
  }

  // Default to free plan
  return 'free';
}

/**
 * Check entitlement for a service
 */
export async function checkEntitlement(
  billingAccountId: string,
  service: ServiceCode
): Promise<EntitlementResult> {
  // Validate inputs
  if (!isValidBillingAccountId(billingAccountId)) {
    throw new Error('Invalid billing account ID');
  }

  if (!['reconcile', 'receipts', 'featureFlags'].includes(service)) {
    throw new Error(`Invalid service code: ${service}`);
  }

  // Get plan code
  const planCode = await getAccountPlanCode(billingAccountId);
  const planConfig = getPlanConfig(planCode);

  if (!planConfig) {
    return {
      allowed: false,
      reason: 'plan_not_supported',
      remainingQuota: 0,
      currentUsage: 0,
      limit: 0,
      planCode: 'free',
    };
  }

  // Check if service is enabled for this plan
  if (!planConfig.features[service]) {
    return {
      allowed: false,
      reason: 'plan_not_supported',
      remainingQuota: 0,
      currentUsage: 0,
      limit: 0,
      planCode,
    };
  }

  // Get current usage
  let usage;
  try {
    usage = await getAccountUsage(billingAccountId);
  } catch (error) {
    // If usage calculation fails, allow the request but log error
    // eslint-disable-next-line no-console
    console.error('[Entitlements] Failed to get account usage:', {
      billingAccountId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Fail open - allow request if usage calculation fails
    return {
      allowed: true,
      reason: 'within_limits',
      remainingQuota: Number.MAX_SAFE_INTEGER,
      currentUsage: 0,
      limit: Number.MAX_SAFE_INTEGER,
      planCode,
    };
  }

  // Get limit for this service
  let limit = 0;
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
      // This should never happen due to validation above
      return {
        allowed: false,
        reason: 'plan_not_supported',
        remainingQuota: 0,
        currentUsage: 0,
        limit: 0,
        planCode,
      };
  }

  const currentUsage = usage.services[service];
  const remainingQuota = Math.max(0, limit - currentUsage);
  const allowed = currentUsage < limit;

  return {
    allowed,
    reason: allowed ? 'within_limits' : 'over_quota',
    remainingQuota,
    currentUsage,
    limit,
    planCode,
  };
}

/**
 * Check if account can use a service (simple boolean)
 */
export async function canUseService(
  billingAccountId: string,
  service: ServiceCode
): Promise<boolean> {
  try {
    const result = await checkEntitlement(billingAccountId, service);
    return result.allowed;
  } catch (error) {
    // Fail open on errors - allow request if entitlement check fails
    // eslint-disable-next-line no-console
    console.error('[Entitlements] Error checking service entitlement:', {
      billingAccountId,
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return true;
  }
}
