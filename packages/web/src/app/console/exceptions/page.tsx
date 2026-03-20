"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { shouldPollExceptions } from "@/lib/console/polling";
import { safeFetch } from "@/lib/safe-fetch";
import { RefreshCw, AlertTriangle, Search } from "lucide-react";
import Link from "next/link";

interface Exception {
  id: string;
  type: string;
  status: "pending" | "investigating" | "resolved" | "ignored";
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: string;
  description: string;
  statusDetail?: string;
  reasonTags?: string[];
  amount?: number;
  currency?: string;
  sourceTransactionId?: string;
  targetTransactionId?: string;
  runId?: string;
  fieldPath?: string;
}

interface ExceptionFilters {
  status?: string;
  severity?: string;
  type?: string;
  search?: string;
}

const POLL_INTERVAL_MS = 15_000;

function exceptionStatusToStatusType(status: Exception["status"]): StatusType {
  switch (status) {
    case "resolved":
      return "completed";
    case "ignored":
      return "disabled";
    case "investigating":
      return "in_progress";
    default:
      return "pending";
  }
}

function severityToBadgeVariant(
  severity: Exception["severity"]
): "destructive" | "warning" | "outline" | "success" {
  switch (severity) {
    case "critical":
      return "destructive";
    case "high":
      return "warning";
    case "medium":
      return "outline";
    default:
      return "success";
  }
}

