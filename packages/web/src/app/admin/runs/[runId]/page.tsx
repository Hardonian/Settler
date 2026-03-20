/**
 * Admin Run Detail Page
 *
 * Detailed view of a reconciliation run with drilldown.
 */

"use client";

import { useAdminRuns } from "@/lib/admin/hooks/use-admin-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminRunDetailPage({ params }: { params: { runId: string } }) {
  const { runId } = params;

  const { data: runsData } = useAdminRuns({ limit: 1000 });
  const run = runsData?.items?.find((r: { id: string }) => r.id === runId);

  if (!run) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground dark:text-muted-foreground">Run not found</p>
          <Link href="/admin/runs">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Runs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "running":
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-muted/40 text-foreground dark:bg-background/30 dark:text-muted-foreground";
    }
  };

  const matchedPercent =
    run.sourceCount + run.targetCount > 0
      ? ((run.matchedCount || 0) / (run.sourceCount + run.targetCount)) * 100
      : 0;

  const duration =
    run.completedAt && run.startedAt
      ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
      : null;

  return (
    <div className="p-8 space-y-6 bg-muted/20 dark:bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/runs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">
              {run.name || `Run ${run.id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Reconciliation run details and drilldown
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(run.status)}
          <Badge className={getStatusColor(run.status)}>{run.status}</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
              Matched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {run.matchedCount} ({matchedPercent.toFixed(1)}%)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
              Unmatched Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {run.unmatchedSourceCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
              Unmatched Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {run.unmatchedTargetCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {run.confidenceAvg ? (Number(run.confidenceAvg) * 100).toFixed(1) + "%" : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Run Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground dark:text-muted-foreground">Run ID:</span>
              <span className="ml-2 font-mono text-xs text-foreground dark:text-white">
                {run.id}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground dark:text-muted-foreground">Tenant ID:</span>
              <span className="ml-2 font-mono text-xs text-foreground dark:text-white">
                {run.tenantId.slice(0, 8)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground dark:text-muted-foreground">Started:</span>
              <span className="ml-2 text-foreground dark:text-white">
                {new Date(run.startedAt).toLocaleString()}
              </span>
            </div>
            {run.completedAt && (
              <div>
                <span className="text-muted-foreground dark:text-muted-foreground">Completed:</span>
                <span className="ml-2 text-foreground dark:text-white">
                  {new Date(run.completedAt).toLocaleString()}
                </span>
              </div>
            )}
            {duration && (
              <div>
                <span className="text-muted-foreground dark:text-muted-foreground">Duration:</span>
                <span className="ml-2 text-foreground dark:text-white">
                  {formatDuration(duration)}
                </span>
              </div>
            )}
            {run.traceId && (
              <div>
                <span className="text-muted-foreground dark:text-muted-foreground">Trace ID:</span>
                <span className="ml-2 font-mono text-xs text-foreground dark:text-white">
                  {run.traceId}
                </span>
              </div>
            )}
          </div>
          {run.errorMessage && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                Error Message
              </div>
              <div className="text-sm text-red-800 dark:text-red-400">{run.errorMessage}</div>
            </div>
          )}
          {run.metadata && Object.keys(run.metadata).length > 0 && (
            <details className="mt-4">
              <summary className="text-sm text-muted-foreground dark:text-muted-foreground cursor-pointer mb-2">
                View Metadata
              </summary>
              <pre className="text-xs bg-muted/40 dark:bg-card p-3 rounded overflow-auto">
                {JSON.stringify(run.metadata, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline">View Matches</Button>
        <Button variant="outline">Export Report</Button>
        <Link href={`/admin/runs/compare?run1=${runId}&run2=${runsData?.items?.[1]?.id || ""}`}>
          <Button variant="outline">Compare with Previous Run</Button>
        </Link>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
