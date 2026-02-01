/**
 * Kill Switch / Feature Flags System
 *
 * Allows disabling features in production without code deployment.
 * Useful for emergency shutdowns, gradual rollouts, and A/B testing.
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number; // 0-100, for gradual rollouts
  targetUsers?: string[]; // User IDs or email domains
  targetEnvironments?: string[]; // 'production', 'staging', 'development'
  metadata?: Record<string, unknown>;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private initialized = false;

  /**
   * Initialize feature flags (load from database or config)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // In production, load from database or feature flag service (LaunchDarkly, etc.)
      // For now, use environment variables or hardcoded defaults
      const flags: FeatureFlag[] = [
        {
          key: "reconciliation-engine",
          enabled: true,
          description: "Core reconciliation engine",
          targetEnvironments: ["production", "staging", "development"],
        },
        {
          key: "receipt-parsing",
          enabled: true,
          description: "Receipt parsing API",
          targetEnvironments: ["production", "staging", "development"],
        },
        {
          key: "feature-flags",
          enabled: true,
          description: "Feature flags system",
          targetEnvironments: ["production", "staging", "development"],
        },
        {
          key: "new-dashboard",
          enabled: false,
          description: "New dashboard UI",
          rolloutPercentage: 0,
          targetEnvironments: ["staging", "development"],
        },
      ];

      for (const flag of flags) {
        this.flags.set(flag.key, flag);
      }

      this.initialized = true;
      // eslint-disable-next-line no-console
      console.info("[FeatureFlags] Initialized with", this.flags.size, "flags");
    } catch (error) {
      console.error("[FeatureFlags] Failed to initialize:", error);
      // Continue with empty flags (fail open)
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: string, context?: { userId?: string; environment?: string }): boolean {
    const flag = this.flags.get(key);

    if (!flag) {
      // Feature not found - default to disabled for safety
      console.warn(`[FeatureFlags] Flag "${key}" not found, defaulting to disabled`);
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment targeting
    if (flag.targetEnvironments && context?.environment) {
      if (!flag.targetEnvironments.includes(context.environment)) {
        return false;
      }
    }

    // Check user targeting
    if (flag.targetUsers && context?.userId) {
      if (!flag.targetUsers.includes(context.userId)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && context?.userId) {
      // Deterministic hash-based rollout (consistent for same user)
      const hash = this.hashUserId(context.userId);
      const percentage = (hash % 100) + 1;
      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Hash user ID for deterministic rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get feature flag value
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  /**
   * Set feature flag (for admin/ops use)
   */
  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
    // eslint-disable-next-line no-console
    console.info(`[FeatureFlags] Flag "${flag.key}" set to ${flag.enabled}`);
  }

  /**
   * Disable feature (kill switch)
   */
  disable(key: string): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = false;
      this.flags.set(key, flag);
      console.warn(`[FeatureFlags] Kill switch activated for "${key}"`);
    }
  }

  /**
   * Enable feature
   */
  enable(key: string): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = true;
      this.flags.set(key, flag);
      // eslint-disable-next-line no-console
      console.info(`[FeatureFlags] Feature "${key}" enabled`);
    }
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

/**
 * Check if feature is enabled (convenience function)
 */
export function isFeatureEnabled(
  key: string,
  context?: { userId?: string; environment?: string }
): boolean {
  return featureFlags.isEnabled(key, {
    environment: process.env.NODE_ENV || "development",
    ...context,
  });
}

/**
 * Require feature to be enabled (throws if disabled)
 */
export function requireFeature(
  key: string,
  context?: { userId?: string; environment?: string }
): void {
  if (!isFeatureEnabled(key, context)) {
    throw new FeatureDisabledError(`Feature "${key}" is disabled`);
  }
}

export class FeatureDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureDisabledError";
  }
}

/**
 * Initialize feature flags on module load
 */
if (typeof window === "undefined") {
  // Server-side initialization
  featureFlags.initialize().catch((error) => {
    console.error("[FeatureFlags] Failed to initialize:", error);
  });
}
