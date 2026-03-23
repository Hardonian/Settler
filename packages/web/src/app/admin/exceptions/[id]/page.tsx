/**
 * Admin Exception Detail Page
 *
 * Operator workbench for a single exception.
 * Fetches via a dedicated single-exception API – no list filtering.
 */

"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExceptionSeverity = "info" | "warn" | "critical";
type ExceptionStatus = "new" | "in_review" | "resolved";

interface ExceptionProvenance {
  runId: string | null;
  fieldPath: string | null;
  ruleId: string | null;
  detectorId: string | null;
  sourceAdapter: string | null;
  targetAdapter: string | null;
  sourceTransactionId: string | null;
  targetTransactionId: string | null;
  ingestionId: string | null;
  matchReason: string | null;
  confidenceScore: number | null;
}

interface AdminExceptionDetail {
  id: string;
  tenantId: string;
  source: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  reason: string;
  evidence: {
    expected: unknown;
    actual: unknown;
  };
  provenance: ExceptionProvenance;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchAdminException(id: string): Promise<AdminExceptionDetail> {
  const res = await fetch(`/api/admin/exceptions/${id}`, { cache: "no-store" });
  if (res.status === 404) {
    throw new NotFoundError();
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error((payload as { message?: string }).message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<AdminExceptionDetail>;
}

class NotFoundError extends Error {
  constructor() {
    super("Exception not found");
    this.name = "NotFoundError";
  }
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

const severityLabel: Record<ExceptionSeverity, string> = {
  critical: "CRITICAL",
  warn: "WARN",
  info: "INFO",
};

const severityClasses: Record<ExceptionSeverity, string> = {
  critical: "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-200",
  warn: "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200",
  info: "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-200",
};

const statusLabel: Record<ExceptionStatus, string> = {
  new: "New",
  in_review: "In Review",
  resolved: "Resolved",
};

const statusIcon: Record<ExceptionStatus, typeof Clock> = {
  new: Clock,
  in_review: AlertTriangle,
  resolved: CheckCircle2,
};

const statusClasses: Record<ExceptionStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

// ─── Small components ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: ExceptionSeverity }) {
  return (
    <Badge className={`font-mono text-xs px-3 py-1 ${severityClasses[severity]}`}>
      {severityLabel[severity]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: ExceptionStatus }) {
  const Icon = statusIcon[status];
  return (
    <Badge className={`gap-1 ${statusClasses[status]}`}>
      <Icon className="w-3 h-3" />
      {statusLabel[status]}
    </Badge>
  );
}

function ProvenanceRow({
  label,
  value,
  mono = false,
  link,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  link?: string;
}) {
  if (!value) {
    return (
      <div className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
        <span className="text-xs text-muted-foreground w-44 shrink-0">{label}</span>
        <span className="text-xs text-muted-foreground italic">unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-44 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        {link ? (
          <Link
            href={link}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-mono break-all"
          >
            {value}
            <ExternalLink className="inline w-3 h-3 ml-1" />
          </Link>
        ) : (
          <span className={`text-xs text-foreground break-all ${mono ? "font-mono" : ""}`}>
            {value}
          </span>
        )}
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value)}
          className="shrink-0 p-0.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground"
          title="Copy to clipboard"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function CollapsibleJson({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = useState(false);
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "object" && Object.keys(value as object).length === 0);

  if (isEmpty) {
    return (
      <div>
        <p className="text-xs text-muted-foreground italic">{label}: empty</p>
      </div>
    );
  }

  const json = (() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  })();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-1"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {label}
      </button>
      {open && (
        <div className="relative">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(json)}
            className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground bg-muted/60 rounded px-1.5 py-0.5"
          >
            Copy
          </button>
          <pre className="text-xs bg-muted/40 p-3 rounded overflow-auto max-h-64 border border-border">
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Action wiring ─────────────────────────────────────────────────────────────

type ReviewAction = "review" | "mark_expected" | "unmatch";

interface ActionResult {
  error: string | null;
}

async function postAdminResolve(id: string): Promise<ActionResult> {
  try {
    const res = await fetch(`/api/admin/exceptions/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      return {
        error: (payload as { message?: string }).message || `Action failed: ${res.status}`,
      };
    }
    return { error: null };
  } catch {
    return { error: "Network error. Please try again." };
  }
}

// ─── Action bar ────────────────────────────────────────────────────────────────

function ActionBar({
  exception,
  onActionComplete,
}: {
  exception: AdminExceptionDetail;
  onActionComplete: () => void;
}) {
  const [pending, setPending] = useState<ReviewAction | "resolve" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleResolve = async () => {
    setPending("resolve");
    setActionError(null);
    const result = await postAdminResolve(exception.id);
    setPending(null);
    if (result.error) {
      setActionError(result.error);
    } else {
      onActionComplete();
    }
  };

  if (exception.status === "resolved") {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Exception resolved.</span>
            {exception.reviewedBy && (
              <span className="text-xs text-muted-foreground ml-1">
                Reviewed by {exception.reviewedBy}
                {exception.reviewedAt
                  ? ` on ${new Date(exception.reviewedAt).toLocaleString()}`
                  : ""}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Operator Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actionError && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {actionError}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            className="bg-green-700 hover:bg-green-800 text-white"
            onClick={handleResolve}
            disabled={pending !== null}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {pending === "resolve" ? "Marking resolved…" : "Mark Resolved"}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/exceptions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queue
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Resolving marks this exception as acknowledged in the admin queue. The audit record is
          stored against this tenant.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminExceptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const {
    data: exception,
    isLoading,
    error,
    refetch,
  } = useQuery<AdminExceptionDetail, Error>({
    queryKey: ["admin", "exception", id],
    queryFn: () => fetchAdminException(id),
    staleTime: 20 * 1000,
    retry: (failureCount, err) => {
      if (err instanceof NotFoundError) return false;
      return failureCount < 2;
    },
  });

  const handleActionComplete = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "exception", id] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "exceptions"] });
    void refetch();
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ── Not found ──
  if (error instanceof NotFoundError) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <p className="text-muted-foreground font-medium">
            This exception no longer exists or you do not have access.
          </p>
          <Link href="/admin/exceptions">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exceptions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !exception) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300 max-w-xl">
          <p className="font-medium">Failed to load exception</p>
          <p className="mt-1">{error?.message || "Unknown error"}</p>
        </div>
        <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const prov = exception.provenance;

  return (
    <div className="p-8 space-y-6 bg-muted/10 min-h-screen">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin/exceptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <SeverityBadge severity={exception.severity} />
              <StatusBadge status={exception.status} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mt-2">{exception.reason}</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{exception.id}</p>
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Type</span>
              <span className="font-medium font-mono">{exception.source}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Tenant</span>
              <span className="font-mono text-xs break-all">{exception.tenantId}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Detected</span>
              <span>{new Date(exception.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Last updated</span>
              <span>{new Date(exception.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Provenance / lineage ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provenance &amp; Lineage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <ProvenanceRow
            label="Reconciliation run"
            value={prov.runId}
            mono
            link={prov.runId ? `/admin/runs/${prov.runId}` : undefined}
          />
          <ProvenanceRow label="Field path" value={prov.fieldPath} mono />
          <ProvenanceRow label="Rule ID" value={prov.ruleId} mono />
          <ProvenanceRow label="Detector ID" value={prov.detectorId} mono />
          <ProvenanceRow label="Source adapter" value={prov.sourceAdapter} />
          <ProvenanceRow label="Target adapter" value={prov.targetAdapter} />
          <ProvenanceRow label="Source transaction" value={prov.sourceTransactionId} mono />
          <ProvenanceRow label="Target transaction" value={prov.targetTransactionId} mono />
          <ProvenanceRow label="Ingestion ID" value={prov.ingestionId} mono />
          <ProvenanceRow label="Match reason" value={prov.matchReason} />
          <ProvenanceRow
            label="Confidence score"
            value={
              prov.confidenceScore !== null ? `${(prov.confidenceScore * 100).toFixed(1)}%` : null
            }
          />
        </CardContent>
      </Card>

      {/* ── Evidence comparison ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observed Difference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Expected
              </p>
              {exception.evidence.expected === null || exception.evidence.expected === undefined ? (
                <p className="text-xs text-muted-foreground italic">No expected value</p>
              ) : (
                <pre className="text-xs whitespace-pre-wrap break-words text-foreground">
                  {typeof exception.evidence.expected === "string"
                    ? exception.evidence.expected
                    : JSON.stringify(exception.evidence.expected, null, 2)}
                </pre>
              )}
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Actual
              </p>
              {exception.evidence.actual === null || exception.evidence.actual === undefined ? (
                <p className="text-xs text-muted-foreground italic">No actual value</p>
              ) : (
                <pre className="text-xs whitespace-pre-wrap break-words text-foreground">
                  {typeof exception.evidence.actual === "string"
                    ? exception.evidence.actual
                    : JSON.stringify(exception.evidence.actual, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Operator actions ── */}
      <ActionBar exception={exception} onActionComplete={handleActionComplete} />

      {/* ── Review history ── */}
      {exception.reviewedBy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Record</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>
              Reviewed by{" "}
              <span className="font-medium text-foreground">{exception.reviewedBy}</span>
              {exception.reviewedAt ? ` on ${new Date(exception.reviewedAt).toLocaleString()}` : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Raw metadata (collapsible, bounded) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diagnostic Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <CollapsibleJson label="Full metadata payload" value={exception.metadata} />
        </CardContent>
      </Card>
    </div>
  );
}
