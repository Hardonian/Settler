"use client";

import { useCallback, useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { safeFetch } from "@/lib/safe-fetch";
import { Brain, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface SystemHealthSnapshot {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_exceptions: number;
  unresolved_exceptions: number;
  avg_confidence: number | null;
  exception_trend: "increasing" | "stable" | "decreasing";
  degraded_reasons?: string[];
}

interface RunExplorerItem {
  id: string;
  name: string;
  status: "completed" | "failed" | "running" | "pending";
  exception_count: number;
  confidence: number | null;
  started_at: string;
  completed_at: string | null;
}

interface SystemHealthResponse {
  data: SystemHealthSnapshot;
  capability: {
    status: string;
    degraded_reasons?: string[];
  };
}

interface RunExplorerResponse {
  data: RunExplorerItem[];
  capability: {
    status: string;
    degraded_reasons?: string[];
  };
}

function CapabilityBadge({
  status,
  degradedReasons,
}: {
  status: string;
  degradedReasons?: string[];
}) {
  const variant =
    status === "available" ? "success" : status === "degraded" ? "warning" : "destructive";
  const label =
    status === "available" ? "Operational" : status === "degraded" ? "Degraded" : "Unavailable";
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant}>{label}</Badge>
      {degradedReasons && degradedReasons.length > 0 && (
        <span className="text-xs text-muted-foreground" title={degradedReasons.join(", ")}>
          {degradedReasons.length} issue{degradedReasons.length > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof Brain;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const toneClasses = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    neutral: "text-foreground",
  };

  return (
    <Card className="border-border/40 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className={`text-2xl font-bold font-mono ${tone ? toneClasses[tone] : ""}`}>
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

export default function IntelligencePage() {
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<SystemHealthSnapshot | null>(null);
  const [healthCapability, setHealthCapability] = useState<
    SystemHealthResponse["capability"] | null
  >(null);

  const [runsLoading, setRunsLoading] = useState(true);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [runsData, setRunsData] = useState<RunExplorerItem[]>([]);
  const [runsCapability, setRunsCapability] = useState<RunExplorerResponse["capability"] | null>(
    null
  );

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    const result = await safeFetch<SystemHealthResponse>(
      "/api/v1/operator/intelligence/system-health"
    );
    if (result.success && result.data) {
      setHealthData(result.data.data);
      setHealthCapability(result.data.capability);
      setHealthError(null);
    } else {
      setHealthError(result.error?.message || "Failed to load system health");
    }
    setHealthLoading(false);
  }, []);

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    const result = await safeFetch<RunExplorerResponse>(
      "/api/v1/operator/intelligence/run-explorer?limit=10"
    );
    if (result.success && result.data) {
      setRunsData(result.data.data || []);
      setRunsCapability(result.data.capability);
      setRunsError(null);
    } else {
      setRunsError(result.error?.message || "Failed to load run explorer");
    }
    setRunsLoading(false);
  }, []);

  useEffect(() => {
    void loadHealth();
    void loadRuns();
  }, [loadHealth, loadRuns]);

  const isLoading = healthLoading && runsLoading;
  const hasError = healthError || runsError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Intelligence"
          description="Real-time reconciliation health metrics and exception intelligence powered by operator mode."
          breadcrumbs={[{ label: "Console" }, { label: "Intelligence" }]}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/40 bg-card/50">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (hasError && !healthData && !runsData.length) {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Intelligence"
          description="Real-time reconciliation health metrics and exception intelligence powered by operator mode."
          breadcrumbs={[{ label: "Console" }, { label: "Intelligence" }]}
        />
        <ErrorState
          title="Failed to load intelligence"
          message={healthError || runsError || "Unknown error"}
          onRetry={() => {
            void loadHealth();
            void loadRuns();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Intelligence"
        description="Real-time reconciliation health metrics and exception intelligence powered by operator mode."
        breadcrumbs={[{ label: "Console" }, { label: "Intelligence" }]}
        actions={
          healthCapability && (
            <CapabilityBadge
              status={healthCapability.status}
              degradedReasons={healthCapability.degraded_reasons}
            />
          )
        }
      />

      {healthCapability?.status === "degraded" && healthCapability.degraded_reasons?.length && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/60">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Intelligence service is degraded
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                {healthCapability.degraded_reasons.join("; ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {healthData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Runs"
            value={healthData.total_runs.toLocaleString()}
            icon={TrendingUp}
          />
          <StatCard
            label="Success Rate"
            value={
              healthData.total_runs > 0
                ? `${((healthData.successful_runs / healthData.total_runs) * 100).toFixed(1)}%`
                : "—"
            }
            icon={CheckCircle}
            tone={
              healthData.total_runs > 0 &&
              healthData.successful_runs / healthData.total_runs >= 0.95
                ? "success"
                : "warning"
            }
          />
          <StatCard
            label="Unresolved Exceptions"
            value={healthData.unresolved_exceptions.toLocaleString()}
            icon={AlertTriangle}
            tone={healthData.unresolved_exceptions > 0 ? "warning" : "success"}
          />
          <StatCard
            label="Exception Trend"
            value={
              healthData.exception_trend === "decreasing"
                ? "Decreasing"
                : healthData.exception_trend === "increasing"
                  ? "Increasing"
                  : "Stable"
            }
            icon={Clock}
            tone={
              healthData.exception_trend === "decreasing"
                ? "success"
                : healthData.exception_trend === "increasing"
                  ? "danger"
                  : "neutral"
            }
          />
        </div>
      )}

      {runsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
            <CardDescription>Latest reconciliation runs with exception context</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runsData.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{run.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{run.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {run.exception_count > 0 && (
                      <Badge variant="warning" className="text-xs">
                        {run.exception_count} exception{run.exception_count > 1 ? "s" : ""}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        run.status === "completed"
                          ? "success"
                          : run.status === "failed"
                            ? "destructive"
                            : run.status === "running"
                              ? "info"
                              : "outline"
                      }
                    >
                      {run.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {runsCapability?.status === "degraded" && runsCapability.degraded_reasons?.length && (
        <Card className="border-border/40">
          <CardContent className="py-4 text-xs text-muted-foreground">
            Run explorer data may be incomplete. {runsCapability.degraded_reasons.join("; ")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
