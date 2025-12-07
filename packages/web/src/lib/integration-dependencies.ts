/**
 * Integration Dependency Resolver
 * Detects integration dependencies and warns about conflicts
 */

export interface IntegrationDependency {
  integrationId: string;
  dependsOn: string[];
  conflictsWith: string[];
  requires: string[];
  optional: string[];
}

const INTEGRATION_DEPENDENCIES: Record<string, IntegrationDependency> = {
  stripe: {
    integrationId: "stripe",
    dependsOn: [],
    conflictsWith: [],
    requires: [],
    optional: ["shopify", "paypal"],
  },
  shopify: {
    integrationId: "shopify",
    dependsOn: [],
    conflictsWith: [],
    requires: [],
    optional: ["stripe", "paypal"],
  },
  paypal: {
    integrationId: "paypal",
    dependsOn: [],
    conflictsWith: [],
    requires: [],
    optional: ["stripe", "shopify"],
  },
  "google-pay": {
    integrationId: "google-pay",
    dependsOn: [],
    conflictsWith: [],
    requires: ["stripe"], // Google Pay typically processes through Stripe
    optional: [],
  },
  "meta-commerce": {
    integrationId: "meta-commerce",
    dependsOn: [],
    conflictsWith: [],
    requires: [],
    optional: ["stripe", "paypal"],
  },
  "tiktok-shop": {
    integrationId: "tiktok-shop",
    dependsOn: [],
    conflictsWith: [],
    requires: [],
    optional: ["stripe", "paypal"],
  },
  "ga4-deep-sync": {
    integrationId: "ga4-deep-sync",
    dependsOn: [],
    conflictsWith: [],
    requires: ["shopify", "stripe"], // GA4 sync needs e-commerce data
    optional: [],
  },
  "paypal-payouts": {
    integrationId: "paypal-payouts",
    dependsOn: ["paypal"], // Requires base PayPal integration
    conflictsWith: [],
    requires: [],
    optional: [],
  },
  "whatsapp-telegram": {
    integrationId: "whatsapp-telegram",
    dependsOn: [],
    conflictsWith: [],
    requires: [],
    optional: ["shopify", "stripe"],
  },
  "wix-stores": {
    integrationId: "wix-stores",
    dependsOn: [],
    conflictsWith: [],
    requires: [],
    optional: ["stripe", "paypal"],
  },
};

/**
 * Check integration dependencies and return warnings
 */
export function checkIntegrationDependencies(
  currentIntegrations: string[],
  newIntegration: string
): {
  canAdd: boolean;
  warnings: string[];
  errors: string[];
  missingRequirements: string[];
} {
  const dependency = INTEGRATION_DEPENDENCIES[newIntegration];
  if (!dependency) {
    return {
      canAdd: true,
      warnings: [],
      errors: [],
      missingRequirements: [],
    };
  }

  const warnings: string[] = [];
  const errors: string[] = [];
  const missingRequirements: string[] = [];

  // Check conflicts
  for (const conflict of dependency.conflictsWith) {
    if (currentIntegrations.includes(conflict)) {
      errors.push(
        `${newIntegration} conflicts with ${conflict}. You cannot use both simultaneously.`
      );
    }
  }

  // Check required dependencies
  for (const required of dependency.requires) {
    if (!currentIntegrations.includes(required)) {
      errors.push(
        `${newIntegration} requires ${required} to be connected first.`
      );
      missingRequirements.push(required);
    }
  }

  // Check optional but recommended
  for (const optional of dependency.optional) {
    if (!currentIntegrations.includes(optional)) {
      warnings.push(
        `${newIntegration} works best with ${optional}. Consider connecting it for better results.`
      );
    }
  }

  // Check dependencies
  for (const dep of dependency.dependsOn) {
    if (!currentIntegrations.includes(dep)) {
      errors.push(
        `${newIntegration} depends on ${dep}. Please connect ${dep} first.`
      );
      missingRequirements.push(dep);
    }
  }

  return {
    canAdd: errors.length === 0,
    warnings,
    errors,
    missingRequirements,
  };
}

/**
 * Get all integration dependencies for a set of integrations
 */
export function getAllDependencies(integrations: string[]): {
  allDependencies: string[];
  allConflicts: string[];
  allRequirements: string[];
} {
  const allDependencies = new Set<string>();
  const allConflicts = new Set<string>();
  const allRequirements = new Set<string>();

  for (const integrationId of integrations) {
    const dependency = INTEGRATION_DEPENDENCIES[integrationId];
    if (dependency) {
      dependency.dependsOn.forEach((d) => allDependencies.add(d));
      dependency.conflictsWith.forEach((c) => allConflicts.add(c));
      dependency.requires.forEach((r) => allRequirements.add(r));
    }
  }

  return {
    allDependencies: Array.from(allDependencies),
    allConflicts: Array.from(allConflicts),
    allRequirements: Array.from(allRequirements),
  };
}
