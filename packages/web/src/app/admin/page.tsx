/**
 * Admin Dashboard Overview
 *
 * Layout modules respect published Operator Customization (GET /api/admin/operator-customization).
 * Canonical metrics still come from /api/admin/metrics; customization is presentation-only.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminMetrics, useAdminStream } from "@/lib/admin/hooks/use-admin-metrics";
import { useTickScheduler } from "@/lib/admin/hooks/use-tick-scheduler";
import {
  recordModuleViewSignal,
  useOperatorDashboardCustomization,
} from "@/lib/admin/hooks/use-operator-dashboard-customization";
import { ADMIN_DASHBOARD_MODULE_REGISTRY } from "@/lib/operator-customization/registry";
import type { ModulePlacement } from "@/lib/operator-customization/schema";
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
  const { data: metrics, isLoading } = useAdminMetrics(timeRange);
  const { connectionState, latency } = useAdminStream(["metrics"], undefined, true);
  const { data: customization, loading: customizationLoading, error: customizationError, fallbackLayout } =
    useOperatorDashboardCustomization();

  useTickScheduler(() => {}, true);

  const kpis = metrics?.kpis;
  const lastUpdated = metrics?.timestamp ? new Date(metrics.timestamp) : new Date();

  const layout = customization?.published ?? fallbackLayout;
  const sortedModules = useMemo(
    () => [...layout.modules].sort((a, b) => a.order - b.order || a.moduleId.localeCompare(b.moduleId)),
    [layout.modules]
  );

  const placementById = useMemo(() => {
    const m = new Map<string, ModulePlacement>();
    for (const p of layout.modules) m.set(p.moduleId, p);
    return m;
  }, [layout.modules]);

  /** Only attach tenant to signals when workspace is unambiguous (single active tenant). */
  const signalTenantId = useMemo(() => {
    const t = customization?.tenant;
    if (t && !t.multiTenantEnvironment) return t.id;
    return null;
  }, [customization?.tenant]);

  const operatingModeLabel =
    layout.operatingMode === "solo_operator"
      ? "Solo operator"
      : layout.operatingMode === "buyer_demo"
        ? "Buyer demo"
        : "Standard";

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-background min-h-screen"
      id="main-content"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Real-time oversight and reconciliation operations
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Operating mode: <span className="font-medium text-foreground">{operatingModeLabel}</span>
            {layout.lastAppliedPresetId ? (
              <>
                {" "}
                · Preset: <span className="font-mono">{layout.lastAppliedPresetId}</span>
              </>
            ) : null}
            {" · "}
            <Link href="/admin/operator-customization" className="underline underline-offset-2">
              Customize layout
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {isModuleEnabled(placementById, "trust_connection") && (
            <ModuleViewTracker moduleId="trust_connection" tenantId={signalTenantId}>
              <div className="flex items-center gap-2">
                <SecurityBadge />
                <SystemStatusCard
                  status={connectionState === "connected" ? "operational" : "degraded"}
                />
              </div>
              <div className="flex items-center gap-2">
                <PulseIndicator active={connectionState === "connected"} color="green" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {connectionState === "connected" ? "Live" : connectionState}
                </span>
                {latency ? (
                  <span className="text-xs text-muted-foreground">({latency}ms)</span>
                ) : null}
              </div>
              <LastUpdatedBadge timestamp={lastUpdated} />
            </ModuleViewTracker>
          )}

          {isModuleEnabled(placementById, "time_range") && (
            <ModuleViewTracker moduleId="time_range" tenantId={signalTenantId}>
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
            </ModuleViewTracker>
          )}
        </div>
      </div>

      {customizationLoading ? (
        <p className="text-xs text-muted-foreground">Loading published layout…</p>
      ) : null}
      {customizationError ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Layout API unavailable ({customizationError}). Showing default module order.
        </p>
      ) : null}
      {customization?.degraded ? (
        <p className="text-xs text-muted-foreground border border-border/60 rounded-md px-3 py-2">
          {customization.degraded.message}
        </p>
      ) : null}

      {sortedModules.map((placement) => {
        if (!placement.enabled) return null;
        switch (placement.moduleId) {
          case "usage_warning":
            return (
              <ModuleViewTracker key={placement.moduleId} moduleId="usage_warning" tenantId={signalTenantId}>
                {kpis && kpis.totalVolume > 0 ? (
                  <UsageWarning
                    current={kpis.totalVolume}
                    limit={placement.thresholdOverrides?.usageWarningVolume ?? 1_000_000}
                    type="usage"
                  />
                ) : null}
              </ModuleViewTracker>
            );
          case "kpi_tiles":
            return (
              <ModuleViewTracker key={placement.moduleId} moduleId="kpi_tiles" tenantId={signalTenantId}>
                <ModuleChrome placement={placement} moduleId="kpi_tiles">
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
                          {...(kpis?.matchedPercent
                            ? { trend: kpis.matchedPercent > 95 ? "up" : "down" }
                            : {})}
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
                </ModuleChrome>
              </ModuleViewTracker>
            );
          case "exception_heatmap":
            return (
              <ModuleViewTracker key={placement.moduleId} moduleId="exception_heatmap" tenantId={signalTenantId}>
                <ModuleChrome placement={placement} moduleId="exception_heatmap">
                  <Card>
                    <CardContent className="pt-6">
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
                                <div className="text-sm text-muted-foreground mb-1">{item.source}</div>
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
                </ModuleChrome>
              </ModuleViewTracker>
            );
          case "activity_feed":
            return (
              <ModuleViewTracker key={placement.moduleId} moduleId="activity_feed" tenantId={signalTenantId}>
                <ModuleChrome placement={placement} moduleId="activity_feed">
                  <Card>
                    <CardContent className="pt-6">
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
                        <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                      )}
                    </CardContent>
                  </Card>
                </ModuleChrome>
              </ModuleViewTracker>
            );
          case "trust_connection":
          case "time_range":
            return null;
          default:
            return null;
        }
      })}

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

function isModuleEnabled(map: Map<string, ModulePlacement>, id: string): boolean {
  return map.get(id)?.enabled !== false;
}

function ModuleChrome({
  moduleId,
  placement,
  children,
}: {
  moduleId: keyof typeof ADMIN_DASHBOARD_MODULE_REGISTRY;
  placement: ModulePlacement;
  children: React.ReactNode;
}) {
  const def = ADMIN_DASHBOARD_MODULE_REGISTRY[moduleId];
  const title = placement.titleOverride ?? def?.defaultTitle ?? moduleId;
  const help = placement.helpOverride ?? def?.defaultHelp ?? "";
  const truth = def?.truthClass ?? "presentation_summary";
  const source = def?.sourceOfTruthHint ?? "unknown";

  return (
    <section aria-labelledby={`mod-${moduleId}-title`} className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <h2 id={`mod-${moduleId}-title`} className="text-sm font-semibold text-foreground">
          {title}
        </h2>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
          {truth.replace(/_/g, " ")} · {source}
        </span>
      </div>
      {help ? <p className="text-xs text-muted-foreground max-w-3xl">{help}</p> : null}
      {children}
    </section>
  );
}

function ModuleViewTracker({
  moduleId,
  tenantId,
  children,
}: {
  moduleId: string;
  tenantId?: string | null;
  children: React.ReactNode;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    recordModuleViewSignal(moduleId, tenantId);
  }, [moduleId, tenantId]);
  return <>{children}</>;
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
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
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
