"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFetch } from "@/lib/safe-fetch";
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, Copy } from "lucide-react";
import Link from "next/link";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { FreezeBlockedButton } from "@/components/shared/FreezeBlockedButton";

interface ExceptionDetail {
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
  sourceSystem?: string;
  targetSystem?: string;
  runId?: string;
  fieldPath?: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  resolution?: string;
  resolvedAt?: string;
  ignoredAt?: string;
  ignoredBy?: string;
  playbookApplied?: string;
  confidenceScore?: number;
  suggestedActions?: string[];
  auditTrail: {
    timestamp: string;
    action: string;
    user: string;
    details?: string;
  }[];
}

export default function ExceptionDetailPage() {
  const params = useParams();
  const exceptionId =
    params && typeof params.exceptionId === "string" ? params.exceptionId : undefined;
  const [exception, setException] = useState<ExceptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFrozen, governanceState } = useGovernanceState();

  useEffect(() => {
    if (!exceptionId) {
      setError("Missing exception ID");
      setLoading(false);
      return;
    }

    loadExceptionDetail();

    // Poll for updates if exception is still active
    if (exception?.status === "pending" || exception?.status === "investigating") {
      const interval = setInterval(loadExceptionDetail, 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [exceptionId, exception?.status]);

  const loadExceptionDetail = async () => {
    if (!exceptionId) {
      return;
    }

    setLoading(true);
    const result = await safeFetch<{ exception?: ExceptionDetail } | ExceptionDetail>(
      `/api/exceptions/${exceptionId}`
    );

    if (result.success && result.data) {
      const payload = result.data;
      const nextException: ExceptionDetail | null =
        payload && typeof payload === "object" && "exception" in payload
          ? (payload.exception ?? null)
          : (payload as ExceptionDetail);
      setException(nextException);
      setError(null);
    } else {
      setError(result.error?.message || "Failed to load exception detail");
      setException(null);
    }
    setLoading(false);
  };

  const handleResolve = async () => {
    const result = await safeFetch(`/api/exceptions/${exceptionId}?action=resolve`, {
      method: "POST",
    });

    if (result.success) {
      await loadExceptionDetail();
    } else {
      alert(result.error?.message || "Failed to resolve exception");
    }
  };

  const handleIgnore = async () => {
    if (
      window.confirm(
        "Are you sure you want to ignore this exception? This action cannot be undone."
      )
    ) {
      const result = await safeFetch(`/api/exceptions/${exceptionId}?action=ignore`, {
        method: "POST",
      });

      if (result.success) {
        await loadExceptionDetail();
      } else {
        alert(result.error?.message || "Failed to ignore exception");
      }
    }
  };

  const handleReopen = async () => {
    const result = await safeFetch(`/api/exceptions/${exceptionId}?action=reopen`, {
      method: "POST",
    });

    if (result.success) {
      await loadExceptionDetail();
    } else {
      alert(result.error?.message || "Failed to reopen exception");
    }
  };

  const getStatusIcon = (status: ExceptionDetail["status"]) => {
    switch (status) {
      case "resolved":
        return CheckCircle2;
      case "ignored":
        return XCircle;
      case "investigating":
        return RefreshCw;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: ExceptionDetail["status"]) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "ignored":
        return "bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground";
      case "investigating":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getSeverityColor = (severity: ExceptionDetail["severity"]) => {
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

  if (loading && !exception) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && !exception) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load exception"
          message={error}
          onRetry={loadExceptionDetail}
        />
      </div>
    );
  }

  if (!exception) {
    return (
      <div className="p-6">
        <EmptyState
          title="Exception not found"
          description="The exception you're looking for doesn't exist or you don't have access"
          action={{
            label: "Go to Exceptions List",
            onClick: () => (window.location.href = "/console/exceptions"),
          }}
        />
      </div>
    );
  }

  const StatusIcon = getStatusIcon(exception.status);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Exception Detail</h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Exception ID:{" "}
            <code className="bg-muted/40 dark:bg-card px-2 py-1 rounded">{exception.id}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadExceptionDetail}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link
            href="/console/exceptions"
            className="text-sm text-muted-foreground dark:text-muted-foreground hover:underline"
          >
            ← Back to List
          </Link>
        </div>
      </div>

      {/* Status and Severity Badges */}
      <div className="flex items-center gap-4 mb-6">
        <Badge className={getStatusColor(exception.status)}>
          <StatusIcon className="w-4 h-4 mr-1" />
          {exception.status.charAt(0).toUpperCase() + exception.status.slice(1)}
        </Badge>
        <Badge className={getSeverityColor(exception.severity)}>
          {exception.severity.charAt(0).toUpperCase() + exception.severity.slice(1)}
        </Badge>
        {exception.confidenceScore !== undefined && (
          <Badge className="bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground">
            Confidence: {Math.round(exception.confidenceScore * 100)}%
          </Badge>
        )}
      </div>

      {/* Exception Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Exception Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exception.statusDetail && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-foreground dark:border-border dark:bg-background/60 dark:text-muted-foreground">
                {exception.statusDetail}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-foreground dark:text-white">Type</h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {exception.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
              {exception.reasonTags && exception.reasonTags.length > 0 && (
                <div>
                  <h3 className="font-medium text-foreground dark:text-white">Decision Drivers</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {exception.reasonTags.map((tag) => (
                      <Badge key={`${exception.id}-${tag}`} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-medium text-foreground dark:text-white">Description</h3>
                <p className="text-muted-foreground dark:text-muted-foreground">{exception.description}</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground dark:text-white">Detected</h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {new Date(exception.detectedAt).toLocaleString()}
                </p>
              </div>
              {exception.runId && (
                <div>
                  <h3 className="font-medium text-foreground dark:text-white">Run</h3>
                  <Link
                    href={`/console/runs/${exception.runId}`}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {exception.runId}
                  </Link>
                </div>
              )}
              {exception.fieldPath && (
                <div>
                  <h3 className="font-medium text-foreground dark:text-white">Field</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground font-mono">
                    {exception.fieldPath}
                  </p>
                </div>
              )}
              {exception.amount && exception.currency && (
                <div>
                  <h3 className="font-medium text-foreground dark:text-white">Amount</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground font-mono">
                    {exception.currency} {exception.amount.toLocaleString()}
                  </p>
                </div>
              )}
              {exception.sourceTransactionId && (
                <div>
                  <h3 className="font-medium text-foreground dark:text-white">Source Transaction</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground font-mono">
                    {exception.sourceTransactionId}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(exception.sourceTransactionId || "")
                      }
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3 ml-1" />
                    </Button>
                  </p>
                </div>
              )}
              {exception.targetTransactionId && (
                <div>
                  <h3 className="font-medium text-foreground dark:text-white">Target Transaction</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground font-mono">
                    {exception.targetTransactionId}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(exception.targetTransactionId || "")
                      }
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3 ml-1" />
                    </Button>
                  </p>
                </div>
              )}
              {exception.sourceSystem && (
                <div>
                  <h3 className="font-medium text-foreground dark:text-white">Source System</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">{exception.sourceSystem}</p>
                </div>
              )}
              {exception.targetSystem && (
                <div>
                  <h3 className="font-medium text-foreground dark:text-white">Target System</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">{exception.targetSystem}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {(exception.expectedValue !== undefined || exception.actualValue !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle>Observed Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-4 dark:border-border dark:bg-background/60">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
                  Expected
                </p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground dark:text-muted-foreground">
                  {JSON.stringify(exception.expectedValue ?? null, null, 2)}
                </pre>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4 dark:border-border dark:bg-background/60">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
                  Actual
                </p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground dark:text-muted-foreground">
                  {JSON.stringify(exception.actualValue ?? null, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(exception.resolution || exception.resolvedAt || exception.ignoredAt) && (
        <Card>
          <CardHeader>
            <CardTitle>Decision Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
            {exception.resolution && <p>{exception.resolution}</p>}
            {exception.resolvedAt && (
              <p>Resolved at {new Date(exception.resolvedAt).toLocaleString()}</p>
            )}
            {exception.ignoredAt && (
              <p>
                Ignored at {new Date(exception.ignoredAt).toLocaleString()}
                {exception.ignoredBy ? ` by ${exception.ignoredBy}` : ""}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {exception.suggestedActions?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground dark:text-muted-foreground">
              {exception.suggestedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Playbook Applied */}
      {exception.playbookApplied && (
        <Card>
          <CardHeader>
            <CardTitle>Applied Playbook</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground dark:text-muted-foreground">{exception.playbookApplied}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {(exception.status === "pending" || exception.status === "investigating") && (
        <div className="flex flex-wrap gap-4">
          <FreezeBlockedButton
            onClick={handleResolve}
            className="bg-green-600 hover:bg-green-700"
            isFrozen={isFrozen}
            freezeReason={governanceState?.freeze_reason}
            frozenMessage="Exception resolution blocked by tenant freeze"
          >
            <CheckCircle2 className="mr-2" />
            Mark Resolved
          </FreezeBlockedButton>
          <FreezeBlockedButton
            onClick={handleIgnore}
            className="bg-slate-600 hover:bg-muted"
            isFrozen={isFrozen}
            freezeReason={governanceState?.freeze_reason}
            frozenMessage="Ignoring exceptions is blocked by tenant freeze"
          >
            <XCircle className="mr-2" />
            Ignore Exception
          </FreezeBlockedButton>
        </div>
      )}

      {(exception.status === "resolved" || exception.status === "ignored") && (
        <div className="flex flex-wrap gap-4">
          <FreezeBlockedButton
            onClick={handleReopen}
            className="bg-yellow-600 hover:bg-yellow-700"
            isFrozen={isFrozen}
            freezeReason={governanceState?.freeze_reason}
            frozenMessage="Reopening exceptions is blocked by tenant freeze"
          >
            <AlertCircle className="mr-2" />
            Reopen Exception
          </FreezeBlockedButton>
        </div>
      )}

      {/* Audit Trail */}
      {exception.auditTrail.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exception.auditTrail.map((entry, index) => (
                <div key={index} className="border-l-2 border-border dark:border-border pl-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-xs text-muted-foreground dark:text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-foreground dark:text-white">
                          {entry.action}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          by {entry.user}
                        </span>
                      </div>
                      {entry.details && (
                        <p className="text-muted-foreground dark:text-muted-foreground mt-1">{entry.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
