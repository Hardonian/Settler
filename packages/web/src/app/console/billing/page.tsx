"use client";

import React, { useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";

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
    exceptions: { current: number; limit: number };
  };
  stripeConfigured?: boolean;
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
      const response = await fetch("/api/console/billing");
      if (!response.ok) {
        throw new Error("Failed to load billing data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsCreatingPortal(true);
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/console/billing`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || payload.error || "Failed to create portal session");
      }
      const { url } = payload;
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setIsCreatingPortal(false);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    try {
      setIsCreatingCheckout(planCode);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode,
          successUrl: `${window.location.origin}/console/billing?success=true`,
          cancelUrl: `${window.location.origin}/console/billing?canceled=true`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || payload.error || "Failed to create checkout session");
      }
      const { url } = payload;
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setIsCreatingCheckout(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-80 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                <div className="h-8 w-32 rounded bg-muted animate-pulse" />
                <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <RouteStateCard
        {...routeStateFromVariant("backend-unreachable", {
          title: "Billing data unavailable",
          description: error || "Failed to load billing data.",
          detail:
            "Billing remains intentionally unreachable until dependencies recover. No billing state was inferred from partial responses.",
          actions: [{ label: "Retry", href: "/console/billing", variant: "outline" }],
        })}
      />
    );
  }

  const planCode = data.subscription?.planCode || "starter";
  const isStarter = planCode === "starter";
  const isGrowth = planCode === "growth";
  const isScale = planCode === "scale";
  const isEnterprise = planCode === "enterprise";

  // Calculate exception threshold based on reconciliation volume
  const reconciliationVolume = data.usage.reconcile.current;
  const exceptionThreshold = Math.floor(reconciliationVolume * 0.01); // 1% included rate
  const exceptionsOverThreshold = Math.max(0, data.usage.exceptions.current - exceptionThreshold);

  const usageBars = [
    {
      service: "Reconciliations",
      current: data.usage.reconcile.current,
      limit: data.usage.reconcile.limit,
      percentage: Math.min(
        100,
        (data.usage.reconcile.current / Math.max(1, data.usage.reconcile.limit)) * 100
      ),
      unit: "reconciliations",
    },
    {
      service: "Exceptions Requiring Review",
      current: data.usage.exceptions.current,
      limit: exceptionThreshold,
      percentage: Math.min(
        100,
        (data.usage.exceptions.current / Math.max(1, exceptionThreshold)) * 100
      ),
      unit: "exceptions",
      overage: exceptionsOverThreshold,
    },
  ];

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Billing & Plan"
        description="Review plan status, usage thresholds, and billing controls."
        breadcrumbs={[
          { label: "Console", href: "/console" },
          { label: "Billing" },
        ]}
        actions={
          data.subscription && data.stripeConfigured ? (
            <Button onClick={handleManageBilling} disabled={isCreatingPortal} variant="outline" size="sm">
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
          ) : undefined
        }
      />

      <div className="space-y-6">
        <div className="hidden">
          {data.subscription && data.stripeConfigured && (
            <Button onClick={handleManageBilling} disabled={isCreatingPortal} variant="outline">
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

        {/* Stripe not configured — shown when billing cannot be activated */}
        {data.stripeConfigured === false && (
          <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-200">
                    Billing not configured
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                    Payment processing requires Stripe to be configured by the operator. Paid plan
                    upgrades are unavailable until this is resolved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  {data.subscription
                    ? `Active subscription - ${data.subscription.planName}`
                    : "Starter plan - First 10,000 reconciliations free"}
                </CardDescription>
              </div>
              <Badge variant={data.subscription?.status === "active" ? "default" : "secondary"}>
                {data.subscription?.status || "Starter"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.subscription && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{data.subscription.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">
                    {new Date(data.subscription.currentPeriodStart).toLocaleDateString()} -{" "}
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
                  <span className="font-medium text-foreground">{bar.service}</span>
                  <span className="text-muted-foreground font-mono tabular-nums text-xs">
                    {bar.current.toLocaleString()} / {bar.limit.toLocaleString()} {bar.unit}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/50">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      bar.percentage >= 90
                        ? "bg-red-500"
                        : bar.percentage >= 75
                          ? "bg-amber-500"
                          : "bg-primary"
                    }`}
                    style={{ width: `${bar.percentage}%` }}
                  />
                </div>
                {bar.service === "Exceptions Requiring Review" &&
                  bar.overage &&
                  bar.overage > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {bar.overage.toLocaleString()} exceptions over threshold. Overage: $
                      {(bar.overage * 0.1).toFixed(2)}
                    </p>
                  )}
                {bar.service === "Reconciliations" && bar.percentage >= 90 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Approaching limit. Overage: ${((bar.current - bar.limit) * 0.01).toFixed(2)}
                    /month
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Starter Plan */}
              <div
                className={`p-4 border rounded-lg ${
                  isStarter ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Starter</h3>
                  {isStarter && (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">$0/month</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• 10,000 reconciliations/month</li>
                  <li>• 1% exception rate included</li>
                  <li>• Automatic explanations</li>
                </ul>
                {!isStarter && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push("/pricing")}
                  >
                    View Details
                  </Button>
                )}
              </div>

              {/* Growth Plan */}
              <div
                className={`p-4 border rounded-lg ${
                  isGrowth ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Growth</h3>
                  {isGrowth && (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">$900/month</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• 100,000 reconciliations/month</li>
                  <li>• 1% exception rate included</li>
                  <li>• Automatic explanations</li>
                  <li>• Overage: $0.01/reconciliation</li>
                  <li>• Exception review: $0.10/exception</li>
                </ul>
                {!isGrowth &&
                  (data.stripeConfigured === false ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Billing not configured
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUpgrade("growth")}
                      disabled={isCreatingCheckout === "growth"}
                    >
                      {isCreatingCheckout === "growth" ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Upgrade to Growth"
                      )}
                    </Button>
                  ))}
              </div>

              {/* Scale Plan */}
              <div
                className={`p-4 border rounded-lg ${
                  isScale ? "border-primary bg-primary/5" : ""
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
                <p className="mb-4 text-sm text-muted-foreground">$9,900/month</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• 1,000,000 reconciliations/month</li>
                  <li>• 1% exception rate included</li>
                  <li>• Automatic explanations</li>
                  <li>• Overage: $0.01/reconciliation</li>
                  <li>• Exception review: $0.10/exception</li>
                </ul>
                {!isScale &&
                  (data.stripeConfigured === false ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Billing not configured
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUpgrade("scale")}
                      disabled={isCreatingCheckout === "scale"}
                    >
                      {isCreatingCheckout === "scale" ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Upgrade to Scale"
                      )}
                    </Button>
                  ))}
              </div>

              {/* Enterprise Plan */}
              <div
                className={`p-4 border rounded-lg ${
                  isEnterprise ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Enterprise</h3>
                  {isEnterprise && (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">Custom</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Custom volume</li>
                  <li>• Custom exception thresholds</li>
                  <li>• Volume discounts</li>
                  <li>• Dedicated support</li>
                </ul>
                {!isEnterprise && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push("/enterprise")}
                  >
                    Contact Sales
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
