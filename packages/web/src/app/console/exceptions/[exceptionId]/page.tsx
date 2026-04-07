import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { safeFetch } from "@/lib/safe-fetch";
import { ExceptionProofpackDownload } from "./ExceptionProofpackDownload";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  type AuditTrailEntry,
  type EvidenceSummary,
  type ExceptionMemory,
  type OperatorSummary,
  type ProofSummary,
  EvidenceCard,
  ExceptionActionPanel,
  MemoriesCard,
  OperatorSummaryCard,
  ProofsCard,
  ProvenanceCard,
  SeverityBadge,
  SimilarCasesCard,
  StatusBadge,
  WhyFlaggedCard,
  type SimilarCase,
  type WhyFlaggedData,
} from "./components";

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
  expectedValue?: Record<string, unknown> | null;
  actualValue?: Record<string, unknown> | null;
  resolution?: string;
  resolvedAt?: string;
  ignoredAt?: string;
  ignoredBy?: string;
  playbookApplied?: string;
  confidenceScore?: number;
  suggestedActions?: string[];
  provenance?: ExceptionProvenance;
  adjudicationMemories: ExceptionMemory[];
  evidenceSummary: EvidenceSummary;
  proofSummary: ProofSummary;
  auditTrail: AuditTrailEntry[];
  operatorSummary: OperatorSummary;
  similarCases?: SimilarCase[];
  whyFlagged?: WhyFlaggedData;
}

async function fetchExceptionDetail(exceptionId: string): Promise<ExceptionDetail> {
  const result = await safeFetch<{
    data?: ExceptionDetail;
    exception?: ExceptionDetail;
  }>(`/api/exceptions/${exceptionId}`);

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to load exception detail");
  }

  const detail = result.data.data ?? result.data.exception;
  if (!detail) {
    throw new Error("Exception detail response was empty");
  }

  return detail;
}

function ValueCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-4">
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className="mt-2 block text-sm font-medium break-words">{value}</span>
    </div>
  );
}

function renderStructuredValue(value: Record<string, unknown> | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return JSON.stringify(value, null, 2);
}

export default async function ExceptionDetailPage({ params }: { params: { exceptionId: string } }) {
  const exceptionId = params.exceptionId;

  if (!exceptionId) {
    return (
      <div className="p-6">
        <EmptyState
          title="Invalid exception URL"
          description="No exception ID was found in this URL."
          action={{
            label: "Go to Exceptions List",
            href: "/console/exceptions",
          }}
        />
      </div>
    );
  }

  const exception = await fetchExceptionDetail(exceptionId);

  return (
    <div className="p-6 space-y-6">
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
              {(exception.provenance?.confidenceScore ?? exception.confidenceScore) != null ? (
                <Badge className="bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground">
                  Confidence:{" "}
                  {Math.round(
                    (exception.provenance?.confidenceScore ?? exception.confidenceScore ?? 0) * 100
                  )}
                  %
                </Badge>
              ) : null}
              {exception.playbookApplied ? (
                <Badge variant="outline">Pattern: {exception.playbookApplied}</Badge>
              ) : null}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{exception.description}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Exception ID:{" "}
              <code className="bg-muted/40 px-1.5 py-0.5 rounded font-mono">{exception.id}</code>
            </p>
          </div>
        </div>
        <ExceptionProofpackDownload exceptionId={exception.id} />
      </div>

      {exception.statusDetail ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-foreground">
          {exception.statusDetail}
        </div>
      ) : null}

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Type</span>
              <span className="font-medium font-mono">
                {exception.type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
              </span>
            </div>
            {exception.amount !== undefined && exception.currency ? (
              <div>
                <span className="text-xs text-muted-foreground block">Amount</span>
                <span className="font-medium font-mono">
                  {exception.currency} {exception.amount.toLocaleString()}
                </span>
              </div>
            ) : null}
            <div>
              <span className="text-xs text-muted-foreground block">Detected</span>
              <span>{new Date(exception.detectedAt).toLocaleString()}</span>
            </div>
            {exception.runId ? (
              <div>
                <span className="text-xs text-muted-foreground block">Run</span>
                <Link
                  href={`/console/runs/${exception.runId}`}
                  className="font-mono text-primary hover:underline"
                >
                  {exception.runId.slice(0, 8)}…
                </Link>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <OperatorSummaryCard summary={exception.operatorSummary} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {exception.whyFlagged ? <WhyFlaggedCard data={exception.whyFlagged} /> : null}
          <ExceptionActionPanel exceptionId={exceptionId} status={exception.status} />
          {exception.similarCases && exception.similarCases.length > 0 ? (
            <SimilarCasesCard cases={exception.similarCases} />
          ) : null}
          <MemoriesCard memories={exception.adjudicationMemories} />
          <ProvenanceCard auditTrail={exception.auditTrail} />
        </div>
        <div className="space-y-6">
          <EvidenceCard evidenceSummary={exception.evidenceSummary} />
          <ProofsCard proofSummary={exception.proofSummary} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold">Expected Record</h2>
            <pre className="rounded-lg border border-border/60 bg-muted/20 p-4 text-xs overflow-auto">
              {renderStructuredValue(exception.expectedValue)}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold">Actual Record</h2>
            <pre className="rounded-lg border border-border/60 bg-muted/20 p-4 text-xs overflow-auto">
              {renderStructuredValue(exception.actualValue)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ValueCard label="Source system" value={exception.sourceSystem || "Not recorded"} />
            <ValueCard label="Target system" value={exception.targetSystem || "Not recorded"} />
            <ValueCard
              label="Source transaction"
              value={exception.sourceTransactionId || "Not recorded"}
            />
            <ValueCard
              label="Target transaction"
              value={exception.targetTransactionId || "Not recorded"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
