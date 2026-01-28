/**
 * Centralized Entitlements System
 * 
 * Single source of truth for plan → features → enforcement.
 * Replaces scattered subscription checks with one canonical system.
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';

export type EntitlementFeature = 
  | 'reconciliations'
  | 'receipts'
  | 'exports'
  | 'scheduled_jobs'
  | 'api_calls'
  | 'connectors'
  | 'audit_trail'
  | 'support'
  | 'retention'
  | 'sla';

export interface EntitlementLimits {
  reconciliations_per_month: number; // -1 for unlimited
  receipts_per_month: number;
  exports_per_month: number;
  scheduled_jobs: number; // -1 for unlimited
  api_calls_per_month: number;
  connectors_enabled: number; // -1 for unlimited
  audit_trail_days: number;
  support_response_hours: number; // 24, 4, 1, etc.
  retention_years: number;
  sla_percentage: number; // 99, 99.9, 99.99
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeUrl?: string;
  remaining?: number; // For usage-based features
  limit?: number;
  currentUsage?: number;
}

export interface EntitlementStatus {
  planId: string;
  planName: string;
  limits: EntitlementLimits;
  billingAccountId: string;
  subscriptionId: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled';
}

/**
 * Plan definitions - single source of truth
 */
const PLAN_ENTITLEMENTS: Record<string, EntitlementLimits> = {
  // Free tier (unsubscribed)
  free: {
    reconciliations_per_month: 100,
    receipts_per_month: 10,
    exports_per_month: 1,
    scheduled_jobs: 0,
    api_calls_per_month: 1000,
    connectors_enabled: 1,
    audit_trail_days: 7,
    support_response_hours: 48,
    retention_years: 0,
    sla_percentage: 0,
  },
  // Starter plan ($99/month)
  starter: {
    reconciliations_per_month: 10000,
    receipts_per_month: 1000,
    exports_per_month: 50,
    scheduled_jobs: 10,
    api_calls_per_month: 100000,
    connectors_enabled: 5,
    audit_trail_days: 90,
    support_response_hours: 24,
    retention_years: 1,
    sla_percentage: 99,
  },
  // Growth plan ($299/month)
  growth: {
    reconciliations_per_month: 100000,
    receipts_per_month: 10000,
    exports_per_month: 500,
    scheduled_jobs: -1, // Unlimited
    api_calls_per_month: 1000000,
    connectors_enabled: 20,
    audit_trail_days: 365,
    support_response_hours: 4,
    retention_years: 1,
    sla_percentage: 99.9,
  },
  // Enterprise (custom pricing)
  enterprise: {
    reconciliations_per_month: -1, // Unlimited
    receipts_per_month: -1,
    exports_per_month: -1,
    scheduled_jobs: -1,
    api_calls_per_month: -1,
    connectors_enabled: -1,
    audit_trail_days: 2555, // 7 years
    support_response_hours: 1,
    retention_years: 7,
    sla_percentage: 99.99,
  },
};

/**
 * Map plan_id from database to canonical plan name
 */
function normalizePlanId(planId: string | null | undefined): string {
  if (!planId) return 'free';
  
  const normalized = planId.toLowerCase();
  
  // Map legacy plan IDs
  if (normalized === 'base') return 'starter';
  if (normalized.includes('pro')) return 'growth';
  if (normalized.includes('enterprise') || normalized.includes('custom')) return 'enterprise';
  if (normalized.includes('starter') || normalized.includes('starter')) return 'starter';
  if (normalized.includes('growth')) return 'growth';
  
  // Default to starter if unknown
  return 'starter';
}

/**
 * Get current user's entitlement status
 * Returns free tier if user not authenticated or no subscription
 */
