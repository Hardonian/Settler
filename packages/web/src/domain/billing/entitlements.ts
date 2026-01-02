/**
 * Entitlement Checking
 * 
 * Checks if an account has permission to use a service based on plan and usage.
 * Includes proper error handling and validation.
 */

import { prisma } from '@/shared/db/prismaClient';
import { getPlanConfig, PlanCode, ServiceCode, mapLegacyPlanId } from './planConfig';
import { getAccountUsage } from './usageService';
import { safeLogger } from '@/lib/observability/safe-logger';

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
    await safeLogger.error('[getAccountPlanCode] Invalid billing account ID', {
      billingAccountId: String(billingAccountId),
    });
    // Return default plan instead of throwing
    return 'starter';
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

  // Default to starter plan
  return 'starter';
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
    await safeLogger.error('[checkEntitlement] Invalid billing account ID', {
      billingAccountId: String(billingAccountId),
      service,
    });
    // Return denied instead of throwing
    return {
      allowed: false,
      reason: 'plan_not_supported',
      remainingQuota: 0,
      currentUsage: 0,
      limit: 0,
      planCode: 'starter',
    };
  }

  // Only reconciliation and exceptions are tracked
  if (!['reconcile', 'exceptions'].includes(service)) {
    await safeLogger.error('[checkEntitlement] Invalid service code', {
      billingAccountId,
      service,
    });
    // Return denied instead of throwing
    return {
      allowed: false,
      reason: 'plan_not_supported',
      remainingQuota: 0,
      currentUsage: 0,
      limit: 0,
      planCode: 'starter',
    };
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
      planCode: 'starter',
    };
  }

  // All services are enabled - no feature gating
  // Only scale, depth, and automation intensity are gated

  // Get current usage
  let usage;
  try {
    usage = await getAccountUsage(billingAccountId);
  } catch (error) {
    // If usage calculation fails, log error and fail closed for paid plans
    // Fail open only for starter/free plans to avoid blocking legitimate users
    await safeLogger.error('[Entitlements] Failed to get account usage', {
      billingAccountId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // For starter plan, fail open (graceful degradation)
    // For paid plans, fail closed (prevent abuse)
    if (planCode === 'starter') {
      return {
        allowed: true,
        reason: 'within_limits',
        remainingQuota: Number.MAX_SAFE_INTEGER,
        currentUsage: 0,
        limit: Number.MAX_SAFE_INTEGER,
        planCode,
      };
    } else {
      // Paid plans: fail closed on usage calculation error
      return {
        allowed: false,
        reason: 'over_quota', // Treat as over quota to be safe
        remainingQuota: 0,
        currentUsage: 0,
        limit: 0,
        planCode,
      };
    }
  }

  // Get limit for this service
  let limit = 0;
  switch (service) {
    case 'reconcile':
      limit = planConfig.limits.reconcile.monthlyVolume;
      break;
    case 'exceptions':
      // Exception limit is calculated as percentage of reconciliation volume
      const reconciliationVolume = usage.services.reconcile || 0;
      limit = Math.floor(reconciliationVolume * planConfig.limits.exceptions.includedRate);
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
    // Fail closed on errors for paid features - log and deny access
    // This prevents abuse if entitlement system is down
    await safeLogger.error('[Entitlements] Error checking service entitlement', {
      billingAccountId,
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Fail closed - deny access if entitlement check fails
    // This is safer than failing open for paid features
    return false;
  }
}
