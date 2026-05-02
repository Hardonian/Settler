"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConsoleListRow } from "@/components/console/console-list-row";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { ReconciliationView } from "@/components/console/ReconciliationView";
import { safeFetch } from "@/lib/safe-fetch";

interface RecentRun {
  runKind?: "recon_job" | "ingestion_run";
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "unknown";
  statusLabel?: string;
  startedAt: string;
  completedAt: string | null;
  summary?: {
    total: number;
    matched: number;
    unmatched: number;
    conflicts: number;
  };
  progress?: number;
}

function getStatusTone(status: RecentRun["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "running":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusIcon(status: RecentRun["status"]) {
  switch (status) {
    case "completed":
      return CheckCircle2;
    case "running":
      return RefreshCw;
    case "pending":
      return Clock;
    default:
      return AlertTriangle;
  }
}

export default function ReconciliationsPage() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("runId");
  const [runs, setRuns] = useState<RecentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (runId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRuns() {
      setLoading(true);
      const result = await safeFetch<{ items: RecentRun[] }>("/api/runs?limit=6&run_kind=all");

      if (cancelled) {
        return;
      }

      if (result.success && result.data) {
        setRuns((result.data.items ?? []).slice(0, 6));
        setError(null);
      } else {
        setRuns([]);
        setError(result.error?.message || "Failed to load runs");
      }

      setLoading(false);
    }

    void loadRuns();

    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (runId) {
    return (
      <div className="space-y-8">
        <div>
          <Link href={`/console/runs/${runId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Run Detail
            </Button>
          </Link>
        </div>

        <ConsolePageHeader
          title="Reconciliation Results"
          description="Inspect the completed run with visible impact ranking, rationale, and result totals."
        />

        <ReconciliationView reconciliationId={runId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Reconciliations"
        description="Inspect the outcomes of your reconciliation intelligence. Every matching decision is replayable, explainable, and linked to deterministic evidence."
      />

      <Card>
        <CardHeader>
          <CardTitle>How This Surface Works</CardTitle>
          <CardDescription>
            Results appear here after a tenant-scoped run completes and persists counters or match
            evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Use Runs to monitor execution state, then open a completed run here to inspect outcomes.
          </p>
          <p>
            Matching rules and tolerances come from the job configuration captured for that run, not
            from a hidden console default.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link href="/console/runs">Open Runs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/console/docs">Review Run Setup</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription>
            Mixed recon jobs and ingestion runs from the same merged list as Runs. Result inspection
            is available for recon jobs; ingestion runs use run detail for now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading recent runs">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card/40 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-72 max-w-full" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="Run history unavailable"
              description={error}
              action={{
                label: "Open Runs",
                onClick: () => {
                  window.location.href = "/console/runs";
                },
              }}
            />
          ) : runs.length === 0 ? (
            <EmptyState
              title="No reconciliation outcomes yet"
              description="This surface visualizes matching rationale and evidence impact. To begin, initiate a new reconciliation run or verify your ingestion jobs."
              hint="Reconciliation runs transform raw transactions into deterministic matches. Once a run completes, you can inspect the 'why' behind every decision here."
              action={{
                label: "Open Runs",
                onClick: () => {
                  window.location.href = "/console/runs";
                },
              }}
            />
          ) : (
            <div className="space-y-4">
              {runs.map((run) => {
                const StatusIcon = getStatusIcon(run.status);

                return (
                  <ConsoleListRow key={run.id}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{run.name}</h3>
                          {run.runKind === "ingestion_run" ? (
                            <Badge variant="outline" className="text-xs font-normal">
                              Ingestion run
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs font-normal">
                              Recon job
                            </Badge>
                          )}
                          <Badge className={getStatusTone(run.status)}>
                            <StatusIcon
                              className={`mr-1 h-3.5 w-3.5 ${
                                run.status === "running" ? "animate-spin" : ""
                              }`}
                            />
                            {run.statusLabel || run.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Started{" "}
                          <time dateTime={run.startedAt}>
                            {new Date(run.startedAt).toLocaleString()}
                          </time>
                          {run.completedAt ? (
                            <>
                              {" "}
                              • Completed{" "}
                              <time dateTime={run.completedAt}>
                                {new Date(run.completedAt).toLocaleString()}
                              </time>
                            </>
                          ) : null}
                        </p>
                        {run.summary && (
                          <p className="text-sm text-muted-foreground">
                            {run.summary.matched} matched • {run.summary.unmatched} unmatched •{" "}
                            {run.summary.conflicts} conflicts
                          </p>
                        )}
                        {run.status === "running" && typeof run.progress === "number" && (
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Progress: {run.progress}%
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                          <Link href={`/console/runs/${run.id}`}>Open Run Detail</Link>
                        </Button>
                        {run.status === "completed" && run.runKind !== "ingestion_run" ? (
                          <Button asChild>
                            <Link href={`/console/reconciliations?runId=${run.id}`}>
                              Inspect Results
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </ConsoleListRow>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
