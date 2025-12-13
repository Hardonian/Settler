/**
 * Plan Configuration
 * 
 * Defines subscription plans with usage limits for all Settler services.
 * Each plan includes limits for Reconcile, Receipts, and Feature Flags.
 */

export type PlanCode = 'free' | 'pro' | 'scale';

export type ServiceCode = 'reconcile' | 'receipts' | 'featureFlags';

export interface ServiceLimits {
  reconcile: {
    monthlyCalls: number; // Monthly included API calls
    rateLimit?: number; // Calls per minute (optional)
  };
  receipts: {
    monthlyCalls: number; // Monthly included receipt parses
    rateLimit?: number; // Parses per minute (optional)
  };
  featureFlags: {
    monthlyEvaluations: number; // Monthly flag evaluations (generous for free tier)
    rateLimit?: number; // Evaluations per minute (optional)
  };
}

export interface PlanConfig {
  code: PlanCode;
  name: string;
  description: string;
  stripePriceId?: string; // Stripe Price ID for monthly billing
  stripeAnnualPriceId?: string; // Stripe Price ID for annual billing
  monthlyPrice?: number; // Monthly price in USD
  annualPrice?: number; // Annual price in USD (if different)
  limits: ServiceLimits;
  features: {
    reconcile: boolean;
    receipts: boolean;
    featureFlags: boolean; // Always true - free dev toolkit
    prioritySupport: boolean;
    customIntegrations: boolean;
  };
}

/**
 * Plan configurations
 */
export const planConfigs: Record<PlanCode, PlanConfig> = {
  free: {
    code: 'free',
    name: 'Free',
    description: 'Perfect for getting started and small projects',
    limits: {
      reconcile: {
        monthlyCalls: 1000, // 1,000 reconciliation jobs/month
      },
      receipts: {
        monthlyCalls: 100, // 100 receipt parses/month
      },
      featureFlags: {
        monthlyEvaluations: 100000, // 100k evaluations/month (generous free tier)
      },
    },
    features: {
      reconcile: true,
      receipts: true,
      featureFlags: true,
      prioritySupport: false,
      customIntegrations: false,
    },
  },
  pro: {
    code: 'pro',
    name: 'Pro',
    description: 'For growing businesses with higher usage needs',
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || process.env.STRIPE_PRICE_ID_PRO || undefined,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_PRO_ANNUAL || undefined,
    monthlyPrice: 99,
    annualPrice: 990, // ~17% discount
    limits: {
      reconcile: {
        monthlyCalls: 100000, // 100k reconciliation jobs/month
        rateLimit: 100, // 100 calls/minute
      },
      receipts: {
        monthlyCalls: 10000, // 10k receipt parses/month
        rateLimit: 50, // 50 parses/minute
      },
      featureFlags: {
        monthlyEvaluations: 1000000, // 1M evaluations/month
        rateLimit: 1000, // 1k evaluations/minute
      },
    },
    features: {
      reconcile: true,
      receipts: true,
      featureFlags: true,
      prioritySupport: true,
      customIntegrations: false,
    },
  },
  scale: {
    code: 'scale',
    name: 'Scale',
    description: 'For large organizations with high-volume needs',
    stripePriceId: process.env.STRIPE_PRICE_ID_SCALE_MONTHLY || process.env.STRIPE_PRICE_ID_SCALE || undefined,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_SCALE_ANNUAL || undefined,
    monthlyPrice: 499,
    annualPrice: 4990, // ~17% discount
    limits: {
      reconcile: {
        monthlyCalls: 1000000, // 1M reconciliation jobs/month
        rateLimit: 500, // 500 calls/minute
      },
      receipts: {
        monthlyCalls: 100000, // 100k receipt parses/month
        rateLimit: 200, // 200 parses/minute
      },
      featureFlags: {
        monthlyEvaluations: 10000000, // 10M evaluations/month
        rateLimit: 5000, // 5k evaluations/minute
      },
    },
    features: {
      reconcile: true,
      receipts: true,
      featureFlags: true,
      prioritySupport: true,
      customIntegrations: true,
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
    base: 'free',
    pro: 'pro',
    enterprise: 'scale',
  };
  return mapping[planId] || 'free';
}

/**
 * Get service limit for a plan
 */
export function getServiceLimit(
  planCode: PlanCode,
  service: ServiceCode
): number {
  const plan = planConfigs[planCode];
  if (!plan) {
    return 0;
  }

  switch (service) {
    case 'reconcile':
      return plan.limits.reconcile.monthlyCalls;
    case 'receipts':
      return plan.limits.receipts.monthlyCalls;
    case 'featureFlags':
      return plan.limits.featureFlags.monthlyEvaluations;
    default:
      return 0;
  }
}
