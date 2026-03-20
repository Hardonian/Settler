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
import {
  Activity,
  Key,
  Lock,
  Database,
  Receipt,
  ArrowRight,
  ShieldCheck,
  ScanSearch,
  ClipboardCheck,
  Bot,
  CheckCircle2,
  Flag,
} from "lucide-react";
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
import { RouteStateCard } from "@/components/shared/route-state";
import { StatCard } from "@/components/ui/stat-card";

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
        <RouteStateCard
          icon={Lock}
          title="Authentication required"
          description="Unable to verify your session. Sign in to access the console."
          detail="Your session was missing or expired. Re-authenticate to load tenant-scoped data."
          actions={[
            { label: "Sign In", href: "/login" },
            { label: "Go Home", href: "/", variant: "outline" },
          ]}
        />
      );
    }

    // Public minimal mode - show useful content even without auth
    // Also enable safe mode if SAFE_MODE env var is set
    // CRITICAL: In safe mode, skip all database/backend calls
    if (!user || isSafeMode()) {
      return (
        <div className="space-y-6">
          {/* Hero — sign-in prompt */}
          <div className="rounded-xl border border-border bg-card p-8 md:p-10">
            <div className="max-w-xl">
              <p className="section-eyebrow mb-3">Developer Console</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                Settler Developer Console
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Manage API keys, monitor reconciliation usage, and explore your integration. Sign in
                for full console access.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
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
                <CardTitle className="label-muted">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                {envValidation.isValid ? (
                  <div className="flex items-center gap-2.5">
                    <span className="status-dot-ok" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">
                      All systems operational
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="status-dot-degraded" aria-hidden="true" />
                      <span className="text-sm font-medium text-foreground">
                        Configuration required
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Missing: {envValidation.missing.join(", ")}. Some features may be unavailable
                      until environment is configured.
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/console/diagnostics">View Setup Guide</Link>
                    </Button>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-border">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/status">View Status Page</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Playground */}
            <Card className="md:col-span-1 card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="label-muted">Playground</CardTitle>
                <CardDescription>Test APIs without an account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" className="w-full">
                  <Link href="/console/playground">Open Playground</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Docs */}
            <Card className="md:col-span-1 card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="label-muted">Documentation</CardTitle>
                <CardDescription>Guides, reference, and cookbooks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/docs">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Quickstart
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/cookbook">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Cookbooks
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What you unlock */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>What you unlock with a free account</CardTitle>
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/signup">Create Free Account</Link>
                </Button>
                <Button variant="outline" asChild>
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

        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 pb-6 border-b border-border">
          <div>
            <p className="section-eyebrow mb-1.5">Developer Console</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
              Overview
            </h1>
            <p className="text-sm text-muted-foreground">
              API usage, keys, and integration health — last 7 days
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/docs">Docs</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/playground">Playground</Link>
            </Button>
          </div>
        </div>

        <Card className="border-electric-cyan/30 bg-gradient-to-r from-electric-cyan/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-electric-cyan" />
              Enterprise Capability Surfaces
            </CardTitle>
            <CardDescription>
              Deterministic traceability, governance controls, and operator intelligence available
              in the console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/console/replay">
                  <ScanSearch className="w-4 h-4 mr-2" />
                  Replay Lab
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/console/audit-trail">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Audit Trail
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/console/bulk-operations">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Bulk Operations
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/console/operator">
                  <Bot className="w-4 h-4 mr-2" />
                  Operator Console
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Only show if data exists */}
        <RBACGate requiredTier="unsubscribed" feature="Dashboard Stats">
          {usageSummary.totalCalls > 0 ||
          apiKeys.length > 0 ||
          receipts.length > 0 ||
          flags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total API Calls"
                value={formatNumber(usageSummary.totalCalls)}
                icon={Activity}
                description="Last 7 days"
                href="/console/usage"
                linkLabel="View details"
              />

              <RBACGate requiredTier="subscribed_unpaid" feature="API Keys">
                <StatCard
                  label="API Keys"
                  value={apiKeys.length}
                  icon={Key}
                  href="/console/api-keys"
                  linkLabel="Manage keys"
                />
              </RBACGate>

              <StatCard
                label="Receipts Parsed"
                value={formatNumber(receipts.length)}
                icon={Receipt}
                href="/console/receipts"
                linkLabel="View receipts"
              />

              <RBACGate requiredTier="subscribed_unpaid" feature="Feature Flags">
                <StatCard
                  label="Feature Flags"
                  value={flags.length}
                  icon={Flag}
                  href="/console/feature-flags"
                  linkLabel="Manage flags"
                />
              </RBACGate>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Start using Settler to see your stats here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
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
                <div className="space-y-2">
                  {[
                    { label: "Reconcile API", calls: reconcileCalls, color: "bg-blue-500" },
                    { label: "Receipts API", calls: receiptsCalls, color: "bg-success" },
                    { label: "Feature Flags API", calls: flagsCalls, color: "bg-primary" },
                  ].map(({ label, calls, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <span className="font-mono text-sm text-muted-foreground tabular-nums">
                        {formatNumber(calls)} calls
                      </span>
                    </div>
                  ))}
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
                    className="h-auto py-4 flex-col items-start hover:bg-muted/50"
                  >
                    <Link href="/console/api-keys">
                      <Key className="w-5 h-5 mb-2 text-primary" />
                      <span className="font-semibold">Get API Key</span>
                      <span className="text-xs text-muted-foreground mt-1 whitespace-normal">
                        Generate a new API key for your application
                      </span>
                    </Link>
                  </Button>
                </RBACGate>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto py-4 flex-col items-start hover:bg-muted/50"
                >
                  <Link href="/console/playground">
                    <Receipt className="w-5 h-5 mb-2 text-success" />
                    <span className="font-semibold">Try Playground</span>
                    <span className="text-xs text-muted-foreground mt-1 whitespace-normal">
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

    return (
      <RouteStateCard
        icon={Database}
        title="Console failed to load"
        description="An unexpected error occurred while rendering the console overview."
        detail="Retry or run diagnostics. If this persists, sign in again to refresh your session."
        actions={[
          { label: "Run Diagnostics", href: "/console/setup-check" },
          { label: "Go Home", href: "/", variant: "outline" },
        ]}
      />
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
