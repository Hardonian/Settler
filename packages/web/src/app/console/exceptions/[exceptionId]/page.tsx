"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { safeFetch } from "@/lib/safe-fetch";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { FreezeBlockedButton } from "@/components/shared/FreezeBlockedButton";
import {
  ExceptionDetailRunContext,
  type ExceptionDetailProvenanceRun,
} from "@/components/console/ExceptionDetailRunContext";
import { EvidenceTrustCard } from "@/components/proof/EvidenceTrustCard";
import { ProvenanceModal } from "@/components/proof/ProvenanceModal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ExceptionProvenance {
  runId: string | null;
  /** Resolved run context (recon job and/or ingestion run); null when unlinked. */
  run?: ExceptionDetailProvenanceRun | null;
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
  rationale_codes: string[] | null;
}

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
  provenance?: ExceptionProvenance;
  auditTrail: {
    timestamp: string;
    action: string;
    user: string;
    details?: string;
  }[];
  adjudicationMemories?: {
    id: string;
    resolution: string;
    resolutionReason: string | null;
    adjudicationType: string;
    adjudicatorId: string;
    adjudicatorType: string;
    outcome: string | null;
    confidence: number | null;
    sourceTrustScore: number | null;
    operatorNotes: string | null;
    systemNotes: string | null;
    evidenceIds: string[];
    createdAt: string;
    completedAt: string | null;
    parentMemoryId: string | null;
  }[];
  evidenceSummary?: {
    total: number;
    degraded: number;
    attested: number;
    latestCapturedAt: string | null;
    items: {
      id: string;
      artifactType: string;
      artifactKey: string;
      capturedAt: string;
      capturedBy: string;
      degraded: boolean;
      degradedReasons: string[];
      attested: boolean;
      reliabilityScore: number | null;
    }[];
  };
  proofSummary?: {
    total: number;
    finalized: number;
    latestCreatedAt: string | null;
    items: {
      id: string;
      packageType: string;
      packageKey: string;
      status: string;
      completenessScore: number;
      missingEvidence: string[];
      completenessFlags: string[];
      evidenceIds: string[];
      createdAt: string;
      finalizedAt: string | null;
    }[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const severityClasses: Record<ExceptionDetail["severity"], string> = {
  critical: "bg-red-100 text-red-700 border border-red-300 dark:bg-red-900 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900 dark:text-orange-300",
  medium:
    "bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-700 border border-green-300 dark:bg-green-900 dark:text-green-300",
};

const severityLabel: Record<ExceptionDetail["severity"], string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const statusClasses: Record<ExceptionDetail["status"], string> = {
  resolved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  ignored: "bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground",
  investigating: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
};

const statusIcon: Record<ExceptionDetail["status"], typeof Clock> = {
  resolved: CheckCircle2,
  ignored: XCircle,
  investigating: RefreshCw,
  pending: Clock,
};

// ─── Small components ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: ExceptionDetail["severity"] }) {
  return (
    <Badge className={`font-mono text-xs px-3 py-1 ${severityClasses[severity]}`}>
      {severityLabel[severity]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: ExceptionDetail["status"] }) {
  const Icon = statusIcon[status];
  return (
    <Badge className={`gap-1 ${statusClasses[status]}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
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
      <p className="text-xs text-muted-foreground italic">
        {label}: <span className="not-italic">empty</span>
      </p>
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
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {label}
      </button>
      {open && (
        <div className="relative mt-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(json)}
            className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground bg-muted/60 rounded px-1.5 py-0.5"
          >
            Copy
          </button>
          <pre className="text-xs bg-muted/40 dark:bg-background/60 p-3 rounded overflow-auto max-h-64 border border-border">
            {json}
          </pre>
        </div>
      )}
    </div>
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

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchExceptionDetail(exceptionId: string): Promise<ExceptionDetail> {
  const result = await safeFetch<{ exception?: ExceptionDetail } | ExceptionDetail>(
    `/api/exceptions/${exceptionId}`
  );

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to load exception detail");
  }

  const payload = result.data;
  const detail: ExceptionDetail | null =
    payload && typeof payload === "object" && "exception" in payload
      ? ((payload.exception ?? null) as ExceptionDetail | null)
      : (payload as ExceptionDetail);

  if (!detail) {
    throw new Error("Exception not found");
  }

  return detail;
}

// ─── Action helpers ────────────────────────────────────────────────────────────

type ExceptionAction = "resolve" | "ignore" | "reopen";

async function performExceptionAction(
  exceptionId: string,
  action: ExceptionAction,
  notes?: string
): Promise<{ success: boolean; message?: string }> {
  const result = await safeFetch<{ success: boolean; message?: string }>(
    `/api/exceptions/${exceptionId}?action=${action}`,
    {
      method: "POST",
      body: JSON.stringify(notes?.trim() ? { notes: notes.trim() } : {}),
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!result.success) {
    return {
      success: false,
      message: result.error?.message || `Failed to ${action} exception`,
    };
  }

  return { success: true };
}

// ─── Action bar ────────────────────────────────────────────────────────────────

function ActionBar({
  exception,
  isFrozen,
  freezeReason,
  onActionComplete,
}: {
  exception: ExceptionDetail;
  isFrozen: boolean;
  freezeReason?: string;
  onActionComplete: () => void;
}) {
  const [pending, setPending] = useState<ExceptionAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");

  const execute = async (action: ExceptionAction) => {
    setPending(action);
    setActionError(null);

    const result = await performExceptionAction(exception.id, action, decisionNotes);
    setPending(null);

    if (!result.success) {
      setActionError(result.message || `Failed to ${action} exception`);
    } else {
      if (action !== "reopen") {
        setDecisionNotes("");
      }
      onActionComplete();
    }
  };

  const isActive = exception.status === "pending" || exception.status === "investigating";
  const isTerminal = exception.status === "resolved" || exception.status === "ignored";

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {actionError}
        </div>
      )}

      {isActive && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="exception-decision-notes" className="text-sm font-medium">
              Decision notes
            </label>
            <Textarea
              id="exception-decision-notes"
              value={decisionNotes}
              onChange={(event) => setDecisionNotes(event.target.value)}
              placeholder="Capture the evidence, rationale, or follow-up context that should persist with this decision."
              rows={4}
              disabled={pending !== null}
            />
            <p className="text-xs text-muted-foreground">
              These notes are written into the immutable adjudication memory and supporting proof
              package for this exception.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <FreezeBlockedButton
              onClick={() => void execute("resolve")}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              isFrozen={isFrozen}
              freezeReason={freezeReason}
              frozenMessage="Exception resolution blocked by tenant freeze"
              disabled={pending !== null}
            >
              <CheckCircle2 className="mr-2 w-4 h-4" />
              {pending === "resolve" ? "Marking resolved…" : "Mark Resolved"}
            </FreezeBlockedButton>

            <FreezeBlockedButton
              onClick={() => void execute("ignore")}
              className="bg-slate-600 hover:bg-muted disabled:opacity-50"
              isFrozen={isFrozen}
              freezeReason={freezeReason}
              frozenMessage="Ignoring exceptions is blocked by tenant freeze"
              disabled={pending !== null}
            >
              <XCircle className="mr-2 w-4 h-4" />
              {pending === "ignore" ? "Ignoring…" : "Ignore Exception"}
            </FreezeBlockedButton>
          </div>
        </div>
      )}

      {isTerminal && (
        <div className="flex flex-wrap gap-3">
          <FreezeBlockedButton
            onClick={() => void execute("reopen")}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            isFrozen={isFrozen}
            freezeReason={freezeReason}
            frozenMessage="Reopening exceptions is blocked by tenant freeze"
            disabled={pending !== null}
          >
            <AlertCircle className="mr-2 w-4 h-4" />
            {pending === "reopen" ? "Reopening…" : "Reopen Exception"}
          </FreezeBlockedButton>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ExceptionDetailPage() {
  const params = useParams();
  const exceptionId =
    params && typeof params.exceptionId === "string" ? params.exceptionId : undefined;

  const queryClient = useQueryClient();
  const { isFrozen, governanceState } = useGovernanceState();
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState(false);

  const {
    data: exception,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<ExceptionDetail, Error>({
    queryKey: ["exception", exceptionId],
    queryFn: () => fetchExceptionDetail(exceptionId!),
    enabled: !!exceptionId,
    staleTime: 20 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return data.status === "pending" || data.status === "investigating" ? 15_000 : false;
    },
    retry: (failureCount, err) => {
      if (err.message === "Exception not found") return false;
      return failureCount < 2;
    },
  });

  const handleActionComplete = () => {
    void queryClient.invalidateQueries({ queryKey: ["exception", exceptionId] });
    void refetch();
  };

  if (!exceptionId) {
    return (
      <div className="p-6">
        <EmptyState
          title="Invalid exception URL"
          description="No exception ID was found in this URL."
          action={{
            label: "Go to Exceptions List",
            onClick: () => (window.location.href = "/console/exceptions"),
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error?.message === "Exception not found") {
    return (
      <div className="p-6">
        <EmptyState
          title="Exception not found"
          description="This exception no longer exists or you do not have access."
          action={{
            label: "Go to Exceptions List",
            onClick: () => (window.location.href = "/console/exceptions"),
          }}
        />
      </div>
    );
  }

  if (error && !exception) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load exception"
          message={error.message}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!exception) {
    return (
      <div className="p-6">
        <EmptyState
          title="Exception not found"
          description="This exception no longer exists or you do not have access."
          action={{
            label: "Go to Exceptions List",
            onClick: () => (window.location.href = "/console/exceptions"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/console/exceptions">
            <Button variant="ghost" size="sm" className="mt-0.5">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <SeverityBadge severity={exception.severity} />
              <StatusBadge status={exception.status} />
              {(exception.provenance?.confidenceScore ?? exception.confidenceScore) !== undefined &&
                (exception.provenance?.confidenceScore ?? exception.confidenceScore) !== null && (
                  <Badge className="bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground">
                    Confidence:{" "}
                    {Math.round(
                      (exception.provenance?.confidenceScore ?? exception.confidenceScore)! * 100
                    )}
                    %
                  </Badge>
                )}
            </div>
            <h1 className="text-2xl font-bold text-foreground dark:text-white">
              {exception.description}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Exception ID:{" "}
              <code className="bg-muted/40 dark:bg-card px-1.5 py-0.5 rounded font-mono">
                {exception.id}
              </code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Status detail banner ── */}
      {exception.statusDetail && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-foreground dark:border-border dark:bg-background/60 dark:text-muted-foreground">
          {exception.statusDetail}
        </div>
      )}

      {/* ── Summary strip ── */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Type</span>
              <span className="font-medium font-mono">
                {exception.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
            {exception.amount !== undefined && exception.currency && (
              <div>
                <span className="text-xs text-muted-foreground block">Amount</span>
                <span className="font-medium font-mono">
                  {exception.currency} {exception.amount.toLocaleString()}
                </span>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground block">Detected</span>
              <span>{new Date(exception.detectedAt).toLocaleString()}</span>
            </div>
            {exception.fieldPath && (
              <div>
                <span className="text-xs text-muted-foreground block">Field</span>
                <span className="font-mono text-xs">{exception.fieldPath}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Provenance / lineage ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provenance &amp; Origin</CardTitle>
          <p className="text-xs text-muted-foreground font-normal mt-1 max-w-3xl">
            Canonical reconciliation exception context for operator review, evidence capture, and
            durable adjudication memory.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const prov = exception.provenance;
            const runId = prov?.runId ?? exception.runId ?? null;
            const runContext: ExceptionDetailProvenanceRun | null =
              prov?.run ??
              (runId
                ? {
                    id: runId,
                    runKind: "ingestion_run",
                    sourceModel: "reconciliation_runs",
                    name: null,
                    normalizedStatus: "unknown",
                    statusLabel: "Unavailable",
                    createdAt: null,
                    startedAt: null,
                    completedAt: null,
                    ingestionId: null,
                    reconJobId: null,
                    href: `/console/runs/${runId}`,
                    recordFound: false,
                    latestResultId: null,
                    uuidCollision: false,
                  }
                : null);
            const sourceAdapter = prov?.sourceAdapter ?? exception.sourceSystem ?? null;
            const targetAdapter = prov?.targetAdapter ?? exception.targetSystem ?? null;
            const srcTxn = prov?.sourceTransactionId ?? exception.sourceTransactionId ?? null;
            const tgtTxn = prov?.targetTransactionId ?? exception.targetTransactionId ?? null;

            return (
              <>
                <ExceptionDetailRunContext run={runContext} />
                <div className="space-y-0 border-t border-border pt-2">
                  <ProvenanceRow label="Source adapter" value={sourceAdapter} />
                  <ProvenanceRow label="Target adapter" value={targetAdapter} />
                  <ProvenanceRow label="Source transaction" value={srcTxn} mono />
                  <ProvenanceRow label="Target transaction" value={tgtTxn} mono />
                  <ProvenanceRow
                    label="Field path"
                    value={prov?.fieldPath ?? exception.fieldPath ?? null}
                    mono
                  />
                  <ProvenanceRow label="Rule ID" value={prov?.ruleId ?? null} mono />
                  <ProvenanceRow label="Detector ID" value={prov?.detectorId ?? null} mono />
                  <ProvenanceRow label="Ingestion ID" value={prov?.ingestionId ?? null} mono />
                  <ProvenanceRow label="Match reason" value={prov?.matchReason ?? null} />
                  <ProvenanceRow
                    label="Confidence"
                    value={
                      prov?.confidenceScore !== null && prov?.confidenceScore !== undefined
                        ? `${(prov.confidenceScore * 100).toFixed(1)}%`
                        : exception.confidenceScore !== undefined
                          ? `${Math.round(exception.confidenceScore * 100)}%`
                          : null
                    }
                  />
                  {prov?.rationale_codes && prov.rationale_codes.length > 0 && (
                    <div className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                      <span className="text-xs text-muted-foreground w-44 shrink-0">
                        Rationale codes
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {prov.rationale_codes.map((code) => (
                          <Badge key={code} variant="outline" className="font-mono text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* ── Decision drivers (reason tags) ── */}
      {exception.reasonTags && exception.reasonTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decision Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {exception.reasonTags.map((tag) => (
                <Badge
                  key={`${exception.id}-${tag}`}
                  variant="outline"
                  className="font-mono text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Evidence and proof readiness ── */}
      {(exception.evidenceSummary || exception.proofSummary) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Evidence & Proof Readiness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Evidence artifacts
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {exception.evidenceSummary?.total ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {exception.evidenceSummary?.attested ?? 0} attested,{" "}
                      {exception.evidenceSummary?.degraded ?? 0} degraded
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Proof packages
                    </p>
                    <p className="mt-2 text-2xl font-bold">{exception.proofSummary?.total ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {exception.proofSummary?.finalized ?? 0} finalized
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-1">
            <EvidenceTrustCard
              exceptionId={exception.id}
              completenessScore={exception.proofSummary?.items[0]?.completenessScore ?? 0}
              reliabilityScore={
                (exception.evidenceSummary?.items.reduce(
                  (acc, item) => acc + (item.reliabilityScore ?? 0),
                  0
                ) ?? 0) / (exception.evidenceSummary?.items.length || 1)
              }
              evidenceCount={exception.evidenceSummary?.items.length ?? 0}
              missingEvidence={exception.proofSummary?.items[0]?.missingEvidence ?? []}
              isActionable={exception.proofSummary?.items[0]?.status === "finalized"}
            />
          </div>
        </div>
      )}

      <ProvenanceModal
        isOpen={isProvenanceModalOpen}
        onClose={() => setIsProvenanceModalOpen(false)}
        exceptionId={exception.id}
        provenanceNodes={
          exception.evidenceSummary?.items.map((item) => ({
            id: item.id,
            type: item.artifactType,
            source: item.capturedBy,
            timestamp: item.capturedAt,
            reliability: item.reliabilityScore ?? 0.5,
            hash: "sha256:8f3b...2e9a", // Simulation since backend doesn't yet return full node hash
          })) || []
        }
      />
      {/* ── Evidence and proof artifacts ── */}
      {(exception.evidenceSummary?.items?.length || exception.proofSummary?.items?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evidence &amp; Proof Artifacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {exception.evidenceSummary?.items?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Captured evidence</p>
                <div className="space-y-2">
                  {exception.evidenceSummary.items.map((artifact) => (
                    <div
                      key={artifact.id}
                      className="rounded-lg border border-border bg-muted/10 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {artifact.artifactType}
                        </Badge>
                        {artifact.attested ? <Badge className="text-xs">Attested</Badge> : null}
                        {artifact.degraded ? (
                          <Badge variant="warning" size="sm">
                            Degraded
                          </Badge>
                        ) : null}
                        {artifact.reliabilityScore != null ? (
                          <Badge variant="outline" className="text-xs">
                            Reliability {(artifact.reliabilityScore * 100).toFixed(0)}%
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 font-mono text-xs break-all">{artifact.artifactKey}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Captured {new Date(artifact.capturedAt).toLocaleString()} by{" "}
                        {artifact.capturedBy}
                      </p>
                      {artifact.degradedReasons.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {artifact.degradedReasons.map((reason) => (
                            <Badge key={`${artifact.id}-${reason}`} variant="outline" size="sm">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {exception.proofSummary?.items?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Proof packages</p>
                <div className="space-y-2">
                  {exception.proofSummary.items.map((proof) => (
                    <div key={proof.id} className="rounded-lg border border-border bg-muted/10 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {proof.packageType}
                        </Badge>
                        <Badge
                          className={
                            proof.status === "finalized"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          }
                        >
                          {proof.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Completeness {(proof.completenessScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="mt-2 font-mono text-xs break-all">{proof.packageKey}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {new Date(proof.createdAt).toLocaleString()}
                        {proof.finalizedAt
                          ? ` • Finalized ${new Date(proof.finalizedAt).toLocaleString()}`
                          : ""}
                      </p>
                      {proof.missingEvidence.length > 0 ? (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Missing evidence
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {proof.missingEvidence.map((item) => (
                              <Badge key={`${proof.id}-${item}`} variant="outline" size="sm">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {proof.completenessFlags.length > 0 ? (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Completeness flags
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {proof.completenessFlags.map((flag) => (
                              <Badge key={`${proof.id}-${flag}`} variant="outline" size="sm">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* ── Adjudication memory ── */}
      {exception.adjudicationMemories && exception.adjudicationMemories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adjudication Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exception.adjudicationMemories.map((memory) => (
                <div key={memory.id} className="rounded-lg border border-border bg-muted/10 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {memory.resolution}
                    </Badge>
                    {memory.outcome ? (
                      <Badge className="bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground">
                        {memory.outcome}
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="text-xs">
                      {memory.adjudicationType}
                    </Badge>
                    {memory.sourceTrustScore != null ? (
                      <Badge variant="outline" className="text-xs">
                        Source trust {(memory.sourceTrustScore * 100).toFixed(0)}%
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm">
                    {memory.resolutionReason ?? "No structured resolution reason recorded."}
                  </p>
                  {memory.operatorNotes ? (
                    <p className="mt-2 text-sm text-muted-foreground">{memory.operatorNotes}</p>
                  ) : null}
                  {memory.systemNotes ? (
                    <p className="mt-2 text-xs text-muted-foreground">{memory.systemNotes}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Actor: {memory.adjudicatorId}</span>
                    <span>
                      Recorded {new Date(memory.completedAt ?? memory.createdAt).toLocaleString()}
                    </span>
                    <span>Evidence refs: {memory.evidenceIds.length}</span>
                    {memory.parentMemoryId ? <span>Reopened from prior decision</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Evidence comparison ── */}
      {(exception.expectedValue !== undefined || exception.actualValue !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observed Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-4 dark:border-border dark:bg-background/60">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Expected
                </p>
                <pre className="whitespace-pre-wrap break-words text-sm text-foreground dark:text-muted-foreground">
                  {JSON.stringify(exception.expectedValue ?? null, null, 2)}
                </pre>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4 dark:border-border dark:bg-background/60">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Actual
                </p>
                <pre className="whitespace-pre-wrap break-words text-sm text-foreground dark:text-muted-foreground">
                  {JSON.stringify(exception.actualValue ?? null, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Suggested next steps ── */}
      {exception.suggestedActions && exception.suggestedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {exception.suggestedActions.map((action, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground dark:text-muted-foreground"
                >
                  <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Operator action bar ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operator Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionBar
            exception={exception}
            isFrozen={isFrozen}
            freezeReason={governanceState?.freeze_reason ?? undefined}
            onActionComplete={handleActionComplete}
          />
        </CardContent>
      </Card>

      {/* ── Decision record ── */}
      {(exception.resolution || exception.resolvedAt || exception.ignoredAt) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decision Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
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

      {/* ── Applied playbook ── */}
      {exception.playbookApplied && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applied Playbook</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {exception.playbookApplied}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Audit trail ── */}
      {exception.auditTrail.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity &amp; Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exception.auditTrail.map((entry, index) => (
                <div key={index} className="border-l-2 border-border dark:border-border pl-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 text-xs text-muted-foreground dark:text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground dark:text-white">
                          {entry.action}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                          by {entry.user}
                        </span>
                      </div>
                      {entry.details && (
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Raw evidence (collapsible) ── */}
      {(exception.expectedValue !== undefined || exception.actualValue !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evidence Payload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CollapsibleJson label="Expected value (raw)" value={exception.expectedValue ?? null} />
            <CollapsibleJson label="Actual value (raw)" value={exception.actualValue ?? null} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
