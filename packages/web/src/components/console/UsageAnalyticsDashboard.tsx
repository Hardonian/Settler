/**
 * Enhanced Usage Analytics Dashboard
 *
 * Real-time usage monitoring with:
 * - Usage trends and forecasting
 * - Cost analysis
 * - Performance metrics
 * - Export capabilities
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { ConsoleErrorBoundary } from "./ErrorBoundary";

interface UsageAnalytics {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  costEstimate: number;
  trends: {
    daily: Array<{ date: string; calls: number; errors: number }>;
    weekly: Array<{ week: string; calls: number; errors: number }>;
  };
  forecast: {
    next30Days: number;
    next90Days: number;
  };
  limits: {
    reconcile?: { current: number; limit: number; remaining: number };
    receipts?: { current: number; limit: number; remaining: number };
    featureFlags?: { current: number; limit: number; remaining: number };
  };
}

type UsageExportFormat = "csv" | "json";

interface UsageExportJob {
  exportId: string;
  format: UsageExportFormat;
  status: "pending" | "processing" | "completed" | "failed" | string;
  totalRows: number;
  processedRows: number;
  chunkCount: number;
  batchCount: number;
  pollUrl: string;
  downloadUrl: string | null;
  errorMessage: string | null;
}

export function UsageAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [activeExport, setActiveExport] = useState<UsageExportJob | null>(null);
  const [exportingFormat, setExportingFormat] = useState<UsageExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportPollCountRef = useRef(0);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const res = await fetch(`/api/console/usage/analytics?days=${days}`);

      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        // Handle non-200 responses gracefully
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch analytics:", res.status, errorData);
        setAnalytics(null);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch analytics:", error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  useEffect(() => {
    if (
      !activeExport ||
      (activeExport.status !== "pending" && activeExport.status !== "processing")
    ) {
      return;
    }

    let cancelled = false;
    const pollTimer = setInterval(async () => {
      if (cancelled || !activeExport.pollUrl) {
        return;
      }

      exportPollCountRef.current += 1;
      if (exportPollCountRef.current > 40) {
        clearInterval(pollTimer);
        setExportError(
          "Export is taking longer than expected. You can retry from the export status."
        );
        setExportingFormat(null);
        return;
      }

      try {
        const statusRes = await fetch(`${activeExport.pollUrl}?tick=1`, {
          cache: "no-store",
        });
        if (!statusRes.ok) {
          return;
        }

        const statusPayload = (await statusRes.json()) as UsageExportJob;
        if (cancelled) {
          return;
        }

        setActiveExport(statusPayload);
        if (statusPayload.status === "completed" || statusPayload.status === "failed") {
          setExportingFormat(null);
          clearInterval(pollTimer);
        }
      } catch {
        // Keep polling; transient errors should not crash the UI.
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
    };
  }, [activeExport?.exportId, activeExport?.status, activeExport?.pollUrl]);

  const startExport = async (format: UsageExportFormat) => {
    try {
      setExportError(null);
      setExportingFormat(format);
      exportPollCountRef.current = 0;
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const res = await fetch(`/api/console/usage/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, days }),
      });

      const payload = (await res.json().catch(() => null)) as
        | UsageExportJob
        | { error?: string }
        | null;
      if (!res.ok || !payload || !("exportId" in payload)) {
        setExportError(
          payload && "error" in payload && payload.error
            ? payload.error
            : "Failed to queue export. Please retry."
        );
        setExportingFormat(null);
        return;
      }

      setActiveExport(payload);
      if (payload.status === "completed") {
        setExportingFormat(null);
      }
    } catch (error: unknown) {
      console.error("Failed to export data:", error);
      setExportError("Failed to queue export. Please retry.");
      setExportingFormat(null);
    }
  };

  const retryExport = async () => {
    if (!activeExport) {
      return;
    }

    try {
      setExportError(null);
      setExportingFormat(activeExport.format);
      exportPollCountRef.current = 0;
      const res = await fetch(`/api/console/usage/export/${activeExport.exportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });
      const payload = (await res.json()) as UsageExportJob;
      setActiveExport(payload);
      if (payload.status === "completed" || payload.status === "failed") {
        setExportingFormat(null);
      }
    } catch {
      setExportError("Retry failed. Please try again.");
      setExportingFormat(null);
    }
  };

  const downloadExport = () => {
    if (!activeExport?.downloadUrl) {
      return;
    }

    window.location.assign(activeExport.downloadUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Unable to load analytics data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Usage Analytics</h2>
            <p className="text-muted-foreground">Detailed usage insights and trends</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
              className="px-3 py-2 border rounded-md bg-white dark:bg-card/80"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startExport("csv")}
              disabled={exportingFormat === "csv"}
            >
              <Download className="w-4 h-4 mr-2" />
              {exportingFormat === "csv" ? "Queueing CSV..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startExport("json")}
              disabled={exportingFormat === "json"}
            >
              <Download className="w-4 h-4 mr-2" />
              {exportingFormat === "json" ? "Queueing JSON..." : "Export JSON"}
            </Button>
          </div>
        </div>
        {activeExport && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Usage Export Status</CardTitle>
              <CardDescription>
                {activeExport.format.toUpperCase()} export {activeExport.exportId.slice(0, 8)}...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Status: <span className="font-medium capitalize">{activeExport.status}</span> ·
                Rows: {activeExport.processedRows.toLocaleString()} /{" "}
                {activeExport.totalRows.toLocaleString()}
              </div>
              {activeExport.status === "completed" && activeExport.downloadUrl && (
                <Button variant="default" size="sm" onClick={downloadExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Export
                </Button>
              )}
              {activeExport.status === "failed" && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {activeExport.errorMessage || "Export failed before artifact creation."}
                  </p>
                  <Button variant="outline" size="sm" onClick={retryExport}>
                    Retry Export
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {exportError && <p className="text-sm text-red-600 dark:text-red-400">{exportError}</p>}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Calls</CardDescription>
              <CardTitle className="text-2xl">{analytics.totalCalls.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">+12% vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Error Rate</CardDescription>
              <CardTitle className="text-2xl">{(analytics.errorRate * 100).toFixed(2)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                {analytics.errorRate < 0.01 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Excellent</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">Monitor</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Estimated Cost</CardDescription>
              <CardTitle className="text-2xl">${analytics.costEstimate.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Based on usage</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Forecast (30d)</CardDescription>
              <CardTitle className="text-2xl">
                {analytics.forecast.next30Days.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Projected calls</div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>Daily API call volume and error rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Chart visualization would go here</p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Data: {analytics.trends.daily.length} data points
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Service Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Service Breakdown</CardTitle>
            <CardDescription>Usage by service with limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.byService).map(([service, count]) => {
                const serviceKey = service.replace("settler-", "") as keyof typeof analytics.limits;
                const limit = analytics.limits[serviceKey];
                const usagePercent = limit ? (limit.current / limit.limit) * 100 : 0;

                return (
                  <div key={service} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {service.replace("settler-", "").replace("-", " ")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count.toLocaleString()} calls
                        {limit &&
                          ` / ${limit.limit === -1 ? "∞" : limit.limit.toLocaleString()} limit`}
                      </span>
                    </div>
                    {limit && limit.limit > 0 && (
                      <div className="w-full bg-border dark:bg-border rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            usagePercent > 90
                              ? "bg-red-600"
                              : usagePercent > 75
                                ? "bg-amber-600"
                                : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ConsoleErrorBoundary>
  );
}
