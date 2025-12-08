/**
 * Feature Flag Resolver
 * 
 * Determines the final value of a feature flag based on:
 * - Environment variables
 * - Remote config (if available)
 * - User context (for percentage/segment/experiment rollouts)
 * - Flag metadata
 */

import { FlagKey, FlagMetadata, FLAG_REGISTRY } from './flags';
import { ProductEvents } from '../telemetry/product-events';

export interface UserContext {
  userId?: string;
  email?: string;
  segments?: string[]; // e.g., ['beta_testers', 'enterprise']
  attributes?: Record<string, any>; // Custom attributes
}

// Re-export FlagKey for convenience
export type { FlagKey } from './flags';

export interface FlagResolutionResult {
  value: boolean | string;
  source: 'environment' | 'remote' | 'percentage' | 'segment' | 'experiment' | 'default';
  metadata?: FlagMetadata;
}

/**
 * Resolve feature flag value
 */
export async function resolveFlag(
  key: FlagKey,
  userContext?: UserContext
): Promise<FlagResolutionResult> {
  const metadata = FLAG_REGISTRY[key];
  if (!metadata) {
    // Flag not found, return safe default
    return {
      value: false,
      source: 'default',
    };
  }

  // 1. Check environment variable override
  const envValue = getEnvOverride(key);
  if (envValue !== null) {
    return {
      value: envValue,
      source: 'environment',
      metadata,
    };
  }

  // 2. Check remote config (if available)
  const remoteValue = await getRemoteConfig(key);
  if (remoteValue !== null) {
    return {
      value: remoteValue,
      source: 'remote',
      metadata,
    };
  }

  // 3. Check environment-specific defaults
  const envDefault = getEnvironmentDefault(metadata);
  if (envDefault !== null) {
    return {
      value: envDefault,
      source: 'environment',
      metadata,
    };
  }

  // 4. Resolve based on rollout type
  switch (metadata.rolloutType) {
    case 'static':
      return {
        value: metadata.defaultValue,
        source: 'default',
        metadata,
      };

    case 'percentage':
      return resolvePercentageRollout(metadata, userContext);

    case 'segment':
      return resolveSegmentRollout(metadata, userContext);

    case 'experiment':
      return resolveExperiment(metadata, userContext);

    default:
      return {
        value: metadata.defaultValue,
        source: 'default',
        metadata,
      };
  }
}

/**
 * Resolve percentage-based rollout
 */
function resolvePercentageRollout(
  metadata: FlagMetadata,
  userContext?: UserContext
): FlagResolutionResult {
  const percentage = metadata.rolloutPercentage || 0;
  const defaultValue = typeof metadata.defaultValue === 'boolean' ? metadata.defaultValue : false;

  if (percentage === 0) {
    return {
      value: defaultValue,
      source: 'default',
      metadata,
    };
  }

  if (percentage === 100) {
    return {
      value: true,
      source: 'percentage',
      metadata,
    };
  }

  // Use stable hash of user ID to determine if user is in rollout
  if (!userContext?.userId) {
    // No user context, use default
    return {
      value: defaultValue,
      source: 'default',
      metadata,
    };
  }

  const hash = stableHash(`${metadata.key}:${userContext.userId}`);
  const userPercentage = (hash % 100) + 1; // 1-100

  const enabled = userPercentage <= percentage;

  return {
    value: enabled,
    source: 'percentage',
    metadata,
  };
}

/**
 * Resolve segment-based rollout
 */
function resolveSegmentRollout(
  metadata: FlagMetadata,
  userContext?: UserContext
): FlagResolutionResult {
  const segments = metadata.segments || [];
  const defaultValue = typeof metadata.defaultValue === 'boolean' ? metadata.defaultValue : false;

  if (segments.length === 0) {
    return {
      value: defaultValue,
      source: 'default',
      metadata,
    };
  }

  // Check if user is in any of the required segments
  const userSegments = userContext?.segments || [];
  const isInSegment = segments.some((segment) => userSegments.includes(segment));

  return {
    value: isInSegment,
    source: 'segment',
    metadata,
  };
}

/**
 * Resolve experiment variant
 */
function resolveExperiment(
  metadata: FlagMetadata,
  userContext?: UserContext
): FlagResolutionResult {
  const variants = metadata.experimentVariants || ['control'];
  const split = metadata.experimentSplit || {};
  const defaultVariant = typeof metadata.defaultValue === 'string' 
    ? metadata.defaultValue 
    : variants[0];

  if (!userContext?.userId) {
    // No user context, return default variant
    return {
      value: defaultVariant,
      source: 'default',
      metadata,
    };
  }

  // Use stable hash to assign variant
  const variant = assignExperimentVariant(
    metadata.key,
    userContext.userId,
    variants,
    split
  );

  // Track experiment assignment
  ProductEvents.experiments.assigned({
    experimentKey: metadata.key,
    variant,
    assignmentMethod: 'stable_hash',
    userId: userContext.userId,
  });

  return {
    value: variant,
    source: 'experiment',
    metadata,
  };
}

/**
 * Assign experiment variant using stable hash
 * Ensures same user always gets same variant
 */
