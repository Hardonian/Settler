/**
 * SIMPLIFIED PRICING MODEL
 * 
 * Core value: "$0.01 per transaction"
 * 
 * This replaces the complex tiered model with a simple usage-based model.
 */

export interface PricingPlan {
  id: string;
  name: string;
  basePriceMonthly: number; // Base monthly fee (can be $0)
  pricePerTransaction: number; // Price per transaction processed
  includedTransactions: number; // Transactions included in base price
  description: string;
}

/**
 * SIMPLIFIED PRICING PLANS
 * 
 * Single base plan + usage-based pricing
 */
export const PRICING_PLANS: Record<string, PricingPlan> = {
  // Free tier: Limited transactions, no base fee
  free: {
    id: 'free',
    name: 'Free',
    basePriceMonthly: 0,
    pricePerTransaction: 0.01, // Still track, but free tier
    includedTransactions: 100, // 100 free transactions/month
    description: '100 transactions/month free, then $0.01 per transaction',
  },

  // Starter: Base fee + usage
  starter: {
    id: 'starter',
    name: 'Starter',
    basePriceMonthly: 29, // $29/month base
    pricePerTransaction: 0.01,
    includedTransactions: 1000, // 1000 transactions included
    description: '$29/month + $0.01 per transaction over 1,000',
  },

  // Growth: Higher base, more included
  growth: {
    id: 'growth',
    name: 'Growth',
    basePriceMonthly: 99, // $99/month base
    pricePerTransaction: 0.01,
    includedTransactions: 10000, // 10,000 transactions included
    description: '$99/month + $0.01 per transaction over 10,000',
  },

  // Enterprise: Custom pricing
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    basePriceMonthly: 0, // Custom
    pricePerTransaction: 0.01, // Can be negotiated lower
    includedTransactions: 0, // Custom
    description: 'Custom pricing, volume discounts available',
  },
};

/**
 * Calculate monthly cost for a plan given transaction count
 */
export function calculateMonthlyCost(
  planId: string,
  transactionCount: number
): number {
  const plan = PRICING_PLANS[planId];
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  const basePrice = plan.basePriceMonthly;
  const overage = Math.max(0, transactionCount - plan.includedTransactions);
  const usageCost = overage * plan.pricePerTransaction;

  return basePrice + usageCost;
}

/**
 * Get plan by ID
 */
export function getPlan(planId: string): PricingPlan {
  const plan = PRICING_PLANS[planId];
  if (!plan) {
    // Default to free if plan not found
    return PRICING_PLANS.free;
  }
  return plan;
}

/**
 * Check if transaction count exceeds plan limits
 */
export function exceedsPlanLimit(
  planId: string,
  transactionCount: number
): boolean {
  const plan = getPlan(planId);
  // For free tier, check against included transactions
  // For paid tiers, no hard limit (just billing)
  if (planId === 'free') {
    return transactionCount > plan.includedTransactions;
  }
  return false; // Paid plans have no hard limit
}

/**
 * Get usage-based pricing explanation
 */
export function getPricingExplanation(planId: string): string {
  const plan = getPlan(planId);
  return plan.description;
}
