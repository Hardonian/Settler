/**
 * Server-side entitlements utilities
 * 
 * Provides getEntitlements() function that checks subscription status
 * and returns features/limits for a tenant
 */

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

export interface Entitlements {
  plan: string;
  features: {
    api_keys: boolean;
    receipts: boolean;
    reconciliation: boolean;
    feature_flags: boolean;
    analytics: boolean;
    webhooks: boolean;
    priority_support?: boolean;
    sso?: boolean;
    custom_integrations?: boolean;
  };
  limits: {
    api_calls_per_month: number;
    receipts_per_month: number;
    reconciliation_runs_per_month: number;
  };
}

/**
 * Get entitlements for a tenant
 * Checks subscription status and returns plan features/limits
 */
export async function getEntitlements(
  tenantId: string,
  userId?: string | null
): Promise<Entitlements> {
  const supabase = await createClient();

  try {
    // Get subscription for tenant
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('tenant_id', tenantId)
      .in('status', ['active', 'trialing'])
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('[Entitlements] Error fetching subscription:', subError);
    }

    // Determine plan
    let plan = 'free';
    if (subscription?.plan) {
      plan = subscription.plan;
    } else {
      // Check tenant plan_hint as fallback
      const { data: tenant } = await supabase
        .from('tenants')
        .select('plan_hint')
        .eq('id', tenantId)
        .single();
      
      if (tenant?.plan_hint) {
        plan = tenant.plan_hint;
      }
    }

    // Get entitlements for plan
    const { data: entitlements, error: entError } = await supabase
      .from('entitlements')
      .select('plan, features, limits')
      .eq('plan', plan)
      .single();

    if (entError || !entitlements) {
      console.error('[Entitlements] Error fetching entitlements:', entError);
      // Return free plan defaults
      return {
        plan: 'free',
        features: {
          api_keys: true,
          receipts: true,
          reconciliation: true,
          feature_flags: false,
          analytics: false,
          webhooks: false,
        },
        limits: {
          api_calls_per_month: 1000,
          receipts_per_month: 100,
          reconciliation_runs_per_month: 10,
        },
      };
    }

    return {
      plan: entitlements.plan,
      features: entitlements.features as Entitlements['features'],
      limits: entitlements.limits as Entitlements['limits'],
    };
  } catch (error) {
    console.error('[Entitlements] Unexpected error:', error);
    // Return free plan defaults on error
    return {
      plan: 'free',
      features: {
        api_keys: true,
        receipts: true,
        reconciliation: true,
        feature_flags: false,
        analytics: false,
        webhooks: false,
      },
      limits: {
        api_calls_per_month: 1000,
        receipts_per_month: 100,
        reconciliation_runs_per_month: 10,
      },
    };
  }
}

/**
 * Check if a feature is enabled for a tenant
 */
export async function hasFeature(
  tenantId: string,
  feature: keyof Entitlements['features']
): Promise<boolean> {
  const entitlements = await getEntitlements(tenantId);
  return entitlements.features[feature] === true;
}

/**
 * Check if usage is within limits
 */
export async function checkLimit(
  tenantId: string,
  limitName: keyof Entitlements['limits'],
  currentUsage: number
): Promise<{ withinLimit: boolean; limit: number; remaining: number }> {
  const entitlements = await getEntitlements(tenantId);
  const limit = entitlements.limits[limitName];
  
  // -1 means unlimited
  if (limit === -1) {
    return { withinLimit: true, limit: -1, remaining: -1 };
  }

  const remaining = Math.max(0, limit - currentUsage);
  return {
    withinLimit: currentUsage < limit,
    limit,
    remaining,
  };
}
