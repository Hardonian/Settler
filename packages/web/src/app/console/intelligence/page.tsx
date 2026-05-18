"use client";

import { useCallback, useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { safeFetch } from "@/lib/safe-fetch";
import { Brain, AlertTriangle, CheckCircle, Clock, TrendingUp, Cpu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

interface WorkforceRegistryBody {
  data: {
    workers: Array<{
      key: string;
      version: string;
      displayName: string;
      description: string;
      riskLevel: string;
      requiresApproval: boolean;
      degradedWhen: string[];
    }>;
  };
  capability?: { state?: string };
}

interface WorkerRunRow {
  id: string;
  runDeltaId: string;
  trigger: string;
  status: string;
  output: {
    headline?: string;
    posture?: string;
    contentHash?: string;
  };
  degradedReasons: string[];
  createdAt: string;
}

interface AnalysisResponse {
  data: WorkerRunRow & {
    output: Record<string, unknown>;
    evidence: unknown;
  };
  capability?: { source?: string };
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

  const [workforceError, setWorkforceError] = useState<string | null>(null);
  const [registry, setRegistry] = useState<WorkforceRegistryBody["data"] | null>(null);
  const [workerRuns, setWorkerRuns] = useState<WorkerRunRow[]>([]);
  const [runDeltaInput, setRunDeltaInput] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse["data"] | null>(null);

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

  const loadWorkforce = useCallback(async () => {
    const reg = await safeFetch<WorkforceRegistryBody>("/api/console/workforce/registry");
    const runs = await safeFetch<{ data: WorkerRunRow[] }>("/api/console/workforce/runs?limit=15");
    if (reg.success && reg.data?.data) {
      setRegistry(reg.data.data);
      setWorkforceError(null);
    } else {
      setWorkforceError(reg.error?.message || "Failed to load workforce registry");
    }
    if (runs.success && runs.data?.data) {
      setWorkerRuns(runs.data.data);
    } else if (!runs.success) {
      setWorkforceError((prev) => prev ?? runs.error?.message ?? "Failed to load worker runs");
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    void loadRuns();
    void loadWorkforce();
  }, [loadHealth, loadRuns, loadWorkforce]);

  const isLoading = healthLoading && runsLoading;
  const hasBlockingError =
    (healthError || runsError || workforceError) && !healthData && !runsData.length && !registry;

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

  if (hasBlockingError) {
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
            void loadWorkforce();
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

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Workforce
          </CardTitle>
          <CardDescription>
            Bounded, evidence-backed workers with audit rows. Prior Run Delta Analyst uses only
            canonical RunDelta fields (deterministic; no generative inference).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {workforceError && (
            <p className="text-sm text-amber-700 dark:text-amber-300">{workforceError}</p>
          )}
          {registry && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Registered capabilities
              </h4>
              <ul className="space-y-2">
                {registry.workers.map((w) => (
                  <li
                    key={w.key}
                    className="rounded-lg border border-border/60 bg-card/40 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{w.displayName}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {w.key}@{w.version}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        risk: {w.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{w.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Degraded when: {w.degradedWhen.join("; ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              Recent analyst runs
            </h4>
            {workerRuns.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No persisted worker runs yet. Run a reconciliation with a prior run so RunDelta is
                computed, or load a briefing by Run Delta id below.
              </p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {workerRuns.map((wr) => (
                  <li
                    key={wr.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded border border-border/50 p-2 text-xs"
                  >
                    <span className="font-mono text-[10px] break-all">{wr.runDeltaId}</span>
                    <span className="text-muted-foreground shrink-0">
                      {wr.output?.posture ?? wr.status} · {new Date(wr.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-border/40 pt-4">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              Load briefing by Run Delta id
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Run Delta UUID"
                value={runDeltaInput}
                onChange={(e) => setRunDeltaInput(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                disabled={analysisLoading || runDeltaInput.trim().length < 8}
                onClick={async () => {
                  const id = runDeltaInput.trim();
                  if (!id) return;
                  setAnalysisLoading(true);
                  setAnalysisError(null);
                  const res = await safeFetch<AnalysisResponse>(
                    `/api/console/workforce/run-deltas/${encodeURIComponent(id)}/analysis`
                  );
                  if (res.success && res.data?.data) {
                    setAnalysisData(res.data.data);
                  } else {
                    setAnalysisData(null);
                    setAnalysisError(res.error?.message || "Failed to load analysis");
                  }
                  setAnalysisLoading(false);
                }}
              >
                {analysisLoading ? "Loading…" : "Load briefing"}
              </Button>
            </div>
            {analysisError && <p className="text-sm text-destructive">{analysisError}</p>}
            {analysisData && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium">{String(analysisData.output?.headline ?? "")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Posture: {String(analysisData.output?.posture ?? "—")} · Hash:{" "}
                    <span className="font-mono text-[10px]">
                      {String(analysisData.output?.contentHash ?? "—")}
                    </span>
                  </p>
                </div>
                {Array.isArray(analysisData.output?.summaryBullets) && (
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    {(analysisData.output.summaryBullets as string[]).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {Array.isArray(analysisData.output?.recommendedNextSteps) && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Next steps
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      {(analysisData.output.recommendedNextSteps as string[]).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisData.degradedReasons?.length > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Degraded signals: {analysisData.degradedReasons.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
