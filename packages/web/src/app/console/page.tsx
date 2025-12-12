/**
 * Console Overview Page
 * 
 * Shows overview stats and quick links for the Developer Console.
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Activity, Key, Receipt, ToggleLeft, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { getUsageSummary } from '@/domain/console/usage';
import { listApiKeys } from '@/domain/console/apiKeys';
import { listReceipts } from '@/domain/console/receipts';
import { listFeatureFlags } from '@/domain/console/featureFlags';
import { LiveActivityFeed } from '@/components/console/LiveActivityFeed';

export const dynamic = 'force-dynamic';

async function ConsoleOverviewContent() {
  // Environment safety check
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key]
  );
  
  if (missingEnvVars.length > 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Configuration issue: Missing environment variables. Please contact support.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  let user;
  try {
    const supabase = await createClient();
    const authResult = await supabase.auth.getUser();
    user = authResult.data?.user;
    
    if (authResult.error) {
      console.error('[Console] Auth error:', authResult.error);
    }
  } catch (error) {
    console.error('[Console] Failed to get user:', error);
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Unable to verify authentication. Please try signing in again.
        </p>
        <Button asChild>
          <Link href="/signup">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Please sign in to access the Developer Console.
        </p>
        <Button asChild>
          <Link href="/signup">Sign In</Link>
        </Button>
      </div>
    );
  }

  // Get billing account with error handling
  let billingAccount;
  try {
    billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
    });
  } catch (error) {
    console.error('[Console] Failed to fetch billing account:', error);
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Unable to load billing information. Please try again or contact support.
        </p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!billingAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          No billing account found. Please set up your account.
        </p>
        <div className="flex gap-2 justify-center">
          <Button asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch overview data
  const [apiKeys, receipts, flags, usageSummary] = await Promise.all([
    listApiKeys(user.id).catch(() => []),
    listReceipts(billingAccount.id, 5).catch(() => []),
    listFeatureFlags(billingAccount.id).catch(() => []),
    getUsageSummary(
      billingAccount.id,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      new Date()
    ).catch(() => ({
      totalCalls: 0,
      byService: {},
      byOperation: {},
      errorRate: 0,
      period: { start: new Date(), end: new Date() },
    })),
  ]);

  const reconcileCalls = (usageSummary.byService as Record<string, number>)['settler-reconcile'] || 0;
  const receiptsCalls = (usageSummary.byService as Record<string, number>)['settler-receipts'] || 0;
  const flagsCalls = (usageSummary.byService as Record<string, number>)['settler-feature-flags'] || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Developer Console
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your API keys, monitor usage, and explore your data.
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" asChild>
             <Link href="/docs">Documentation</Link>
           </Button>
           <Button asChild>
             <Link href="/console/playground">Playground</Link>
           </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total API Calls</CardDescription>
            <CardTitle className="text-3xl">{usageSummary.totalCalls.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Activity className="w-4 h-4" />
              <span>Last 7 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>API Keys</CardDescription>
            <CardTitle className="text-3xl">{apiKeys.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/console/api-keys">
                Manage Keys <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Receipts Parsed</CardDescription>
            <CardTitle className="text-3xl">{receipts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/console/receipts">
                View Receipts <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Feature Flags</CardDescription>
            <CardTitle className="text-3xl">{flags.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/console/feature-flags">
                Manage Flags <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage by Service</CardTitle>
            <CardDescription>API calls in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium">Reconcile API</span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-mono">
                  {reconcileCalls.toLocaleString()} calls
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">Receipts API</span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-mono">
                  {receiptsCalls.toLocaleString()} calls
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="font-medium">Feature Flags API</span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-mono">
                  {flagsCalls.toLocaleString()} calls
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Feed */}
        <div className="lg:col-span-1 h-full">
          <LiveActivityFeed />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start hover:bg-slate-50 dark:hover:bg-slate-900">
              <Link href="/console/api-keys">
                <Key className="w-5 h-5 mb-2 text-blue-600" />
                <span className="font-semibold">Create API Key</span>
                <span className="text-xs text-slate-500 mt-1">
                  Generate a new API key for your application
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start hover:bg-slate-50 dark:hover:bg-slate-900">
              <Link href="/console/feature-flags">
                <ToggleLeft className="w-5 h-5 mb-2 text-purple-600" />
                <span className="font-semibold">Manage Flags</span>
                <span className="text-xs text-slate-500 mt-1">
                  Create and configure feature flags
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start hover:bg-slate-50 dark:hover:bg-slate-900">
              <Link href="/console/docs">
                <Receipt className="w-5 h-5 mb-2 text-green-600" />
                <span className="font-semibold">View API Docs</span>
                <span className="text-xs text-slate-500 mt-1">
                  Explore endpoints and examples
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConsoleOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading console...</p>
          </div>
        </div>
      }
    >
      <ConsoleOverviewContent />
    </Suspense>
  );
}
