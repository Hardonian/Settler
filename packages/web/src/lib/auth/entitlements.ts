/**
 * Entitlements System
 * 
 * Provides clear entitlement primitives for unauthenticated, authenticated, and paid users.
 * Used throughout the app to gate features by subscription level.
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';

export interface Entitlements {
  isAuthed: boolean;
  role: 'admin' | 'user';
  plan: 'free' | 'pro' | 'enterprise';
  isPaid: boolean;
  userId?: string;
}

/**
 * Get user entitlements
 * Returns safe defaults if auth/database fails
 */
export async function getEntitlements(): Promise<Entitlements> {
  const defaults: Entitlements = {
    isAuthed: false,
    role: 'user',
    plan: 'free',
    isPaid: false,
  };

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return defaults;
    }

    // Get user profile and subscription
    let role: 'admin' | 'user' = 'user';
    let plan: 'free' | 'pro' | 'enterprise' = 'free';
    let isPaid = false;

    try {
      // Try to get profile from Supabase (if using Supabase profiles table)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileError && profile) {
        const profileData = profile as { role?: string } | null;
        if (profileData && profileData.role === 'admin') {
          role = 'admin';
        }
      }

      // Try to get subscription from Prisma (if available)
      // Subscriptions are linked via billing_accounts table
      if (prisma && typeof prisma.billingAccount !== 'undefined') {
        try {
          const billingAccount = await prisma.billingAccount.findFirst({
            where: { userId: user.id },
            include: {
              subscriptions: {
                where: {
                  status: {
                    in: ['active', 'trialing'],
                  },
                  currentPeriodEnd: {
                    gt: new Date(), // Not expired
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1,
              },
            },
          });

          if (billingAccount?.subscriptions?.[0]) {
            const subscription = billingAccount.subscriptions[0];
            isPaid = true;
            
            // Map subscription planName or planId to entitlement plan
            const planName = subscription.planName || subscription.planId || '';
            if (planName.toLowerCase().includes('enterprise')) {
              plan = 'enterprise';
            } else if (planName.toLowerCase().includes('pro')) {
              plan = 'pro';
            }
          }
        } catch (dbError) {
          // Database query failed - use defaults
          console.warn('[Entitlements] Failed to query subscription:', dbError);
        }
      }

      // Fallback: Check Supabase subscriptions table via billing_accounts if Prisma unavailable
      if (!isPaid) {
        try {
          const { data: billingAccount, error: billingError } = await supabase
            .from('billing_accounts')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          if (!billingError && billingAccount) {
            const billingAccountData = billingAccount as { id?: string } | null;
            if (billingAccountData && billingAccountData.id) {
              const billingAccountId = billingAccountData.id;
              const { data: subscription, error: subError } = await supabase
                .from('subscriptions')
                .select('status, plan_name, plan_id, current_period_end')
                .eq('billing_account_id', billingAccountId)
                .in('status', ['active', 'trialing'])
                .gt('current_period_end', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (!subError && subscription) {
                const subscriptionData = subscription as { plan_name?: string | null; plan_id?: string | null } | null;
                if (subscriptionData) {
                  const planName = subscriptionData.plan_name || subscriptionData.plan_id || '';
                  if (planName && typeof planName === 'string') {
                    isPaid = true;
                    if (planName.toLowerCase().includes('enterprise')) {
                      plan = 'enterprise';
                    } else if (planName.toLowerCase().includes('pro')) {
                      plan = 'pro';
                    }
                  }
                }
              }
            }
          }
        } catch {
          // Supabase query failed - use defaults
          console.warn('[Entitlements] Failed to query Supabase subscription:', supabaseError);
        }
      }
    } catch {
      // Profile/subscription lookup failed - use defaults
      console.warn('[Entitlements] Failed to get user profile/subscription:', error);
    }

    return {
      isAuthed: true,
      role,
      plan,
      isPaid,
      userId: user.id,
    };
  } catch {
    // Auth check failed - return defaults
    console.warn('[Entitlements] Failed to get entitlements:', error);
    return defaults;
  }
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(feature: 'premium' | 'enterprise'): Promise<boolean> {
  const entitlements = await getEntitlements();
  
  if (!entitlements.isAuthed) {
    return false;
  }

  if (feature === 'enterprise') {
    return entitlements.plan === 'enterprise';
  }

  if (feature === 'premium') {
    return entitlements.isPaid || entitlements.plan === 'pro' || entitlements.plan === 'enterprise';
  }

  return false;
}
