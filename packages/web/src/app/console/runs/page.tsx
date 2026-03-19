"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  TimerReset,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { shouldPollRuns } from "@/lib/console/polling";
import { safeFetch } from "@/lib/safe-fetch";

interface RunFilters {
  status?: string;
  search?: string;
}

interface RunListItem {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "unknown";
  statusLabel?: string;
  startedAt: string;
  completedAt: string | null;
  progress: number;
  progressState?: "not_started" | "in_progress" | "completed" | "failed" | "unknown";
  isTerminal: boolean;
  summary: {
    total: number;
    sourceCount: number;
    targetCount: number;
    matched: number;
    unmatched: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflicts: number;
  };
  summarySemantics: {
    processed: number;
    matchedWithTolerance: number;
    exceptioned: number;
    unresolved: number;
    ignored: number;
    resolved: number;
  };
  summaryState: "success" | "review_needed" | "in_progress" | "failed" | "empty" | "unknown";
  configDrift?: {
    status?: "none" | "detected" | "indeterminate";
  };
}

const POLL_INTERVAL_MS = 15_000;

function getStatusIcon(status: RunListItem["status"]) {
  switch (status) {
    case "completed":
      return CheckCircle2;
    case "failed":
      return XCircle;
    case "running":
      return RefreshCw;
    case "pending":
      return Clock;
    default:
      return AlertCircle;
  }
}

function getStatusColor(status: RunListItem["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "failed":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case "running":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
  }
}

function getSummaryStateTone(state: RunListItem["summaryState"]) {
  switch (state) {
    case "success":
      return "text-green-700 dark:text-green-300";
    case "review_needed":
      return "text-amber-700 dark:text-amber-300";
    case "failed":
      return "text-red-700 dark:text-red-300";
    case "in_progress":
      return "text-blue-700 dark:text-blue-300";
    default:
      return "text-slate-600 dark:text-slate-400";
  }
}

function formatDuration(startedAt: string, completedAt: string | null) {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationMs = end - start;

  if (durationMs < 1000) return "< 1s";
  if (durationMs < 60_000) return `${Math.floor(durationMs / 1000)}s`;
  if (durationMs < 3_600_000) {
    return `${Math.floor(durationMs / 60_000)}m ${Math.floor((durationMs % 60_000) / 1000)}s`;
  }
  return `${Math.floor(durationMs / 3_600_000)}h ${Math.floor((durationMs % 3_600_000) / 60_000)}m`;
}

function formatCount(value: number) {
  return value.toLocaleString();
}

