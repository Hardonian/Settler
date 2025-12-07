"use client";

import { useState, useEffect } from "react";
import { TrendingDown, Users, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChurnMetrics {
  churnRate: number;
  churnedUsers: number;
  revenueChurn: number;
  mrrLost: number;
  avgLifetime: number;
  churnReasons: Array<{ reason: string; count: number }>;
}

export function ChurnAnalysisDashboard() {
  const [metrics, setMetrics] = useState<ChurnMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChurnMetrics();
  }, [timeRange]);

  const fetchChurnMetrics = async () => {
    try {
      const response = await fetch(`/api/analytics/churn?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error("Failed to fetch churn metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Churn Analysis</CardTitle>
              <CardDescription>Comprehensive churn metrics and insights</CardDescription>
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
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Churn Rate</CardDescription>
                  <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                    {metrics.churnRate.toFixed(2)}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <TrendingDown className="w-4 h-4" />
                    <span>Users churned</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Churned Users</CardDescription>
                  <CardTitle className="text-3xl">{metrics.churnedUsers}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>Total churned</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Revenue Churn</CardDescription>
                  <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                    {metrics.revenueChurn.toFixed(2)}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <DollarSign className="w-4 h-4" />
                    <span>MRR lost</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Avg Lifetime</CardDescription>
                  <CardTitle className="text-3xl">{metrics.avgLifetime.toFixed(1)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Months</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Churn Reasons</CardTitle>
            <CardDescription>Top reasons users churned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.churnReasons.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <span className="text-slate-900 dark:text-white">{item.reason}</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {item.count} users
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
