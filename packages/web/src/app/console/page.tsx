/**
 * Console Overview Page
 *
 * Shows overview stats and quick links for the Developer Console.
 * OPTIMIZED: Heavy components code-split with Suspense boundaries
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, Key, Receipt, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUsageSummary } from "@/domain/console/usage";
import { listApiKeys } from "@/domain/console/apiKeys";
import { listReceipts } from "@/domain/console/receipts";
import { listFeatureFlags } from "@/domain/console/featureFlags";
import { validateSupabaseEnv } from "@/lib/env/validator";
import { EnvErrorPanel } from "@/components/env/EnvErrorPanel";
import { isSafeMode } from "@/lib/safe";
import { RBACGate } from "@/lib/rbac-gate";
import { appLogger } from "@/lib/utils/logger";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { PageLoadingSkeleton, CardLoadingSkeleton } from "@/components/shared/loading-state";
import { ConsoleSurfaceMap } from "@/components/feature-visual-proof";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";

// OPTIMIZATION: Code-split heavy dashboard components
// These are not needed for initial paint and add ~15KB to the bundle
// Using next/dynamic with alias to avoid conflict with export const dynamic
import nextDynamic from "next/dynamic";

const LiveActivityFeed = nextDynamic(
  () =>
    import("@/components/console/LiveActivityFeed").then((mod) => ({
      default: mod.LiveActivityFeed,
    })),
  { loading: () => <CardLoadingSkeleton count={3} /> }
);

const OnboardingWizardClient = nextDynamic(
  () =>
    import("@/components/onboarding/OnboardingWizardClient").then((mod) => ({
      default: mod.OnboardingWizardClient,
    })),
  { loading: () => null }
);

const WelcomeBannerClient = nextDynamic(
  () =>
    import("@/components/onboarding/WelcomeBannerClient").then((mod) => ({
      default: mod.WelcomeBannerClient,
    })),
  { loading: () => null }
);

const InsightsPanel = nextDynamic(
  () =>
    import("@/components/console/AIInsightsPanel").then((mod) => ({ default: mod.InsightsPanel })),
  { loading: () => <CardLoadingSkeleton count={2} /> }
);

const ErrorAlertsPanel = nextDynamic(
  () =>
    import("@/components/console/ErrorAlertsPanel").then((mod) => ({
      default: mod.ErrorAlertsPanel,
    })),
  { loading: () => <CardLoadingSkeleton count={2} /> }
);

const UsageWarningBanner = nextDynamic(
  () =>
    import("@/components/console/UsageWarningBanner").then((mod) => ({
      default: mod.UsageWarningBanner,
    })),
  { loading: () => null }
);

const GuidedTourClient = nextDynamic(
  () =>
    import("@/components/console/GuidedTourClient").then((mod) => ({
      default: mod.GuidedTourClient,
    })),
  { loading: () => null }
);

const UsageInsightsPanel = nextDynamic(
  () =>
    import("@/components/console/UsageInsightsPanel").then((mod) => ({
      default: mod.UsageInsightsPanel,
    })),
  { loading: () => <CardLoadingSkeleton count={2} /> }
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Prisma binary engine

async function ConsoleOverviewContent() {
  const startTime = Date.now();

  try {
    // Structured logging for console requests (server-side only, no secrets)
    const logContext = {
      route: "/console",
      timestamp: new Date().toISOString(),
      userAgent: typeof process !== "undefined" ? "server" : "client",
    };

    appLogger.info("Console request started", logContext);

    // Environment safety check using validator
    const envValidation = validateSupabaseEnv();
    if (!envValidation.isValid) {
      appLogger.warn("Missing environment variables", {
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
        appLogger.error("Console auth error", undefined, {
          ...logContext,
          error: authResult.error.message,
          code: authResult.error.status,
        });
      } else if (user) {
        appLogger.info("User authenticated", {
          ...logContext,
          userId: user.id,
          email: user.email ? "***" : undefined, // Don't log full email
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      appLogger.error("Failed to get user", undefined, {
        ...logContext,
        error: errorMessage,
      });
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Authentication Required
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              We couldn't verify your authentication status. Please sign in to access the Developer
              Console.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button asChild>
                <Link href="/signup">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Public minimal mode - show useful content even without auth
    // Also enable safe mode if SAFE_MODE env var is set
    // CRITICAL: In safe mode, skip all database/backend calls
    if (!user || isSafeMode()) {
      return (
        <div className="space-y-6">
          {/* Hero — sign-in prompt */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 md:p-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3">
                Developer Console
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                Settler Developer Console
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Manage API keys, monitor reconciliation usage, and explore your integration. Sign in
                for full console access.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold px-6 shadow-md"
                >
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="px-6 border-slate-300 dark:border-slate-700"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Status + Quick access */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* System status */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    All systems operational
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/status">View Status Page</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Playground */}
            <Card className="md:col-span-1 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Playground
                </CardTitle>
                <CardDescription className="text-xs">Test APIs without an account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  <Link href="/console/playground">Open Playground</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Docs */}
            <Card className="md:col-span-1 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Documentation
                </CardTitle>
                <CardDescription className="text-xs">
                  Guides, reference, and cookbooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/docs">
                      <ArrowRight className="w-3.5 h-3.5 mr-2" />
                      Quickstart
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/cookbook">
                      <ArrowRight className="w-3.5 h-3.5 mr-2" />
                      Cookbooks
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What you unlock */}
          <Card className="bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                What you unlock with a free account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                {[
                  "API key management",
                  "Real-time usage analytics",
                  "Reconciliation run history",
                  "Saved workflows",
                  "Audit evidence export",
                  "Replay Lab access",
                  "Webhook configuration",
                  "Priority support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold px-6 shadow-sm"
                >
                  <Link href="/signup">Create Free Account</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="px-6 border-slate-300 dark:border-slate-700"
                >
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <ConsoleSurfaceMap />
          <RealityEvidencePanel scope="console" title="Console evidence references" />
        </div>
      );
    }

    // Get billing account with comprehensive error handling
    // CRITICAL: Lazy-load Prisma to prevent import-time failures
    let billingAccount = null;
    try {
      // Lazy import Prisma - if it fails, we continue without it
      const { prisma } = await import("@/shared/db/prismaClient").catch(() => ({ prisma: null }));

      if (prisma && typeof prisma.billingAccount !== "undefined") {
        try {
          billingAccount = await Promise.race([
            prisma.billingAccount.findFirst({
              where: { userId: user.id },
            }),
            // Timeout after 5 seconds
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Database query timeout")), 5000)
            ),
          ]);
        } catch (prismaError) {
          appLogger.error("Prisma query failed", prismaError);
          // Don't throw - continue with null billingAccount
          billingAccount = null;
        }

        // Create billing account automatically if missing (graceful degradation)
        if (!billingAccount) {
          try {
            billingAccount = await Promise.race([
              prisma.billingAccount.create({
                data: {
                  userId: user.id,
                  email: user.email || "",
                  status: "active",
                },
              }),
              // Timeout after 5 seconds
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Database create timeout")), 5000)
              ),
            ]);
          } catch (createError) {
            appLogger.error("Failed to create billing account", createError);
            // Don't crash - continue with null billingAccount
            billingAccount = null;
          }
        }
      }
    } catch (err) {
      appLogger.error("Failed to load Prisma or fetch billing account", undefined, {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      // Continue without billing account - use user.id as fallback
      billingAccount = null;
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
      const [apiKeysResult, receiptsResult, flagsResult, usageSummaryResult] =
        await Promise.allSettled([
          listApiKeys().catch((err) => {
            // Don't re-throw - Promise.allSettled handles all errors gracefully
            // Auth errors are already handled by the layout, so we can safely return empty array
            if (err instanceof Error && err.message.includes("Unauthorized")) {
              appLogger.warn("listApiKeys: User not authenticated, returning empty array");
              return [];
            }
            appLogger.error("listApiKeys error", err);
            return [];
          }),
          listReceipts(billingAccountId, 5).catch((err) => {
            appLogger.error("listReceipts error", err);
            return [];
          }),
          listFeatureFlags(billingAccountId).catch((err) => {
            appLogger.error("listFeatureFlags error", err);
            return [];
          }),
          getUsageSummary(
            billingAccountId,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            new Date()
          ).catch((err) => {
            appLogger.error("getUsageSummary error", err);
            return {
              totalCalls: 0,
              byService: {},
              byOperation: {},
              errorRate: 0,
              period: { start: new Date(), end: new Date() },
            };
          }),
        ]);

      if (apiKeysResult.status === "fulfilled") {
        apiKeys = apiKeysResult.value;
      } else {
        appLogger.error("Failed to fetch API keys", apiKeysResult.reason);
      }

      if (receiptsResult.status === "fulfilled") {
        receipts = receiptsResult.value;
      } else {
        appLogger.error("Failed to fetch receipts", receiptsResult.reason);
      }

      if (flagsResult.status === "fulfilled") {
        flags = flagsResult.value;
      } else {
        appLogger.error("Failed to fetch feature flags", flagsResult.reason);
      }

      if (usageSummaryResult.status === "fulfilled") {
        usageSummary = usageSummaryResult.value;
      } else {
        appLogger.error("Failed to fetch usage summary", usageSummaryResult.reason);
      }
    } catch (err) {
      appLogger.error("Error fetching overview data", undefined, {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      // Continue with empty/default values - page will still render
    }

    const reconcileCalls =
      (usageSummary.byService as Record<string, number>)["settler-reconcile"] || 0;
    const receiptsCalls =
      (usageSummary.byService as Record<string, number>)["settler-receipts"] || 0;
    const flagsCalls =
      (usageSummary.byService as Record<string, number>)["settler-feature-flags"] || 0;

    // Format numbers with proper formatting
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    // Log successful page load
    const duration = Date.now() - startTime;
    appLogger.info("Console page loaded successfully", {
      route: "/console",
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
    const userName = user.user_metadata?.name || user.email?.split("@")[0];

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

        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1.5">
              Developer Console
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
              Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              API usage, keys, and integration health — last 7 days
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-slate-300 dark:border-slate-700"
            >
              <Link href="/docs">Docs</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <Link href="/playground">Playground</Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats - Only show if data exists */}
        <RBACGate requiredTier="unsubscribed" feature="Dashboard Stats">
          {usageSummary.totalCalls > 0 ||
          apiKeys.length > 0 ||
          receipts.length > 0 ||
          flags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
                    Total API Calls
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold tracking-tight mt-1">
                    {formatNumber(usageSummary.totalCalls)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 mb-3">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Last 7 days</span>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-slate-200 dark:border-slate-800"
                  >
                    <Link href="/console/usage">
                      View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <RBACGate requiredTier="subscribed_unpaid" feature="API Keys">
                <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-2 pt-5 px-5">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
                      API Keys
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold tracking-tight mt-1">
                      {apiKeys.length}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full text-xs border-slate-200 dark:border-slate-800"
                    >
                      <Link href="/console/api-keys">
                        Manage Keys <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </RBACGate>

              <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
                    Receipts Parsed
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold tracking-tight mt-1">
                    {formatNumber(receipts.length)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-slate-200 dark:border-slate-800"
                  >
                    <Link href="/console/receipts">
                      View Receipts <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <RBACGate requiredTier="subscribed_unpaid" feature="Feature Flags">
                <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-2 pt-5 px-5">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
                      Feature Flags
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold tracking-tight mt-1">
                      {flags.length}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full text-xs border-slate-200 dark:border-slate-800"
                    >
                      <Link href="/console/feature-flags">
                        Manage Flags <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </RBACGate>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Start using Settler to see your stats here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Once you create an API key and start making API calls, your usage statistics will
                  appear here.
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/console/api-keys">
                      Get API Key <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/console/playground">
                      Try Playground <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </RBACGate>

        <RBACGate requiredTier="subscribed_unpaid" feature="Usage Analytics">
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
          <RBACGate requiredTier="subscribed_paid" feature="Insights">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <InsightsPanel />
              <ErrorAlertsPanel />
            </div>
          </RBACGate>

          {/* Usage Insights */}
          <UsageInsightsPanel />
        </RBACGate>

        {/* Quick Actions - Show only first 2 actions initially */}
        <RBACGate requiredTier="unsubscribed" feature="Quick Actions">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <RBACGate requiredTier="subscribed_unpaid" feature="API Keys">
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-4 flex-col items-start hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <Link href="/console/api-keys">
                      <Key className="w-5 h-5 mb-2 text-blue-600" />
                      <span className="font-semibold">Get API Key</span>
                      <span className="text-xs text-slate-500 mt-1">
                        Generate a new API key for your application
                      </span>
                    </Link>
                  </Button>
                </RBACGate>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto py-4 flex-col items-start hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <Link href="/console/playground">
                    <Receipt className="w-5 h-5 mb-2 text-green-600" />
                    <span className="font-semibold">Try Playground</span>
                    <span className="text-xs text-slate-500 mt-1">
                      Test APIs without writing code
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </RBACGate>
      </div>
    );
  } catch (err) {
    // Top-level error boundary - catch any unhandled errors
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    const duration = Date.now() - startTime;

    // Structured error logging (server-side only, no secrets)
    appLogger.error("Console unhandled error", err, {
      route: "/console",
      timestamp: new Date().toISOString(),
      error: errorMessage,
      duration,
      // Only log stack in development
      ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {}),
    });

    // Provide more detailed error information in development
    const isDevelopment = process.env.NODE_ENV === "development";

    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Unable to Load Console
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We encountered an issue while loading the Developer Console. This may be due to:
          </p>
          <ul className="text-left text-sm text-slate-600 dark:text-slate-400 mb-6 space-y-2 max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Temporary service interruption</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Network connectivity issues</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Configuration or authentication problems</span>
            </li>
          </ul>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
            Please try refreshing the page. If the problem persists, contact our support team.
          </p>
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
    <ErrorBoundary context="Console Overview">
      <Suspense fallback={<PageLoadingSkeleton />}>
        <ConsoleOverviewContent />
      </Suspense>
    </ErrorBoundary>
  );
}
