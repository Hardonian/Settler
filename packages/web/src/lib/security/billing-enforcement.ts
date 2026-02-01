/**
 * Billing Enforcement Runtime Guards
 * 
 * CRITICAL: These guards enforce billing and subscription requirements
 * at the runtime level, complementing database-level RLS policies.
 * 
 * These guards MUST be used in all API routes that access paid features.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/observability/logger';
import { checkUserEntitlements } from './entitlement-checks';

export interface BillingEnforcementResult {
  allowed: boolean;
  billingAccountId?: string;
  subscriptionStatus?: 'active' | 'trialing' | 'none' | 'expired';
  planId?: string;
  error?: NextResponse;
  reason?: string;
}

/**
 * Check if user has active subscription
 * This is a runtime guard that complements database RLS policies
 */
export async function requireActiveSubscription(
  _request: NextRequest,
  userId?: string
): Promise<BillingEnforcementResult> {
  try {
    const supabaseClient = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return {
        allowed: false,
        error: NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
          },
          { status: 401 }
        ),
        reason: 'No authenticated user',
      };
    }

    const targetUserId = userId || user.id;

    // Get billing account
    const billingAccountResult = await supabaseClient
      .from('billing_accounts')
      .select('id, status, tenant_id')
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();
    
    const { data: billingAccount, error: billingError } = billingAccountResult;

    if (billingError || !billingAccount || typeof billingAccount !== 'object') {
      return {
        allowed: false,
        error: NextResponse.json(
          {
            error: 'Billing Account Required',
            message: 'Please set up billing to access this feature',
            code: 'BILLING_ACCOUNT_REQUIRED',
            upgrade_required: true,
          },
          { status: 403 }
        ),
        reason: 'No active billing account',
      };
    }

    const billingAccountTyped = billingAccount as {
      id: string;
      status: string;
      tenant_id: string | null;
    };

    // Check for active subscription
    const subscriptionResult = await supabaseClient
      .from('subscriptions')
      .select('id, status, plan_id, trial_end, cancel_at_period_end, cancelled_at')
      .eq('billing_account_id', billingAccountTyped.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const { data: subscription, error: subError } = subscriptionResult;

    if (subError || !subscription) {
      return {
        allowed: false,
        subscriptionStatus: 'none',
        billingAccountId: billingAccountTyped.id,
        error: NextResponse.json(
          {
            error: 'Active Subscription Required',
            message: 'Please subscribe to a plan to access this feature',
            code: 'SUBSCRIPTION_REQUIRED',
            upgrade_required: true,
          },
          { status: 403 }
        ),
        reason: 'No active subscription',
      };
    }

    // Type guard for subscription
    if (!subscription || typeof subscription !== 'object') {
      return {
        allowed: false,
        subscriptionStatus: 'none',
        billingAccountId: billingAccountTyped.id,
        error: NextResponse.json(
          {
            error: 'Active Subscription Required',
            message: 'Please subscribe to a plan to access this feature',
            code: 'SUBSCRIPTION_REQUIRED',
            upgrade_required: true,
          },
          { status: 403 }
        ),
        reason: 'No active subscription',
      };
    }

    const sub = subscription as {
      id: string;
      status: string;
      plan_id: string | null;
      trial_end: string | null;
      cancel_at_period_end: boolean | null;
      cancelled_at: string | null;
    };

    // Check if trial has expired
    if (sub.trial_end) {
      const trialEnd = new Date(sub.trial_end);
      const now = new Date();
      const gracePeriodEnd = new Date(trialEnd);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // 7-day grace period

      if (now > gracePeriodEnd) {
        return {
          allowed: false,
          subscriptionStatus: 'expired',
          billingAccountId: billingAccountTyped.id,
          planId: sub.plan_id || undefined,
          error: NextResponse.json(
            {
              error: 'Pilot Expired',
              message: 'Your pilot has expired. Please upgrade to a paid plan.',
              code: 'PILOT_EXPIRED',
              upgrade_required: true,
              pilot_expired: true,
            },
            { status: 403 }
          ),
          reason: 'Trial/pilot expired',
        };
      }
    }

    // Check if subscription is cancelled but still in period
    if (sub.cancel_at_period_end && sub.cancelled_at) {
      // Still allow access until period ends
      return {
        allowed: true,
        subscriptionStatus: sub.status === 'trialing' ? 'trialing' : 'active',
        billingAccountId: billingAccountTyped.id,
        planId: sub.plan_id || undefined,
      };
    }

    // Additional entitlement check for past_due/unpaid accounts
    const entitlementCheck = await checkUserEntitlements(billingAccountTyped.id);
    if (!entitlementCheck.allowed && entitlementCheck.error) {
      // If billing status is past_due or unpaid, return entitlement error
      return {
        allowed: false,
        subscriptionStatus: sub.status === 'trialing' ? 'trialing' : 'active',
        billingAccountId: billingAccountTyped.id,
        planId: sub.plan_id || undefined,
        error: entitlementCheck.error,
        reason: entitlementCheck.entitlements.message || 'Entitlement check failed',
      };
    }

    return {
      allowed: true,
      subscriptionStatus: sub.status === 'trialing' ? 'trialing' : 'active',
      billingAccountId: billingAccountTyped.id,
      planId: sub.plan_id || undefined,
    };
  } catch (_error) {
    await logger.error('Billing enforcement check failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Fail closed - deny access on error, but return 403 not 500
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: 'Subscription Check Failed',
          message: 'Unable to verify subscription status. Please try again or contact support.',
          code: 'SUBSCRIPTION_CHECK_FAILED',
          retryable: true,
        },
        { status: 403 }
      ),
      reason: 'Error checking subscription',
    };
  }
}

