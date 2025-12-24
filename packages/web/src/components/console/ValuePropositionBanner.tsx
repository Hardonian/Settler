'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useState, useEffect } from 'react';

interface ValuePropositionBannerProps {
  /** Feature to highlight */
  feature?: string;
  /** Custom message */
  message?: string;
  /** Custom CTA text */
  ctaText?: string;
  /** Custom CTA URL */
  ctaUrl?: string;
  /** Dismissible */
  dismissible?: boolean;
  /** Storage key for dismissal */
  storageKey?: string;
}

/**
 * Value Proposition Banner
 * 
 * Shows compelling upgrade prompts for unauthenticated or unpaid users
 * Optimized to not show for already-paid users
 */
export function ValuePropositionBanner({
  feature,
  message,
  ctaText,
  ctaUrl,
  dismissible = true,
  storageKey = 'value-prop-banner-dismissed',
}: ValuePropositionBannerProps) {
  const { subscription, loading } = useSubscriptionStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissible && typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(storageKey) === 'true';
      setDismissed(isDismissed);
    }
  }, [dismissible, storageKey]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
      setDismissed(true);
    }
  };

  // Don't show for paid/enterprise users
  if (loading || !subscription || subscription.isPaid || subscription.isEnterprise || dismissed) {
    return null;
  }

  const defaultMessage = subscription.tier === 'unsubscribed'
    ? 'Unlock the full power of Settler with a subscription'
    : 'Complete your payment to access all features';

  const defaultCtaText = subscription.tier === 'unsubscribed'
    ? 'View Pricing'
    : 'Complete Payment';

  const defaultCtaUrl = subscription.tier === 'unsubscribed'
    ? '/pricing'
    : '/console/billing';

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {feature ? `Unlock ${feature}` : 'Upgrade Your Plan'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {message || defaultMessage}
            </p>
            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Link href={ctaUrl || defaultCtaUrl} className="flex items-center gap-1">
                  {ctaText || defaultCtaText}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