export default function ExceptionsPage() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("runId");
  const typeFilter = searchParams.get("type");

  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExceptionFilters>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Initialize filters from URL params
    if (typeFilter && !filters.type) {
      setFilters((prev) => ({ ...prev, type: typeFilter }));
    }
  }, [filters.type, typeFilter]);

  const pollingEnabled = shouldPollExceptions({
    autoRefresh,
    exceptions,
    loadingInitialState: loading && exceptions.length === 0,
    statusFilter: filters.status,
    runScoped: Boolean(runId),
  });

  const loadExceptions = useCallback(async () => {
    setLoading(true);
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value as string);
      }
    });

    if (runId) {
      queryParams.set("runId", runId);
    }

    const endpoint = `/api/exceptions?${queryParams.toString()}`;
    const result = await safeFetch<{
      items?: Exception[];
      data?: Exception[];
      exceptions?: Exception[];
      pagination?: unknown;
    }>(endpoint);

    if (result.success && result.data) {
      const items = result.data.items ?? result.data.data ?? result.data.exceptions ?? [];
      setExceptions(items);
      setError(null);
    } else {
      setError(result.error?.message || "Failed to load exceptions");
      setExceptions([]);
    }
    setLoading(false);
  }, [filters, runId]);

  useEffect(() => {
    void loadExceptions();
  }, [loadExceptions]);

  useEffect(() => {
    if (!pollingEnabled) {
      return undefined;
    }

    const interval = setInterval(() => {
      void loadExceptions();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadExceptions, pollingEnabled]);

  const handleRefresh = async () => {
    await loadExceptions();
  };

  if (loading && exceptions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card>
          <CardContent className="py-5">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && exceptions.length === 0) {
    return <ErrorState title="Failed to load exceptions" message={error} onRetry={handleRefresh} />;
  }

  if (exceptions.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Exceptions"
          description="Operator decision queue for unresolved reconciliation outcomes."
          breadcrumbs={[
            { label: "Console", href: "/console" },
            { label: "Exceptions" },
          ]}
        />
        <EmptyState
          icon={AlertTriangle}
          title="No exceptions found"
          description={
            runId
              ? "No exceptions were recorded for this run under the current filters."
              : "There are no exceptions matching your current filters."
          }
          hint="Exceptions are created when reconciliation runs detect mismatches, timing differences, or missing transactions."
          action={
            filters.status || filters.severity || filters.type || filters.search
              ? { label: "Clear Filters", onClick: () => setFilters({}) }
              : { label: "View Runs", href: "/console/runs" }
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Exceptions"
        description={
          runId
            ? "Exceptions recorded for this run, with status, severity, and rationale tags."
            : "Operator decision queue for unresolved reconciliation outcomes."
        }
        breadcrumbs={[
          { label: "Console", href: "/console" },
          ...(runId
            ? [
                { label: "Runs", href: "/console/runs" },
                { label: `Run ${runId.slice(0, 8)}...`, href: `/console/runs/${runId}` },
              ]
            : []),
          { label: "Exceptions" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                id="auto-refresh-toggle"
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              Auto-refresh
            </label>
            <Badge variant={pollingEnabled ? "info" : "outline"}>
              {pollingEnabled ? `Polling ${POLL_INTERVAL_MS / 1000}s` : "Paused"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="py-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="status-filter" className="block text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value || undefined }))
                }
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="ignored">Ignored</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="severity-filter" className="block text-xs font-medium text-muted-foreground">
                Severity
              </label>
              <select
                id="severity-filter"
                value={filters.severity || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, severity: e.target.value || undefined }))
                }
                className="input-field"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="type-filter" className="block text-xs font-medium text-muted-foreground">
                Type
              </label>
              <select
                id="type-filter"
                value={filters.type || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value || undefined }))
                }
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="amount_mismatch">Amount Mismatch</option>
                <option value="timing_difference">Timing Difference</option>
                <option value="missing_transaction">Missing Transaction</option>
                <option value="duplicate_transaction">Duplicate Transaction</option>
                <option value="currency_mismatch">Currency Mismatch</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="search-filter" className="block text-xs font-medium text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="search-filter"
                  type="text"
                  placeholder="Search exceptions..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value || undefined }))
                  }
                  className="input-field pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exceptions List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exception Queue</CardTitle>
              <CardDescription>{exceptions.length} exception{exceptions.length !== 1 ? "s" : ""} found</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exceptions.map((exception) => (
              <div
                key={exception.id}
                className="rounded-xl border border-border overflow-hidden hover:border-border/80 transition-colors"
              >
                <div className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">
                        {exception.type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </h3>
                      <StatusBadge
                        status={exceptionStatusToStatusType(exception.status)}
                        label={exception.status.charAt(0).toUpperCase() + exception.status.slice(1)}
                        size="sm"
                      />
                      <Badge variant={severityToBadgeVariant(exception.severity)} size="sm">
                        {exception.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {exception.description}
                    </p>
                    {exception.statusDetail && (
                      <p className="text-xs text-muted-foreground/70">{exception.statusDetail}</p>
                    )}
                    {exception.reasonTags && exception.reasonTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {exception.reasonTags.map((tag) => (
                          <Badge key={`${exception.id}-${tag}`} variant="outline" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/console/exceptions/${exception.id}`}>View details</Link>
                    </Button>
                  </div>
                </div>
                <div className="px-5 py-2.5 border-t border-border/60 bg-card/50">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Detected {new Date(exception.detectedAt).toLocaleString()}</span>
                    {exception.amount != null && exception.currency && (
                      <span className="font-mono">
                        {exception.currency} {exception.amount.toLocaleString()}
                      </span>
                    )}
                    {exception.sourceTransactionId && (
                      <span>
                        Source: <code className="text-[11px]">{exception.sourceTransactionId.slice(0, 8)}...</code>
                      </span>
                    )}
                    {exception.targetTransactionId && (
                      <span>
                        Target: <code className="text-[11px]">{exception.targetTransactionId.slice(0, 8)}...</code>
                      </span>
                    )}
                    {exception.fieldPath && <span>Field: {exception.fieldPath}</span>}
                    {exception.runId && (
                      <Link
                        href={`/console/runs/${exception.runId}`}
                        className="hover:text-foreground transition-colors"
                      >
                        Run: <code className="text-[11px]">{exception.runId.slice(0, 8)}...</code>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
