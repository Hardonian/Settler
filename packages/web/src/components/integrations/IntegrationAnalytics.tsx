"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, DollarSign, Users, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface IntegrationRevenue {
  integrationId: string;
  name: string;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  customerCount: number;
  averageRevenuePerUser: number;
  growthRate: number;
}

export function IntegrationAnalytics() {
  const [revenue, setRevenue] = useState<IntegrationRevenue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setRevenue(data.revenue || []);
        setError(null);
      } else {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
          details?: unknown;
        };
        setRevenue([]);
        // Standardized error format: { error: string, code?: string, details?: unknown }
        setError(payload.error || "Failed to fetch integration analytics");
      }
    } catch (error: unknown) {
      console.error("Failed to fetch analytics:", error);
      setRevenue([]);
      // Standardized error format: { error: string, code?: string, details?: unknown }
      let errorMessage = "Failed to fetch integration analytics";
      if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = String((error as { message: unknown }).message);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const totalRevenue = revenue.reduce((sum: number, r: any) => sum + r.totalRevenue, 0);
  const totalMRR = revenue.reduce((sum: number, r: any) => sum + r.monthlyRecurringRevenue, 0);
  const totalCustomers = revenue.reduce((sum: number, r: any) => sum + r.customerCount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">${totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <DollarSign className="w-4 h-4" />
              <span>All integrations</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monthly Recurring Revenue</CardDescription>
            <CardTitle className="text-3xl">${totalMRR.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <TrendingUp className="w-4 h-4" />
              <span>MRR</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Customers</CardDescription>
            <CardTitle className="text-3xl">{totalCustomers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              <span>Using integrations</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Revenue Per User</CardDescription>
            <CardTitle className="text-3xl">
              ${totalCustomers > 0 ? (totalRevenue / totalCustomers).toFixed(0) : "0"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Activity className="w-4 h-4" />
              <span>ARPU</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Integration Revenue Breakdown</CardTitle>
              <CardDescription>Revenue by integration</CardDescription>
            </div>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
                <TabsTrigger value="90d">90d</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAnalytics()}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {revenue.map((item) => (
                <div
                  key={item.integrationId}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                      <span>{item.customerCount} customers</span>
                      <span>ARPU: ${item.averageRevenuePerUser.toFixed(2)}</span>
                      <span className={item.growthRate >= 0 ? "text-green-600" : "text-red-600"}>
                        {item.growthRate >= 0 ? "+" : ""}
                        {item.growthRate.toFixed(1)}% growth
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${item.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      ${item.monthlyRecurringRevenue.toLocaleString()}/mo
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
