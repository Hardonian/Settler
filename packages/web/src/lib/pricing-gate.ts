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
 * Get upgrade message based on current tier with enhanced value propositions
 */
export function getUpgradeMessage(tier: SubscriptionTier, feature?: string): {
  title: string;
  message: string;
  cta: string;
  ctaUrl: string;
  benefits?: string[];
  urgency?: 'low' | 'medium' | 'high';
} {
  const featureBenefits: Record<string, string[]> = {
    'API Keys': [
      'Unlimited API keys',
      'Advanced key management',
      'Key rotation & security',
      'Usage analytics per key'
    ],
    'Usage Analytics': [
      'Real-time usage tracking',
      'Historical analytics',
      'Cost optimization insights',
      'Custom date ranges'
    ],
    'Feature Flags': [
      'Unlimited feature flags',
      'Environment management',
      'A/B testing support',
      'Advanced targeting'
    ],
    'Reconciliation': [
      'Unlimited reconciliations',
      'Automated matching',
      'Custom rules engine',
      'Bulk operations'
    ],
    'Webhooks': [
      'Unlimited webhooks',
      'Event filtering',
      'Retry logic',
      'Webhook analytics'
    ],
  };

  switch (tier) {
    case 'unsubscribed':
      return {
        title: 'Unlock Premium Features',
        message: feature 
          ? `${feature} requires a subscription. Get started with a plan that fits your needs.`
          : 'This feature requires an active subscription. Choose a plan to get started.',
        cta: 'View Pricing Plans',
        ctaUrl: feature ? `/pricing?feature=${encodeURIComponent(feature)}` : '/pricing',
        benefits: feature ? featureBenefits[feature] : undefined,
        urgency: 'high',
      };
    case 'subscribed_unpaid':
      return {
        title: 'Complete Your Payment',
        message: 'Your subscription is active but payment is required to access premium features. Update your payment method to continue.',
        cta: 'Update Payment Method',
        ctaUrl: '/console/billing?action=update-payment',
        urgency: 'high',
      };
    case 'subscribed_paid':
      return {
        title: 'Upgrade Your Plan',
        message: 'This feature is available on higher plan tiers. Upgrade to unlock advanced capabilities.',
        cta: 'View Upgrade Options',
        ctaUrl: '/console/billing?action=upgrade',
        urgency: 'medium',
      };
    case 'enterprise':
      return {
        title: 'Enterprise Feature',
        message: 'This feature requires enterprise-level access. Contact sales for more information.',
        cta: 'Contact Sales',
        ctaUrl: '/enterprise/contact',
        urgency: 'low',
      };
    default: {
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = tier;
      void _exhaustive; // Use void to mark as intentionally unused
      return {
        title: 'Upgrade Required',
        message: 'This feature requires a higher plan tier.',
        cta: 'Upgrade Plan',
        ctaUrl: '/console/billing',
        urgency: 'medium',
      };
    }
  }
}

/**
 * Get feature-specific value proposition
 */
export function getFeatureValueProp(feature: string): {
  headline: string;
  benefits: string[];
  cta: string;
} {
  const valueProps: Record<string, { headline: string; benefits: string[]; cta: string }> = {
    'API Keys': {
      headline: 'Manage API access with enterprise-grade security',
      benefits: [
        'Unlimited API keys for all your applications',
        'Advanced key rotation and expiration policies',
        'Per-key usage analytics and monitoring',
        'Fine-grained permissions and scopes'
      ],
      cta: 'Start Managing API Keys',
    },
    'Usage Analytics': {
      headline: 'Track and optimize your API usage',
      benefits: [
        'Real-time usage metrics and dashboards',
        'Historical trends and forecasting',
        'Cost optimization recommendations',
        'Custom alerts and notifications'
      ],
      cta: 'View Usage Analytics',
    },
    'Feature Flags': {
      headline: 'Ship faster with confidence',
      benefits: [
        'Unlimited feature flags across environments',
        'A/B testing and gradual rollouts',
        'Targeted releases by user segment',
        'Instant rollback capabilities'
      ],
      cta: 'Enable Feature Flags',
    },
    'Reconciliation': {
      headline: 'Automate financial reconciliation',
      benefits: [
        'Unlimited reconciliation runs',
        'AI-powered matching algorithms',
        'Custom rules and workflows',
        'Bulk operations and batch processing'
      ],
      cta: 'Start Reconciling',
    },
    'Webhooks': {
      headline: 'Real-time event notifications',
      benefits: [
        'Unlimited webhook endpoints',
        'Advanced filtering and routing',
        'Automatic retry with exponential backoff',
        'Webhook analytics and monitoring'
      ],
      cta: 'Set Up Webhooks',
    },
  };

  return valueProps[feature] || {
    headline: 'Unlock powerful features',
    benefits: [
      'Full access to all features',
      'Priority support',
      'Advanced analytics',
      'Custom integrations'
    ],
    cta: 'Upgrade Now',
  };
}
