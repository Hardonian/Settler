"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFetch } from "@/lib/safe-fetch";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface RunStage {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface Run {
  runKind?: "recon_job" | "ingestion_run";
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "unknown";
  statusLabel?: string;
  isTerminal?: boolean;
  stages: RunStage[];
  progress: number;
  progressState?: "not_started" | "in_progress" | "completed" | "failed" | "unknown";
  startedAt: string;
  completedAt?: string;
  error?: string;
  summary?: {
    total: number;
    sourceCount: number;
    targetCount: number;
    matched: number;
    unmatched: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflicts: number;
  };
  summaryMath?: {
    sourceCount: number;
    targetCount: number;
    matchedCount: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflictCount: number;
    note: string;
  };
  summaryState?: "success" | "review_needed" | "in_progress" | "failed" | "empty" | "unknown";
  config?: {
    sourceAdapter: string | null;
    targetAdapter: string | null;
    reconStrategy: string | null;
    templateId: string | null;
    validationRuleCount: number;
    validationRuleLabels: string[];
    ruleVersionCount: number;
    ruleVersionLabels: string[];
    snapshotId: string | null;
    inputHash: string | null;
    configSource: "snapshot" | "job_definition";
    configCapturedAt: string | null;
    definitionDriftDetected: boolean;
    definitionDriftNotes: string[];
    summaryBasis: string;
  };
  resultContext?: {
    latestResultId: string | null;
    latestResultStatus: string | null;
    latestResultStartedAt: string | null;
    latestResultCompletedAt: string | null;
    persistedResultCount: number;
    comparison?: {
      previousResultId: string;
      previousResultStartedAt: string | null;
      deltaMatched: number;
      deltaUnmatched: number;
      deltaConflicts: number;
      snapshotChanged: boolean;
      inputHashChanged: boolean;
    } | null;
  };
  exceptions?: {
    total: number;
    pending: number;
    investigating: number;
    resolved: number;
    ignored: number;
    reviewRequired: number;
  };
  exceptionWorkflowNote?: string;
  metadata?: Record<string, unknown>;
  traceId?: string | null;
}

