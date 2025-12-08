/**
 * React Hooks for Feature Flags and Experiments
 * 
 * Easy-to-use hooks for accessing feature flags and experiment variants in components.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  resolveFlag,
  isFeatureEnabled,
  getExperimentVariant,
  UserContext,
  FlagKey,
} from './resolver';
import { ProductEvents } from '../telemetry/product-events';

/**
 * Get current user context (from auth, session, etc.)
 * Override this based on your auth implementation
 */
function getCurrentUserContext(): UserContext | undefined {
  if (typeof window === 'undefined') return undefined;

  // Try to get user ID from localStorage (set by auth system)
  const userId = localStorage.getItem('user_id') || undefined;
  const email = localStorage.getItem('user_email') || undefined;
  
  // Get user segments (could be from API, localStorage, etc.)
  const segmentsStr = localStorage.getItem('user_segments');
  const segments = segmentsStr ? JSON.parse(segmentsStr) : undefined;

  if (!userId) return undefined;

  const context: UserContext = {
    userId,
    segments,
  };
  
  if (email) {
    context.email = email;
  }

  return context;
}

/**
 * Hook to check if a feature flag is enabled
 * 
 * @example
 * ```tsx
 * const isNewDashboard = useFeatureFlag('new_dashboard');
 * return isNewDashboard ? <NewDashboard /> : <LegacyDashboard />;
 * ```
 */
export function useFeatureFlag(key: FlagKey): boolean {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const userContext = useMemo(() => getCurrentUserContext(), []);

  useEffect(() => {
    let mounted = true;

    async function checkFlag() {
      try {
        // Try async resolution first (for remote config, etc.)
        const result = await resolveFlag(key, userContext);
        if (mounted) {
          const value = typeof result.value === 'boolean' ? result.value : false;
          setEnabled(value);
          setLoading(false);

          // Track feature flag fallback if needed
          if (result.source === 'default' && result.metadata) {
            ProductEvents.errors.featureFlagFallback({
              flagKey: key,
              fallbackValue: value,
              reason: 'flag_not_found_or_failed',
            });
          }
        }
      } catch (_error) {
        // Fallback to synchronous check
        if (mounted) {
          const fallbackValue = isFeatureEnabled(key, userContext);
          setEnabled(fallbackValue);
          setLoading(false);

          ProductEvents.errors.featureFlagFallback({
            flagKey: key,
            fallbackValue,
            reason: 'resolution_error',
          });
        }
      }
    }

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [key, userContext]);

  // Fallback to synchronous check if still loading
  if (loading) {
    return isFeatureEnabled(key, userContext);
  }

  return enabled;
}

/**
 * Hook to get experiment variant
 * 
 * @example
 * ```tsx
 * const variant = useExperimentVariant('experiment_onboarding_v2');
 * if (variant === 'variant_a') return <OnboardingV2A />;
 * if (variant === 'variant_b') return <OnboardingV2B />;
 * return <OnboardingControl />;
 * ```
 */
export function useExperimentVariant(experimentKey: FlagKey): string {
  const [variant, setVariant] = useState<string>('control');
  const [loading, setLoading] = useState<boolean>(true);
  const userContext = useMemo(() => getCurrentUserContext(), []);

  useEffect(() => {
    let mounted = true;

    async function getVariant() {
      try {
        const result = await resolveFlag(experimentKey, userContext);
        if (mounted) {
          const value = typeof result.value === 'string' ? result.value : 'control';
          setVariant(value);
          setLoading(false);

          // Track experiment exposure
          if (result.source === 'experiment' && userContext?.userId) {
            ProductEvents.experiments.exposure({
              experimentKey,
              variant: value,
              exposureType: 'page_view',
            });
          }
        }
      } catch (_error) {
        // Fallback to synchronous check
        if (mounted) {
          const fallbackVariant = getExperimentVariant(experimentKey, userContext);
          setVariant(fallbackVariant);
          setLoading(false);

          ProductEvents.errors.experimentAssignmentFailed({
            experimentKey,
            fallbackVariant,
            reason: 'resolution_error',
          });
        }
      }
    }

    getVariant();
  }, [experimentKey, userContext]);

  // Fallback to synchronous check if still loading
  if (loading) {
    return getExperimentVariant(experimentKey, userContext);
  }

  return variant;
}

/**
 * Hook to get multiple feature flags at once
 * 
 * @example
 * ```tsx
 * const flags = useFeatureFlags(['new_dashboard', 'beta_sidebar']);
 * if (flags.new_dashboard) return <NewDashboard />;
 * ```
 */
export function useFeatureFlags(keys: FlagKey[]): Record<FlagKey, boolean> {
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({} as Record<FlagKey, boolean>);
  const [loading, setLoading] = useState<boolean>(true);
  const userContext = useMemo(() => getCurrentUserContext(), []);

  useEffect(() => {
    let mounted = true;

    async function checkFlags() {
      try {
        const results = await Promise.all(
          keys.map(async (key) => {
            const result = await resolveFlag(key, userContext);
            return {
              key,
              value: typeof result.value === 'boolean' ? result.value : false,
            };
          })
        );

        if (mounted) {
          const flagsMap = results.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
          }, {} as Record<FlagKey, boolean>);

          setFlags(flagsMap);
          setLoading(false);
        }
      } catch (_error) {
        // Fallback to synchronous checks
        if (mounted) {
          const flagsMap = keys.reduce((acc, flagKey) => {
            acc[flagKey] = isFeatureEnabled(flagKey, userContext);
            return acc;
          }, {} as Record<FlagKey, boolean>);

          setFlags(flagsMap);
          setLoading(false);
        }
      }
    }

    checkFlags();
  }, [keys.join(','), userContext]);

  // Fallback to synchronous checks if still loading
  if (loading) {
    return keys.reduce((acc, key) => {
      acc[key] = isFeatureEnabled(key, userContext);
      return acc;
    }, {} as Record<FlagKey, boolean>);
  }

  return flags;
}

