/**
 * useSubscriptionStatus Hook
 * 
 * React hook for accessing subscription status with automatic caching
 * Prevents duplicate API calls across components
 */

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionStatus } from '@/lib/subscription-access';
import { getCachedSubscriptionStatus, invalidateSubscriptionCache } from '@/lib/subscription-cache';

/**
 * Hook to get subscription status with caching
 * 
 * @example
 * ```tsx
 * const { subscription, loading, refresh } = useSubscriptionStatus();
 * 
 * if (loading) return <Loading />;
 * if (subscription?.tier === 'unsubscribed') return <UpgradePrompt />;
 * ```
 */
export function useSubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const data = await getCachedSubscriptionStatus();
        if (!cancelled) {
          setSubscription(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load subscription'));
          setLoading(false);
          // Set fallback
          setSubscription({
            tier: 'unsubscribed',
            hasSubscription: false,
            isPaid: false,
            isEnterprise: false,
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => {
    invalidateSubscriptionCache();
    setLoading(true);
    getCachedSubscriptionStatus()
      .then((data) => {
        setSubscription(data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error('Failed to refresh subscription'));
        setLoading(false);
      });
  }, []);

  return {
    subscription,
    loading,
    error,
    refresh,
    /** Check if user has access to a tier */
    hasAccess: (requiredTier: SubscriptionStatus['tier']) => {
      if (!subscription) return false;
      const tierOrder: Record<SubscriptionStatus['tier'], number> = {
        unsubscribed: 0,
        subscribed_unpaid: 1,
        subscribed_paid: 2,
        enterprise: 3,
      };
      return (tierOrder[subscription.tier] ?? 0) >= (tierOrder[requiredTier] ?? 0);
    },
  };
}
