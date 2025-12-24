'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { CreditCard, Lock, Sparkles, Zap, Shield, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SubscriptionStatus } from '@/lib/subscription-access';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionGateProps {
  requiredTier: 'unsubscribed' | 'subscribed_unpaid' | 'subscribed_paid' | 'enterprise';
  feature: string;
  children: React.ReactNode;
  /** Show value proposition instead of just blocking */
  showValueProp?: boolean;
  /** Custom benefits to highlight */
  benefits?: string[];
}

/**
 * Enhanced Subscription Gate Component
 * 
 * Restricts access to features based on subscription tier with compelling value propositions
 * Optimized with request deduplication and better UX
 */
export function SubscriptionGate({ 
  requiredTier, 
  feature, 
  children,
  showValueProp = true,
  benefits 
}: SubscriptionGateProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      // Use cache-busting only if needed, otherwise rely on browser cache
      const response = await fetch('/api/console/subscription-status', {
        cache: 'no-store', // Always fresh for gating decisions
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError('Unable to verify subscription status');
      // Default to unsubscribed on error (fail closed for security)
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

  const hasAccess = useMemo(() => {
    if (!subscription) return false;
    
    const tierOrder: Record<string, number> = {
      unsubscribed: 0,
      subscribed_unpaid: 1,
      subscribed_paid: 2,
      enterprise: 3,
    };

    const userTier = tierOrder[subscription.tier] || 0;
    const requiredTierLevel = tierOrder[requiredTier] || 0;
    
    return userTier >= requiredTierLevel;
  }, [subscription, requiredTier]);

  if (loading) {
    return (
      <div className="animate-pulse p-6">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription || !hasAccess) {
    return (
      <AccessDenied 
        feature={feature} 
        currentTier={subscription?.tier} 
        requiredTier={requiredTier}
        showValueProp={showValueProp}
        benefits={benefits}
        onRetry={loadSubscription}
      />
    );
  }

  return <>{children}</>;
}

interface AccessDeniedProps {
  feature: string;
  currentTier?: string;
  requiredTier?: string;
  showValueProp?: boolean;
  benefits?: string[];
}

function AccessDenied({ 
  feature, 
  currentTier, 
  requiredTier,
  showValueProp = true,
  benefits,
}: AccessDeniedProps) {
  const tierInfo = useMemo(() => {
    const tierLabels: Record<string, { label: string; icon: typeof Lock; color: string }> = {
      unsubscribed: { 
        label: 'Free Plan', 
        icon: Lock,
        color: 'text-slate-600'
      },
      subscribed_unpaid: { 
        label: 'Unpaid Subscription', 
        icon: CreditCard,
        color: 'text-yellow-600'
      },
      subscribed_paid: { 
        label: 'Paid Subscription', 
        icon: CheckCircle2,
        color: 'text-green-600'
      },
      enterprise: { 
        label: 'Enterprise', 
        icon: Shield,
        color: 'text-purple-600'
      },
    };

    return {
      current: tierLabels[currentTier || 'unsubscribed'] || tierLabels.unsubscribed,
      required: tierLabels[requiredTier || 'subscribed_paid'] || tierLabels.subscribed_paid,
    };
  }, [currentTier, requiredTier]);

  const defaultBenefits = useMemo(() => {
    if (benefits) return benefits;
    
    const benefitsMap: Record<string, string[]> = {
      'API Keys': [
        'Unlimited API keys',
        'Advanced key management',
        'Key rotation & security',
        'Usage analytics per key'
      ],
      'Usage Analytics': [
        'Real-time usage tracking',
        'Historical analytics',
        'Cost optimization insights',
        'Custom date ranges'
      ],
      'Feature Flags': [
        'Unlimited feature flags',
        'Environment management',
        'A/B testing support',
        'Advanced targeting'
      ],
      'Reconciliation': [
        'Unlimited reconciliations',
        'Automated matching',
        'Custom rules engine',
        'Bulk operations'
      ],
      'Webhooks': [
        'Unlimited webhooks',
        'Event filtering',
        'Retry logic',
        'Webhook analytics'
      ],
    };

    return benefitsMap[feature] || [
      'Full access to all features',
      'Priority support',
      'Advanced analytics',
      'Custom integrations'
    ];
  }, [feature, benefits]);

  const upgradeUrl = currentTier === 'unsubscribed' 
    ? '/pricing?feature=' + encodeURIComponent(feature)
    : '/console/billing?upgrade=true';

  const CurrentTierIcon = tierInfo.current?.icon || Lock;
  const RequiredTierIcon = tierInfo.required?.icon || Lock;

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">
              Unlock {feature}
            </CardTitle>
            <CardDescription className="text-base">
              {currentTier === 'unsubscribed' 
                ? 'Upgrade to access this powerful feature'
                : currentTier === 'subscribed_unpaid'
                ? 'Complete your payment to unlock this feature'
                : 'Upgrade your plan to access this feature'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current vs Required Tier */}
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
          <div className="flex-1 text-center">
            <CurrentTierIcon className={`w-5 h-5 mx-auto mb-2 ${tierInfo.current?.color || 'text-slate-600'}`} />
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Current</div>
            <div className="text-lg font-semibold">{tierInfo.current?.label || 'Free Plan'}</div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div className="flex-1 text-center">
            <RequiredTierIcon className={`w-5 h-5 mx-auto mb-2 ${tierInfo.required?.color || 'text-blue-600'}`} />
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Required</div>
            <div className="text-lg font-semibold">{tierInfo.required?.label || 'Paid Subscription'}</div>
          </div>
        </div>

        {/* Value Proposition */}
        {showValueProp && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-blue-600" />
              What you'll get:
            </div>
            <ul className="space-y-2">
              {defaultBenefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Benefits Highlight */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg">
          <div className="text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Instant Access</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Scale Freely</div>
          </div>
          <div className="text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Priority Support</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Link href={upgradeUrl} className="flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              {currentTier === 'unsubscribed' ? 'View Pricing Plans' : 'Upgrade Now'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/console">
              Back to Console
            </Link>
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          <span>✓ Cancel anytime</span>
          <span className="mx-2">•</span>
          <span>✓ No credit card required for trial</span>
          <span className="mx-2">•</span>
          <span>✓ 14-day money-back guarantee</span>
        </div>
      </CardContent>
    </Card>
  );
}
