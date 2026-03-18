"use client";

import { useState, useEffect } from "react";
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
  detectedAt: Date;
  description: string;
  amount?: number;
  currency?: string;
  sourceTransactionId?: string;
  targetTransactionId?: string;
  sourceSystem?: string;
  targetSystem?: string;
  rootCause?: string;
  resolution?: string;
  resolvedAt?: Date;
  ignoredAt?: Date;
  ignoredBy?: string;
  playbookApplied?: string;
  confidenceScore?: number;
  suggestedActions?: string[];
  auditTrail: {
    timestamp: Date;
    action: string;
    user: string;
    details?: string;
  }[];
}

export default function ExceptionDetailPage() {
  const [exception, setException] = useState<ExceptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFrozen, governanceState } = useGovernanceState();

  // In a real app, we'd get the exceptionId from useParams()
  // For now, we'll simulate it or leave it as a placeholder
  const exceptionId = "EXC-12345"; // This would come from useParams()

  useEffect(() => {
    loadExceptionDetail();

    // Poll for updates if exception is still active
    if (exception?.status === "pending" || exception?.status === "investigating") {
      const interval = setInterval(loadExceptionDetail, 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [exceptionId, exception?.status]);

  const loadExceptionDetail = async () => {
    setLoading(true);
    const result = await safeFetch<ExceptionDetail>(`/api/exceptions/${exceptionId}`);

    if (result.success && result.data) {
      setException(result.data);
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
        return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Exception Detail</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Exception ID:{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{exception.id}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadExceptionDetail}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link
            href="/console/exceptions"
            className="text-sm text-slate-600 dark:text-slate-400 hover:underline"
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
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Type</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {exception.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Description</h3>
                <p className="text-slate-600 dark:text-slate-400">{exception.description}</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Detected</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(exception.detectedAt).toLocaleString()}
                </p>
              </div>
              {exception.amount && exception.currency && (
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Amount</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-mono">
                    {exception.currency} {exception.amount.toLocaleString()}
                  </p>
                </div>
              )}
              {exception.sourceTransactionId && (
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Source Transaction</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-mono">
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
                  <h3 className="font-medium text-slate-900 dark:text-white">Target Transaction</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-mono">
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
                  <h3 className="font-medium text-slate-900 dark:text-white">Source System</h3>
                  <p className="text-slate-600 dark:text-slate-400">{exception.sourceSystem}</p>
                </div>
              )}
              {exception.targetSystem && (
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Target System</h3>
                  <p className="text-slate-600 dark:text-slate-400">{exception.targetSystem}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Root Cause and Resolution */}
      {exception.rootCause ||
        exception.resolution ||
        (exception.suggestedActions?.length && (
          <>
            {exception.rootCause && (
              <Card>
                <CardHeader>
                  <CardTitle>Root Cause Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {exception.rootCause}
                  </p>
                </CardContent>
              </Card>
            )}
            {exception.resolution && (
              <Card>
                <CardHeader>
                  <CardTitle>Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {exception.resolution}
                  </p>
                  {exception.resolvedAt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Resolved {new Date(exception.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            {exception.suggestedActions?.length && (
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                    {exception.suggestedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        ))}

      {/* Playbook Applied */}
      {exception.playbookApplied && (
        <Card>
          <CardHeader>
            <CardTitle>Applied Playbook</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">{exception.playbookApplied}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {(exception.status === "pending" || exception.status === "investigating") && (
        <div className="flex flex-wrap gap-4">
          {exception.status === "pending" && (
            <>
              <FreezeBlockedButton
                onClick={handleResolve}
                className="bg-green-600 hover:bg-green-700"
                isFrozen={isFrozen}
                freezeReason={governanceState?.freeze_reason}
                frozenMessage="Exception resolution blocked by tenant freeze"
              >
                <CheckCircle2 className="mr-2" />
                Resolve Exception
              </FreezeBlockedButton>
              <Button onClick={handleIgnore} className="bg-slate-600 hover:bg-slate-700">
                <XCircle className="mr-2" />
                Ignore Exception
              </Button>
            </>
          )}
          {exception.status === "investigating" && (
            <>
              <Button onClick={handleReopen} className="bg-yellow-600 hover:bg-yellow-700">
                <AlertCircle className="mr-2" />
                Reopen Investigation
              </Button>
            </>
          )}
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
                <div key={index} className="border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {entry.action}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          by {entry.user}
                        </span>
                      </div>
                      {entry.details && (
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{entry.details}</p>
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
