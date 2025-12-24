'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { SubscriptionGate } from '@/components/console/SubscriptionGate';
import { SubscriptionTier, SubscriptionStatus } from './subscription-access';

// Global cache for subscription status to avoid duplicate requests
let subscriptionCache: {
  data: SubscriptionStatus | null;
  timestamp: number;
  promise: Promise<SubscriptionStatus> | null;
} = {
  data: null,
  timestamp: 0,
  promise: null,
};

const CACHE_TTL = 30000; // 30 seconds

/**
 * Shared hook for subscription status with caching
 * Prevents duplicate API calls across multiple RBACGate components
 */
function useSubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(subscriptionCache.data);
  const [loading, setLoading] = useState(!subscriptionCache.data);

  useEffect(() => {
    const now = Date.now();
    const isCacheValid = subscriptionCache.data && (now - subscriptionCache.timestamp) < CACHE_TTL;

    if (isCacheValid) {
      setSubscription(subscriptionCache.data);
      setLoading(false);
      return;
    }

    // If there's already a pending request, wait for it
    if (subscriptionCache.promise) {
      subscriptionCache.promise
        .then((data) => {
          setSubscription(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
      return;
    }

    // Create new request
    setLoading(true);
    const promise: Promise<SubscriptionStatus> = fetch('/api/console/subscription-status')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch subscription');
        return res.json() as Promise<SubscriptionStatus>;
      })
      .then((data) => {
        subscriptionCache.data = data;
        subscriptionCache.timestamp = Date.now();
        subscriptionCache.promise = null;
        setSubscription(data);
        setLoading(false);
        return data;
      })
      .catch((err) => {
        console.error('Failed to load subscription:', err);
        const fallback: SubscriptionStatus = {
          tier: 'unsubscribed',
          hasSubscription: false,
          isPaid: false,
          isEnterprise: false,
        };
        subscriptionCache.data = fallback;
        subscriptionCache.timestamp = Date.now();
        subscriptionCache.promise = null;
        setSubscription(fallback);
        setLoading(false);
        return fallback;
      });

    subscriptionCache.promise = promise;
  }, []);

  const refresh = useCallback(() => {
    subscriptionCache.timestamp = 0; // Invalidate cache
    subscriptionCache.promise = null;
    setLoading(true);
    // Trigger re-fetch
    const promise = fetch('/api/console/subscription-status')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch subscription');
        return res.json() as Promise<SubscriptionStatus>;
      })
      .then((data) => {
        subscriptionCache.data = data;
        subscriptionCache.timestamp = Date.now();
        subscriptionCache.promise = null;
        setSubscription(data);
        setLoading(false);
        return data;
      })
      .catch((err) => {
        console.error('Failed to refresh subscription:', err);
        setLoading(false);
        return subscriptionCache.data;
      });
    subscriptionCache.promise = promise;
  }, []);

  return { subscription, loading, refresh };
}

interface RBACGateProps {
  /** Minimum subscription tier required */
  requiredTier?: SubscriptionTier;
  /** Required role (e.g., 'admin', 'member') */
  requiredRole?: string;
  /** Feature name for error messages */
  feature: string;
  /** Children to render if access granted */
  children: React.ReactNode;
  /** Fallback content if access denied */
  fallback?: React.ReactNode;
  /** Truncate content instead of hiding (show partial) */
  truncate?: boolean;
  /** Max items to show when truncated */
  maxItems?: number;
  /** Custom benefits to show in upgrade prompt */
  benefits?: string[];
  /** Show value proposition */
  showValueProp?: boolean;
}

/**
 * Enhanced RBAC Gate Component
 * 
 * Combines subscription tier checks with role-based access control.
 * Optimized with request deduplication and caching.
 * Can truncate content for lower tiers instead of hiding completely.
 */
export function RBACGate({
  requiredTier = 'unsubscribed',
  requiredRole,
  feature,
  children,
  fallback,
  truncate = false,
  maxItems = 5,
  benefits,
  showValueProp = true,
}: RBACGateProps) {
  const { subscription, loading } = useSubscriptionStatus();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(!!requiredRole);

  useEffect(() => {
    if (!requiredRole) {
      setRoleLoading(false);
      return;
    }

    fetch('/api/console/user-role')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json() as { role?: string };
          return data;
        }
        return { role: undefined };
      })
      .then((data) => {
        setUserRole(data.role || null);
        setRoleLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load role:', err);
        setRoleLoading(false);
      });
  }, [requiredRole]);

  const hasAccess = useMemo(() => {
    if (!subscription) return false;

    // Check subscription tier
    const tierOrder: Record<SubscriptionTier, number> = {
      unsubscribed: 0,
      subscribed_unpaid: 1,
      subscribed_paid: 2,
      enterprise: 3,
    };

    const userTier = tierOrder[subscription.tier] ?? 0;
    const requiredTierLevel = tierOrder[requiredTier] ?? 0;
    const hasTierAccess = userTier >= requiredTierLevel;

    // Check role if required
    const hasRoleAccess = !requiredRole || userRole === requiredRole || userRole === 'admin';

    return hasTierAccess && hasRoleAccess;
  }, [subscription, requiredTier, requiredRole, userRole]);

  if (loading || roleLoading) {
    return (
      <div className="animate-pulse p-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    // Check if we should truncate (only if tier access but not role access)
    const tierOrder: Record<SubscriptionTier, number> = {
      unsubscribed: 0,
      subscribed_unpaid: 1,
      subscribed_paid: 2,
      enterprise: 3,
    };
    const userTier = subscription ? tierOrder[subscription.tier] ?? 0 : 0;
    const requiredTierLevel = tierOrder[requiredTier] ?? 0;
    const hasTierAccess = userTier >= requiredTierLevel;
    const hasRoleAccess = !requiredRole || userRole === requiredRole || userRole === 'admin';

    if (truncate && hasTierAccess && !hasRoleAccess) {
      // Show truncated content with upgrade prompt
      return (
        <>
          {Array.isArray(children) ? children.slice(0, maxItems) : children}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                  Showing {maxItems} of {Array.isArray(children) ? children.length : 1} items
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Upgrade to see all {feature} and unlock advanced features.
                </p>
              </div>
              <a
                href="/pricing"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap"
              >
                Upgrade →
              </a>
            </div>
          </div>
        </>
      );
    }

    // Show full gate with value proposition
    return (
      fallback || (
        <SubscriptionGate
          requiredTier={requiredTier}
          feature={feature}
          benefits={benefits}
          showValueProp={showValueProp}
        >
          {null}
        </SubscriptionGate>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Truncate content based on subscription tier
 */
export function TruncateContent({
  tier,
  maxItems,
  children,
  showUpgrade = true,
}: {
  tier: SubscriptionTier;
  maxItems: number;
  children: React.ReactNode;
  showUpgrade?: boolean;
}) {
  const tierLimits: Record<SubscriptionTier, number> = {
    unsubscribed: 3,
    subscribed_unpaid: 10,
    subscribed_paid: 50,
    enterprise: 1000,
  };

  const limit = tierLimits[tier] ?? maxItems;
  const items = Array.isArray(children) ? children : [children];
  const visible = items.slice(0, Math.min(limit, maxItems));
  const hidden = items.length - visible.length;

  return (
    <>
      {visible}
      {hidden > 0 && showUpgrade && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          Showing {visible.length} of {items.length} items. 
          {tier !== 'enterprise' && ' Upgrade to see more.'}
        </div>
      )}
    </>
  );
}
