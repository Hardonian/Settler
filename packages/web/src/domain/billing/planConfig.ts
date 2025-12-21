/**
 * Plan Configuration
 * 
 * Pricing Model: Simple Subscription + Usage-Based Overage
 * 
 * Core principle: Simple, transparent pricing with predictable base costs.
 * Overage pricing applies for usage beyond included limits.
 * Exception supervision model: 1% exception rate included, $0.10 per exception requiring review.
 */

export type PlanCode = 'free' | 'starter' | 'growth' | 'scale' | 'enterprise';

export type ServiceCode = 'reconcile' | 'exceptions';

/**
 * Service limits - reconciliation volume and exception supervision
 */
export interface ServiceLimits {
  reconcile: {
    monthlyVolume: number; // Monthly reconciliation volume included
    pricePerReconciliation: number; // Price per reconciliation over included volume ($0.01)
  };
  exceptions: {
    includedRate: number; // Included exception rate (e.g., 0.01 = 1%)
    pricePerException: number; // Price per exception requiring review ($0.10)
  };
}

export interface PlanConfig {
  code: PlanCode;
  name: string;
  description: string;
  stripePriceId?: string; // Stripe Price ID for paid plans
  monthlyPrice: number; // Monthly price in USD (0 for free/starter)
  limits: ServiceLimits;
  // All features included - no feature gating
  // Only scale, depth, and automation intensity are gated
}

/**
 * Plan configurations
 * 
 * Pricing aligned with public documentation:
 * - Free: $0/month - 1,000 reconciliations/month
 * - Starter: $29/month - 10,000 reconciliations/month
 * - Growth: $99/month - 100,000 reconciliations/month
 * - Scale: $299/month - 1,000,000 reconciliations/month
 * - Enterprise: Custom pricing - Unlimited
 * 
 * Overage: $0.01 per reconciliation beyond included volume
 * Exception Supervision: 1% exception rate included, $0.10 per exception requiring review
 */
export const planConfigs: Record<PlanCode, PlanConfig> = {
  free: {
    code: 'free',
    name: 'Free',
    description: 'Perfect for testing and small projects',
    monthlyPrice: 0,
    limits: {
      reconcile: {
        monthlyVolume: 1000, // 1k reconciliations included free
        pricePerReconciliation: 0.01, // $0.01 per reconciliation over 1k
      },
      exceptions: {
        includedRate: 0.01, // 1% exception rate included (10 exceptions auto-explained)
        pricePerException: 0.10, // $0.10 per exception requiring review
      },
    },
  },
  starter: {
    code: 'starter',
    name: 'Starter',
    description: 'Perfect for small e-commerce stores, early-stage SaaS',
    stripePriceId: process.env.STRIPE_PRICE_ID_STARTER || undefined,
    monthlyPrice: 29, // $29/month as documented
    limits: {
      reconcile: {
        monthlyVolume: 10000, // 10k reconciliations included
        pricePerReconciliation: 0.01, // $0.01 per reconciliation over 10k
      },
      exceptions: {
        includedRate: 0.01, // 1% exception rate included (100 exceptions auto-explained)
        pricePerException: 0.10, // $0.10 per exception requiring review
      },
    },
  },
  growth: {
    code: 'growth',
    name: 'Growth',
    description: 'Perfect for mid-market SaaS, growing e-commerce',
    stripePriceId: process.env.STRIPE_PRICE_ID_GROWTH || undefined,
    monthlyPrice: 99, // $99/month as documented
    limits: {
      reconcile: {
        monthlyVolume: 100000, // 100k reconciliations included
        pricePerReconciliation: 0.01, // $0.01 per reconciliation over 100k
      },
      exceptions: {
        includedRate: 0.01, // 1% exception rate included (1,000 exceptions auto-explained)
        pricePerException: 0.10, // $0.10 per exception requiring review
      },
    },
  },
  scale: {
    code: 'scale',
    name: 'Scale',
    description: 'Perfect for large e-commerce, enterprise SaaS',
    stripePriceId: process.env.STRIPE_PRICE_ID_SCALE || undefined,
    monthlyPrice: 299, // $299/month as documented
    limits: {
      reconcile: {
        monthlyVolume: 1000000, // 1M reconciliations included
        pricePerReconciliation: 0.01, // $0.01 per reconciliation over 1M
      },
      exceptions: {
        includedRate: 0.01, // 1% exception rate included (10,000 exceptions auto-explained)
        pricePerException: 0.10, // $0.10 per exception requiring review
      },
    },
  },
  enterprise: {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'Custom volume and exception thresholds',
    monthlyPrice: 0, // Custom pricing
    limits: {
      reconcile: {
        monthlyVolume: 0, // Custom volume (unlimited)
        pricePerReconciliation: 0.008, // Volume discount
      },
      exceptions: {
        includedRate: 0.015, // 1.5% exception rate included (custom threshold)
        pricePerException: 0.08, // Volume discount on exceptions
      },
    },
  },
};

/**
 * Get plan configuration by code
 */
export function getPlanConfig(planCode: string): PlanConfig | null {
  const code = planCode as PlanCode;
  if (code in planConfigs) {
    return planConfigs[code];
  }
  return null;
}

/**
 * Get default plan (free)
 */
export function getDefaultPlan(): PlanConfig {
  return planConfigs.free;
}

/**
 * Map legacy planId to new planCode
 */
export function mapLegacyPlanId(planId: string): PlanCode {
  const mapping: Record<string, PlanCode> = {
    base: 'starter',
    free: 'free',
    pro: 'growth',
    commercial: 'growth',
    enterprise: 'enterprise',
    scale: 'scale',
  };
  return mapping[planId] || 'free';
}

/**
 * Get reconciliation volume limit for a plan
 */
export function getReconciliationVolumeLimit(planCode: PlanCode): number {
  const plan = planConfigs[planCode];
  if (!plan) {
    return planConfigs.free.limits.reconcile.monthlyVolume;
  }
  return plan.limits.reconcile.monthlyVolume;
}

/**
 * Get exception threshold for a plan
 */
export function getExceptionThreshold(planCode: PlanCode, reconciliationVolume: number): number {
  const plan = planConfigs[planCode];
  if (!plan) {
    return Math.floor(reconciliationVolume * planConfigs.free.limits.exceptions.includedRate);
  }
  return Math.floor(reconciliationVolume * plan.limits.exceptions.includedRate);
}

/**
 * Calculate monthly cost for a plan
 */
export function calculateMonthlyCost(
  planCode: PlanCode,
  reconciliationVolume: number,
  exceptionsRequiringReview: number
): number {
  const plan = planConfigs[planCode];
  if (!plan) {
    return 0;
  }

  // Base plan price
  let cost = plan.monthlyPrice;

  // Overage for reconciliations
  const includedVolume = plan.limits.reconcile.monthlyVolume;
  if (reconciliationVolume > includedVolume) {
    const overage = reconciliationVolume - includedVolume;
    cost += overage * plan.limits.reconcile.pricePerReconciliation;
  }

  // Overage for exceptions
  const includedExceptions = getExceptionThreshold(planCode, reconciliationVolume);
  if (exceptionsRequiringReview > includedExceptions) {
    const exceptionOverage = exceptionsRequiringReview - includedExceptions;
    cost += exceptionOverage * plan.limits.exceptions.pricePerException;
  }

  return cost;
}
