/**
 * Subscription Access Control
 * 
 * Defines access levels based on subscription tier:
 * - unsubscribed: No subscription
 * - subscribed_unpaid: Has subscription but payment failed/pending
 * - subscribed_paid: Active paid subscription
 * - enterprise: Enterprise plan
 */

export type SubscriptionTier = 
  | 'unsubscribed'
  | 'subscribed_unpaid'
  | 'subscribed_paid'
  | 'enterprise';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  hasSubscription: boolean;
  isPaid: boolean;
  isEnterprise: boolean;
  planName?: string;
  subscriptionId?: string;
}

export interface AccessLevel {
  canViewTables: boolean;
  canEditTables: boolean;
  canTestAPI: boolean;
  canViewWebhooks: boolean;
  canViewFeatureFlags: boolean;
  canViewReconciliation: boolean;
  canViewReceipts: boolean;
  canViewUsage: boolean;
  canViewBilling: boolean;
  maxTablesPerRequest: number;
  maxAPIRequestsPerDay: number;
}

const ACCESS_LEVELS: Record<SubscriptionTier, AccessLevel> = {
  unsubscribed: {
    canViewTables: false,
    canEditTables: false,
    canTestAPI: false,
    canViewWebhooks: false,
    canViewFeatureFlags: false,
    canViewReconciliation: false,
    canViewReceipts: true, // Limited to receipts only
    canViewUsage: false,
    canViewBilling: false,
    maxTablesPerRequest: 10,
    maxAPIRequestsPerDay: 100,
  },
  subscribed_unpaid: {
    canViewTables: true,
    canEditTables: false, // Read-only
    canTestAPI: true,
    canViewWebhooks: true,
    canViewFeatureFlags: true,
    canViewReconciliation: true,
    canViewReceipts: true,
    canViewUsage: true,
    canViewBilling: true,
    maxTablesPerRequest: 50,
    maxAPIRequestsPerDay: 1000,
  },
  subscribed_paid: {
    canViewTables: true,
    canEditTables: true,
    canTestAPI: true,
    canViewWebhooks: true,
    canViewFeatureFlags: true,
    canViewReconciliation: true,
    canViewReceipts: true,
    canViewUsage: true,
    canViewBilling: true,
    maxTablesPerRequest: 100,
    maxAPIRequestsPerDay: 10000,
  },
  enterprise: {
    canViewTables: true,
    canEditTables: true,
    canTestAPI: true,
    canViewWebhooks: true,
    canViewFeatureFlags: true,
    canViewReconciliation: true,
    canViewReceipts: true,
    canViewUsage: true,
    canViewBilling: true,
    maxTablesPerRequest: 1000,
    maxAPIRequestsPerDay: 100000,
  },
};

/**
 * Determine subscription tier from database records
 */
export function determineSubscriptionTier(
  subscription: {
    status?: string;
    plan_name?: string;
    plan_id?: string;
    current_period_end?: Date | string;
  } | null,
  billingAccount: {
    status?: string;
  } | null
): SubscriptionTier {
  // No subscription at all
  if (!subscription) {
    return 'unsubscribed';
  }

  // Check if enterprise plan
  const planName = (subscription.plan_name || subscription.plan_id || '').toLowerCase();
  if (planName.includes('enterprise') || planName.includes('enterprise')) {
    return 'enterprise';
  }

  // Check subscription status
  const status = (subscription.status || '').toLowerCase();
  
  // Active subscription
  if (status === 'active') {
    // Check if billing account is active and paid
    const billingStatus = (billingAccount?.status || '').toLowerCase();
    if (billingStatus === 'active' && billingAccount) {
      // Check if payment is current (period hasn't ended)
      if (subscription.current_period_end) {
        const periodEnd = new Date(subscription.current_period_end);
        const now = new Date();
        if (periodEnd > now) {
          return 'subscribed_paid';
        }
      }
      // If no period end info, assume paid if status is active
      return 'subscribed_paid';
    }
    // Active subscription but billing issues
    return 'subscribed_unpaid';
  }

  // Cancelled, past_due, etc.
  if (status === 'cancelled' || status === 'past_due' || status === 'unpaid') {
    return 'subscribed_unpaid';
  }

  // Default to unpaid if subscription exists but status unclear
  return 'subscribed_unpaid';
}

/**
 * Get access level for a subscription tier
 */
export function getAccessLevel(tier: SubscriptionTier): AccessLevel {
  return ACCESS_LEVELS[tier];
}

/**
 * Check if user has access to a feature
 */
export function hasAccess(
  tier: SubscriptionTier,
  feature: keyof AccessLevel
): boolean {
  const access = getAccessLevel(tier);
  return access[feature] as boolean;
}
