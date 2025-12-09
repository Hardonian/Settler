/**
 * Entitlement Checking
 * 
 * Checks if an account has permission to use a service based on plan and usage.
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
 * Get plan code for a billing account
 */
export async function getAccountPlanCode(
  billingAccountId: string
): Promise<PlanCode> {
  // Get active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      billingAccountId,
      status: {
        in: ['active', 'trialing'],
      },
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
  const usage = await getAccountUsage(billingAccountId);

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
  const result = await checkEntitlement(billingAccountId, service);
  return result.allowed;
}
