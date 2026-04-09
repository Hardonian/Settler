"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, TimerReset, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { shouldPollRuns } from "@/lib/console/polling";
import { safeFetch } from "@/lib/safe-fetch";

type RunKindFilter = "all" | "recon_job" | "ingestion_run";

interface RunFilters {
  status?: string;
  search?: string;
  runKind?: RunKindFilter;
}

interface RunListItem {
  runKind: "recon_job" | "ingestion_run";
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "unknown";
  statusLabel?: string;
  startedAt: string;
  completedAt: string | null;
  progress: number;
  progressState?: "not_started" | "in_progress" | "completed" | "failed" | "unknown";
  isTerminal: boolean;
  ingestionId?: string | null;
  sourceAdapter?: string | null;
  targetAdapter?: string | null;
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
  compactProofSummary?: {
    proofPackages: {
      total: number;
      finalized: number;
      bestCompletenessScore: number | null;
      missingEvidenceCount: number;
      latestCreatedAt: string | null;
      state: "ready" | "degraded" | "setup_required" | "unavailable";
    };
    recurrence: {
      exceptionsWithMemories: number;
      repeatedResolutionReasons: string[];
      state: "ready" | "degraded" | "setup_required" | "unavailable";
      topRecurringFamilies: Array<{
        family: string;
        trend: "strengthening" | "weakening" | "stable" | "unavailable";
        certainty: "high" | "medium" | "low";
        score: number;
      }>;
    };
    delta: {
      state: "available" | "unavailable" | "not_comparable" | "degraded";
      changedSincePreviousRun: "changed" | "unchanged" | "unavailable";
      summary: string;
      reasonCodes: string[];
      history: {
        pattern:
          | "worsening_pattern"
          | "recovering_pattern"
          | "stable_pattern"
          | "thin_history"
          | "unavailable";
        trend: "improving" | "regressing" | "stable" | "volatile" | "unavailable";
        certainty: "high" | "medium" | "low";
      };
    };
    operatorSummary: {
      signal: "strong" | "weak" | "degraded" | "unavailable" | "not_comparable";
      pattern:
        | "worsening_pattern"
        | "recovering_pattern"
        | "stable_pattern"
        | "thin_history"
        | "unavailable";
      proofPosture: "stronger" | "weaker" | "unchanged" | "unavailable";
      explainerCodes: string[];
      recurringFamilies: Array<{
        family: string;
        trend: "strengthening" | "weakening" | "stable" | "unavailable";
        certainty: "high" | "medium" | "low";
        reasonCodes: string[];
      }>;
    };
  };
}

interface RunsListApiResponse {
  items: RunListItem[];
  next_cursor: string | null;
  pagination?: {
    limit?: number;
    returned?: number;
    has_more?: boolean;
    filter_scan_pages?: number;
    filter_truncation_possible?: boolean;
  };
  response_meta?: {
    pagination_mode?: string;
    requested_run_kind?: RunKindFilter;
    filters_applied?: { status: string | null; search: string | null };
  };
}

const POLL_INTERVAL_MS = 15_000;

