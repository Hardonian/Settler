'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Lock } from 'lucide-react';
import { SubscriptionStatus } from '@/lib/subscription-access';

interface SubscriptionGateProps {
  requiredTier: 'unsubscribed' | 'subscribed_unpaid' | 'subscribed_paid' | 'enterprise';
  feature: string;
  children: React.ReactNode;
}

/**
 * Subscription Gate Component
 * 
 * Restricts access to features based on subscription tier
 */
export function SubscriptionGate({ requiredTier, feature, children }: SubscriptionGateProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const response = await fetch('/api/console/subscription-status');
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Failed to load subscription:', err);
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

  if (!subscription) {
    return <AccessDenied feature={feature} />;
  }

  const tierOrder: Record<string, number> = {
    unsubscribed: 0,
    subscribed_unpaid: 1,
    subscribed_paid: 2,
    enterprise: 3,
  };

  const userTier = tierOrder[subscription.tier] || 0;
  const requiredTierLevel = tierOrder[requiredTier] || 0;

  if (userTier < requiredTierLevel) {
    return <AccessDenied feature={feature} currentTier={subscription.tier} requiredTier={requiredTier} />;
  }

  return <>{children}</>;
}

function AccessDenied({ 
  feature, 
  currentTier, 
  requiredTier 
}: { 
  feature: string; 
  currentTier?: string; 
  requiredTier?: string;
}) {
  const tierLabels: Record<string, string> = {
    unsubscribed: 'Free',
    subscribed_unpaid: 'Unpaid Subscription',
    subscribed_paid: 'Paid Subscription',
    enterprise: 'Enterprise',
  };

  const isUnsubscribed = currentTier === 'unsubscribed' || !currentTier;
  const isUnpaid = currentTier === 'subscribed_unpaid';
  const ctaHref = isUnsubscribed ? '/pricing' : '/console/billing';
  const ctaLabel = isUnsubscribed ? 'View Pricing' : 'Update Billing';
  const secondaryHref = isUnsubscribed ? '/signup' : '/console';
  const secondaryLabel = isUnsubscribed ? 'Sign In' : 'Back to Console';

  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <Lock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-2">Subscription Required</h3>
          <p className="text-yellow-800 mb-4">
            {feature} requires a {requiredTier ? tierLabels[requiredTier] : 'subscription'}.
            {isUnsubscribed && (
              <span className="block mt-1">
                Start on a paid plan to unlock this feature and higher monthly limits.
              </span>
            )}
            {isUnpaid && (
              <span className="block mt-1">
                Your subscription is unpaid. Update billing to restore full access.
              </span>
            )}
            {currentTier && (
              <span className="block mt-1">
                Your current plan: <strong>{tierLabels[currentTier]}</strong>
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4" />
              {ctaLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
