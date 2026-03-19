"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFetch } from "@/lib/safe-fetch";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface RunSummary {
  total: number;
  sourceCount: number;
  targetCount: number;
  matched: number;
  unmatched: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflicts: number;
}

interface Run {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "unknown";
  statusLabel?: string;
  startedAt: string;
  completedAt: string | null;
  summary?: RunSummary;
  summaryState?: "success" | "review_needed" | "in_progress" | "failed" | "empty" | "unknown";
  progress?: number;
  progressState?: "not_started" | "in_progress" | "completed" | "failed" | "unknown";
  isTerminal?: boolean;
}

interface RunFilters {
  status?: string;
  search?: string;
}

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RunFilters>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { isFrozen, governanceState } = useGovernanceState();

  useEffect(() => {
    loadRuns();

    if (autoRefresh) {
      const interval = setInterval(loadRuns, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, filters]);

  const loadRuns = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value as string);
      }
    });

    const result = await safeFetch<Run[]>(`/api/runs?${queryParams.toString()}`);

    if (result.success && result.data) {
      setRuns(result.data);
      setError(null);
    } else {
      setError(result.error?.message || "Failed to load runs");
      setRuns([]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    await loadRuns();
  };

  const getStatusIcon = (status: Run["status"]) => {
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
  };

  const getStatusColor = (status: Run["status"]) => {
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
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const durationMs = end - start;

    if (durationMs < 1000) return "< 1s";
    if (durationMs < 60000) return `${Math.floor(durationMs / 1000)}s`;
    if (durationMs < 3600000)
      return `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;
    return `${Math.floor(durationMs / 3600000)}h ${Math.floor((durationMs % 3600000) / 60000)}m`;
  };

  if (loading && runs.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && runs.length === 0) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load runs" message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  if (runs.length === 0 && !filters.status && !filters.search) {
    return (
      <div className="p-6 space-y-6">
        {/* Governance Freeze Banner */}
        {isFrozen && governanceState && (
          <FreezeErrorAlert
            reason={governanceState.freeze_reason}
            scope={governanceState.frozen_by || "tenant"}
            frozenAt={governanceState.frozen_at || undefined}
            recoveryAction={{
              label: "View Governance Settings",
              href: "/console/settings?tab=governance",
            }}
          />
        )}
        <EmptyState
          title="No reconciliation runs yet"
          description="Reconciliation runs will appear here once jobs are executed. Create a job and run it to see execution history."
          action={{
            label: "Open Reconciliations",
            onClick: () => {
              window.location.href = "/console/reconciliations";
            },
          }}
        />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Governance Freeze Banner */}
        {isFrozen && governanceState && (
          <FreezeErrorAlert
            reason={governanceState.freeze_reason}
            scope={governanceState.frozen_by || "tenant"}
            frozenAt={governanceState.frozen_at || undefined}
            recoveryAction={{
              label: "View Governance Settings",
              href: "/console/settings?tab=governance",
            }}
          />
        )}
        <EmptyState
          title="No runs match your filters"
          description="Try adjusting your search criteria or clearing filters to see all runs"
          action={{
            label: "Clear Filters",
            onClick: () => {
              setFilters({});
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Governance Freeze Banner */}
      {isFrozen && governanceState && (
        <FreezeErrorAlert
          reason={governanceState.freeze_reason}
          scope={governanceState.frozen_by || "tenant"}
          frozenAt={governanceState.frozen_at || undefined}
          recoveryAction={{
            label: "View Governance Settings",
            href: "/console/settings?tab=governance",
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Runs</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Execution history for tenant-scoped reconciliations and their review outcomes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              id="auto-refresh-checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="search-filter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Search
              </label>
              <input
                id="search-filter"
                type="text"
                placeholder="Search runs..."
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Runs List</CardTitle>
          <CardDescription>{runs.length} runs found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Run ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Start Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    End Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Source / Target
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Needs Review
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const StatusIcon = getStatusIcon(run.status);
                  return (
                    <tr
                      key={run.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-3 px-4">
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {run.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                        {run.name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(run.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {run.statusLabel || run.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {run.completedAt ? new Date(run.completedAt).toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {run.startedAt ? formatDuration(run.startedAt, run.completedAt) : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {run.summary
                          ? `${run.summary.sourceCount.toLocaleString()} / ${run.summary.targetCount.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {run.summary && run.summary.unmatched + run.summary.conflicts > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {(run.summary.unmatched + run.summary.conflicts).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400">
                            {run.summary
                              ? (run.summary.unmatched + run.summary.conflicts).toLocaleString()
                              : "-"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/console/runs/${run.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
