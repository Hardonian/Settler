import { createClient } from './supabase/server';
import { SubscriptionTier, SubscriptionStatus, determineSubscriptionTier, getAccessLevel } from './subscription-access';

/**
 * Get current user's subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return {
      tier: 'unsubscribed',
      hasSubscription: false,
      isPaid: false,
      isEnterprise: false,
    };
  }

  // Get tenant_id from user metadata or memberships
  let tenantId: string | null = null;
  
  // Try to get tenant from memberships
  const { data: membership } = await supabase
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  tenantId = membership?.tenant_id || null;
  
  // If no membership, try to get from billing_accounts
  if (!tenantId) {
    const { data: billingAccount } = await supabase
      .from('billing_accounts')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    tenantId = billingAccount?.tenant_id || null;
  }

  // Get subscription
  let subscription: {
    id?: string;
    status?: string;
    plan_name?: string;
    plan_id?: string;
    current_period_end?: Date | string;
    billing_account_id?: string;
    tenant_id?: string;
  } | null = null;
  let billingAccount: {
    id?: string;
    status?: string;
  } | null = null;

  if (tenantId) {
    // Get subscription by tenant
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('id, status, plan_name, plan_id, current_period_end, tenant_id, billing_account_id')
      .eq('tenant_id', tenantId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    subscription = subData ?? null;

    // Get billing account
    if (subData?.billing_account_id) {
      const { data: billingData } = await supabase
        .from('billing_accounts')
        .select('id, status')
        .eq('id', subData.billing_account_id)
        .single();
      
      billingAccount = billingData;
    } else {
      // Try to get billing account by tenant
      const { data: billingData } = await supabase
        .from('billing_accounts')
        .select('id, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      billingAccount = billingData;
    }
  } else {
    // Fallback: try to get subscription by user_id
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('id, status, plan_name, plan_id, current_period_end, billing_account_id')
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    subscription = subData ?? null;

    if (subscription?.billing_account_id) {
      const { data: billingData } = await supabase
        .from('billing_accounts')
        .select('id, status')
        .eq('id', subscription.billing_account_id)
        .single();
      
      billingAccount = billingData;
    }
  }

  const tier = determineSubscriptionTier(subscription, billingAccount);
  const access = getAccessLevel(tier);

  return {
    tier,
    hasSubscription: !!subscription,
    isPaid: tier === 'subscribed_paid' || tier === 'enterprise',
    isEnterprise: tier === 'enterprise',
    planName: subscription?.plan_name,
    subscriptionId: subscription?.id,
  };
}
