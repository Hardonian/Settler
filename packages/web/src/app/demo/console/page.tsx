"use client";

/**
 * Showcase Console — Demo Dashboard
 *
 * Full interactive demo of the Settler console with realistic data.
 * No authentication required. All data is deterministic and in-memory.
 * Designed for: demos, screenshots, trial evaluation, investor review.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Link2,
  PlayCircle,
  Shield,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import type {
  ShowcaseTenant,
  ShowcaseRun,
  ShowcaseException,
  ShowcaseAlert,
  ShowcaseIntegration,
  ShowcaseMetrics,
} from "@/lib/demo/showcase-data";

interface DemoData {
  tenants: ShowcaseTenant[];
  runs: ShowcaseRun[];
  exceptions: ShowcaseException[];
  alerts: ShowcaseAlert[];
  integrations: ShowcaseIntegration[];
  metrics: ShowcaseMetrics | null;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function summaryStateToStatus(state: string): StatusType {
  switch (state) {
    case "success":
      return "success";
    case "review_needed":
      return "review_needed";
    case "failed":
      return "failed";
    case "in_progress":
      return "in_progress";
    default:
      return "neutral";
  }
}

function runStatusToStatus(status: string): StatusType {
  switch (status) {
    case "completed":
      return "completed";
    case "running":
      return "running";
    case "failed":
      return "failed";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}

function integrationStatusColor(status: string): string {
  switch (status) {
    case "connected":
      return "bg-green-500";
    case "degraded":
      return "bg-amber-500";
    case "disconnected":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

function alertSeverityVariant(
  severity: string
): "destructive" | "warning" | "outline" {
  switch (severity) {
    case "critical":
      return "destructive";
    case "warning":
      return "warning";
    default:
      return "outline";
  }
}

function MiniSparkline({ data, color = "text-blue-500" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 120;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-[120px] h-8 ${color}`} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DemoConsolePage() {
  const [data, setData] = useState<DemoData | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (tenantId?: string) => {
    setLoading(true);
    try {
      const tenantParam = tenantId ? `?tenantId=${tenantId}` : "";
      const [tenantsRes, runsRes, exceptionsRes, alertsRes, integrationsRes, metricsRes] =
        await Promise.all([
          fetch("/api/demo/tenants"),
          fetch(`/api/demo/runs${tenantParam}`),
          fetch(`/api/demo/exceptions${tenantParam}`),
          fetch(`/api/demo/alerts${tenantParam}`),
          fetch(`/api/demo/integrations${tenantParam}`),
          fetch(`/api/demo/metrics${tenantParam}`),
        ]);

      const [tenants, runs, exceptions, alerts, integrations, metrics] = await Promise.all([
        tenantsRes.json(),
        runsRes.json(),
        exceptionsRes.json(),
        alertsRes.json(),
        integrationsRes.json(),
        metricsRes.json(),
      ]);

      setData({ tenants, runs, exceptions, alerts, integrations, metrics });
      if (!tenantId && tenants.length > 0) {
        setSelectedTenant(tenants[0].id);
      }
    } catch {
      // Demo mode — gracefully degrade
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedTenant) {
      void loadData(selectedTenant);
    }
  }, [selectedTenant, loadData]);

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const currentTenant = data.tenants.find((t) => t.id === selectedTenant);
  const openExceptions = data.exceptions.filter(
    (e) => e.status === "pending" || e.status === "investigating"
  );
  const criticalAlerts = data.alerts.filter((a) => a.severity === "critical" && !a.acknowledged);
  const metrics = data.metrics;
  const latestRuns = data.runs.slice(0, 5);
  const recentExceptions = openExceptions.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Demo Banner */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <PlayCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Showcase Mode — Live Product Demo
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              All data is deterministic and read-only. Switch tenants to explore different reconciliation scenarios.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/signup">
              Start Free Trial <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/demo">All Demos</Link>
          </Button>
        </div>
      </div>

      {/* Header + Tenant Selector */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Reconciliation Console
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {currentTenant?.name || "Dashboard"}
          </h1>
          {currentTenant && (
            <p className="text-sm text-muted-foreground mt-1">
              {currentTenant.industry} — {currentTenant.scenarioLabel}
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          <label htmlFor="tenant-select" className="block text-xs font-medium text-muted-foreground mb-1">
            Scenario
          </label>
          <select
            id="tenant-select"
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="input-field min-w-[240px]"
          >
            {data.tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.scenarioLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          {criticalAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">{alert.title}</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{alert.message}</p>
              </div>
              <Badge variant="destructive" className="flex-shrink-0">Critical</Badge>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Match Rate"
            value={`${metrics.matchRate}%`}
            icon={CheckCircle2}
            tone={metrics.matchRate >= 95 ? "success" : metrics.matchRate >= 90 ? "warning" : "danger"}
            description={`${metrics.totalRunsCompleted} runs completed`}
          />
          <StatCard
            label="Records Processed"
            value={formatCount(metrics.totalRecordsProcessed)}
            icon={Activity}
            description={`Avg run: ${(metrics.avgRunDurationMs / 1000).toFixed(1)}s`}
          />
          <StatCard
            label="Open Exceptions"
            value={metrics.openExceptions}
            icon={AlertTriangle}
            tone={metrics.openExceptions > 10 ? "danger" : metrics.openExceptions > 0 ? "warning" : "success"}
            description={`${metrics.resolvedExceptions} resolved`}
          />
          <StatCard
            label="Active Integrations"
            value={metrics.activeIntegrations}
            icon={Link2}
            description={`${data.integrations.length} total configured`}
          />
        </div>
      )}

      {/* Trends */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Match Rate Trend</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold tabular-nums">{metrics.matchRate}%</span>
              <MiniSparkline data={metrics.trendMatchRate} color="text-green-500" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Exception Trend</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold tabular-nums">{metrics.openExceptions}</span>
              <MiniSparkline data={metrics.trendExceptions} color="text-amber-500" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Volume Trend</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold tabular-nums">{formatCount(metrics.totalRecordsProcessed)}</span>
              <MiniSparkline data={metrics.trendVolume} color="text-blue-500" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two-column: Recent Runs + Exceptions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Runs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Runs</CardTitle>
                <CardDescription>Latest reconciliation executions</CardDescription>
              </div>
              <Badge variant="outline">{data.runs.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{run.name}</p>
                    <StatusBadge status={runStatusToStatus(run.status)} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatCount(run.summary.matched)} matched</span>
                    <span>{formatCount(run.summary.unmatched)} unmatched</span>
                    <span>{formatCount(run.summary.conflicts)} conflicts</span>
                  </div>
                </div>
                <StatusBadge
                  status={summaryStateToStatus(run.summaryState)}
                  label={run.summaryState.replace("_", " ")}
                  size="sm"
                />
              </div>
            ))}
            {data.runs.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                + {data.runs.length - 5} more runs
              </p>
            )}
          </CardContent>
        </Card>

        {/* Open Exceptions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Open Exceptions</CardTitle>
                <CardDescription>Items requiring operator attention</CardDescription>
              </div>
              <Badge variant={openExceptions.length > 0 ? "warning" : "outline"}>
                {openExceptions.length} open
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentExceptions.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">All clear</p>
                <p className="text-xs text-muted-foreground">No open exceptions for this tenant</p>
              </div>
            ) : (
              recentExceptions.map((exc) => (
                <div
                  key={exc.id}
                  className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm text-foreground line-clamp-2">{exc.description}</p>
                    <Badge variant={exc.severity === "critical" ? "destructive" : exc.severity === "high" ? "warning" : "outline"} className="flex-shrink-0">
                      {exc.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{exc.type.replace(/_/g, " ")}</Badge>
                    <span>${exc.amount.toFixed(2)}</span>
                    <span>{exc.statusDetail}</span>
                  </div>
                </div>
              ))
            )}
            {openExceptions.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                + {openExceptions.length - 5} more exceptions
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>
            Data sources and destinations configured for this tenant. Status reflects last sync health.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${integrationStatusColor(integration.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {integration.category} — {formatCount(integration.recordsSynced)} records
                  </p>
                </div>
                <Badge
                  variant={
                    integration.status === "connected"
                      ? "success"
                      : integration.status === "degraded"
                        ? "warning"
                        : "outline"
                  }
                >
                  {integration.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>
              System-generated alerts based on threshold rules and anomaly detection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  alert.acknowledged ? "opacity-60" : ""
                }`}
              >
                <div className="mt-0.5">
                  {alert.severity === "critical" ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : alert.severity === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Activity className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {alert.acknowledged && (
                    <Badge variant="outline" className="text-[10px]">Ack</Badge>
                  )}
                  <Badge variant={alertSeverityVariant(alert.severity)}>{alert.severity}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trust & Provenance */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            Trust & Provenance
          </CardTitle>
          <CardDescription>
            Every reconciliation run in Settler produces deterministic, auditable results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deterministic Engine</p>
              <p className="text-sm text-foreground">Same inputs always produce identical outputs. Every run is replayable.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audit Trail</p>
              <p className="text-sm text-foreground">Every operator action, rule change, and exception resolution is logged with actor and timestamp.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tenant Isolation</p>
              <p className="text-sm text-foreground">All data is scoped to your tenant. No cross-tenant data leakage is possible.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evidence Manifests</p>
              <p className="text-sm text-foreground">Each run produces hash-linked evidence that can be independently verified.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Ready to reconcile your own data?
        </h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
          Start a free trial to connect your payment processors, banks, and accounting systems.
          See real reconciliation results in minutes.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/signup">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">Talk to Sales</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
