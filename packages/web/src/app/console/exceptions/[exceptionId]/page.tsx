import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFetch } from "@/lib/safe-fetch";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  ExceptionDetailClient,
  SeverityBadge,
  StatusBadge,
  CollapsibleJson,
  ProvenanceRow,
} from "./components";
import { Memories, Evidence, Proofs, Provenance } from "./components";

// ─── Types ─────────────────────────────────────────────────────────────────────

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
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchExceptionDetail(exceptionId: string): Promise<ExceptionDetail> {
  const result = await safeFetch<{ data: ExceptionDetail }>(`/api/exceptions/${exceptionId}`);

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to load exception detail");
  }

  return result.data;
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default async function ExceptionDetailPage({ params }: { params: { exceptionId: string } }) {
  const exceptionId = params.exceptionId;
  const exception = await fetchExceptionDetail(exceptionId);

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

      <Suspense fallback={<Skeleton className="h-48" />}>
        <Memories exceptionId={exceptionId} />
      </Suspense>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <Evidence exceptionId={exceptionId} />
          </Suspense>
        </div>
        <div className="xl:col-span-1">
          <Suspense fallback={<Skeleton className="h-24" />}>
            <Proofs exceptionId={exceptionId} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-64" />}>
        <Provenance exceptionId={exceptionId} />
      </Suspense>

      <ExceptionDetailClient exceptionId={exceptionId} />
    </div>
  );
}
