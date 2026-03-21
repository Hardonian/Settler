"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UsageLimitIndicator } from "@/components/UsageLimitIndicator";
import {
  BarChart3,
  Zap,
  CreditCard,
  ArrowUpRight,
  Database,
  Globe,
  Clock,
  Layers,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface BillingData {
  billingAccount: { id: string; email: string; status: string } | null;
  subscription: {
    planName: string;
    planCode: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: {
    reconcile: { current: number; limit: number };
    exceptions: { current: number; limit: number };
  };
  stripeConfigured?: boolean;
}

interface UsageData {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  period: { start: string; end: string };
  limits: {
    reconcile?: { current: number; limit: number; remaining: number };
    receipts?: { current: number; limit: number; remaining: number };
    featureFlags?: { current: number; limit: number; remaining: number };
    playground?: { current: number; limit: number; remaining: number };
  };
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UsagePage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [billingRes, usageRes] = await Promise.all([
          fetch("/api/console/billing"),
          fetch("/api/console/usage?days=30"),
        ]);

        if (billingRes.ok) {
          setBilling(await billingRes.json());
        }
        if (usageRes.ok) {
          setUsage(await usageRes.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load usage data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading usage data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const reconUsage = billing?.usage?.reconcile ??
    usage?.limits?.reconcile ?? { current: 0, limit: 0 };
  const reconPercent = reconUsage.limit > 0 ? (reconUsage.current / reconUsage.limit) * 100 : 0;

  const receiptsUsage = usage?.limits?.receipts ?? { current: 0, limit: 0, remaining: 0 };
  const receiptsPercent =
    receiptsUsage.limit > 0 ? (receiptsUsage.current / receiptsUsage.limit) * 100 : 0;

  const planName = billing?.subscription?.planName ?? "Free";
  const planStatus = billing?.subscription?.status ?? "inactive";
  const periodEnd = billing?.subscription?.currentPeriodEnd;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Operations & Billing
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Usage Control</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Monitor infrastructure consumption and manage your resource allocation. Usage metrics
            are tracked in real-time to ensure predictable performance across your reconciliation
            pipelines.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 font-bold gap-2 shadow-xl ring-1 ring-primary/20">
          <Link href="/pricing" className="flex items-center gap-2">
            Upgrade Resources
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Consumption Grid */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 overflow-hidden glass">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Consumption Metrics
              </CardTitle>
              <CardDescription className="font-medium mt-1">
                Resource utilization across the current billing period.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {/* Reconciliations */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Monthly Reconciliations</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Volume processed through the engine
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono">
                      {formatNumber(reconUsage.current)}
                    </span>
                    {reconUsage.limit > 0 && (
                      <span className="text-xs text-muted-foreground font-medium ml-2">
                        / {formatNumber(reconUsage.limit)}
                      </span>
                    )}
                  </div>
                </div>
                <Progress value={reconPercent} className="h-2" />
              </div>

              {/* Receipts */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Receipt Processing</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Parsed and validated receipt documents
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono">
                      {formatNumber(receiptsUsage.current)}
                    </span>
                    {receiptsUsage.limit > 0 && (
                      <span className="text-xs text-muted-foreground font-medium ml-2">
                        / {formatNumber(receiptsUsage.limit)}
                      </span>
                    )}
                  </div>
                </div>
                <Progress value={receiptsPercent} className="h-2" />
              </div>

              {/* API Calls */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">API Calls (30d)</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Total API calls in the current period
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono">
                      {formatNumber(usage?.totalCalls ?? 0)}
                    </span>
                  </div>
                </div>
                {usage?.errorRate !== undefined && usage.errorRate > 0 && (
                  <p className="text-xs text-destructive font-medium">
                    Error rate: {usage.errorRate.toFixed(2)}%
                  </p>
                )}
              </div>

              <div className="pt-4 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                <Clock className="h-3 w-3" />
                {usage?.period
                  ? `Period: ${formatDate(usage.period.start)} — ${formatDate(usage.period.end)}`
                  : "Live usage data"}
              </div>
            </CardContent>
          </Card>

          {/* Service breakdown */}
          {usage?.byService && Object.keys(usage.byService).length > 0 && (
            <Card className="border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold">Usage by Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(usage.byService)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([service, count]) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {service.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-bold font-mono">{formatNumber(count)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Plan & Billing Sidebar */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
            <div className="absolute -right-8 -top-8 p-4 opacity-10">
              <CreditCard className="h-32 w-32 text-primary" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Plan Details
              </CardTitle>
              <CardDescription className="font-bold text-primary italic underline underline-offset-4">
                {planName} License
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Status
                </p>
                <Badge
                  variant={
                    planStatus === "active" || planStatus === "trialing" ? "default" : "outline"
                  }
                  className="text-xs"
                >
                  {planStatus === "trialing" ? "Trial" : planStatus}
                </Badge>
              </div>

              {periodEnd && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Current Period Ends
                  </p>
                  <p className="text-sm font-bold text-foreground">{formatDate(periodEnd)}</p>
                </div>
              )}

              {!billing?.subscription && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    No active subscription. Upgrade to unlock higher limits.
                  </p>
                </div>
              )}

              <div className="pt-6 border-t border-primary/20 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    High-Priority Reconciliation Queue
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    SSO & Multi-Tenant Support
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Automated Evidence Signing
                  </span>
                </div>
              </div>

              <Button variant="default" className="w-full h-11 font-bold shadow-lg" asChild>
                <Link href="/dashboard/billing">Manage Billing</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Limits & Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8">
              <UsageLimitIndicator
                current={reconUsage.current}
                limit={reconUsage.limit}
                type="reconciliations"
                userPlan={
                  (billing?.subscription?.planCode ?? "free") as
                    | "free"
                    | "trial"
                    | "commercial"
                    | "enterprise"
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