/**
 * Hook to get experiment variant with exposure tracking
 * Automatically tracks when user is exposed to experiment
 * 
 * @example
 * ```tsx
 * const { variant, trackExposure } = useExperiment('experiment_onboarding_v2');
 * 
 * useEffect(() => {
 *   trackExposure('page_view');
 * }, []);
 * ```
 */
export function useExperiment(experimentKey: FlagKey) {
  const variant = useExperimentVariant(experimentKey);
  const userContext = useMemo(() => getCurrentUserContext(), []);

  const trackExposure = (exposureType: 'page_view' | 'feature_use' | 'interaction') => {
    if (userContext?.userId) {
      ProductEvents.experiments.exposure({
        experimentKey,
        variant,
        exposureType,
      });
    }
  };

  return {
    variant,
    trackExposure,
    isControl: variant === 'control',
    isVariant: variant !== 'control',
  };
}

/**
 * Hook to track conversions with experiment context
 * 
 * @example
 * ```tsx
 * const { trackConversion } = useExperimentConversion('experiment_checkout_v2');
 * 
 * const handleCheckout = () => {
 *   trackConversion('checkout_completed', { value: 99.99 });
 * };
 * ```
 */
export function useExperimentConversion(experimentKey: FlagKey) {
  const variant = useExperimentVariant(experimentKey);

  const trackConversion = (
    conversionName: string,
    properties?: {
      value?: number;
      [key: string]: any;
    }
  ) => {
    ProductEvents.conversions.subscriptionStarted({
      planId: conversionName,
      planName: conversionName,
      billingCycle: 'monthly',
      amount: properties?.value,
    });

    // Also track with experiment context
    ProductEvents.experiments.exposure({
      experimentKey,
      variant,
      exposureType: 'interaction',
    });
  };

  return {
    trackConversion,
    variant,
  };
}
