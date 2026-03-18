"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFetch } from "@/lib/safe-fetch";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

interface Exception {
  id: string;
  type: string;
  status: "pending" | "investigating" | "resolved" | "ignored";
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: Date;
  description: string;
  amount?: number;
  currency?: string;
  sourceTransactionId?: string;
  targetTransactionId?: string;
}

interface ExceptionFilters {
  status?: string;
  severity?: string;
  type?: string;
  search?: string;
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExceptionFilters>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadExceptions();

    if (autoRefresh) {
      const interval = setInterval(loadExceptions, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const loadExceptions = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value as string);
      }
    });

    const result = await safeFetch<Exception[]>(`/api/exceptions?${queryParams.toString()}`);

    if (result.success && result.data) {
      setExceptions(result.data);
      setError(null);
    } else {
      setError(result.error?.message || "Failed to load exceptions");
      setExceptions([]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    await loadExceptions();
  };

  const getStatusColor = (status: Exception["status"]) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "ignored":
        return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
      case "investigating":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getSeverityColor = (severity: Exception["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    }
  };

  if (loading && exceptions.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && exceptions.length === 0) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load exceptions" message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  if (exceptions.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No exceptions found"
          description="There are currently no exceptions matching your filters"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Exceptions</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitoring and managing reconciliation discrepancies
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              id="auto-refresh-toggle"
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="auto-refresh-toggle" className="cursor-pointer">
              Auto-refresh
            </label>
          </div>
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
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="ignored">Ignored</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="severity-filter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Severity
              </label>
              <select
                id="severity-filter"
                value={filters.severity || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, severity: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="type-filter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Type
              </label>
              <select
                id="type-filter"
                value={filters.type || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="amount_mismatch">Amount Mismatch</option>
                <option value="timing_difference">Timing Difference</option>
                <option value="missing_transaction">Missing Transaction</option>
                <option value="duplicate_transaction">Duplicate Transaction</option>
                <option value="currency_mismatch">Currency Mismatch</option>
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
                placeholder="Search exceptions..."
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

      {/* Exceptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Exceptions List</CardTitle>
          <CardDescription>{exceptions.length} exceptions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exceptions.map((exception) => (
              <div
                key={exception.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(
                            exception.severity
                          )}`}
                        >
                          {exception.severity.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 dark:text-white truncate">
                          {exception.type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {exception.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge className={getStatusColor(exception.status)}>
                      {exception.status.charAt(0).toUpperCase() + exception.status.slice(1)}
                    </Badge>
                    <Link
                      href={`/console/exceptions/${exception.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>Detected: {new Date(exception.detectedAt).toLocaleString()}</span>
                    {exception.amount && exception.currency && (
                      <span>
                        {exception.currency} {exception.amount.toLocaleString()}
                      </span>
                    )}
                    {exception.sourceTransactionId && (
                      <span>Source: {exception.sourceTransactionId.slice(0, 8)}...</span>
                    )}
                    {exception.targetTransactionId && (
                      <span>Target: {exception.targetTransactionId.slice(0, 8)}...</span>
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
