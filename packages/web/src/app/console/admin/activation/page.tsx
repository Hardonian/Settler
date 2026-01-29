/**
 * Activation Funnel Dashboard
 *
 * Admin panel for tracking activation funnel metrics and conversion rates.
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TrendingUp, Users, Link2, CheckCircle2, AlertCircle } from "lucide-react";

interface ActivationMetrics {
  signups: number;
  tenantsCreated: number;
  providersConnected: number;
  firstRecons: number;
  exceptionsCreated: number;
  exceptionsResolved: number;
  checkoutsStarted: number;
  checkoutsCompleted: number;
  paymentsFailed: number;
  subscriptionsCanceled: number;
  conversionRates: {
    signupToConnect: number;
    connectToRecon: number;
    reconToResolved: number;
    checkoutToCompleted: number;
  };
}

export default function ActivationFunnelPage() {
  const [metrics24h, setMetrics24h] = useState<ActivationMetrics | null>(null);
  const [metrics7d, setMetrics7d] = useState<ActivationMetrics | null>(null);
  const [metrics30d, setMetrics30d] = useState<ActivationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const periods = [
          { label: "24h", days: 1 },
          { label: "7d", days: 7 },
          { label: "30d", days: 30 },
        ];

        const results = await Promise.all(
          periods.map(async ({ days }) => {
            const startDate = new Date(now);
            startDate.setDate(startDate.getDate() - days);
            const response = await fetch(
              `/api/ops/activation-funnel?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`
            );
            if (!response.ok) {
              throw new Error(`Failed to fetch ${days}d metrics`);
            }
            const data = await response.json();
            return { label: days === 1 ? "24h" : days === 7 ? "7d" : "30d", metrics: data.metrics };
          })
        );

        setMetrics24h(results.find((r) => r.label === "24h")?.metrics || null);
        setMetrics7d(results.find((r) => r.label === "7d")?.metrics || null);
        setMetrics30d(results.find((r) => r.label === "30d")?.metrics || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load activation metrics");
      } finally {
        setLoading(false);
      }
    };

    void fetchMetrics();
  }, []);

  const FunnelStep = ({
    label,
    count,
    conversionRate,
    icon: Icon,
  }: {
    label: string;
    count: number;
    conversionRate?: number;
    icon: typeof Users;
  }) => (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
        <div className="text-2xl font-bold">{count.toLocaleString()}</div>
        {conversionRate !== undefined && (
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {conversionRate.toFixed(1)}% conversion
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading activation metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = metrics7d || metrics24h || metrics30d;
  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500">No activation data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Activation Funnel</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track user activation and conversion rates across the product lifecycle
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        {[
          { label: "24h", data: metrics24h },
          { label: "7d", data: metrics7d },
          { label: "30d", data: metrics30d },
        ].map(({ label, data }) => (
          <button
            key={label}
            className={`px-4 py-2 rounded-lg border ${
              data === metrics
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            }`}
            onClick={() => {
              if (label === "24h") setMetrics24h(data);
              else if (label === "7d") setMetrics7d(data);
              else setMetrics30d(data);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Funnel Visualization */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Activation Funnel</CardTitle>
          <CardDescription>User journey from signup to activation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FunnelStep label="Signups" count={metrics.signups} icon={Users} />
            <div className="ml-8 text-xs text-slate-500">
              ↓ {metrics.conversionRates.signupToConnect.toFixed(1)}% →
            </div>
            <FunnelStep
              label="Provider Connected"
              count={metrics.providersConnected}
              conversionRate={metrics.conversionRates.signupToConnect}
              icon={Link2}
            />
            <div className="ml-8 text-xs text-slate-500">
              ↓ {metrics.conversionRates.connectToRecon.toFixed(1)}% →
            </div>
            <FunnelStep
              label="First Reconciliation"
              count={metrics.firstRecons}
              conversionRate={metrics.conversionRates.connectToRecon}
              icon={CheckCircle2}
            />
            <div className="ml-8 text-xs text-slate-500">
              ↓ {metrics.conversionRates.reconToResolved.toFixed(1)}% →
            </div>
            <FunnelStep
              label="Exceptions Resolved"
              count={metrics.exceptionsResolved}
              conversionRate={metrics.conversionRates.reconToResolved}
              icon={TrendingUp}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tenants Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.tenantsCreated.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Checkouts Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.checkoutsStarted.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">
              {metrics.conversionRates.checkoutToCompleted.toFixed(1)}% completed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payments Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.paymentsFailed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Subscriptions Canceled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {metrics.subscriptionsCanceled.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