export default function RunsPage() {
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RunFilters>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { isFrozen, governanceState } = useGovernanceState();

  const loadRuns = useCallback(async () => {
    setLoading(true);

    const queryParams = new URLSearchParams();
    if (filters.status) {
      queryParams.set("status", filters.status);
    }
    if (filters.search) {
      queryParams.set("search", filters.search);
    }

    const query = queryParams.toString();
    const result = await safeFetch<RunListItem[]>(query ? `/api/runs?${query}` : "/api/runs");

    if (result.success && result.data) {
      setRuns(result.data);
      setError(null);
    } else {
      setRuns([]);
      setError(result.error?.message || "Failed to load runs");
    }

    setLoading(false);
  }, [filters.search, filters.status]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const pollingEnabled = shouldPollRuns({
    autoRefresh,
    runs,
    loadingInitialState: loading && runs.length === 0,
    statusFilter: filters.status,
  });

  useEffect(() => {
    if (!pollingEnabled) {
      return undefined;
    }

    const interval = setInterval(() => {
      void loadRuns();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadRuns, pollingEnabled]);

  const totals = useMemo(
    () =>
      runs.reduce(
        (acc, run) => {
          acc.totalRuns += 1;
          acc.matched += run.summary.matched;
          acc.reviewRequired += run.summarySemantics.unresolved;
          acc.exceptions += run.summarySemantics.exceptioned;
          if (!run.isTerminal) {
            acc.activeRuns += 1;
          }
          return acc;
        },
        {
          totalRuns: 0,
          activeRuns: 0,
          matched: 0,
          reviewRequired: 0,
          exceptions: 0,
        }
      ),
    [runs]
  );

  const handleRefresh = useCallback(async () => {
    await loadRuns();
  }, [loadRuns]);

  const showFreezeBanner = isFrozen && governanceState;

  if (loading && runs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error && runs.length === 0) {
    return (
      <div className="space-y-6">
        {showFreezeBanner ? (
          <FreezeErrorAlert
            reason={governanceState.freeze_reason}
            scope={governanceState.frozen_by || "tenant"}
            frozenAt={governanceState.frozen_at || undefined}
            recoveryAction={{
              label: "View Governance Settings",
              href: "/console/settings?tab=governance",
            }}
          />
        ) : null}
        <ErrorState title="Failed to load runs" message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFreezeBanner ? (
        <FreezeErrorAlert
          reason={governanceState.freeze_reason}
          scope={governanceState.frozen_by || "tenant"}
          frozenAt={governanceState.frozen_at || undefined}
          recoveryAction={{
            label: "View Governance Settings",
            href: "/console/settings?tab=governance",
          }}
        />
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ConsolePageHeader
          title="Runs"
          description="Track canonical reconciliation execution state, compare persisted outcomes, and open the exact run that produced the current exception queue."
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              id="auto-refresh-checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
              className="rounded border-border"
            />
            Auto-refresh active work
          </label>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh now
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-5 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-foreground">One canonical run model</p>
            <p>
              Matched, unmatched, conflict, exception, and review counts come from the same
              canonical summary contract used by run detail and reconciliation detail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {pollingEnabled ? `Polling every ${POLL_INTERVAL_MS / 1000}s` : "Polling paused"}
            </Badge>
            <Badge variant="outline">
              {totals.activeRuns > 0
                ? `${totals.activeRuns} run${totals.activeRuns === 1 ? "" : "s"} active`
                : "All visible runs terminal"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {runs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Visible runs</CardDescription>
              <CardTitle className="text-3xl">{formatCount(totals.totalRuns)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Current tenant-scoped run history after filters.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Matched rows</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                {formatCount(totals.matched)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Rows that reconciled under exact or tolerance-supported logic.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Review required</CardDescription>
              <CardTitle className="text-3xl text-amber-600 dark:text-amber-400">
                {formatCount(totals.reviewRequired)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Unresolved outcomes still awaiting operator action.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Exceptioned rows</CardDescription>
              <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                {formatCount(totals.exceptions)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Rows promoted into the exception workflow.
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter the canonical run history by lifecycle state or run name / identifier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status || ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value || undefined,
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="search-filter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="search-filter"
                  type="text"
                  placeholder="Search run name or UUID..."
                  value={filters.search || ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => setFilters({})}
                disabled={!filters.search && !filters.status}
              >
                <TimerReset className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {runs.length === 0 ? (
        <EmptyState
          title={
            filters.status || filters.search
              ? "No runs match your filters"
              : "No reconciliation runs yet"
          }
          description={
            filters.status || filters.search
              ? "Try widening the lifecycle filter or clearing your search to review the full tenant run history."
              : "Runs appear here after a tenant-scoped reconciliation starts. Open Reconciliations to launch or inspect the next workflow."
          }
          action={{
            label: filters.status || filters.search ? "Clear Filters" : "Open Reconciliations",
            onClick: () => {
              if (filters.status || filters.search) {
                setFilters({});
                return;
              }

              window.location.href = "/console/reconciliations";
            },
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Run history</CardTitle>
            <CardDescription>
              Every row uses the same lifecycle and summary semantics surfaced on run detail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {runs.map((run) => {
              const StatusIcon = getStatusIcon(run.status);
              return (
                <div
                  key={run.id}
                  className="rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-800"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-foreground">
                          {run.name}
                        </h2>
                        <Badge className={getStatusColor(run.status)}>
                          <StatusIcon
                            className={`mr-1 h-3.5 w-3.5 ${run.status === "running" ? "animate-spin" : ""}`}
                          />
                          {run.statusLabel || run.status}
                        </Badge>
                        {run.configDrift?.status === "detected" ? (
                          <Badge variant="outline" className="text-amber-700 dark:text-amber-300">
                            Config drift detected
                          </Badge>
                        ) : null}
                      </div>

                      <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <div className="font-medium text-foreground">Run ID</div>
                          <code className="text-xs">{run.id}</code>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Started</div>
                          <div>{new Date(run.startedAt).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Completed</div>
                          <div>
                            {run.completedAt
                              ? new Date(run.completedAt).toLocaleString()
                              : "Still running"}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Duration</div>
                          <div>{formatDuration(run.startedAt, run.completedAt)}</div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Matched
                          </div>
                          <div className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">
                            {formatCount(run.summary.matched)}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Unmatched
                          </div>
                          <div className="mt-1 text-xl font-semibold text-amber-600 dark:text-amber-400">
                            {formatCount(run.summary.unmatched)}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Conflicts
                          </div>
                          <div className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
                            {formatCount(run.summary.conflicts)}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Exceptions
                          </div>
                          <div className="mt-1 text-xl font-semibold">
                            {formatCount(run.summarySemantics.exceptioned)}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Review required
                          </div>
                          <div className="mt-1 text-xl font-semibold">
                            {formatCount(run.summarySemantics.unresolved)}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Tolerance matches
                          </div>
                          <div className="mt-1 text-xl font-semibold">
                            {formatCount(run.summarySemantics.matchedWithTolerance)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className={getSummaryStateTone(run.summaryState)}>
                          Summary state: {run.summaryState.replaceAll("_", " ")}
                        </span>
                        <span className="text-muted-foreground">
                          Processed {formatCount(run.summarySemantics.processed)} of{" "}
                          {formatCount(run.summary.total)} records
                        </span>
                        <span className="text-muted-foreground">
                          Source {formatCount(run.summary.sourceCount)} / Target{" "}
                          {formatCount(run.summary.targetCount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 xl:w-56 xl:flex-col">
                      <Button asChild>
                        <Link href={`/console/runs/${run.id}`}>Open run detail</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/console/reconciliations?runId=${run.id}`}>
                          Inspect reconciliation
                        </Link>
                      </Button>
                      <Button asChild variant="ghost">
                        <Link href={`/console/exceptions?runId=${run.id}`}>Open exceptions</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