export default function RunPage() {
  const params = useParams();
  const runId = params.runId as string;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadRun();

    if (autoRefresh && run && !run.isTerminal) {
      const interval = setInterval(loadRun, 2000); // Poll every 2 seconds for running jobs
      return () => clearInterval(interval);
    }
    return undefined;
  }, [runId, autoRefresh, run?.isTerminal]);

  const loadRun = async () => {
    setLoading(true);
    const result = await safeFetch<Run>(`/api/runs/${runId}`);

    if (result.success && result.data) {
      setRun(result.data);
      setError(null);
    } else {
      setError(result.error?.message || "Failed to load run");
      setRun(null);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: Run["status"]) => {
    switch (status) {
      case "completed":
        return CheckCircle2;
      case "failed":
        return XCircle;
      case "running":
        return RefreshCw;
      case "unknown":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: Run["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "running":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "unknown":
        return "bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground";
      default:
        return "bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground";
    }
  };

  const formatSignedDelta = (value: number) => {
    if (value > 0) {
      return `+${value}`;
    }
    return `${value}`;
  };

  if (loading && !run) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && !run) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load run" message={error} onRetry={loadRun} />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-6">
        <EmptyState
          title="Run not found"
          description="The run you're looking for doesn't exist or you don't have access"
          action={{
            label: "Go to Console",
            onClick: () => (window.location.href = "/console"),
          }}
        />
      </div>
    );
  }

  const StatusIcon = getStatusIcon(run.status);
  const isIngestionRun = run.runKind === "ingestion_run";

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center text-sm text-muted-foreground dark:text-muted-foreground mb-4">
        <Link href="/console" className="hover:text-foreground dark:hover:text-white">
          Console
        </Link>
        <span className="mx-2">/</span>
        <Link href="/console/runs" className="hover:text-foreground dark:hover:text-white">
          Runs
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground dark:text-white">{run.name}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/console/runs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Runs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">{run.name}</h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Run ID: <code className="bg-muted/40 dark:bg-card px-2 py-1 rounded">{run.id}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" onClick={loadRun}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isIngestionRun ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ingestion reconciliation run</CardTitle>
            <CardDescription>
              This run is stored in <code className="text-xs">reconciliation_runs</code>, not{" "}
              <code className="text-xs">recon_jobs</code>. Counts and lifecycle here reflect that
              row; snapshot-backed job config and drift-event scoping may differ from recon job runs.
            </CardDescription>
          </CardHeader>
          {run.exceptionWorkflowNote ? (
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {run.exceptionWorkflowNote}
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status</CardTitle>
            <Badge className={getStatusColor(run.status)}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {run.statusLabel || run.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{run.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${run.progress}%` }}
                />
              </div>
            </div>
            {run.summary && (
              <div className="space-y-3 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                  <div>
                    <div className="text-2xl font-bold">{run.summary.sourceCount}</div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Source Rows
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{run.summary.targetCount}</div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Target Rows
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{run.summary.matched}</div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Matched
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      {run.summary.unmatchedSourceCount}
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Unmatched Source
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      {run.summary.unmatchedTargetCount}
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Unmatched Target
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{run.summary.conflicts}</div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Conflicts
                    </div>
                  </div>
                </div>
                {run.summaryMath?.note ? (
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {run.summaryMath.note}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {run.resultContext && !isIngestionRun && (
        <Card>
          <CardHeader>
            <CardTitle>Result Provenance</CardTitle>
            <CardDescription>
              Run detail shows the latest persisted result for this run definition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground dark:text-muted-foreground">
            <p>
              Persisted results:{" "}
              <span className="font-medium text-foreground dark:text-white">
                {run.resultContext.persistedResultCount}
              </span>
            </p>
            {run.resultContext.latestResultId ? (
              <p>
                Latest result ID:{" "}
                <code className="bg-muted/40 dark:bg-card px-1.5 py-0.5 rounded break-all">
                  {run.resultContext.latestResultId}
                </code>
              </p>
            ) : (
              <p>No persisted result has been recorded yet.</p>
            )}
            {run.resultContext.latestResultStartedAt && (
              <p>
                Evaluated at {new Date(run.resultContext.latestResultStartedAt).toLocaleString()}.
              </p>
            )}
            {run.resultContext.comparison && (
              <div className="rounded-md border border-border dark:border-border p-3">
                <p className="font-medium text-foreground dark:text-white">
                  Compared to prior result
                </p>
                <p className="mt-1">
                  Previous result{" "}
                  <code className="bg-muted/40 dark:bg-card px-1.5 py-0.5 rounded break-all">
                    {run.resultContext.comparison.previousResultId}
                  </code>
                  {run.resultContext.comparison.previousResultStartedAt
                    ? ` from ${new Date(run.resultContext.comparison.previousResultStartedAt).toLocaleString()}`
                    : ""}
                  .
                </p>
                <p className="mt-1">
                  Matched {formatSignedDelta(run.resultContext.comparison.deltaMatched)} • Unmatched{" "}
                  {formatSignedDelta(run.resultContext.comparison.deltaUnmatched)} • Conflicts{" "}
                  {formatSignedDelta(run.resultContext.comparison.deltaConflicts)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                  Snapshot {run.resultContext.comparison.snapshotChanged ? "changed" : "unchanged"}{" "}
                  • Input hash{" "}
                  {run.resultContext.comparison.inputHashChanged ? "changed" : "unchanged"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {run.exceptions && !isIngestionRun && (
        <Card>
          <CardHeader>
            <CardTitle>Exception Workflow</CardTitle>
            <CardDescription>
              Exceptions are run-scoped operator decisions, distinct from run execution status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">
                  {run.exceptions.total}
                </p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{run.exceptions.pending}</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{run.exceptions.investigating}</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Investigating
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{run.exceptions.resolved}</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Resolved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{run.exceptions.ignored}</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Ignored</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{run.exceptions.reviewRequired}</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Needs Review
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/console/exceptions?runId=${run.id}`}>
                <Button variant="outline" size="sm">
                  Open All Run Exceptions
                </Button>
              </Link>
              <Link href={`/console/exceptions?runId=${run.id}&status=pending`}>
                <Button variant="outline" size="sm">
                  Open Pending
                </Button>
              </Link>
              <Link href={`/console/exceptions?runId=${run.id}&status=investigating`}>
                <Button variant="outline" size="sm">
                  Open Investigating
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Continuity - Next Actions */}
      {run.status === "completed" && !isIngestionRun && (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Review results and investigate any exceptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href={`/console/reconciliations?runId=${run.id}`}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-start justify-center"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="font-semibold">View Results</span>
                  </div>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                    See detailed reconciliation outcomes
                  </span>
                </Button>
              </Link>
              {run.summary && run.summary.unmatched > 0 && (
                <Link href={`/console/exceptions?runId=${run.id}`}>
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-start justify-center border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold">View Exceptions</span>
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        {run.summary.unmatched}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Investigate unmatched records
                    </span>
                  </Button>
                </Link>
              )}
              {run.summary && run.summary.conflicts > 0 && (
                <Link href={`/console/exceptions?runId=${run.id}&type=conflicts`}>
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-start justify-center border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-semibold">View Conflicts</span>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {run.summary.conflicts}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Resolve conflicting matches
                    </span>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {run.status === "running" && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Run in progress</p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Results will appear here when the run completes. Progress: {run.progress}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {run.status === "pending" && (
        <Card className="border-border dark:border-border bg-muted/20/50 dark:bg-card/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground dark:text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground dark:text-white mb-1">Run pending</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  This run is queued and will start shortly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stages */}
      {run.config && (
        <Card>
          <CardHeader>
            <CardTitle>Effective Configuration</CardTitle>
            <CardDescription>
              Configuration context used to interpret the latest persisted result.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`rounded-md border p-3 text-sm ${
                run.config.configSource === "snapshot"
                  ? "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
              }`}
            >
              {run.config.configSource === "snapshot"
                ? "Snapshot-backed configuration: run decisions are tied to a captured snapshot."
                : "Live-definition fallback: snapshot data was not available for this result."}
              {run.config.configCapturedAt
                ? ` Captured ${new Date(run.config.configCapturedAt).toLocaleString()}.`
                : ""}
            </div>
            {run.config.definitionDriftDetected && run.config.definitionDriftNotes.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <p className="font-medium">Current definition differs from captured snapshot:</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {run.config.definitionDriftNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white">Adapters</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {[run.config.sourceAdapter, run.config.targetAdapter]
                    .filter(Boolean)
                    .join(" -> ") || "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white">Strategy</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {run.config.reconStrategy || "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white">Rules</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {run.config.validationRuleCount > 0
                    ? `${run.config.validationRuleCount} rule${
                        run.config.validationRuleCount === 1 ? "" : "s"
                      } active`
                    : "No validation rules recorded"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white">Rule Versions</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {run.config.ruleVersionCount > 0
                    ? `${run.config.ruleVersionCount} locked version${
                        run.config.ruleVersionCount === 1 ? "" : "s"
                      }`
                    : "No rule-version lock recorded"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white">Snapshot</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground font-mono break-all">
                  {run.config.snapshotId || "Not persisted"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white">Input Hash</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground font-mono break-all">
                  {run.config.inputHash || "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white">Template</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground font-mono break-all">
                  {run.config.templateId || "None"}
                </p>
              </div>
            </div>
            {run.config.validationRuleLabels.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground dark:text-white">
                  Recorded Rule Coverage
                </p>
                <div className="flex flex-wrap gap-2">
                  {run.config.validationRuleLabels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {run.config.ruleVersionLabels.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground dark:text-white">
                  Snapshot Rule Versions
                </p>
                <div className="flex flex-wrap gap-2">
                  {run.config.ruleVersionLabels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {run.config.summaryBasis}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stages</CardTitle>
          <CardDescription>Progress through each stage of the run</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {run.stages.map((stage) => {
              const StageIcon = getStatusIcon(stage.status);
              return (
                <div
                  key={stage.id}
                  className="flex items-start gap-4 p-4 bg-muted/20 dark:bg-card rounded-lg"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      stage.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : stage.status === "running"
                          ? "bg-blue-100 dark:bg-blue-900/30 animate-pulse"
                          : stage.status === "failed"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-muted/40 dark:bg-muted"
                    }`}
                  >
                    <StageIcon
                      className={`w-5 h-5 ${
                        stage.status === "completed"
                          ? "text-green-600 dark:text-green-400"
                          : stage.status === "running"
                            ? "text-blue-600 dark:text-blue-400"
                            : stage.status === "failed"
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                      } ${stage.status === "running" ? "animate-spin" : ""}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground dark:text-white">{stage.name}</h3>
                      <Badge className={getStatusColor(stage.status)}>{stage.status}</Badge>
                    </div>
                    {stage.error && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {stage.error}
                      </div>
                    )}
                    {stage.completedAt && (
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                        Completed {new Date(stage.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {run.error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-200">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 dark:text-red-300">{run.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
