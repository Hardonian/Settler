/**
 * Feature Flag Definitions
 * 
 * Central registry of all feature flags and their metadata.
 * Flags can be used for:
 * - Feature toggles (on/off)
 * - Gradual rollouts (percentage-based)
 * - A/B test variants
 * - Segment-based targeting
 */

export type FlagKey =
  // Feature toggles
  | 'new_dashboard'
  | 'beta_sidebar'
  | 'advanced_matching'
  | 'ml_features'
  | 'realtime_dashboard'
  | 'admin_impersonation'
  | 'webhook_retries'
  | 'api_docs'
  // Experiments
  | 'experiment_onboarding_v2'
  | 'experiment_dashboard_layout'
  | 'experiment_checkout_v2'
  | 'experiment_pricing_page';

export type RolloutType = 'static' | 'percentage' | 'segment' | 'experiment';

export interface FlagMetadata {
  key: FlagKey;
  description: string;
  defaultValue: boolean | string;
  rolloutType: RolloutType;
  // For percentage rollouts
  rolloutPercentage?: number;
  // For segment-based rollouts
  segments?: string[];
  // For experiments
  experimentVariants?: string[];
  experimentSplit?: Record<string, number>; // e.g., { control: 50, variant_a: 50 }
  // Environment overrides
  environments?: {
    development?: boolean | string;
    staging?: boolean | string;
    production?: boolean | string;
  };
}

/**
 * Feature flag registry
 * 
 * Define all feature flags here with their metadata.
 * Flags can be overridden via environment variables or remote config.
 */
export const FLAG_REGISTRY: Record<FlagKey, FlagMetadata> = {
  // Feature Toggles
  new_dashboard: {
    key: 'new_dashboard',
    description: 'Enable new dashboard UI',
    defaultValue: false,
    rolloutType: 'percentage',
    rolloutPercentage: 0, // Start at 0%, increase gradually
    environments: {
      development: true,
      staging: false,
      production: false,
    },
  },

  beta_sidebar: {
    key: 'beta_sidebar',
    description: 'Enable beta sidebar navigation',
    defaultValue: false,
    rolloutType: 'static',
    environments: {
      development: true,
      staging: false,
      production: false,
    },
  },

  advanced_matching: {
    key: 'advanced_matching',
    description: 'Enable advanced matching algorithms',
    defaultValue: false,
    rolloutType: 'percentage',
    rolloutPercentage: 10,
  },

  ml_features: {
    key: 'ml_features',
    description: 'Enable ML-powered features',
    defaultValue: false,
    rolloutType: 'segment',
    segments: ['beta_testers', 'enterprise'],
  },

  realtime_dashboard: {
    key: 'realtime_dashboard',
    description: 'Enable real-time dashboard updates',
    defaultValue: false,
    rolloutType: 'percentage',
    rolloutPercentage: 0,
  },

  admin_impersonation: {
    key: 'admin_impersonation',
    description: 'Enable admin user impersonation',
    defaultValue: false,
    rolloutType: 'segment',
    segments: ['admins'],
  },

  webhook_retries: {
    key: 'webhook_retries',
    description: 'Enable automatic webhook retries',
    defaultValue: true,
    rolloutType: 'static',
  },

  api_docs: {
    key: 'api_docs',
    description: 'Enable API documentation',
    defaultValue: true,
    rolloutType: 'static',
  },

  // Experiments
  experiment_onboarding_v2: {
    key: 'experiment_onboarding_v2',
    description: 'A/B test: New onboarding flow',
    defaultValue: 'control',
    rolloutType: 'experiment',
    experimentVariants: ['control', 'variant_a', 'variant_b'],
    experimentSplit: {
      control: 50,
      variant_a: 25,
      variant_b: 25,
    },
  },

  experiment_dashboard_layout: {
    key: 'experiment_dashboard_layout',
    description: 'A/B test: Dashboard layout variations',
    defaultValue: 'control',
    rolloutType: 'experiment',
    experimentVariants: ['control', 'compact', 'expanded'],
    experimentSplit: {
      control: 50,
      compact: 25,
      expanded: 25,
    },
  },

  experiment_checkout_v2: {
    key: 'experiment_checkout_v2',
    description: 'A/B test: New checkout flow',
    defaultValue: 'control',
    rolloutType: 'experiment',
    experimentVariants: ['control', 'variant_a'],
    experimentSplit: {
      control: 50,
      variant_a: 50,
    },
  },

  experiment_pricing_page: {
    key: 'experiment_pricing_page',
    description: 'A/B test: Pricing page design',
    defaultValue: 'control',
    rolloutType: 'experiment',
    experimentVariants: ['control', 'variant_a'],
    experimentSplit: {
      control: 50,
      variant_a: 50,
    },
  },
};

/**
 * Get flag metadata
 */
export function getFlagMetadata(key: FlagKey): FlagMetadata | undefined {
  return FLAG_REGISTRY[key];
}

/**
 * Get all flag keys
 */
export function getAllFlagKeys(): FlagKey[] {
  return Object.keys(FLAG_REGISTRY) as FlagKey[];
}

/**
 * Check if a flag is an experiment
 */
export function isExperimentFlag(key: FlagKey): boolean {
  const metadata = FLAG_REGISTRY[key];
  return metadata?.rolloutType === 'experiment';
}
