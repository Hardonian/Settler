"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, CheckCircle2, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
}

export function FunnelDashboard() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, [timeRange]);

  const fetchFunnelData = async () => {
    try {
      const response = await fetch(`/api/analytics/funnel?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setFunnel(data.funnel || []);
      }
    } catch (error) {
      console.error("Failed to fetch funnel data:", error);
    } finally {
      setLoading(false);
    }
  };

  const conversionRate =
    funnel.length > 0 && funnel[0] && funnel[funnel.length - 1]
      ? (funnel[funnel.length - 1]!.count / funnel[0]!.count) * 100
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Activation → Paid conversion tracking</CardDescription>
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
        ) : (
          <div className="space-y-6">
            {/* Overall Conversion */}
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {conversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                Overall Conversion Rate
              </div>
            </div>

            {/* Funnel Steps */}
            <div className="space-y-4">
              {funnel.map((step, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{step.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {step.count.toLocaleString()} users
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {step.percentage.toFixed(1)}%
                      </div>
                      {index > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          -{step.dropoff.toFixed(1)}% dropoff
                        </div>
                      )}
                    </div>
                  </div>
                  <Progress value={step.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
