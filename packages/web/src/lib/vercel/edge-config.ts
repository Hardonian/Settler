/**
 * Vercel Edge Config Integration
 *
 * Provides integration with Vercel Edge Config for feature flags and edge configuration
 * Falls back gracefully if Edge Config is not configured
 *
 * Usage:
 *   import { edgeConfig } from '@/lib/vercel/edge-config';
 *   const value = await edgeConfig.get('feature_flag_key');
 */

import { get } from "@vercel/edge-config";

/**
 * Check if Vercel Edge Config is configured
 */
export function isEdgeConfigConfigured(): boolean {
  return !!process.env.EDGE_CONFIG;
}

/**
 * Vercel Edge Config client wrapper with error handling
 */
export const edgeConfig = {
  /**
   * Get value from Edge Config
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!isEdgeConfigConfigured()) {
      console.warn("[Edge Config] Edge Config not configured, returning null");
      return null;
    }

    try {
      const value = await get<T>(key);
      return value ?? null;
    } catch (error) {
      console.error(`[Edge Config] Error getting key "${key}":`, error);
      return null;
    }
  },

  /**
   * Get multiple values from Edge Config
   */
  async getAll<T = unknown>(keys: string[]): Promise<Record<string, T | null>> {
    if (!isEdgeConfigConfigured()) {
      return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<string, T | null>);
    }

    try {
      const values = await Promise.all(keys.map((key) => get<T>(key)));
      return keys.reduce(
        (acc, key, index) => ({ ...acc, [key]: values[index] ?? null }),
        {} as Record<string, T | null>
      );
    } catch (error) {
      console.error(`[Edge Config] Error getting multiple keys:`, error);
      return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<string, T | null>);
    }
  },

  /**
   * Check if key exists in Edge Config
   */
  async has(key: string): Promise<boolean> {
    if (!isEdgeConfigConfigured()) {
      return false;
    }

    try {
      const value = await get(key);
      return value !== null && value !== undefined;
    } catch (error) {
      console.error(`[Edge Config] Error checking existence of key "${key}":`, error);
      return false;
    }
  },
};

/**
 * Get feature flag from Edge Config
 * This integrates with the existing feature flag system
 */
export async function getFeatureFlagFromEdgeConfig(
  flagKey: string
): Promise<boolean | string | null> {
  if (!isEdgeConfigConfigured()) {
    return null;
  }

  try {
    // Try flag-specific key first
    const flagValue = await edgeConfig.get<boolean | string>(`flag_${flagKey}`);
    if (flagValue !== null) {
      return flagValue;
    }

    // Try general feature flags object
    const flags = await edgeConfig.get<Record<string, boolean | string>>("feature_flags");
    if (flags && typeof flags === "object" && flagKey in flags) {
      const value = flags[flagKey];
      return value ?? null;
    }

    return null;
  } catch (error) {
    console.error(`[Edge Config] Error getting feature flag "${flagKey}":`, error);
    return null;
  }
}
