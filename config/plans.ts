/**
 * Plan Configuration (DEPRECATED - Use pricing-simple.ts instead)
 *
 * This file is kept for backward compatibility but pricing-simple.ts is the source of truth.
 * 
 * @deprecated Use pricing-simple.ts for new code
 */

export type PlanType = "free" | "trial" | "commercial" | "enterprise";

export interface PlanFeatures {
  cookbooks: string[] | "all";
  docs: string[] | "all";
  playground: {
    runsPerDay: number | "unlimited";
    advancedFeatures: boolean;
  };
  consulting: boolean;
  emailAnalysis: {
    enabled: boolean;
    reportsPerMonth: number | "unlimited";
  };
  newsFeed: {
    personalized: boolean;
    aiGenerated: boolean;
  };
  workflows: {
    maxWorkflows: number | "unlimited";
    advancedWorkflows: boolean;
  };
  support: "community" | "email" | "priority" | "dedicated";
}

export interface Plan {
  name: string;
  type: PlanType;
  price: string;
  period: string;
  features: PlanFeatures;
  limits: {
    reconciliationsPerMonth: number | "unlimited";
    logRetentionDays: number | "unlimited";
    platformAdapters: number | "unlimited";
  };
}

export const plans: Record<PlanType, Plan> = {
  free: {
    name: "Free",
    type: "free",
    price: "$0",
    period: "forever",
    features: {
      cookbooks: ["ecommerce-shopify-stripe", "scheduled-reconciliations", "error-handling"],
      docs: ["getting-started", "installation", "api-reference-basic"],
      playground: {
        runsPerDay: 3,
        advancedFeatures: false,
      },
      consulting: false,
      emailAnalysis: {
        enabled: true,
        reportsPerMonth: 5,
      },
      newsFeed: {
        personalized: false,
        aiGenerated: true,
      },
      workflows: {
        maxWorkflows: 2,
        advancedWorkflows: false,
      },
      support: "community",
    },
    limits: {
      reconciliationsPerMonth: 1000,
      logRetentionDays: 7,
      platformAdapters: 2,
    },
  },
  trial: {
    name: "Free Trial",
    type: "trial",
    price: "$0",
    period: "30 days",
    features: {
      cookbooks: "all", // Full access during trial
      docs: "all", // Full access during trial
      playground: {
        runsPerDay: "unlimited", // Unlimited during trial
        advancedFeatures: true,
      },
      consulting: false, // Self-service onboarding with guides
      emailAnalysis: {
        enabled: true,
        reportsPerMonth: "unlimited",
      },
      newsFeed: {
        personalized: true, // If pre-test completed
        aiGenerated: true,
      },
      workflows: {
        maxWorkflows: "unlimited",
        advancedWorkflows: true,
      },
      support: "email",
    },
    limits: {
      reconciliationsPerMonth: "unlimited",
      logRetentionDays: 30,
      platformAdapters: "unlimited",
    },
  },
  commercial: {
    name: "Commercial",
    type: "commercial",
    price: "$99",
    period: "/month",
    features: {
      cookbooks: "all",
      docs: "all",
      playground: {
        runsPerDay: "unlimited",
        advancedFeatures: true,
      },
      consulting: false, // Self-service onboarding with enhanced guides
      emailAnalysis: {
        enabled: true,
        reportsPerMonth: "unlimited",
      },
      newsFeed: {
        personalized: true,
        aiGenerated: true,
      },
      workflows: {
        maxWorkflows: "unlimited",
        advancedWorkflows: true,
      },
      support: "email",
    },
    limits: {
      reconciliationsPerMonth: 100000,
      logRetentionDays: 30,
      platformAdapters: "unlimited",
    },
  },
  enterprise: {
    name: "Enterprise",
    type: "enterprise",
    price: "Custom",
    period: "",
    features: {
      cookbooks: "all",
      docs: "all",
      playground: {
        runsPerDay: "unlimited",
        advancedFeatures: true,
      },
      consulting: true, // Dedicated account manager
      emailAnalysis: {
        enabled: true,
        reportsPerMonth: "unlimited",
      },
      newsFeed: {
        personalized: true,
        aiGenerated: true,
      },
      workflows: {
        maxWorkflows: "unlimited",
        advancedWorkflows: true,
      },
      support: "dedicated",
    },
    limits: {
      reconciliationsPerMonth: "unlimited",
      logRetentionDays: "unlimited",
      platformAdapters: "unlimited",
    },
  },
};

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  userPlan: PlanType,
  feature: keyof PlanFeatures,
  specificFeature?: string
): boolean {
  const plan = plans[userPlan];
  const featureConfig = plan.features[feature];

  if (featureConfig === true) return true;
  if (featureConfig === false) return false;

  // Handle array features (cookbooks, docs)
  if (Array.isArray(featureConfig)) {
    if (specificFeature) {
      return featureConfig.includes(specificFeature);
    }
    return featureConfig.length > 0;
  }

  // Handle 'all' access
  if (featureConfig === "all") return true;

  // Handle object features (playground, emailAnalysis, etc.)
  if (typeof featureConfig === "object") {
    if ("enabled" in featureConfig) {
      return featureConfig.enabled === true;
    }
    if ("runsPerDay" in featureConfig) {
      return featureConfig.runsPerDay === "unlimited" || featureConfig.runsPerDay > 0;
    }
    return true;
  }

  return false;
}

/**
 * Get plan limits for a user
 */
export function getPlanLimits(userPlan: PlanType) {
  return plans[userPlan].limits;
}

/**
 * Check if content should be gated
 */
export function isContentGated(
  userPlan: PlanType,
  contentId: string,
  contentType: "cookbook" | "doc" | "feature"
): boolean {
  const plan = plans[userPlan];

  if (plan.type === "trial" || plan.type === "commercial" || plan.type === "enterprise") {
    return false; // Full access
  }

  // Free tier gating
  if (contentType === "cookbook") {
    const gatedCookbooks = [
      "realtime-webhooks",
      "multi-currency",
      "dashboard-metrics",
      "api-key-management",
    ];
    return gatedCookbooks.includes(contentId);
  }

  if (contentType === "doc") {
    const gatedDocs = ["api-reference-advanced", "webhooks", "multi-currency", "edge-ai"];
    return gatedDocs.includes(contentId);
  }

  return false;
}
