"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageBar } from "@/components/billing/UsageBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar, TrendingUp, TrendingDown } from "lucide-react";
// Date utility functions
const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const subDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

interface UsageData {
  period: {
    start: string;
    end: string;
  };
  usage: {
    reconciliation_jobs: { current: number; limit: number; trend: number };
    api_requests: { current: number; limit: number; trend: number };
    webhook_events: { current: number; limit: number; trend: number };
    db_queries: { current: number; limit: number; trend: number };
    ai_requests: { current: number; limit: number; trend: number };
  };
  byIntegration: Array<{
    integration_id: string;
    name: string;
    usage: number;
    percentage: number;
  }>;
  dailyUsage: Array<{
    date: string;
    reconciliation_jobs: number;
    api_requests: number;
    webhook_events: number;
  }>;
}

export default function UsageDashboardPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod] = useState<"current" | "last-month" | "last-7-days">("current");

  useEffect(() => {
    fetchUsageData();
  }, [selectedPeriod]);

  const fetchUsageData = async () => {
    try {
      setIsLoading(true);
      // In production, fetch from API based on selectedPeriod
      // Mock data
      setData({
        period: {
          start: startOfMonth(new Date()).toISOString(),
          end: endOfMonth(new Date()).toISOString(),
        },
        usage: {
          reconciliation_jobs: { current: 7500, limit: 10000, trend: 5.2 },
          api_requests: { current: 85000, limit: 100000, trend: -2.1 },
          webhook_events: { current: 45000, limit: 50000, trend: 8.5 },
          db_queries: { current: 420000, limit: 500000, trend: 3.2 },
          ai_requests: { current: 850, limit: 1000, trend: 12.1 },
        },
        byIntegration: [
          { integration_id: "stripe", name: "Stripe", usage: 3500, percentage: 46.7 },
          { integration_id: "shopify", name: "Shopify", usage: 2800, percentage: 37.3 },
          { integration_id: "paypal", name: "PayPal", usage: 1200, percentage: 16.0 },
        ],
        dailyUsage: Array.from({ length: 30 }, (_, i) => {
          const dateObj = subDays(new Date(), 29 - i);
          const dateStr = dateObj.toISOString().split('T')[0] as string;
          return {
            date: dateStr,
            reconciliation_jobs: Math.floor(Math.random() * 300) + 200,
            api_requests: Math.floor(Math.random() * 3000) + 2000,
            webhook_events: Math.floor(Math.random() * 2000) + 1000,
          };
        }),
      });
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
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

  if (!data) {
    return <div>Failed to load usage data</div>;
  }

  const TrendIcon = ({ trend }: { trend: number }) => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Usage Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your usage across all features and integrations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(data.period.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(data.period.end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-integration">By Integration</TabsTrigger>
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Jobs</CardTitle>
                <CardDescription>Jobs executed this period</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageBar
                  current={data.usage.reconciliation_jobs.current}
                  limit={data.usage.reconciliation_jobs.limit}
                  label="Reconciliation Jobs"
                  unit="jobs"
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <TrendIcon trend={data.usage.reconciliation_jobs.trend} />
                  <span>
                    {data.usage.reconciliation_jobs.trend > 0 ? "+" : ""}
                    {data.usage.reconciliation_jobs.trend.toFixed(1)}% vs last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Requests</CardTitle>
                <CardDescription>API calls made this period</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageBar
                  current={data.usage.api_requests.current}
                  limit={data.usage.api_requests.limit}
                  label="API Requests"
                  unit="requests"
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <TrendIcon trend={data.usage.api_requests.trend} />
                  <span>
                    {data.usage.api_requests.trend > 0 ? "+" : ""}
                    {data.usage.api_requests.trend.toFixed(1)}% vs last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Events</CardTitle>
                <CardDescription>Webhook events processed</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageBar
                  current={data.usage.webhook_events.current}
                  limit={data.usage.webhook_events.limit}
                  label="Webhook Events"
                  unit="events"
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <TrendIcon trend={data.usage.webhook_events.trend} />
                  <span>
                    {data.usage.webhook_events.trend > 0 ? "+" : ""}
                    {data.usage.webhook_events.trend.toFixed(1)}% vs last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Requests</CardTitle>
                <CardDescription>AI-powered operations</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageBar
                  current={data.usage.ai_requests.current}
                  limit={data.usage.ai_requests.limit}
                  label="AI Requests"
                  unit="requests"
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <TrendIcon trend={data.usage.ai_requests.trend} />
                  <span>
                    {data.usage.ai_requests.trend > 0 ? "+" : ""}
                    {data.usage.ai_requests.trend.toFixed(1)}% vs last period
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Integration</CardTitle>
              <CardDescription>Breakdown of usage across integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.byIntegration.map((integration) => (
                  <div key={integration.integration_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{integration.name}</span>
                      <span className="text-sm text-gray-600">
                        {integration.usage.toLocaleString()} jobs ({integration.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${integration.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage</CardTitle>
              <CardDescription>Usage trends over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.dailyUsage.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-600">
                      {formatDate(new Date(day.date))}
                    </span>
                    <div className="flex gap-4 text-sm">
                      <span>{day.reconciliation_jobs} jobs</span>
                      <span>{day.api_requests.toLocaleString()} API calls</span>
                      <span>{day.webhook_events.toLocaleString()} webhooks</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
