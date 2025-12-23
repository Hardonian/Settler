/**
 * Pricing Gate Utilities
 * 
 * CRITICAL: Client-side and server-side utilities to enforce pricing gates.
 * All UI components that show/hide features based on plan MUST use these utilities.
 * 
 * This ensures consistent enforcement across the application.
 */

import { getSubscriptionStatus } from './get-subscription-status';
import { getEntitlements } from './auth/entitlements';
import { SubscriptionTier, SubscriptionStatus } from './subscription-access';

/**
 * Server-side: Check if user has access to a feature
 * Returns subscription status for conditional rendering
 */
export async function checkFeatureAccess(): Promise<{
  canAccess: boolean;
  tier: SubscriptionTier;
  reason?: string;
  upgradeUrl: string;
}> {
  try {
    const status = await getSubscriptionStatus();
    
    // Unsubscribed users cannot access paid features
    if (status.tier === 'unsubscribed') {
      return {
        canAccess: false,
        tier: status.tier,
        reason: 'Subscription required',
        upgradeUrl: '/pricing?next=' + encodeURIComponent('/console'),
      };
    }
    
    // Unpaid subscriptions have limited access
    if (status.tier === 'subscribed_unpaid') {
      return {
        canAccess: true, // Allow read-only access
        tier: status.tier,
        reason: 'Payment required for full access',
        upgradeUrl: '/console/billing',
      };
    }
    
    // Paid subscriptions have full access
    return {
      canAccess: true,
      tier: status.tier,
      upgradeUrl: '/console/billing',
    };
  } catch (error) {
    // Fail closed - deny access on error
    console.error('[checkFeatureAccess] Error:', error);
    return {
      canAccess: false,
      tier: 'unsubscribed',
      reason: 'Unable to verify subscription',
      upgradeUrl: '/pricing',
    };
  }
}

/**
 * Server-side: Check if user has a specific plan or higher
 * 
 * Note: Maps entitlement plans ('free' | 'pro' | 'enterprise') to pricing tiers
 */
export async function requirePlan(
  minimumPlan: 'free' | 'starter' | 'growth' | 'scale' | 'enterprise'
): Promise<{
  hasAccess: boolean;
  currentPlan: string;
  upgradeUrl: string;
}> {
  try {
    const entitlements = await getEntitlements();
    
    // Map entitlement plan to pricing tier level
    // Entitlements use: 'free' | 'pro' | 'enterprise'
    // Pricing uses: 'free' | 'starter' | 'growth' | 'scale' | 'enterprise'
    const planHierarchy: Record<string, number> = {
      free: 0,
      starter: 1,
      growth: 2,
      scale: 3,
      enterprise: 4,
    };
    
    // Map entitlement plan to hierarchy level
    // 'pro' maps to 'starter' level (paid plans start at starter)
    const entitlementToLevel: Record<string, number> = {
      free: 0,
      pro: 1, // Maps to starter tier
      enterprise: 4,
    };
    
    const userPlanLevel = entitlementToLevel[entitlements.plan] ?? 0;
    const requiredPlanLevel = planHierarchy[minimumPlan] ?? 0;
    
    return {
      hasAccess: userPlanLevel >= requiredPlanLevel,
      currentPlan: entitlements.plan,
      upgradeUrl: '/pricing?plan=' + minimumPlan,
    };
  } catch (error) {
    console.error('[requirePlan] Error:', error);
    return {
      hasAccess: false,
      currentPlan: 'free',
      upgradeUrl: '/pricing',
    };
  }
}

/**
 * Client-side hook: Check feature access
 * Use this in React components for client-side gating
 */
export function useFeatureGate() {
  // This would be implemented as a React hook
  // For now, return a function that can be called
  return async () => {
    try {
      const response = await fetch('/api/console/subscription-status');
      if (!response.ok) {
        return {
          canAccess: false,
          tier: 'unsubscribed' as SubscriptionTier,
          upgradeUrl: '/pricing',
        };
      }
      const status: SubscriptionStatus = await response.json();
      return {
        canAccess: status.hasSubscription,
        tier: status.tier,
        upgradeUrl: status.tier === 'unsubscribed' ? '/pricing' : '/console/billing',
      };
    } catch (error) {
      return {
        canAccess: false,
        tier: 'unsubscribed' as SubscriptionTier,
        upgradeUrl: '/pricing',
      };
    }
  };
}

/**
 * Get upgrade message based on current tier
 */
export function getUpgradeMessage(tier: SubscriptionTier): {
  title: string;
  message: string;
  cta: string;
  ctaUrl: string;
} {
  switch (tier) {
    case 'unsubscribed':
      return {
        title: 'Upgrade to Access',
        message: 'This feature requires an active subscription. Choose a plan to get started.',
        cta: 'View Pricing',
        ctaUrl: '/pricing',
      };
    case 'subscribed_unpaid':
      return {
        title: 'Payment Required',
        message: 'Please update your payment method to access this feature.',
        cta: 'Update Payment',
        ctaUrl: '/console/billing',
      };
    case 'subscribed_paid':
    case 'enterprise':
      return {
        title: 'Upgrade Required',
        message: 'This feature requires a higher plan tier.',
        cta: 'Upgrade Plan',
        ctaUrl: '/console/billing',
      };
    default: {
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = tier;
      return {
        title: 'Upgrade Required',
        message: 'This feature requires a higher plan tier.',
        cta: 'Upgrade Plan',
        ctaUrl: '/console/billing',
      };
    }
  }
}
