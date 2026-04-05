/**
 * Plan Configuration
 * 
 * Pricing Model: Volume + Exception Supervision
 * 
 * Core principle: Pricing scales with reliance, not curiosity.
 * Reconciliation is a system behavior - pricing reflects volume and exception supervision.
 */

export type PlanCode = 'starter' | 'growth' | 'scale' | 'enterprise';

export type ServiceCode = 'reconcile' | 'exceptions';

/**
 * Simplified service limits - only reconciliation volume and exceptions
 */
export interface ServiceLimits {
  reconcile: {
    monthlyVolume: number; // Monthly reconciliation volume included
    pricePerReconciliation: number; // Price per reconciliation over included volume
  };
  exceptions: {
    includedRate: number; // Included exception rate (e.g., 0.01 = 1%)
    pricePerException: number; // Price per exception requiring review
  };
}

export interface PlanConfig {
  code: PlanCode;
  name: string;
  description: string;
  stripePriceId?: string; // Stripe Price ID for paid plans
  monthlyPrice: number; // Monthly price in USD (0 for starter)
  limits: ServiceLimits;
  // All features included - no feature gating
  // Only scale, depth, and automation intensity are gated
}

/**
 * Plan configurations
 * 
 * Model: Volume + Exception Supervision
 * Pricing scales with reliance, not curiosity
 */
export const planConfigs: Record<PlanCode, PlanConfig> = {
  starter: {
    code: 'starter',
    name: 'Starter',
    description: 'First 10,000 reconciliations free',
    monthlyPrice: 0,
    limits: {
      reconcile: {
        monthlyVolume: 10000, // 10k reconciliations included free
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
    description: 'For growing businesses',
    stripePriceId: process.env.STRIPE_PRICE_ID_GROWTH || undefined,
    monthlyPrice: 900, // 100k × $0.01 - 10k free = $900
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
    description: 'For high-volume operations',
    stripePriceId: process.env.STRIPE_PRICE_ID_SCALE || undefined,
    monthlyPrice: 9900, // 1M × $0.01 - 10k free = $9,900
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
        monthlyVolume: 0, // Custom volume
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
 * Get default plan (starter)
 */
export function getDefaultPlan(): PlanConfig {
  return planConfigs.starter;
}

/**
 * Map legacy planId to new planCode
 */
export function mapLegacyPlanId(planId: string): PlanCode {
  const normalized = planId?.trim().toLowerCase() ?? "";
  if (normalized === "starter" || normalized === "growth" || normalized === "scale") {
    return normalized;
  }
  const mapping: Record<string, PlanCode> = {
    base: "starter",
    free: "starter",
    trial: "starter",
    pro: "growth",
    commercial: "growth",
    enterprise: "enterprise",
    scale: "scale",
  };
  return mapping[normalized] || "starter";
}

/**
 * Get reconciliation volume limit for a plan
 */
export function getReconciliationVolumeLimit(planCode: PlanCode): number {
  const plan = planConfigs[planCode];
  if (!plan) {
    return planConfigs.starter.limits.reconcile.monthlyVolume;
  }
  return plan.limits.reconcile.monthlyVolume;
}

/**
 * Get exception threshold for a plan
 */
export function getExceptionThreshold(planCode: PlanCode, reconciliationVolume: number): number {
  const plan = planConfigs[planCode];
  if (!plan) {
    return Math.floor(reconciliationVolume * planConfigs.starter.limits.exceptions.includedRate);
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
