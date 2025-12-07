"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CostBreakdownCard } from "@/components/billing/CostBreakdownCard";
import { BillingCycleProgress } from "@/components/billing/BillingCycleProgress";
import { UsageBar } from "@/components/billing/UsageBar";
import { ThresholdWarningBanner } from "@/components/billing/ThresholdWarningBanner";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Download, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface BillingData {
  billingAccount: {
    id: string;
    email: string;
    status: string;
  };
  subscription: {
    id: string;
    planName: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  usage: {
    reconciliation_jobs: { current: number; limit: number };
    api_requests: { current: number; limit: number };
    webhook_events: { current: number; limit: number };
  };
  estimatedBill: {
    base_subscription_cost: number;
    add_on_costs: number;
    usage_costs: number;
    total_cost: number;
    period_start: string;
    period_end: string;
  };
  warnings: Array<{
    event_type: string;
    current_usage: number;
    plan_limit: number;
    percentage_used: number;
  }>;
}

export default function BillingDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);
      // In production, this would fetch from your API
      // For now, using mock data structure
      await fetch("/api/billing/invoice/estimate?billing_account_id=current");
      // Handle response...
      
      // Mock data for now
      setData({
        billingAccount: {
          id: "billing-account-id",
          email: "user@example.com",
          status: "active",
        },
        subscription: {
          id: "sub-id",
          planName: "Settler Core",
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        usage: {
          reconciliation_jobs: { current: 7500, limit: 10000 },
          api_requests: { current: 85000, limit: 100000 },
          webhook_events: { current: 45000, limit: 50000 },
        },
        estimatedBill: {
          base_subscription_cost: 49.95,
          add_on_costs: 39.95,
          usage_costs: 15.00,
          total_cost: 104.90,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        warnings: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error || "Failed to load billing data"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const costItems = [
    {
      label: "Base Subscription",
      amount: data.estimatedBill.base_subscription_cost,
      description: data.subscription.planName,
    },
    {
      label: "Add-Ons",
      amount: data.estimatedBill.add_on_costs,
      description: "Premium integrations",
    },
    {
      label: "Usage Overage",
      amount: data.estimatedBill.usage_costs,
      description: "Additional usage beyond plan limits",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1.5 text-sm md:text-base">
            Manage your subscription and view usage
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.push("/dashboard/billing")} className="font-medium">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
          <Button onClick={() => router.push("/dashboard/billing")} className="font-medium">
            <CreditCard className="mr-2 h-4 w-4" />
            Payment Methods
          </Button>
        </div>
      </div>

      {data.warnings.length > 0 && (
        <ThresholdWarningBanner
          title="Usage Warning"
          message={`Approaching limits for ${data.warnings.length} feature${data.warnings.length > 1 ? "s" : ""}. Consider upgrading.`}
          severity="warning"
          onUpgrade={() => router.push("/pricing")}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BillingCycleProgress
            periodStart={new Date(data.subscription.currentPeriodStart)}
            periodEnd={new Date(data.subscription.currentPeriodEnd)}
          />

          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>Current usage for this billing period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <UsageBar
                current={data.usage.reconciliation_jobs.current}
                limit={data.usage.reconciliation_jobs.limit}
                label="Reconciliation Jobs"
                unit="jobs"
              />
              <UsageBar
                current={data.usage.api_requests.current}
                limit={data.usage.api_requests.limit}
                label="API Requests"
                unit="requests"
              />
              <UsageBar
                current={data.usage.webhook_events.current}
                limit={data.usage.webhook_events.limit}
                label="Webhook Events"
                unit="events"
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <CostBreakdownCard
            title="Estimated Bill"
            description="Current billing period"
            items={costItems}
            total={data.estimatedBill.total_cost}
            period={`${new Date(data.estimatedBill.period_start).toLocaleDateString()} - ${new Date(data.estimatedBill.period_end).toLocaleDateString()}`}
          />
        </div>
      </div>
    </div>
  );
}
