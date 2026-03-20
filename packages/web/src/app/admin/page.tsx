/**
 * Admin Dashboard Overview
 *
 * Main overview page with KPI tiles, trend charts, exception heatmap, and activity feed.
 * FinTech-native feel with high-signal, dense but readable information.
 */

"use client";

import { useState } from "react";
import { useAdminMetrics, useAdminStream } from "@/lib/admin/hooks/use-admin-metrics";
import { useTickScheduler } from "@/lib/admin/hooks/use-tick-scheduler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SecurityBadge,
  SystemStatusCard,
  LastUpdatedBadge,
} from "@/components/admin/trust-signals";
import { UsageWarning } from "@/components/admin/urgency-indicators";
import { HoverCard, AnimatedNumber, PulseIndicator } from "@/components/admin/microinteractions";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  // Fetch metrics
  const { data: metrics, isLoading } = useAdminMetrics(timeRange);

  // Connect to SSE stream
  const { connectionState, latency } = useAdminStream(["metrics"], undefined, true);

  // Throttle chart updates (4fps max)
  useTickScheduler(() => {
    // Chart updates would happen here
  }, true);

  const kpis = metrics?.kpis;
  const lastUpdated = metrics?.timestamp ? new Date(metrics.timestamp) : new Date();

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-background min-h-screen"
      id="main-content"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Real-time oversight and reconciliation operations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Trust Signals */}
          <div className="flex items-center gap-2">
            <SecurityBadge />
            <SystemStatusCard
              status={connectionState === "connected" ? "operational" : "degraded"}
            />
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <PulseIndicator active={connectionState === "connected"} color="green" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {connectionState === "connected" ? "Live" : connectionState}
            </span>
            {latency && (
              <span className="text-xs text-muted-foreground">({latency}ms)</span>
            )}
          </div>

          {/* Last Updated */}
          <LastUpdatedBadge timestamp={lastUpdated} />

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(["24h", "7d", "30d"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                aria-pressed={timeRange === range}
                aria-label={`Select ${range} time range`}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Warning (if applicable) */}
      {kpis && kpis.totalVolume > 0 && (
        <UsageWarning current={kpis.totalVolume} limit={1000000} type="usage" />
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KPITile
              title="Matched %"
              value={kpis?.matchedPercent.toFixed(1) || "0.0"}
              unit="%"
              {...(kpis?.matchedPercent ? { trend: kpis.matchedPercent > 95 ? "up" : "down" } : {})}
              icon={<CheckCircle2 className="w-5 h-5" />}
              isLoading={isLoading}
            />
            <KPITile
              title="Exceptions"
              value={kpis?.exceptionsCount.toLocaleString() || "0"}
              {...(kpis?.exceptionsCount !== undefined
                ? { trend: kpis.exceptionsCount < 10 ? "up" : "down" }
                : {})}
              icon={<AlertTriangle className="w-5 h-5" />}
              isLoading={isLoading}
              href="/admin/exceptions"
            />
            <KPITile
              title="Avg Time to Resolve"
              value={kpis?.avgTimeToResolve ? formatDuration(kpis.avgTimeToResolve) : "0ms"}
              {...(kpis?.avgTimeToResolve !== undefined
                ? { trend: kpis.avgTimeToResolve < 3600000 ? "up" : "down" }
                : {})}
              icon={<Clock className="w-5 h-5" />}
              isLoading={isLoading}
            />
            <KPITile
              title="Total Volume"
              value={kpis?.totalVolume.toLocaleString() || "0"}
              icon={<Activity className="w-5 h-5" />}
              isLoading={isLoading}
            />
            <KPITile
              title="Refunds"
              value={kpis?.refundsCount.toLocaleString() || "0"}
              icon={<DollarSign className="w-5 h-5" />}
              isLoading={isLoading}
            />
            <KPITile
              title="Payout Gaps"
              value={kpis?.payoutGaps.toLocaleString() || "0"}
              icon={<AlertTriangle className="w-5 h-5" />}
              isLoading={isLoading}
            />
          </>
        )}
      </div>

      {/* Exception Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Exception Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Skeleton className="h-4 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ) : metrics?.exceptionHeatmap && metrics.exceptionHeatmap.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.exceptionHeatmap.map((item, idx) => (
                <HoverCard key={idx}>
                  <div
                    className="p-4 border border-border rounded-lg transition-all"
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.source} exceptions: ${item.count} ${item.severity}`}
                  >
                    <div className="text-sm text-muted-foreground mb-1">
                      {item.source}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          item.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : item.severity === "warn"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }
                      >
                        {item.severity}
                      </Badge>
                      <span className="text-lg font-semibold text-foreground">
                        <AnimatedNumber value={item.count} />
                      </span>
                    </div>
                  </div>
                </HoverCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No exceptions in this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
            <div className="space-y-3" role="list" aria-label="Recent activity">
              {metrics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  role="listitem"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" aria-hidden="true" />
                  <div className="flex-1">
                    <div className="text-sm text-foreground">{activity.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <time dateTime={activity.timestamp}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        <Link href="/admin/ops">
          <Button aria-label="View operations console">View Ops Console</Button>
        </Link>
        <Link href="/admin/runs">
          <Button variant="outline" aria-label="View reconciliation runs">
            View Runs
          </Button>
        </Link>
        <Link href="/admin/audit">
          <Button variant="outline" aria-label="View audit trail">
            View Audit Trail
          </Button>
        </Link>
      </div>
    </div>
  );
}

function KPITile({
  title,
  value,
  unit,
  trend,
  icon,
  isLoading,
  href,
}: {
  title: string;
  value: string;
  unit?: string;
  trend?: "up" | "down";
  icon: React.ReactNode;
  isLoading?: boolean;
  href?: string;
}) {
  const content = (
    <HoverCard>
      <Card className={href ? "cursor-pointer" : ""} role={href ? "link" : undefined}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div aria-hidden="true">{icon}</div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-foreground">{value}</div>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              {trend && (
                <div
                  className={`ml-auto ${trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  aria-label={`Trending ${trend}`}
                >
                  {trend === "up" ? (
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="w-4 h-4" aria-hidden="true" />
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </HoverCard>
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${title}: ${value}${unit || ""}`}>
        {content}
      </Link>
    );
  }

  return <div aria-label={`${title}: ${value}${unit || ""}`}>{content}</div>;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
