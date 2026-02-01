'use client';

import { useEffect, useState } from 'react';
import { SubscriptionGate } from '@/components/console/SubscriptionGate';
import { SubscriptionTier, SubscriptionStatus } from './subscription-access';

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
}

/**
 * RBAC Gate Component
 * 
 * Combines subscription tier checks with role-based access control.
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
}: RBACGateProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccess();
  }, []);

  async function loadAccess() {
    try {
      const [subResponse, roleResponse] = await Promise.all([
        fetch('/api/console/subscription-status').catch(() => null),
        requiredRole ? fetch('/api/console/user-role').catch(() => null) : Promise.resolve(null),
      ]);

      if (subResponse && subResponse.ok) {
        const subData = await subResponse.json() as SubscriptionStatus;
        setSubscription(subData);
      } else {
        // Default to unsubscribed on error
        setSubscription({
          tier: 'unsubscribed',
          hasSubscription: false,
          isPaid: false,
          isEnterprise: false,
        });
      }

      if (roleResponse && roleResponse.ok) {
        const roleData = await roleResponse.json() as { role?: string };
        setUserRole(roleData.role || null);
      }
    } catch (_error) {
      console.error('Failed to load access:', error);
      // Default to unsubscribed on error
      setSubscription({
        tier: 'unsubscribed',
        hasSubscription: false,
        isPaid: false,
        isEnterprise: false,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  // Check subscription tier
  const tierOrder: Record<SubscriptionTier, number> = {
    unsubscribed: 0,
    subscribed_unpaid: 1,
    subscribed_paid: 2,
    enterprise: 3,
  };

  const userTier = subscription?.tier ? tierOrder[subscription.tier] ?? 0 : 0;
  const requiredTierLevel = tierOrder[requiredTier] ?? 0;
  const hasTierAccess = userTier >= requiredTierLevel;

  // Check role if required
  const hasRoleAccess = !requiredRole || userRole === requiredRole || userRole === 'admin';

  if (!hasTierAccess || !hasRoleAccess) {
    if (truncate && hasTierAccess && !hasRoleAccess) {
      // Show truncated content
      return (
        <>
          {Array.isArray(children) ? children.slice(0, maxItems) : children}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            Showing limited content. Upgrade to see all {feature}.
          </div>
        </>
      );
    }
    return fallback || <SubscriptionGate requiredTier={requiredTier} feature={feature}>{null}</SubscriptionGate>;
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