export function assignExperimentVariant(
  experimentKey: string,
  userId: string,
  variants: string[],
  split: Record<string, number>
): string {
  // Create stable hash from experiment key + user ID
  const hash = stableHash(`${experimentKey}:${userId}`);
  const hashValue = hash % 100; // 0-99

  // Calculate cumulative percentages
  let cumulative = 0;
  for (const variant of variants) {
    const percentage = split[variant] || 0;
    cumulative += percentage;
    if (hashValue < cumulative) {
      return variant;
    }
  }

  // Fallback to first variant
  return variants[0] || 'control';
}

/**
 * Stable hash function (djb2 algorithm)
 * Returns consistent hash for same input
 */
function stableHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get environment variable override
 */
function getEnvOverride(key: FlagKey): boolean | string | null {
  if (typeof window === 'undefined') return null;

  // Check for boolean flag: NEXT_PUBLIC_FLAG_<KEY>
  const envKey = `NEXT_PUBLIC_FLAG_${key.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  const envValue = process.env[envKey];

  if (envValue === undefined) return null;

  // Try to parse as boolean
  if (envValue === 'true' || envValue === '1') return true;
  if (envValue === 'false' || envValue === '0') return false;

  // Return as string (for experiment variants)
  return envValue;
}

/**
 * Get remote config value (placeholder for future integration)
 * Can integrate with LaunchDarkly, GrowthBook, Unleash, etc.
 */
async function getRemoteConfig(_key: FlagKey): Promise<boolean | string | null> {
  // TODO: Integrate with remote config provider
  // Example:
  // const config = await fetchRemoteConfig(key);
  // return config?.value || null;
  return null;
}

/**
 * Get environment-specific default
 */
function getEnvironmentDefault(metadata: FlagMetadata): boolean | string | null {
  if (typeof window === 'undefined') return null;

  const env = process.env.NODE_ENV || 'development';
  const envDefaults = metadata.environments;

  if (!envDefaults) return null;

  switch (env) {
    case 'development':
      return envDefaults.development ?? null;
    case 'production':
      return envDefaults.production ?? null;
    case 'test':
      return null; // Use default in test
    default:
      return null;
  }
}

/**
 * Check if feature is enabled (synchronous, for client components)
 * Falls back to default if user context not available
 */
export function isFeatureEnabled(key: FlagKey, userContext?: UserContext): boolean {
  const metadata = FLAG_REGISTRY[key];
  if (!metadata) return false;

  // Check environment override first
  const envValue = getEnvOverride(key);
  if (envValue !== null && typeof envValue === 'boolean') {
    return envValue;
  }

  // Check environment default
  const envDefault = getEnvironmentDefault(metadata);
  if (envDefault !== null && typeof envDefault === 'boolean') {
    return envDefault;
  }

  // For experiments, return false (use getExperimentVariant instead)
  if (metadata.rolloutType === 'experiment') {
    return false;
  }

  // For percentage/segment rollouts without user context, use default
  if (!userContext && (metadata.rolloutType === 'percentage' || metadata.rolloutType === 'segment')) {
    return typeof metadata.defaultValue === 'boolean' ? metadata.defaultValue : false;
  }

  // Resolve based on rollout type
  if (metadata.rolloutType === 'percentage') {
    const percentage = metadata.rolloutPercentage || 0;
    if (percentage === 0) return false;
    if (percentage === 100) return true;
    if (!userContext?.userId) return false;
    
    const hash = stableHash(`${metadata.key}:${userContext.userId}`);
    return (hash % 100) < percentage;
  }

  if (metadata.rolloutType === 'segment') {
    const segments = metadata.segments || [];
    const userSegments = userContext?.segments || [];
    return segments.some((s) => userSegments.includes(s));
  }

  // Static rollout
  return typeof metadata.defaultValue === 'boolean' ? metadata.defaultValue : false;
}

/**
 * Get experiment variant (synchronous, for client components)
 */
export function getExperimentVariant(
  experimentKey: FlagKey,
  userContext?: UserContext
): string {
  const metadata = FLAG_REGISTRY[experimentKey];
  if (!metadata || metadata.rolloutType !== 'experiment') {
    return typeof metadata?.defaultValue === 'string' ? metadata.defaultValue : 'control';
  }

  // Check environment override
  const envValue = getEnvOverride(experimentKey);
  if (envValue !== null && typeof envValue === 'string') {
    return envValue;
  }

  // Check environment default
  const envDefault = getEnvironmentDefault(metadata);
  if (envDefault !== null && typeof envDefault === 'string') {
    return envDefault;
  }

  // Fallback to default variant
  if (typeof metadata.defaultValue === 'string') {
    return metadata.defaultValue;
  }

  // Assign variant
  if (!userContext?.userId) {
    const defaultVariant = typeof metadata.defaultValue === 'string' ? metadata.defaultValue : 'control';
    return defaultVariant;
  }

  const variants = metadata.experimentVariants || ['control'];
  const split = metadata.experimentSplit || {};

  return assignExperimentVariant(experimentKey, userContext.userId, variants, split);
}
