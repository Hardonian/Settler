/**
 * Subscription & Tier Management
 * 
 * Handles subscription tier detection and feature gating for console features.
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | 'unauthenticated';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  planCode?: string;
  status?: string;
  features: {
    playgroundRequestsPerDay: number;
    playgroundRequestsPerMinute: number;
    apiRequestsPerMonth: number;
    advancedPlaygroundFeatures: boolean;
    requestHistory: boolean;
    customTemplates: boolean;
    webhookTesting: boolean;
    teamCollaboration: boolean;
  };
}

const TIER_FEATURES: Record<SubscriptionTier, SubscriptionInfo['features']> = {
  unauthenticated: {
    playgroundRequestsPerDay: 10,
    playgroundRequestsPerMinute: 2,
    apiRequestsPerMonth: 0,
    advancedPlaygroundFeatures: false,
    requestHistory: false,
    customTemplates: false,
    webhookTesting: false,
    teamCollaboration: false,
  },
  free: {
    playgroundRequestsPerDay: 50,
    playgroundRequestsPerMinute: 5,
    apiRequestsPerMonth: 1000,
    advancedPlaygroundFeatures: false,
    requestHistory: true,
    customTemplates: false,
    webhookTesting: false,
    teamCollaboration: false,
  },
  pro: {
    playgroundRequestsPerDay: 500,
    playgroundRequestsPerMinute: 30,
    apiRequestsPerMonth: 100000,
    advancedPlaygroundFeatures: true,
    requestHistory: true,
    customTemplates: true,
    webhookTesting: true,
    teamCollaboration: false,
  },
  enterprise: {
    playgroundRequestsPerDay: -1, // Unlimited
    playgroundRequestsPerMinute: 100,
    apiRequestsPerMonth: -1, // Unlimited
    advancedPlaygroundFeatures: true,
    requestHistory: true,
    customTemplates: true,
    webhookTesting: true,
    teamCollaboration: true,
  },
};

/**
 * Get subscription info for current user
 */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        tier: 'unauthenticated',
        features: TIER_FEATURES.unauthenticated,
      };
    }

    // Get billing account and subscription
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
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

    if (!billingAccount) {
      return {
        tier: 'free',
        features: TIER_FEATURES.free,
      };
    }

    const subscription = billingAccount.subscriptions[0];
    if (!subscription) {
      return {
        tier: 'free',
        features: TIER_FEATURES.free,
      };
    }

    // Determine tier from planId
    const planId = subscription.planId?.toLowerCase() || 'base';
    
    let tier: SubscriptionTier = 'free';
    
    if (planId.includes('enterprise') || planId.includes('custom')) {
      tier = 'enterprise';
    } else if (planId.includes('pro') || planId.includes('paid')) {
      tier = 'pro';
    } else {
      tier = 'free';
    }

    return {
      tier,
      planCode: planId !== 'base' ? planId : undefined,
      status: subscription.status || undefined,
      features: TIER_FEATURES[tier],
    };
  } catch (error) {
    console.error('[getSubscriptionInfo] Error:', error);
    // Default to unauthenticated on error
    return {
      tier: 'unauthenticated',
      features: TIER_FEATURES.unauthenticated,
    };
  }
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(feature: keyof SubscriptionInfo['features']): Promise<boolean> {
  const info = await getSubscriptionInfo();
  const featureValue = info.features[feature];
  return typeof featureValue === 'boolean' ? featureValue : false;
}

/**
 * Check if user can make a playground request
 * In production, this would check actual usage against limits
 */
export async function canMakePlaygroundRequest(): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const info = await getSubscriptionInfo();
  
  // Enterprise has unlimited
  if (info.features.playgroundRequestsPerDay === -1) {
    return { allowed: true, remaining: -1 };
  }

  // In production, check actual usage from database
  // For now, always allow but show limits in UI
  return { allowed: true, remaining: info.features.playgroundRequestsPerDay };
}