export async function getEntitlementStatus(): Promise<EntitlementStatus | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null; // Unauthenticated
    }

    // Get billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active',
        deletedAt: null,
      },
      include: {
        subscriptions: {
          where: {
            status: { in: ['active', 'trialing'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!billingAccount || billingAccount.subscriptions.length === 0) {
      return null; // No subscription
    }

    const subscription = billingAccount.subscriptions[0];
    if (!subscription) {
      return null; // No subscription
    }

    const planId = normalizePlanId(subscription.planId);
    const limits = PLAN_ENTITLEMENTS[planId];
    if (!limits) {
      return null; // Invalid plan
    }

    return {
      planId,
      planName: subscription.planName || planId,
      limits,
      billingAccountId: billingAccount.id,
      subscriptionId: subscription.id,
      status: subscription.status as 'active' | 'trialing' | 'past_due' | 'cancelled',
    };
  } catch (error) {
    console.error('[getEntitlementStatus] Error:', error);
    return null; // Fail safe - return null (free tier)
  }
}

/**
 * Check if user has entitlement for a feature
 * Returns detailed result with upgrade URL and usage info
 */
export async function requireEntitlement(
  feature: EntitlementFeature,
  quantity: number = 1
): Promise<EntitlementCheckResult> {
  try {
    const status = await getEntitlementStatus();
    
    if (!status) {
      // Unauthenticated or no subscription
      return {
        allowed: false,
        reason: 'subscription_required',
        upgradeUrl: '/pricing',
      };
    }

    // Check feature-specific limits
    let limit: number;
    let currentUsage: number = 0;

    switch (feature) {
      case 'reconciliations':
        limit = status.limits.reconciliations_per_month;
        // Get current month usage
        const reconUsage = await prisma.usageCounter.findFirst({
          where: {
            billingAccountId: status.billingAccountId,
            service: 'reconcile',
            period: 'monthly',
            periodStart: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        });
        currentUsage = reconUsage?.count || 0;
        break;

      case 'receipts':
        limit = status.limits.receipts_per_month;
        const receiptUsage = await prisma.usageCounter.findFirst({
          where: {
            billingAccountId: status.billingAccountId,
            service: 'receipts',
            period: 'monthly',
            periodStart: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        });
        currentUsage = receiptUsage?.count || 0;
        break;

      case 'exports':
        limit = status.limits.exports_per_month;
        const exportUsage = await prisma.usageCounter.findFirst({
          where: {
            billingAccountId: status.billingAccountId,
            service: 'exports',
            period: 'monthly',
            periodStart: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        });
        currentUsage = exportUsage?.count || 0;
        break;

      case 'scheduled_jobs':
        limit = status.limits.scheduled_jobs;
        // Count active scheduled jobs
        const jobCount = await prisma.reconJob.count({
          where: {
            // Need tenant_id - would need to get from billing account
            scheduleCron: { not: null },
            status: 'active',
            deletedAt: null,
          },
        });
        currentUsage = jobCount;
        break;

      case 'api_calls':
        limit = status.limits.api_calls_per_month;
        const apiUsage = await prisma.usageCounter.findFirst({
          where: {
            billingAccountId: status.billingAccountId,
            service: 'api',
            period: 'monthly',
            periodStart: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        });
        currentUsage = apiUsage?.count || 0;
        break;

      case 'connectors':
        limit = status.limits.connectors_enabled;
        // Count active connectors
        const connectorCount = await prisma.ingestionSource.count({
          where: {
            // Would need tenant_id mapping
            status: 'active',
            deletedAt: null,
          },
        });
        currentUsage = connectorCount;
        break;

      default:
        // For features without usage tracking (support, retention, sla, audit_trail)
        return {
          allowed: true, // Always allowed, limits are informational
        };
    }

    // Unlimited plans
    if (limit === -1) {
      return {
        allowed: true,
        remaining: -1,
        limit: -1,
        currentUsage,
      };
    }

    // Check if usage + quantity exceeds limit
    if (currentUsage + quantity > limit) {
      // Determine upgrade path
      let upgradePlan = 'growth';
      if (status.planId === 'free') upgradePlan = 'starter';
      else if (status.planId === 'starter') upgradePlan = 'growth';
      else if (status.planId === 'growth') upgradePlan = 'enterprise';

      return {
        allowed: false,
        reason: 'limit_exceeded',
        upgradeUrl: `/pricing?plan=${upgradePlan}`,
        remaining: Math.max(0, limit - currentUsage),
        limit,
        currentUsage,
      };
    }

    return {
      allowed: true,
      remaining: limit - currentUsage - quantity,
      limit,
      currentUsage,
    };
  } catch (error) {
    console.error('[requireEntitlement] Error:', error);
    // CRITICAL: Fail closed - deny access on error (prevents revenue leakage)
    return {
      allowed: false,
      reason: 'check_failed',
      upgradeUrl: '/pricing',
    };
  }
}

/**
 * Get upgrade URL for current plan
 */
export async function getUpgradeUrl(): Promise<string> {
  const status = await getEntitlementStatus();
  
  if (!status) {
    return '/pricing';
  }

  if (status.planId === 'free') return '/pricing?plan=starter';
  if (status.planId === 'starter') return '/pricing?plan=growth';
  if (status.planId === 'growth') return '/pricing?plan=enterprise';
  
  return '/pricing';
}
