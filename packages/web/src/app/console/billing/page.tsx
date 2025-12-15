'use client';

import React, { useEffect, useState } from 'react';
import { ConsoleLayout } from '@/components/console/ConsoleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AITokensWidget } from '@/components/console/AITokensWidget';

interface BillingData {
  billingAccount: {
    id: string;
    email: string;
    status: string;
  };
  subscription: {
    id: string;
    planName: string;
    planCode: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: {
    reconcile: { current: number; limit: number };
    receipts: { current: number; limit: number };
    featureFlags: { current: number; limit: number };
  };
}

export default function BillingPage() {
  const router = useRouter();
  const [data, setData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<string | null>(null);

  useEffect(() => {
    void fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/console/billing');
      if (!response.ok) {
        throw new Error('Failed to load billing data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsCreatingPortal(true);
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/console/billing`,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setIsCreatingPortal(false);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    try {
      setIsCreatingCheckout(planCode);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode,
          successUrl: `${window.location.origin}/console/billing?success=true`,
          cancelUrl: `${window.location.origin}/console/billing?canceled=true`,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsCreatingCheckout(null);
    }
  };

  if (isLoading) {
    return (
      <ConsoleLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </ConsoleLayout>
    );
  }

  if (error || !data) {
    return (
      <ConsoleLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error || 'Failed to load billing data'}</p>
            </div>
          </CardContent>
        </Card>
      </ConsoleLayout>
    );
  }

  const planCode = data.subscription?.planCode || 'free';
  const isFree = planCode === 'free';
  const isPro = planCode === 'pro';
  const isScale = planCode === 'scale';

  const usageBars = [
    {
      service: 'Reconcile',
      current: data.usage.reconcile.current,
      limit: data.usage.reconcile.limit,
      percentage: Math.min(100, (data.usage.reconcile.current / data.usage.reconcile.limit) * 100),
    },
    {
      service: 'Receipts',
      current: data.usage.receipts.current,
      limit: data.usage.receipts.limit,
      percentage: Math.min(100, (data.usage.receipts.current / data.usage.receipts.limit) * 100),
    },
    {
      service: 'Feature Flags',
      current: data.usage.featureFlags.current,
      limit: data.usage.featureFlags.limit,
      percentage: Math.min(100, (data.usage.featureFlags.current / data.usage.featureFlags.limit) * 100),
    },
  ];

  return (
    <ConsoleLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Billing & Plan</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your subscription and view usage
            </p>
          </div>
          {data.subscription && (
            <Button
              onClick={handleManageBilling}
              disabled={isCreatingPortal}
              variant="outline"
            >
              {isCreatingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </>
              )}
            </Button>
          )}
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  {data.subscription
                    ? `Active subscription - ${data.subscription.planName}`
                    : 'Free plan - No active subscription'}
                </CardDescription>
              </div>
              <Badge
                variant={data.subscription?.status === 'active' ? 'default' : 'secondary'}
              >
                {data.subscription?.status || 'Free'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.subscription && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span className="font-medium">{data.subscription.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Period:</span>
                  <span className="font-medium">
                    {new Date(data.subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                    {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                {data.subscription.cancelAtPeriodEnd && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Subscription will cancel at period end</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Current usage for this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageBars.map((bar) => (
              <div key={bar.service} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{bar.service}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {bar.current.toLocaleString()} / {bar.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      bar.percentage >= 90
                        ? 'bg-red-500'
                        : bar.percentage >= 75
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${bar.percentage}%` }}
                  />
                </div>
                {bar.percentage >= 90 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Approaching limit. Consider upgrading.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Plan Options */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Upgrade or change your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <div
                className={`p-4 border rounded-lg ${
                  isFree ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Free</h3>
                  {isFree && (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  $0/month
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• 1,000 reconciliations/month</li>
                  <li>• 100 receipt parses/month</li>
                  <li>• 100k feature flag evaluations/month</li>
                </ul>
                {!isFree && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/pricing')}
                  >
                    View Details
                  </Button>
                )}
              </div>

              {/* Pro Plan */}
              <div
                className={`p-4 border rounded-lg ${
                  isPro ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Pro</h3>
                  {isPro && (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  $99/month
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• 100,000 reconciliations/month</li>
                  <li>• 10,000 receipt parses/month</li>
                  <li>• 1M feature flag evaluations/month</li>
                  <li>• 100k AI tokens/month</li>
                  <li>• AI-powered insights</li>
                  <li>• Priority support</li>
                </ul>
                {!isPro && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpgrade('pro')}
                    disabled={isCreatingCheckout === 'pro'}
                  >
                    {isCreatingCheckout === 'pro' ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Upgrade to Pro'
                    )}
                  </Button>
                )}
              </div>

              {/* Scale Plan */}
              <div
                className={`p-4 border rounded-lg ${
                  isScale ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Scale</h3>
                  {isScale && (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  $499/month
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• 1M reconciliations/month</li>
                  <li>• 100k receipt parses/month</li>
                  <li>• 10M feature flag evaluations/month</li>
                  <li>• 1M AI tokens/month</li>
                  <li>• AI-powered insights</li>
                  <li>• Priority support</li>
                  <li>• Custom integrations</li>
                </ul>
                {!isScale && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpgrade('scale')}
                    disabled={isCreatingCheckout === 'scale'}
                  >
                    {isCreatingCheckout === 'scale' ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Upgrade to Scale'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
        </Card>

        {/* AI Tokens Widget */}
        <AITokensWidget />
      </div>
    </ConsoleLayout>
  );
}
