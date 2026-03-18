"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Users, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  useEffect(() => {
    void fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/integrations/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setRevenue(data.revenue || []);
        setError(null);
      } else {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setRevenue([]);
        setError(payload.error || "Failed to fetch integration analytics");
      }
    } catch (error: unknown) {
      console.error("Failed to fetch analytics:", error);
      setRevenue([]);
      setError(error instanceof Error ? error.message : "Failed to fetch integration analytics");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>
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
