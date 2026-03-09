/**
 * Ops Overview Tab
 *
 * Health status overview with R/Y/G indicators
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthStatus {
  status: "healthy" | "warning" | "critical";
  message: string;
}

interface StripeIntegrationStatus {
  status: "configured" | "setup_required";
  configured: boolean;
  setupSteps: string[];
}

interface OverviewData {
  health: HealthStatus;
  totalCustomers: number;
  activeCustomers: number;
  totalUsage: number;
  errorRate: number;
  pendingJobs: number;
  failedWebhooks: number;
}

export function OpsOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const [overviewResponse, integrationResponse] = await Promise.all([
          fetch("/api/ops/overview"),
          fetch("/api/ops/integration-status"),
        ]);

        if (!overviewResponse.ok) {
          throw new Error("Failed to fetch overview");
        }

        const overviewResult = await overviewResponse.json();
        setData(overviewResult);

        if (integrationResponse.ok) {
          const integrationResult = await integrationResponse.json();
          setStripeStatus(integrationResult?.integrations?.stripe ?? null);
        } else {
          setStripeStatus({
            status: "setup_required",
            configured: false,
            setupSteps: [
              "Unable to load integration status. Check admin access and runtime config.",
            ],
          });
        }
      } catch (error: unknown) {
        console.error("Failed to fetch ops overview:", error);
        // Set default error state
        setData({
          health: { status: "critical", message: "Failed to load data" },
          totalCustomers: 0,
          activeCustomers: 0,
          totalUsage: 0,
          errorRate: 0,
          pendingJobs: 0,
          failedWebhooks: 0,
        });
        setStripeStatus({
          status: "setup_required",
          configured: false,
          setupSteps: ["Unable to load integration status."],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
    const interval = setInterval(fetchOverview, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load overview data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const healthColor =
    data.health.status === "healthy"
      ? "bg-green-500"
      : data.health.status === "warning"
        ? "bg-yellow-500"
        : "bg-red-500";

  const healthIcon =
    data.health.status === "healthy" ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : data.health.status === "warning" ? (
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-600" />
    );

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {healthIcon}
            System Health
          </CardTitle>
          <CardDescription>{data.health.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${healthColor}`} />
            <Badge variant={data.health.status === "healthy" ? "default" : "destructive"}>
              {data.health.status.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Billing Integration
          </CardTitle>
          <CardDescription>
            Runtime capability status for checkout and billing portal flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={stripeStatus?.configured ? "default" : "destructive"}>
              {stripeStatus?.configured ? "CONFIGURED" : "SETUP REQUIRED"}
            </Badge>
          </div>
          {!stripeStatus?.configured && stripeStatus?.setupSteps?.length ? (
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {stripeStatus.setupSteps.slice(0, 2).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Stripe billing runtime is configured.</p>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{data.activeCustomers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingJobs}</div>
            <p className="text-xs text-muted-foreground">{data.failedWebhooks} failed webhooks</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
