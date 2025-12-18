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
import { validateSupabaseEnv } from '@/lib/env/validator';
import { EnvErrorPanel } from '@/components/env/EnvErrorPanel';
import { LiveActivityFeed } from '@/components/console/LiveActivityFeed';
import { OnboardingWizardClient } from '@/components/onboarding/OnboardingWizardClient';
import { WelcomeBannerClient } from '@/components/onboarding/WelcomeBannerClient';
import { AIInsightsPanel } from '@/components/console/AIInsightsPanel';
import { ErrorAlertsPanel } from '@/components/console/ErrorAlertsPanel';
import { UsageWarningBanner } from '@/components/console/UsageWarningBanner';
import { GuidedTourClient } from '@/components/console/GuidedTourClient';
import { UsageInsightsPanel } from '@/components/console/UsageInsightsPanel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

async function ConsoleOverviewContent() {
  const startTime = Date.now();
  
  try {
    // Structured logging for console requests (server-side only, no secrets)
    const logContext = {
      route: '/console',
      timestamp: new Date().toISOString(),
      userAgent: typeof process !== 'undefined' ? 'server' : 'client',
    };
    
    console.log('[Console] Request started', logContext);
    
    // Environment safety check using validator
    const envValidation = validateSupabaseEnv();
    if (!envValidation.isValid) {
      console.warn('[Console] Missing environment variables', {
        ...logContext,
        missingVars: envValidation.missing,
      });
      return <EnvErrorPanel missingVars={envValidation.missing} />;
    }

    let user;
    try {
      const supabase = await createClient();
      const authResult = await supabase.auth.getUser();
      user = authResult.data?.user;
      
      if (authResult.error) {
        console.error('[Console] Auth error', {
          ...logContext,
          error: authResult.error.message,
          code: authResult.error.status,
        });
      } else if (user) {
        console.log('[Console] User authenticated', {
          ...logContext,
          userId: user.id,
          email: user.email ? '***' : undefined, // Don't log full email
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Console] Failed to get user', {
        ...logContext,
        error: errorMessage,
      });
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

    // Public minimal mode - show useful content even without auth
    if (!user) {
      return (
        <div className="space-y-8">
          {/* Public Minimal Console */}
          <div className="text-center space-y-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Settler Developer Console
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Manage API keys, monitor usage, and control your Settler integration. 
              Sign in for full access, or explore our public tools below.
            </p>
          </div>

          {/* Live Status Widget */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current service availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  All systems operational
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tools - Client-only safe tools */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Tools</CardTitle>
              <CardDescription>Client-side utilities you can use right now</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
                  <Link href="/playground">
                    <span className="font-semibold">JSON Validator</span>
                    <span className="text-xs text-slate-500 mt-1">
                      Validate and format JSON
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
                  <Link href="/playground">
                    <span className="font-semibold">CSV Previewer</span>
                    <span className="text-xs text-slate-500 mt-1">
                      Preview CSV data
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
                  <Link href="/playground">
                    <span className="font-semibold">Sample Demo</span>
                    <span className="text-xs text-slate-500 mt-1">
                      Try reconciliation demo
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Docs Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Learn more about Settler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild variant="outline">
                  <Link href="/cookbook">Cookbook</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/runbooks">Runbooks</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/schematics">Schematics</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Try Playground CTA */}
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">Try Playground</CardTitle>
              <CardDescription className="text-blue-100">
                Experiment with Settler APIs without signing up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="secondary">
                <Link href="/playground">Open Playground</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Sign In CTA */}
          <div className="text-center py-4">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Sign in for full access to API keys, usage analytics, and saved workflows.
            </p>
            <Button asChild>
              <Link href="/signup">Sign In / Sign Up</Link>
            </Button>
          </div>
        </div>
      );
    }

  // Get billing account with comprehensive error handling
  let billingAccount;
  try {
    // Check if Prisma is available and database is accessible
    if (!prisma || typeof prisma.billingAccount === 'undefined') {
      console.warn('[Console] Prisma client not available, using fallback');
      // Continue without billing account - use user.id as fallback
      billingAccount = null;
    } else {
      // Wrap Prisma call in additional try-catch to handle connection errors
      try {
        billingAccount = await Promise.race([
          prisma.billingAccount.findFirst({
            where: { userId: user.id },
          }),
          // Timeout after 5 seconds
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
          ),
        ]);
      } catch (prismaError) {
        console.error('[Console] Prisma query failed:', prismaError);
        // Don't throw - continue with null billingAccount
        billingAccount = null;
      }
    }
  } catch (error) {
    console.error('[Console] Failed to fetch billing account:', error);
    // Don't return early - continue with null billingAccount
    billingAccount = null;
  }
  
  // If Prisma completely failed, show a helpful message but don't crash
  if (!billingAccount && (!prisma || typeof prisma.billingAccount === 'undefined')) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Database connection unavailable. Some features may be limited.
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

  if (!billingAccount && prisma && typeof prisma.billingAccount !== 'undefined') {
    // Create billing account automatically if missing (graceful degradation)
    try {
      // Wrap in timeout to prevent hanging
      billingAccount = await Promise.race([
        prisma.billingAccount.create({
          data: {
            userId: user.id,
            email: user.email || '',
            status: 'active',
          },
        }),
        // Timeout after 5 seconds
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database create timeout')), 5000)
        ),
      ]);
    } catch (createError) {
      console.error('[Console] Failed to create billing account:', createError);
      // Don't crash - continue with null billingAccount and handle gracefully below
      // The domain functions will handle missing billingAccount gracefully
      billingAccount = null;
    }
  }
  
  // If we still don't have a billing account, use a fallback ID for queries
  // This allows the page to render even if billing account creation failed
  const billingAccountId = billingAccount?.id || user.id;

  // Fetch overview data with comprehensive error handling
  let apiKeys: Awaited<ReturnType<typeof listApiKeys>> = [];
  let receipts: Awaited<ReturnType<typeof listReceipts>> = [];
  let flags: Awaited<ReturnType<typeof listFeatureFlags>> = [];
  let usageSummary: Awaited<ReturnType<typeof getUsageSummary>> = {
    totalCalls: 0,
    byService: {},
    byOperation: {},
    errorRate: 0,
    period: { start: new Date(), end: new Date() },
  };

  try {
    const [apiKeysResult, receiptsResult, flagsResult, usageSummaryResult] = await Promise.allSettled([
      listApiKeys().catch((err) => {
        // Don't re-throw - Promise.allSettled handles all errors gracefully
        // Auth errors are already handled by the layout, so we can safely return empty array
        if (err instanceof Error && err.message.includes('Unauthorized')) {
          console.warn('[Console] listApiKeys: User not authenticated, returning empty array');
          return [];
        }
        console.error('[Console] listApiKeys error:', err);
        return [];
      }),
      listReceipts(billingAccountId, 5).catch((err) => {
        console.error('[Console] listReceipts error:', err);
        return [];
      }),
      listFeatureFlags(billingAccountId).catch((err) => {
        console.error('[Console] listFeatureFlags error:', err);
        return [];
      }),
      getUsageSummary(
        billingAccountId,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        new Date()
      ).catch((err) => {
        console.error('[Console] getUsageSummary error:', err);
        return {
          totalCalls: 0,
          byService: {},
          byOperation: {},
          errorRate: 0,
          period: { start: new Date(), end: new Date() },
        };
      }),
    ]);

    if (apiKeysResult.status === 'fulfilled') {
      apiKeys = apiKeysResult.value;
    } else {
      console.error('[Console] Failed to fetch API keys:', apiKeysResult.reason);
    }

    if (receiptsResult.status === 'fulfilled') {
      receipts = receiptsResult.value;
    } else {
      console.error('[Console] Failed to fetch receipts:', receiptsResult.reason);
    }

    if (flagsResult.status === 'fulfilled') {
      flags = flagsResult.value;
    } else {
      console.error('[Console] Failed to fetch feature flags:', flagsResult.reason);
    }

    if (usageSummaryResult.status === 'fulfilled') {
      usageSummary = usageSummaryResult.value;
    } else {
      console.error('[Console] Failed to fetch usage summary:', usageSummaryResult.reason);
    }
  } catch (error) {
    console.error('[Console] Error fetching overview data:', error);
    // Continue with empty/default values - page will still render
  }

  const reconcileCalls = (usageSummary.byService as Record<string, number>)['settler-reconcile'] || 0;
  const receiptsCalls = (usageSummary.byService as Record<string, number>)['settler-receipts'] || 0;
  const flagsCalls = (usageSummary.byService as Record<string, number>)['settler-feature-flags'] || 0;

  // Format numbers with proper formatting
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Log successful page load
  const duration = Date.now() - startTime;
  console.log('[Console] Page loaded successfully', {
    route: '/console',
    timestamp: new Date().toISOString(),
    duration,
    dataLoaded: {
      apiKeys: apiKeys.length,
      receipts: receipts.length,
      flags: flags.length,
      usageSummary: usageSummary.totalCalls,
    },
  });

  // Get user name from user metadata or email
  const userName = user.user_metadata?.name || user.email?.split('@')[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <WelcomeBannerClient userName={userName} />
      
      {/* Usage Warning Banner */}
      <UsageWarningBanner />
      
      {/* Onboarding Wizard */}
      <OnboardingWizardClient />
      
      {/* Guided Tour */}
      <GuidedTourClient />

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
             <Link href="/playground">Playground</Link>
           </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription>Total API Calls</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(usageSummary.totalCalls)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Activity className="w-4 h-4" />
              <span>Last 7 days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription>API Keys</CardDescription>
            <CardTitle className="text-3xl">{apiKeys.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/console/api-keys">
                Manage Keys <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription>Receipts Parsed</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(receipts.length)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/console/receipts">
                View Receipts <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription>Feature Flags</CardDescription>
            <CardTitle className="text-3xl">{flags.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
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
                <span className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                  {formatNumber(reconcileCalls)} calls
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">Receipts API</span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                  {formatNumber(receiptsCalls)} calls
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="font-medium">Feature Flags API</span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                  {formatNumber(flagsCalls)} calls
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

      {/* AI Insights & Error Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AIInsightsPanel />
        <ErrorAlertsPanel />
      </div>

      {/* Usage Insights */}
      <UsageInsightsPanel />

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
  } catch (error) {
    // Top-level error boundary - catch any unhandled errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const duration = Date.now() - startTime;
    
    // Structured error logging (server-side only, no secrets)
    console.error('[Console] Unhandled error', {
      route: '/console',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      duration,
      // Only log stack in development
      ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
    });
    
    // Provide more detailed error information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Unable to Load Console
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We encountered an error while loading the Developer Console. This might be due to:
          </p>
          <ul className="text-left text-sm text-slate-600 dark:text-slate-400 mb-6 space-y-2 max-w-md mx-auto">
            <li>• Database connection issues</li>
            <li>• Missing database tables or migrations</li>
            <li>• Configuration issues with Supabase</li>
            <li>• Missing environment variables</li>
          </ul>
          {isDevelopment && errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-mono text-red-800 dark:text-red-200 break-all">
                Error: {errorMessage}
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/console/setup-check">Run Diagnostics</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
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
