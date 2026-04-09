"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExceptionFamilySummary } from "@settler/reconciliation-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  GitCompare,
  HelpCircle,
  History,
  Info,
  Loader2,
  ShieldCheck,
  Workflow,
} from "lucide-react";

type ExceptionStatus = "pending" | "investigating" | "resolved" | "ignored";

export type ExceptionMemory = {
  id: string;
  resolution: string;
  resolutionReason: string | null;
  resolutionCode: string | null;
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
};

export type EvidenceSummary = {
  total: number;
  degraded: number;
  attested: number;
  latestCapturedAt: string | null;
  items: Array<{
    id: string;
    artifactType: string;
    artifactKey: string;
    capturedAt: string;
    capturedBy: string;
    degraded: boolean;
    degradedReasons: string[];
    attested: boolean;
    reliabilityScore: number | null;
  }>;
};

export type ProofSummary = {
  total: number;
  finalized: number;
  latestCreatedAt: string | null;
  items: Array<{
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
  }>;
};

export type AuditTrailEntry = {
  timestamp: string;
  action: string;
  user: string;
  details?: string;
};

export type OperatorSummary = {
  whatHappened: string;
  whyItMatters: string;
  nextStep: string;
  evidenceState: "ready" | "degraded" | "setup_required" | "unavailable";
  proofState: "ready" | "degraded" | "setup_required" | "unavailable";
  memoryState: "ready" | "degraded" | "setup_required" | "unavailable";
  evidenceCount: number;
  attestedEvidenceCount: number;
  degradedEvidenceCount: number;
  proofPackageCount: number;
  finalizedProofPackageCount: number;
  bestCompletenessScore: number | null;
  missingEvidenceCount: number;
  memoryCount: number;
  recurringResolutionReason: string | null;
  familyLabel: string | null;
  familyState: ExceptionFamilySummary["state"];
  supportingCaseCount: number;
  recurrencePosture: ExceptionFamilySummary["recurrencePosture"];
  reopenedCaseCount: number;
  reopenRate: number | null;
  dominantResolutionCode: string | null;
  latestResolution: {
    outcome: string | null;
    reason: string | null;
    completedAt: string | null;
  } | null;
};

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  const variantMap: Record<string, "destructive" | "warning" | "outline" | "secondary"> = {
    critical: "destructive",
    high: "warning",
    medium: "outline",
    low: "secondary",
  };

  const variant = variantMap[severity.toLowerCase()] || "outline";

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {severity}
    </Badge>
  );
}

function mapStatusToType(status: string): StatusType {
  const normalized = status.toLowerCase();
  if (normalized === "resolved" || normalized === "matched") return "completed";
  if (normalized === "ignored" || normalized === "dismissed") return "disabled";
  if (normalized === "investigating" || normalized === "in_progress") return "in_progress";
  return "pending";
}

export function GenericStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <StatusBadge
      status={mapStatusToType(status)}
      label={status.replace(/_/g, " ")}
      className={className}
    />
  );
}

export { GenericStatusBadge as StatusBadge };

function readinessBadgeStatus(state: OperatorSummary["evidenceState"]): StatusType {
  switch (state) {
    case "ready":
      return "completed";
    case "degraded":
      return "degraded";
    case "setup_required":
      return "warning";
    default:
      return "error";
  }
}

