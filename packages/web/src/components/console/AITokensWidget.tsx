/**
 * AI Tokens Widget
 * 
 * Displays current AI token usage and allows purchasing add-ons.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus } from 'lucide-react';
import { ConsoleErrorBoundary } from './ErrorBoundary';
import Link from 'next/link';

interface AITokenInfo {
  plan: string;
  includedTokens: number;
  purchasedTokens: number;
  totalAvailableTokens: number;
  overagePrice: number;
  pricing: {
    commercial: { pricePer1M: number; description: string };
    enterprise: { pricePer1M: number; description: string };
  };
}

export function AITokensWidget() {
  const [tokenInfo, setTokenInfo] = useState<AITokenInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/console/billing/ai-tokens')
      .then((res) => res.json())
      .then((data) => {
        setTokenInfo(data);
      })
      .catch((error) => {
        console.error('Failed to fetch AI token info:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-border dark:bg-border rounded w-3/4"></div>
            <div className="h-4 bg-border dark:bg-border rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenInfo || tokenInfo.includedTokens === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Upgrade to Commercial or Enterprise to unlock AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                <strong>AI Insights include:</strong>
              </p>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
                <li>Cost optimization recommendations</li>
                <li>Performance improvement suggestions</li>
                <li>Usage pattern analysis</li>
                <li>Anomaly detection</li>
              </ul>
            </div>
            <Button asChild className="w-full">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercent = tokenInfo.totalAvailableTokens > 0
    ? Math.min(100, (tokenInfo.purchasedTokens / tokenInfo.totalAvailableTokens) * 100)
    : 0;

  const pricePer1M = tokenInfo.plan === 'scale' 
    ? tokenInfo.pricing.enterprise.pricePer1M 
    : tokenInfo.pricing.commercial.pricePer1M;

  return (
    <ConsoleErrorBoundary>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                AI Tokens
              </CardTitle>
              <CardDescription>
                {tokenInfo.totalAvailableTokens.toLocaleString()} tokens available
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
              {tokenInfo.plan === 'scale' ? 'Enterprise' : 'Commercial'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Included</span>
                <span className="text-sm text-muted-foreground">
                  {tokenInfo.includedTokens.toLocaleString()} tokens/month
                </span>
              </div>
              {tokenInfo.purchasedTokens > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Purchased</span>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    +{tokenInfo.purchasedTokens.toLocaleString()} tokens
                  </span>
                </div>
              )}
              <div className="w-full bg-border dark:bg-border rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            <div className="bg-muted/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Add-On Pricing</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  ${pricePer1M}/1M tokens
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tokens never expire. Purchase additional tokens as needed.
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/console/billing">
                <Plus className="w-4 h-4 mr-2" />
                Purchase Add-Ons
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </ConsoleErrorBoundary>
  );
}
