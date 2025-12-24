/**
 * Subscription Status Cache
 * 
 * Client-side cache for subscription status to prevent duplicate API calls
 * Shared across all components using subscription status
 */

import { SubscriptionStatus } from './subscription-access';

interface CacheEntry {
  data: SubscriptionStatus | null;
  timestamp: number;
  promise: Promise<SubscriptionStatus> | null;
}

const CACHE_TTL = 30000; // 30 seconds

let cache: CacheEntry = {
  data: null,
  timestamp: 0,
  promise: null,
};

/**
 * Get cached subscription status or fetch if expired
 */
export async function getCachedSubscriptionStatus(): Promise<SubscriptionStatus> {
  const now = Date.now();
  const isCacheValid = cache.data && (now - cache.timestamp) < CACHE_TTL;

  if (isCacheValid && cache.data) {
    return cache.data;
  }

  // If there's already a pending request, return that promise
  if (cache.promise) {
    return cache.promise;
  }

  // Create new request
  const promise = fetch('/api/console/subscription-status')
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      return res.json() as Promise<SubscriptionStatus>;
    })
    .then((data) => {
      cache.data = data;
      cache.timestamp = Date.now();
      cache.promise = null;
      return data;
    })
    .catch((err) => {
      console.error('[SubscriptionCache] Failed to fetch:', err);
      // Return fallback on error
      const fallback: SubscriptionStatus = {
        tier: 'unsubscribed',
        hasSubscription: false,
        isPaid: false,
        isEnterprise: false,
      };
      cache.data = fallback;
      cache.timestamp = Date.now();
      cache.promise = null;
      return fallback;
    });

  cache.promise = promise;
  return promise;
}

/**
 * Invalidate cache (force refresh on next request)
 */
export function invalidateSubscriptionCache(): void {
  cache.timestamp = 0;
  cache.promise = null;
}

/**
 * Get current cached value without fetching
 */
export function getCachedValue(): SubscriptionStatus | null {
  return cache.data;
}

/**
 * Check if cache is valid
 */
export function isCacheValid(): boolean {
  const now = Date.now();
  return !!(cache.data && (now - cache.timestamp) < CACHE_TTL);
}