export function OperatorSummaryCard({ summary }: { summary: OperatorSummary }) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          Operator Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryBlock label="What happened" value={summary.whatHappened} />
          <SummaryBlock label="Why it matters" value={summary.whyItMatters} />
          <SummaryBlock label="What to do next" value={summary.nextStep} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StateMetric
            label="Evidence"
            state={summary.evidenceState}
            value={`${summary.evidenceCount} artifact${summary.evidenceCount === 1 ? "" : "s"}`}
            detail={`${summary.attestedEvidenceCount} attested · ${summary.degradedEvidenceCount} degraded`}
          />
          <StateMetric
            label="Proof"
            state={summary.proofState}
            value={`${summary.finalizedProofPackageCount}/${summary.proofPackageCount} finalized`}
            detail={
              summary.bestCompletenessScore != null
                ? `Best completeness ${Math.round(summary.bestCompletenessScore)}% · ${summary.missingEvidenceCount} missing evidence references`
                : "No proof package created yet"
            }
          />
          <StateMetric
            label="Memory"
            state={summary.memoryState}
            value={`${summary.memoryCount} adjudication record${summary.memoryCount === 1 ? "" : "s"}`}
            detail={
              summary.recurringResolutionReason
                ? `${summary.familyLabel ? `${summary.familyLabel} family` : "Recurring memory"} · ${summary.recurringResolutionReason}`
                : "No recurring operator pattern recorded yet"
            }
          />
        </div>

        {summary.familyLabel ? (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
            <p className="font-medium">
              {summary.familyLabel} family · {summary.recurrencePosture}
            </p>
            <p className="mt-1 text-muted-foreground">
              {summary.supportingCaseCount} prior case
              {summary.supportingCaseCount === 1 ? "" : "s"} recorded
              {summary.reopenedCaseCount > 0
                ? ` · ${summary.reopenedCaseCount} reopened`
                : " · no reopened cases recorded"}
            </p>
            {summary.reopenRate != null ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Reopen rate: {Math.round(summary.reopenRate * 100)}%
                {summary.dominantResolutionCode
                  ? ` · dominant code ${summary.dominantResolutionCode}`
                  : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        {summary.latestResolution ? (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
            <p className="font-medium">Latest recorded decision</p>
            <p className="mt-1 text-muted-foreground">
              {summary.latestResolution.reason || "Operator resolution recorded without a reason."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Outcome: {summary.latestResolution.outcome || "not specified"} · Completed:{" "}
              {summary.latestResolution.completedAt
                ? new Date(summary.latestResolution.completedAt).toLocaleString()
                : "not recorded"}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function StateMetric({
  label,
  state,
  value,
  detail,
}: {
  label: string;
  state: OperatorSummary["evidenceState"];
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <StatusBadge
          status={readinessBadgeStatus(state)}
          label={state.replace(/_/g, " ")}
          size="sm"
        />
      </div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}

export function MemoriesCard({ memories }: { memories: ExceptionMemory[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Adjudication Memory
        </CardTitle>
      </CardHeader>
      <CardContent>
        {memories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic text-sm border-2 border-dashed rounded-lg">
            No durable records for this exception yet. The first explicit operator decision will
            appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => (
              <div key={memory.id} className="rounded-lg border border-border bg-muted/10 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="font-mono text-xs bg-background">
                    {memory.resolution.toUpperCase()}
                  </Badge>
                  {memory.outcome ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {memory.outcome}
                    </Badge>
                  ) : null}
                  <SeverityBadge severity={memory.adjudicationType} className="text-xs" />
                  {memory.sourceTrustScore != null ? (
                    <Badge variant="outline" className="text-xs">
                      <ShieldCheck className="mr-1 h-3 w-3 inline" />
                      {(memory.sourceTrustScore * 100).toFixed(0)}% Trust
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm font-medium">
                  {memory.resolutionReason ?? "General adjudication outcome."}
                </p>
                {memory.resolutionCode ? (
                  <p className="mt-1 text-xs font-mono text-muted-foreground">
                    Code: {memory.resolutionCode}
                  </p>
                ) : null}
                {memory.operatorNotes ? (
                  <div className="mt-2 text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 italic">
                    {memory.operatorNotes}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Actor: {memory.adjudicatorId.slice(0, 8)}
                    <span className="mx-1 opacity-50">|</span>
                    Type: {memory.adjudicatorType}
                  </span>
                  <span>{new Date(memory.completedAt ?? memory.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EvidenceCard({ evidenceSummary }: { evidenceSummary: EvidenceSummary }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Evidence Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">{evidenceSummary.total}</div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
              Artifacts
            </div>
            <div className="text-[10px] text-green-600 font-semibold">
              {evidenceSummary.attested} attested
            </div>
          </div>
        </div>
        {evidenceSummary.items.length > 0 ? (
          <div className="space-y-2">
            {evidenceSummary.items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/50 px-3 py-2 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-foreground/80 truncate">{item.artifactType}</span>
                  <Badge variant={item.degraded ? "destructive" : "outline"}>
                    {item.degraded ? "degraded" : item.attested ? "attested" : "captured"}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  {item.reliabilityScore != null
                    ? `${Math.round(item.reliabilityScore * 100)}% reliability`
                    : "Reliability not recorded"}
                </div>
                {item.degradedReasons.length > 0 ? (
                  <div className="text-amber-600">
                    {item.degradedReasons.slice(0, 2).join(" · ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No evidence is attached yet. Capture supporting artifacts before closing the loop on
            this exception.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ProofsCard({ proofSummary }: { proofSummary: ProofSummary }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          Proof Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{proofSummary.finalized}</p>
            <p className="text-xs text-muted-foreground">Finalized packages</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{proofSummary.total} total</p>
            <p className="text-xs text-muted-foreground">
              {proofSummary.latestCreatedAt
                ? `Latest ${new Date(proofSummary.latestCreatedAt).toLocaleDateString()}`
                : "No proof package yet"}
            </p>
          </div>
        </div>
        {proofSummary.items.length > 0 ? (
          <div className="space-y-2">
            {proofSummary.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/60 bg-background/70 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.packageType}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(item.completenessScore)}% complete
                    </p>
                  </div>
                  <Badge variant={item.status === "finalized" ? "default" : "outline"}>
                    {item.status}
                  </Badge>
                </div>
                {item.missingEvidence.length > 0 ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Missing: {item.missingEvidence.slice(0, 2).join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No proof package has been generated for this exception yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ProvenanceCard({ auditTrail }: { auditTrail: AuditTrailEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Provenance Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditTrail.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm opacity-60 italic">
            No provenance events recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {auditTrail.map((entry, index) => (
              <div
                key={`${entry.timestamp}-${entry.action}-${index}`}
                className="relative pl-6 pb-6 last:pb-0"
              >
                <div className="absolute left-0 top-1 bottom-0 w-px bg-border" />
                <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full border border-background bg-primary" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{entry.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by <span className="text-foreground/80">{entry.user}</span>
                  </div>
                  {entry.details ? (
                    <div className="mt-2 rounded bg-muted/40 p-2 text-xs font-mono">
                      {entry.details}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExceptionActionPanel({
  exceptionId,
  status,
}: {
  exceptionId: string;
  status: ExceptionStatus;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableActions =
    status === "resolved" || status === "ignored" ? ["reopen"] : ["resolve", "ignore"];

  const handleAction = (action: string) => {
    setError(null);
    setSuccess(null);
    setPendingAction(action);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/exceptions/${exceptionId}?action=${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: notes.trim() || undefined }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || payload.message || "Failed to update exception");
        }

        setSuccess(payload.message || "Exception updated successfully.");
        setNotes("");
        router.refresh();
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Failed to update exception"
        );
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Record Operator Decision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Record the decision here so the exception queue, adjudication memory, and proof surface
          stay aligned. Notes are stored as part of the operator trail.
        </p>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Why was this resolved, ignored, or reopened?"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {availableActions.map((action) => (
            <Button
              key={action}
              variant={action === "ignore" ? "outline" : "default"}
              onClick={() => handleAction(action)}
              disabled={isPending}
            >
              {isPending && pendingAction === action ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {action === "resolve"
                ? "Resolve exception"
                : action === "ignore"
                  ? "Ignore exception"
                  : "Reopen exception"}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Similar Cases (Compounding Intelligence) ──�� */

export type SimilarCase = {
  exceptionId: string;
  resolution: string;
  resolutionReason: string | null;
  resolutionCode: string | null;
  confidence: number | null;
  adjudicatedAt: string;
  adjudicatorId: string;
  archetypeCode: string | null;
  archetypeLabel: string | null;
};

export function FamilyIntelligenceCard({ family }: { family: ExceptionFamilySummary }) {
  if (family.state === "unavailable") {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Workflow className="w-4 h-4 text-muted-foreground" />
          Family Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {family.familyLabel ? <Badge variant="secondary">{family.familyLabel}</Badge> : null}
          <Badge variant="outline">{family.state.replace(/_/g, " ")}</Badge>
          <Badge variant="outline">{family.recurrencePosture.replace(/_/g, " ")}</Badge>
        </div>

        <p className="text-sm text-foreground">{family.summary}</p>

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryBlock label="Cases" value={String(family.totalCases)} />
          <SummaryBlock
            label="Supporting"
            value={`${family.supportingCaseCount} prior case${family.supportingCaseCount === 1 ? "" : "s"}`}
          />
          <SummaryBlock
            label="Reopened"
            value={
              family.reopenRate != null
                ? `${family.reopenedCaseCount} (${Math.round(family.reopenRate * 100)}%)`
                : String(family.reopenedCaseCount)
            }
          />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
          <p className="font-medium">Next step</p>
          <p className="mt-1 text-muted-foreground">{family.nextStep}</p>
          {family.dominantResolutionReason ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Dominant resolution: {family.dominantResolutionReason}
              {family.lastSeenAt
                ? ` · Last seen ${new Date(family.lastSeenAt).toLocaleDateString()}`
                : ""}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function SimilarCasesCard({ cases }: { cases: SimilarCase[] }) {
  if (cases.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-muted-foreground" />
          Similar Resolved Cases ({cases.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Prior exceptions resolved with similar patterns. Use these to inform your decision.
        </p>
        {cases.map((c) => (
          <div
            key={`${c.exceptionId}-${c.adjudicatedAt}`}
            className="rounded-lg border border-border/60 p-3 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant={c.resolution === "ignored" ? "outline" : "default"}
                className="capitalize text-xs"
              >
                {c.resolution}
              </Badge>
              {c.archetypeLabel ? (
                <Badge variant="secondary" className="text-xs">
                  {c.archetypeLabel}
                </Badge>
              ) : null}
            </div>
            {c.resolutionReason ? (
              <p className="text-sm text-foreground">{c.resolutionReason}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Resolved by {c.adjudicatorId.slice(0, 8)}... on{" "}
              {new Date(c.adjudicatedAt).toLocaleDateString()}
              {c.confidence != null ? ` (${Math.round(c.confidence * 100)}% confidence)` : ""}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Why Flagged (Deterministic Explanation) ���── */

export type WhyFlaggedData = {
  primaryReasons: Array<{
    reason: string;
    code: string;
    weight: number;
    evidence?: string;
  }>;
  secondaryReasons: Array<{
    reason: string;
    code: string;
    weight: number;
  }>;
  confidence: number;
  similarCaseCount: number;
};

export function WhyFlaggedCard({ data }: { data: WhyFlaggedData }) {
  const hasReasons = data.primaryReasons.length > 0 || data.secondaryReasons.length > 0;
  if (!hasReasons) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
          Why Flagged
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.primaryReasons.map((r) => (
          <div key={r.code} className="rounded-lg border border-border/60 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-sm font-medium text-foreground">{r.reason}</span>
            </div>
            {r.evidence ? <p className="text-xs text-muted-foreground pl-5">{r.evidence}</p> : null}
            <div className="flex items-center gap-2 pl-5">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${Math.round(r.weight * 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">
                {Math.round(r.weight * 100)}%
              </span>
            </div>
          </div>
        ))}
        {data.secondaryReasons.map((r) => (
          <div key={r.code} className="rounded-lg border border-border/40 p-3">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-sm text-muted-foreground">{r.reason}</span>
            </div>
          </div>
        ))}
        {data.similarCaseCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {data.similarCaseCount} similar case{data.similarCaseCount !== 1 ? "s" : ""} found in
            adjudication history.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