/**
 * Check if user has required plan or higher
 */
export async function requirePlan(
  request: NextRequest,
  minimumPlan: 'free' | 'starter' | 'growth' | 'scale' | 'enterprise',
  userId?: string
): Promise<BillingEnforcementResult> {
  const subscriptionCheck = await requireActiveSubscription(request, userId);
  
  if (!subscriptionCheck.allowed) {
    return subscriptionCheck;
  }

  const planHierarchy: Record<string, number> = {
    free: 0,
    starter: 1,
    growth: 2,
    scale: 3,
    enterprise: 4,
    // Legacy mappings
    base: 1,
    pro: 2,
  };

  const userPlan = subscriptionCheck.planId || 'free';
  const userPlanLevel = planHierarchy[userPlan] ?? 0;
  const requiredPlanLevel = planHierarchy[minimumPlan] ?? 0;

  if (userPlanLevel < requiredPlanLevel) {
    return {
      allowed: false,
      billingAccountId: subscriptionCheck.billingAccountId,
      planId: userPlan,
      subscriptionStatus: subscriptionCheck.subscriptionStatus,
      error: NextResponse.json(
        {
          error: 'Plan Upgrade Required',
          message: `This feature requires ${minimumPlan} plan or higher`,
          code: 'PLAN_UPGRADE_REQUIRED',
          current_plan: userPlan,
          required_plan: minimumPlan,
          upgrade_required: true,
        },
        { status: 403 }
      ),
      reason: `Plan ${userPlan} does not meet requirement ${minimumPlan}`,
    };
  }

  return {
    ...subscriptionCheck,
    allowed: true,
  };
}

/**
 * Check if billing account has add-on purchase
 */
export async function requireAddOn(
  request: NextRequest,
  addOnIntegrationId: string,
  userId?: string
): Promise<BillingEnforcementResult> {
  const subscriptionCheck = await requireActiveSubscription(request, userId);
  
  if (!subscriptionCheck.allowed || !subscriptionCheck.billingAccountId) {
    return subscriptionCheck;
  }

  try {
    const supabaseClient = await createClient();
    
    // Check if add-on is standard (included in base plan)
    const addOnResult = await supabaseClient
      .from('add_ons')
      .select('id, integration_id, is_standard')
      .eq('integration_id', addOnIntegrationId)
      .eq('is_active', true)
      .single();
    
    const { data: addOn, error: addOnError } = addOnResult;

    if (addOnError || !addOn || typeof addOn !== 'object') {
      return {
        allowed: false,
        billingAccountId: subscriptionCheck.billingAccountId,
        error: NextResponse.json(
          {
            error: 'Integration Not Found',
            message: `Integration ${addOnIntegrationId} not found`,
            code: 'INTEGRATION_NOT_FOUND',
          },
          { status: 404 }
        ),
        reason: 'Add-on not found',
      };
    }

    const addOnTyped = addOn as {
      id: string;
      integration_id: string;
      is_standard: boolean;
    };

    // If standard, allow access
    if (addOnTyped.is_standard) {
      return {
        ...subscriptionCheck,
        allowed: true,
      };
    }

    // Check if add-on is purchased
    const purchaseResult = await supabaseClient
      .from('add_on_purchases')
      .select('id, status')
      .eq('billing_account_id', subscriptionCheck.billingAccountId)
      .eq('add_on_id', addOnTyped.id)
      .eq('status', 'active')
      .single();
    
    const { data: purchase, error: purchaseError } = purchaseResult;

    if (purchaseError || !purchase) {
      return {
        allowed: false,
        billingAccountId: subscriptionCheck.billingAccountId,
        error: NextResponse.json(
          {
            error: 'Add-On Required',
            message: `This feature requires the ${addOnIntegrationId} add-on`,
            code: 'ADD_ON_REQUIRED',
            add_on_required: addOnIntegrationId,
            upgrade_required: true,
          },
          { status: 403 }
        ),
        reason: 'Add-on not purchased',
      };
    }

    return {
      ...subscriptionCheck,
      allowed: true,
    };
  } catch (_error) {
    await logger.error('Add-on check failed', {
      error: error instanceof Error ? error.message : String(error),
      add_on: addOnIntegrationId,
    });

    return {
      allowed: false,
      billingAccountId: subscriptionCheck.billingAccountId,
      error: NextResponse.json(
        {
          error: 'Add-On Check Failed',
          message: 'Unable to verify add-on purchase. Please try again or contact support.',
          code: 'ADD_ON_CHECK_FAILED',
          retryable: true,
        },
        { status: 403 }
      ),
      reason: 'Error checking add-on',
    };
  }
}

/**
 * Middleware wrapper for API routes
 * Usage: export const POST = withBillingEnforcement(handler, { requireSubscription: true })
 */
export function withBillingEnforcement<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: {
    requireSubscription?: boolean;
    requirePlan?: 'free' | 'starter' | 'growth' | 'scale' | 'enterprise';
    requireAddOn?: string;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;

    // Check subscription requirement
    if (options.requireSubscription || options.requirePlan || options.requireAddOn) {
      const subscriptionCheck = await requireActiveSubscription(request);
      
      if (!subscriptionCheck.allowed) {
        return subscriptionCheck.error!;
      }

      // Check plan requirement
      if (options.requirePlan) {
        const planCheck = await requirePlan(request, options.requirePlan);
        if (!planCheck.allowed) {
          return planCheck.error!;
        }
      }

      // Check add-on requirement
      if (options.requireAddOn) {
        const addOnCheck = await requireAddOn(request, options.requireAddOn);
        if (!addOnCheck.allowed) {
          return addOnCheck.error!;
        }
      }
    }

    // All checks passed, call handler
    return handler(...args);
  }) as T;
}
