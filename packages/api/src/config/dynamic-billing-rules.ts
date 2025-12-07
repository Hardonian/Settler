/**
 * Dynamic Billing Rules Configuration
 *
 * Allows billing tiers and rules to be configured dynamically
 * without code changes.
 */

export interface BillingTier {
  id: string;
  name: string;
  base_price_monthly: number;
  limits: {
    reconciliation_jobs: number; // -1 for unlimited
    api_requests: number;
    webhook_events: number;
    db_queries: number;
    ai_requests: number;
    auth_users: number;
    storage_gb: number;
  };
  features: string[];
  metadata?: Record<string, unknown>;
}

export interface UsagePricingRule {
  event_type: string;
  base_limit: number; // Included in base plan
  overage_price_per_unit: number;
  unit: string;
  tier_multipliers?: Record<string, number>; // Multiplier per tier
}

/**
 * Default billing tiers
 */
export const BILLING_TIERS: Record<string, BillingTier> = {
  base: {
    id: "base",
    name: "Settler Core",
    base_price_monthly: 49.95,
    limits: {
      reconciliation_jobs: 10000,
      api_requests: 100000,
      webhook_events: 50000,
      db_queries: 500000,
      ai_requests: 1000,
      auth_users: 1000,
      storage_gb: 10,
    },
    features: ["core_reconciliation", "standard_integrations", "basic_analytics", "email_support"],
  },
  pro: {
    id: "pro",
    name: "Settler Pro",
    base_price_monthly: 149.95,
    limits: {
      reconciliation_jobs: 50000,
      api_requests: 500000,
      webhook_events: 250000,
      db_queries: 2500000,
      ai_requests: 5000,
      auth_users: 5000,
      storage_gb: 50,
    },
    features: [
      "core_reconciliation",
      "standard_integrations",
      "advanced_analytics",
      "sql_editor",
      "realtime_dashboards",
      "high_volume_api",
      "priority_support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Settler Enterprise",
    base_price_monthly: 499.95,
    limits: {
      reconciliation_jobs: -1, // unlimited
      api_requests: -1,
      webhook_events: -1,
      db_queries: -1,
      ai_requests: -1,
      auth_users: -1,
      storage_gb: 100,
    },
    features: [
      "core_reconciliation",
      "standard_integrations",
      "advanced_analytics",
      "sql_editor",
      "realtime_dashboards",
      "high_volume_api",
      "custom_integrations",
      "dedicated_support",
      "sla_guarantees",
    ],
  },
};

/**
 * Usage pricing rules
 */
export const USAGE_PRICING_RULES: Record<string, UsagePricingRule> = {
  reconciliation_job: {
    event_type: "reconciliation_job",
    base_limit: 10000,
    overage_price_per_unit: 0.05,
    unit: "job",
    tier_multipliers: {
      base: 1.0,
      pro: 0.8, // 20% discount
      enterprise: 0.5, // 50% discount
    },
  },
  api_request: {
    event_type: "api_request",
    base_limit: 100000,
    overage_price_per_unit: 0.001,
    unit: "request",
  },
  webhook_event: {
    event_type: "webhook_event",
    base_limit: 50000,
    overage_price_per_unit: 0.002,
    unit: "event",
  },
  db_query: {
    event_type: "db_query",
    base_limit: 500000,
    overage_price_per_unit: 0.0001,
    unit: "query",
  },
  ai_request: {
    event_type: "ai_request",
    base_limit: 1000,
    overage_price_per_unit: 0.1,
    unit: "request",
  },
};

/**
 * Get billing tier configuration
 */
export function getBillingTier(tierId: string): BillingTier | null {
  return BILLING_TIERS[tierId] || null;
}

/**
 * Get usage pricing rule
 */
export function getUsagePricingRule(eventType: string): UsagePricingRule | null {
  return USAGE_PRICING_RULES[eventType] || null;
}

/**
 * Calculate overage cost
 */
export function calculateOverageCost(
  eventType: string,
  usage: number,
  limit: number,
  tierId: string = "base"
): number {
  if (limit === -1 || usage <= limit) {
    return 0; // Unlimited or within limit
  }

  const rule = getUsagePricingRule(eventType);
  if (!rule) {
    return 0; // No pricing rule
  }

  const overage = usage - limit;
  const basePrice = rule.overage_price_per_unit;
  const multiplier = rule.tier_multipliers?.[tierId] || 1.0;

  return overage * basePrice * multiplier;
}

/**
 * Get plan limit for event type
 */
export function getPlanLimit(tierId: string, eventType: string): number {
  const tier = getBillingTier(tierId);
  if (!tier) {
    return 0;
  }

  const limitKey = eventType as keyof typeof tier.limits;
  return tier.limits[limitKey] || 0;
}

/**
 * Get all billing tiers
 */
export function getAllBillingTiers(): Record<string, BillingTier> {
  return BILLING_TIERS;
}

/**
 * Update billing tier dynamically
 */
export async function updateBillingTier(
  tierId: string,
  updates: Partial<BillingTier>,
  _supabase: any
): Promise<boolean> {
  // In production, update in database or config store
  // For now, update in-memory config
  if (BILLING_TIERS[tierId]) {
    BILLING_TIERS[tierId] = { ...BILLING_TIERS[tierId], ...updates };
    return true;
  }
  return false;
}