/** Map run status to StatusBadge status type */
function toStatusType(status: RunListItem["status"]): StatusType {
  switch (status) {
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "running":
      return "running";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}

/** Map summary state to StatusBadge status type */
function summaryToStatusType(state: RunListItem["summaryState"]): StatusType {
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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listMeta, setListMeta] = useState<RunsListApiResponse["response_meta"] | null>(null);
  const [pagePagination, setPagePagination] = useState<RunsListApiResponse["pagination"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RunFilters>({ runKind: "all" });
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
    const runKind = filters.runKind ?? "all";
    queryParams.set("run_kind", runKind);
    queryParams.set("limit", "50");

    const query = queryParams.toString();
    const result = await safeFetch<RunsListApiResponse>(`/api/runs?${query}`);

    if (result.success && result.data) {
      setRuns(result.data.items ?? []);
      setNextCursor(result.data.next_cursor ?? null);
      setListMeta(result.data.response_meta ?? null);
      setPagePagination(result.data.pagination ?? null);
      setError(null);
    } else {
      setRuns([]);
      setNextCursor(null);
      setListMeta(null);
      setPagePagination(null);
      setError(result.error?.message || "Failed to load runs");
    }

    setLoading(false);
  }, [filters.search, filters.status, filters.runKind]);

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

  const loadMore = useCallback(async () => {
    if (!nextCursor || filters.status || filters.search) {
      return;
    }
    setLoadingMore(true);
    const queryParams = new URLSearchParams();
    const runKind = filters.runKind ?? "all";
    queryParams.set("run_kind", runKind);
    queryParams.set("limit", "50");
    queryParams.set("cursor", nextCursor);
    const result = await safeFetch<RunsListApiResponse>(`/api/runs?${queryParams.toString()}`);
    if (result.success && result.data) {
      setRuns((prev) => [...prev, ...(result.data!.items ?? [])]);
      setNextCursor(result.data.next_cursor ?? null);
    }
    setLoadingMore(false);
  }, [filters.runKind, filters.search, filters.status, nextCursor]);

  const showFreezeBanner = isFrozen && governanceState;

  if (loading && runs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton animation="wave" className="h-8 w-48" />
          <Skeleton animation="wave" className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border/70 shadow-sm">
              <CardHeader className="pb-1 pt-5 px-5">
                <Skeleton animation="wave" className="h-3 w-20" />
                <Skeleton animation="wave" className="mt-1 h-8 w-24" />
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <Skeleton animation="wave" className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} animation="wave" className="h-36 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
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

      <ConsolePageHeader
        title="Runs"
        description="Merged reconciliation activity: scheduled recon jobs and ingestion-triggered reconciliation runs share one list. Use the run kind filter to narrow the stream."
        breadcrumbs={[{ label: "Console", href: "/console" }, { label: "Runs" }]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                id="auto-refresh-checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="rounded border-border accent-primary"
              />
              Auto-refresh
            </label>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={pollingEnabled ? "info" : "outline"}>
          {pollingEnabled ? `Polling every ${POLL_INTERVAL_MS / 1000}s` : "Polling paused"}
        </Badge>
        <Badge variant={totals.activeRuns > 0 ? "processing" : "outline"}>
          {totals.activeRuns > 0
            ? `${totals.activeRuns} run${totals.activeRuns === 1 ? "" : "s"} active`
            : "All runs terminal"}
        </Badge>
      </div>

      {runs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visible runs"
            value={formatCount(totals.totalRuns)}
            description="Rows on this page after filters (merged recon jobs + ingestion runs)."
          />
          <StatCard
            label="Matched rows"
            value={formatCount(totals.matched)}
            tone="success"
            description="Reconciled under exact or tolerance logic."
          />
          <StatCard
            label="Review required"
            value={formatCount(totals.reviewRequired)}
            tone="warning"
            description="Unresolved outcomes awaiting operator action."
            href="/console/exceptions"
            linkLabel="Open exceptions"
          />
          <StatCard
            label="Exceptioned rows"
            value={formatCount(totals.exceptions)}
            tone="danger"
            description="Rows promoted into the exception workflow."
            href="/console/exceptions"
            linkLabel="View exceptions"
          />
        </div>
      ) : null}

      <Card>
        <CardContent className="py-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,160px)_200px_minmax(0,1fr)_auto]">
            <div className="space-y-1.5">
              <label
                htmlFor="run-kind-filter"
                className="block text-xs font-medium text-muted-foreground"
              >
                Run kind
              </label>
              <select
                id="run-kind-filter"
                value={filters.runKind ?? "all"}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    runKind: (event.target.value as RunKindFilter) || "all",
                  }))
                }
                className="input-field"
              >
                <option value="all">All kinds</option>
                <option value="recon_job">Recon job</option>
                <option value="ingestion_run">Ingestion run</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="status-filter"
                className="block text-xs font-medium text-muted-foreground"
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
                className="input-field"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="search-filter"
                className="block text-xs font-medium text-muted-foreground"
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
                  className="input-field pl-9"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ runKind: "all" })}
                disabled={
                  !filters.search &&
                  !filters.status &&
                  (!filters.runKind || filters.runKind === "all")
                }
              >
                <TimerReset className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {runs.length === 0 ? (
        <EmptyState
          icon={Scale}
          title={
            filters.status || filters.search || (filters.runKind && filters.runKind !== "all")
              ? "No runs match your filters"
              : "No reconciliation runs yet"
          }
          description={
            filters.status || filters.search || (filters.runKind && filters.runKind !== "all")
              ? "Try widening filters: clear run kind, lifecycle status, or search to see the full merged tenant history."
              : "Reconciliation runs appear here from recon jobs and from ingestion-triggered reconciliation. Each row shows execution state and summary counts for that run kind."
          }
          hint={
            filters.status || filters.search || (filters.runKind && filters.runKind !== "all")
              ? undefined
              : "Next: connect Stripe (or another source) under Integrations, then trigger a recon job — or explore the Playground with sample data."
          }
          action={
            filters.status || filters.search || (filters.runKind && filters.runKind !== "all")
              ? { label: "Clear Filters", onClick: () => setFilters({ runKind: "all" }) }
              : { label: "Connect integrations", href: "/dashboard/integrations" }
          }
          secondaryAction={
            filters.status || filters.search || (filters.runKind && filters.runKind !== "all")
              ? undefined
              : { label: "Try demo console", href: "/demo/console", variant: "outline" }
          }
        />
      ) : (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="sticky top-0 z-10 border-b border-border/40 bg-card/95 py-4 backdrop-blur-sm">
            <CardTitle>Run history</CardTitle>
            <CardDescription>
              Merged list: recon jobs and ingestion reconciliation runs. Detail pages differ by run
              kind where the data model does not yet offer parity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {listMeta?.pagination_mode === "filter_scan_first_page" &&
            listMeta.filters_applied &&
            (listMeta.filters_applied.status || listMeta.filters_applied.search) ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-border px-3 py-2">
                Status and search use a bounded scan of merged pages;{" "}
                {pagePagination?.filter_truncation_possible
                  ? "results may be incomplete if more matches exist beyond the scan limit—narrow filters or use run kind + pagination without status/search."
                  : "pagination cursor is disabled until those filters are cleared."}
              </p>
            ) : null}
            {runs.map((run) => (
              <div
                key={run.id}
                className="rounded-xl border border-border/80 bg-card/50 p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-card/80 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    {/* Row 1: Name + status badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        className="truncate text-base font-semibold text-foreground"
                        title={run.name}
                      >
                        {run.name}
                      </h2>
                      <Badge variant="outline" className="text-xs font-normal">
                        {run.runKind === "ingestion_run" ? "Ingestion run" : "Recon job"}
                      </Badge>
                      <StatusBadge
                        status={toStatusType(run.status)}
                        label={run.statusLabel || undefined}
                      />
                      {run.configDrift?.status === "detected" && (
                        <StatusBadge status="warning" label="Config drift" size="sm" />
                      )}
                    </div>

                    {/* Row 2: Metadata grid */}
                    <div className="grid gap-x-6 gap-y-1 text-sm md:grid-cols-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Run ID</span>
                        <div className="truncate font-mono text-xs text-foreground" title={run.id}>
                          {run.id}
                        </div>
                      </div>
                      {run.ingestionId ? (
                        <div>
                          <span className="text-xs text-muted-foreground">Ingestion</span>
                          <div
                            className="truncate font-mono text-xs text-foreground"
                            title={run.ingestionId}
                          >
                            {run.ingestionId}
                          </div>
                        </div>
                      ) : null}
                      {(run.sourceAdapter || run.targetAdapter) && (
                        <div className="md:col-span-2">
                          <span className="text-xs text-muted-foreground">Adapters</span>
                          <div className="text-sm text-foreground">
                            {[run.sourceAdapter, run.targetAdapter].filter(Boolean).join(" → ") ||
                              "—"}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-muted-foreground">Started</span>
                        <div className="text-foreground">
                          {new Date(run.startedAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Completed</span>
                        <div className="text-foreground">
                          {run.completedAt
                            ? new Date(run.completedAt).toLocaleString()
                            : "Still running"}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Duration</span>
                        <div className="font-mono text-foreground">
                          {formatDuration(run.startedAt, run.completedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Metric chips */}
                    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                      <div className="metric-chip">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Matched
                        </div>
                        <div className="mt-0.5 text-lg font-semibold text-success tabular-nums">
                          {formatCount(run.summary.matched)}
                        </div>
                      </div>
                      <div className="metric-chip">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Unmatched
                        </div>
                        <div className="mt-0.5 text-lg font-semibold text-warning tabular-nums">
                          {formatCount(run.summary.unmatched)}
                        </div>
                      </div>
                      <div className="metric-chip">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Conflicts
                        </div>
                        <div className="mt-0.5 text-lg font-semibold text-error tabular-nums">
                          {formatCount(run.summary.conflicts)}
                        </div>
                      </div>
                      <div className="metric-chip">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Exceptions
                        </div>
                        <div className="mt-0.5 text-lg font-semibold tabular-nums">
                          {formatCount(run.summarySemantics.exceptioned)}
                        </div>
                      </div>
                      <div className="metric-chip">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Review
                        </div>
                        <div className="mt-0.5 text-lg font-semibold tabular-nums">
                          {formatCount(run.summarySemantics.unresolved)}
                        </div>
                      </div>
                      <div className="metric-chip">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          In-tolerance
                        </div>
                        <div className="mt-0.5 text-lg font-semibold tabular-nums">
                          {formatCount(run.summarySemantics.matchedWithTolerance)}
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Summary state + record counts */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <StatusBadge
                        status={summaryToStatusType(run.summaryState)}
                        label={run.summaryState
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                        size="sm"
                      />
                      <span className="text-muted-foreground">
                        {formatCount(run.summarySemantics.processed)} /{" "}
                        {formatCount(run.summary.total)} records
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Source {formatCount(run.summary.sourceCount)} &middot; Target{" "}
                        {formatCount(run.summary.targetCount)}
                      </span>
                      {run.compactProofSummary ? (
                        <>
                          <Badge variant="outline" size="sm">
                            Proof {run.compactProofSummary.proofPackages.finalized}/
                            {run.compactProofSummary.proofPackages.total}
                          </Badge>
                          <Badge
                            variant={
                              run.compactProofSummary.delta.changedSincePreviousRun === "changed"
                                ? "warning"
                                : "outline"
                            }
                            size="sm"
                          >
                            {run.compactProofSummary.delta.changedSincePreviousRun === "changed"
                              ? "Changed since prior run"
                              : run.compactProofSummary.delta.changedSincePreviousRun ===
                                  "unchanged"
                                ? "No prior-run change"
                                : "Delta unavailable"}
                          </Badge>
                          <Badge
                            variant={
                              run.compactProofSummary.operatorSummary.signal === "degraded"
                                ? "destructive"
                                : run.compactProofSummary.operatorSummary.signal === "strong"
                                  ? "success"
                                  : "outline"
                            }
                            size="sm"
                          >
                            Signal {run.compactProofSummary.operatorSummary.signal}
                          </Badge>
                          {run.compactProofSummary.operatorSummary.pattern !== "unavailable" ? (
                            <Badge
                              variant={
                                run.compactProofSummary.operatorSummary.pattern ===
                                "worsening_pattern"
                                  ? "destructive"
                                  : run.compactProofSummary.operatorSummary.pattern ===
                                      "recovering_pattern"
                                    ? "success"
                                    : "outline"
                              }
                              size="sm"
                            >
                              Pattern {run.compactProofSummary.operatorSummary.pattern}
                            </Badge>
                          ) : null}
                          <Badge
                            variant={
                              run.compactProofSummary.operatorSummary.proofPosture === "weaker"
                                ? "destructive"
                                : run.compactProofSummary.operatorSummary.proofPosture ===
                                    "stronger"
                                  ? "success"
                                  : "outline"
                            }
                            size="sm"
                          >
                            Proof posture {run.compactProofSummary.operatorSummary.proofPosture}
                          </Badge>
                          {run.compactProofSummary.recurrence.exceptionsWithMemories > 0 ? (
                            <Badge variant="info" size="sm">
                              {run.compactProofSummary.recurrence.exceptionsWithMemories} recurring
                              families
                            </Badge>
                          ) : null}
                          {run.compactProofSummary.operatorSummary.recurringFamilies[0] ? (
                            <Badge variant="outline" size="sm">
                              Priority family{" "}
                              {run.compactProofSummary.operatorSummary.recurringFamilies[0].family}
                            </Badge>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 xl:w-48 xl:flex-col xl:gap-2">
                    <Button asChild size="sm">
                      <Link href={`/console/runs/${run.id}`}>Open detail</Link>
                    </Button>
                    {run.runKind === "recon_job" ? (
                      <>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/console/reconciliations?runId=${run.id}`}>
                            Reconciliation
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/console/exceptions?runId=${run.id}`}>Exceptions</Link>
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground xl:px-1">
                        Results and exceptions UIs are recon-job keyed today; open detail for
                        ingestion run truth.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!filters.status && !filters.search && nextCursor ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
