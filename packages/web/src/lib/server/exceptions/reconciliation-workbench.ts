import type { PrismaClient } from "@prisma/client";
import type { ReadinessState } from "@/lib/activation/readiness";

/** Row from similar-resolved adjudication memory query (similarity scoring input). */
type SimilarResolvedMemoryRow = {
  id: string;
  exceptionId: string;
  resolution: string;
  resolutionReason: string | null;
  resolutionCode: string | null;
  archetypeId: string | null;
  outcome: string | null;
  createdAt: Date;
  confidence: unknown;
  sourceTrustScore: unknown;
  adjudicatorId: string;
  archetype: { code: string; label: string } | null;
};

/** Scored similar case before stripping internal `_score`. */
type SimilarScoredCaseRow = {
  memoryId: string;
  exceptionId: string;
  resolution: string;
  resolutionReason: string | null;
  resolutionCode: string | null;
  outcome: string | null;
  confidence: number | null;
  adjudicatedAt: string;
  adjudicatorId: string;
  archetypeCode: string | null;
  archetypeLabel: string | null;
  _score: number;
};
import {
  EXCEPTION_MATCH_TYPES,
  buildExceptionFamilySummary,
  buildExceptionProofLineage,
  buildExceptionRunComparisonSnapshotForRunIds,
  normalizeExceptionResolutionReason,
  operatorStatusToCanonical,
  predictExceptionArchetype,
  resolveReconciliationExceptionScope,
  toCanonicalExceptionStatus,
  toOperatorExceptionStatus,
  type CanonicalExceptionStatus,
  type ExceptionDetailIntelligence,
  type ExceptionFamilySummary,
  type ExceptionRunComparisonSnapshot,
} from "@settler/reconciliation-core";

const SIMILAR_RESOLVED_CASE_SCAN_LIMIT = 50;

export type ReconciliationWorkbenchListFilters = {
  tenantId: string;
  runId?: string | null;
  runKind?: "recon_job" | "ingestion_run" | null;
  status?: string | null;
  severity?: "low" | "medium" | "high" | "critical" | null;
  type?: string | null;
  search?: string | null;
  limit: number;
  offset: number;
};

export type ReconciliationWorkbenchListItem = {
  id: string;
  type: string;
  matchType: string;
  status: "pending" | "investigating" | "resolved" | "ignored";
  canonicalStatus: CanonicalExceptionStatus;
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: string;
  description: string;
  statusDetail?: string;
  reasonTags?: string[];
  amount?: number;
  currency?: string;
  confidenceScore: number | null;
  sourceTransactionId: string;
  targetTransactionId?: string | null;
  runId: string;
  assignedTo?: string | null;
  resolutionReason?: string | null;
  compactSummary?: {
    recurrence: {
      memoryCount: number;
      recurringResolutionReason: string | null;
      familyLabel: string | null;
      recurrencePosture: "worsening" | "stable" | "improving" | "unavailable";
      state: ReadinessState;
    };
    evidence: {
      total: number;
      degraded: number;
      attested: number;
      state: ReadinessState;
    };
    proof: {
      total: number;
      finalized: number;
      bestCompletenessScore: number | null;
      missingEvidenceCount: number;
      state: ReadinessState;
      changedSincePreviousRun: "changed" | "unchanged" | "unavailable";
      changeSummary: string;
    };
    supportability: {
      degradedReasons: string[];
      nextStep: string;
    };
  };
};

export type ReconciliationWorkbenchDetail = ReconciliationWorkbenchListItem & {
  notes?: string | null;
  sourceSystem?: string | null;
  targetSystem?: string | null;
  runMetadata?: Record<string, unknown>;
  expectedValue?: Record<string, unknown> | null;
  actualValue?: Record<string, unknown> | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  ignoredAt?: string | null;
  ignoredBy?: string | null;
  suggestedActions: string[];
  playbookApplied?: string | null;
  operatorNotes?: string | null;
  sourceTrustScore?: number | null;
  topArchetype?: {
    id: string;
    code: string;
    label: string;
    confidence: number;
    category?: string | null;
  } | null;
  adjudicationMemories: Array<{
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
  }>;
  evidenceSummary: {
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
  proofSummary: {
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
  auditTrail: Array<{
    timestamp: string;
    action: string;
    user: string;
    details?: string;
  }>;
  operatorSummary: ExceptionOperatorSummary;
  familySummary: ExceptionFamilySummary;
  /** Canonical prior-run comparison for this exception's run (same object as list compact proof slice and proofpack). */
  runComparison: ExceptionRunComparisonSnapshot | null;
  /** Family/adjudication memory and bounded similar cases — deterministic, stored-facts only. */
  exceptionIntelligence: ExceptionDetailIntelligence;
  /** Stable ids for audit/export alignment with proofpack lineage. */
  proofLineage: ReturnType<typeof buildExceptionProofLineage>;
  similarCases: Array<{
    memoryId: string;
    exceptionId: string;
    resolution: string;
    resolutionReason: string | null;
    resolutionCode: string | null;
    confidence: number | null;
    adjudicatedAt: string;
    adjudicatorId: string;
    archetypeCode: string | null;
    archetypeLabel: string | null;
  }>;
  whyFlagged: {
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
};

export type ExceptionOperatorSummary = {
  whatHappened: string;
  whyItMatters: string;
  nextStep: string;
  evidenceState: ReadinessState;
  proofState: ReadinessState;
  memoryState: ReadinessState;
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

export type ReconciliationWorkbenchOutcome<T> =
  | { kind: "ok"; data: T }
  | { kind: "not_found"; requestedRunId?: string }
  | {
      kind: "ambiguous_uuid_collision";
      requestedRunId: string;
      jobId: string;
      ingestionRunId: string;
    };

function asJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? ({ ...value } as Record<string, unknown>)
    : {};
}

function pushTag(target: string[], value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return;
  }
  if (!target.includes(trimmed)) {
    target.push(trimmed);
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function resolveExceptionType(args: {
  topArchetypeCode?: string | null;
  matchType: string;
  matchReason?: string | null;
}): string {
  if (args.topArchetypeCode) {
    return args.topArchetypeCode;
  }
  if (args.matchType === "conflict") {
    return "conflict";
  }
  if (args.matchReason?.toLowerCase().includes("date")) {
    return "date_drift";
  }
  if (args.matchReason?.toLowerCase().includes("amount")) {
    return "amount_mismatch";
  }
  return args.matchType || "unmatched";
}

function buildDescription(args: {
  sourceDescription?: string | null;
  matchReason?: string | null;
  matchType: string;
}): string {
  const sourceDescription = args.sourceDescription?.trim();
  const matchReason = args.matchReason?.trim();

  if (sourceDescription && matchReason) {
    return `${sourceDescription} — ${matchReason}`;
  }

  if (sourceDescription) {
    return sourceDescription;
  }

  if (matchReason) {
    return matchReason;
  }

  return args.matchType === "conflict"
    ? "Conflicting reconciliation candidate requires review"
    : "Unmatched reconciliation record requires review";
}

function buildStatusDetail(args: {
  canonicalStatus: CanonicalExceptionStatus;
  assignedTo?: string | null;
  latestResolutionReason?: string | null;
  latestOperatorNotes?: string | null;
  latestCompletedAt?: Date | null;
}): string {
  if (args.canonicalStatus === "in_progress") {
    return args.assignedTo
      ? `Investigation is in progress and assigned to ${args.assignedTo}.`
      : "Investigation is in progress.";
  }

  if (args.canonicalStatus === "resolved") {
    const completedAt = args.latestCompletedAt
      ? `Resolved ${args.latestCompletedAt.toLocaleString()}. `
      : "";
    const reason = args.latestResolutionReason ? `Reason: ${args.latestResolutionReason}. ` : "";
    const notes = args.latestOperatorNotes ? args.latestOperatorNotes : "";
    return `${completedAt}${reason}${notes}`.trim();
  }

  if (args.canonicalStatus === "dismissed") {
    const completedAt = args.latestCompletedAt
      ? `Ignored ${args.latestCompletedAt.toLocaleString()}. `
      : "";
    const reason = args.latestResolutionReason ? `Reason: ${args.latestResolutionReason}. ` : "";
    const notes = args.latestOperatorNotes ? args.latestOperatorNotes : "";
    return `${completedAt}${reason}${notes}`.trim();
  }

  return args.assignedTo
    ? `Awaiting operator review. Currently assigned to ${args.assignedTo}.`
    : "Awaiting operator review.";
}

function buildSuggestedActions(status: CanonicalExceptionStatus, hasEvidence: boolean): string[] {
  if (status === "resolved" || status === "dismissed") {
    return hasEvidence
      ? [
          "Review the recorded proof package before exporting or attesting this decision.",
          "Use the adjudication memory below when similar cases recur.",
        ]
      : ["Capture supporting evidence if this decision must be reused or exported later."];
  }

  if (status === "in_progress") {
    return [
      "Complete the investigation and record the final adjudication outcome.",
      "Attach supporting evidence before closing the exception.",
    ];
  }

  return [
    "Review the source and target records side by side.",
    "Record operator evidence before resolving or ignoring the exception.",
  ];
}

function resolveEvidenceState(
  summary: ReconciliationWorkbenchDetail["evidenceSummary"]
): ReadinessState {
  if (summary.total === 0) {
    return "setup_required";
  }
  if (summary.degraded > 0 || summary.attested < summary.total) {
    return "degraded";
  }
  return "ready";
}

function resolveProofState(args: {
  evidenceState: ReadinessState;
  proofSummary: ReconciliationWorkbenchDetail["proofSummary"];
}): ReadinessState {
  const missingEvidenceCount = args.proofSummary.items.reduce(
    (count, item) => count + item.missingEvidence.length,
    0
  );

  if (args.proofSummary.total === 0) {
    return args.evidenceState === "setup_required" ? "setup_required" : "degraded";
  }

  if (args.proofSummary.finalized > 0 && missingEvidenceCount === 0) {
    return "ready";
  }

  return "degraded";
}

function resolveMemoryState(memoryCount: number): ReadinessState {
  return memoryCount > 0 ? "ready" : "setup_required";
}

function summarizeRecurringResolutionReason(
  memories: ReconciliationWorkbenchDetail["adjudicationMemories"]
): string | null {
  const counts = new Map<string, number>();
  for (const memory of memories) {
    const reason = memory.resolutionReason?.trim();
    if (!reason) {
      continue;
    }
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }

  let topReason: string | null = null;
  let topCount = 0;
  for (const [reason, count] of counts.entries()) {
    if (count > topCount) {
      topReason = reason;
      topCount = count;
    }
  }

  return topReason;
}

function buildWhatHappened(args: {
  status: CanonicalExceptionStatus;
  severity: ReconciliationWorkbenchDetail["severity"];
  description: string;
}): string {
  const severity = args.severity.toUpperCase();

  if (args.status === "resolved") {
    return `${severity} exception resolved: ${args.description}`;
  }

  if (args.status === "dismissed") {
    return `${severity} exception ignored with an explicit operator decision.`;
  }

  if (args.status === "in_progress") {
    return `${severity} exception is under investigation: ${args.description}`;
  }

  return `${severity} exception is awaiting operator review: ${args.description}`;
}

function buildWhyItMatters(args: {
  status: CanonicalExceptionStatus;
  evidenceState: ReadinessState;
  proofState: ReadinessState;
  memoryCount: number;
  recurringResolutionReason: string | null;
  familySummary?: ExceptionFamilySummary;
}): string {
  if (args.status === "resolved" && args.proofState === "ready") {
    return args.memoryCount > 0
      ? "The operator decision, supporting evidence, and reusable adjudication memory are aligned for export or reuse."
      : "The decision is recorded and exportable, but this case has not yet built reusable adjudication depth.";
  }

  if (args.status === "resolved") {
    return "The decision is recorded, but the proof or evidence set is not yet fully export-ready.";
  }

  if (args.evidenceState === "setup_required") {
    return "No supporting evidence is attached yet, so this exception still depends on operator judgment rather than reusable proof.";
  }

  if (args.familySummary?.state === "available" && args.familySummary.familyLabel) {
    return `${args.familySummary.familyLabel} already has ${args.familySummary.supportingCaseCount} prior cases of operator memory. Dominant path: ${args.familySummary.dominantResolutionReason ?? "still forming"}.`;
  }

  if (args.recurringResolutionReason) {
    return `This exception already shows a recurring resolution pattern: ${args.recurringResolutionReason}.`;
  }

  return "This exception still affects operator trust until the outcome, evidence, and proof state are recorded explicitly.";
}

export function buildExceptionOperatorSummary(args: {
  status: CanonicalExceptionStatus;
  severity: ReconciliationWorkbenchDetail["severity"];
  description: string;
  suggestedActions: string[];
  adjudicationMemories: ReconciliationWorkbenchDetail["adjudicationMemories"];
  evidenceSummary: ReconciliationWorkbenchDetail["evidenceSummary"];
  proofSummary: ReconciliationWorkbenchDetail["proofSummary"];
  familySummary: ExceptionFamilySummary;
}): ExceptionOperatorSummary {
  const evidenceState = resolveEvidenceState(args.evidenceSummary);
  const proofState = resolveProofState({
    evidenceState,
    proofSummary: args.proofSummary,
  });
  const reusableMemoryCount =
    args.familySummary.state === "available"
      ? Math.max(args.familySummary.supportingCaseCount, args.adjudicationMemories.length)
      : args.adjudicationMemories.length;
  const memoryState = resolveMemoryState(reusableMemoryCount);
  const recurringResolutionReason =
    args.familySummary.dominantResolutionReason ??
    summarizeRecurringResolutionReason(args.adjudicationMemories);
  const latestResolution = args.adjudicationMemories[0]
    ? {
        outcome: args.adjudicationMemories[0].outcome,
        reason: args.adjudicationMemories[0].resolutionReason,
        completedAt: args.adjudicationMemories[0].completedAt,
      }
    : null;
  const bestCompletenessScore =
    args.proofSummary.items.length > 0
      ? Math.max(...args.proofSummary.items.map((item) => item.completenessScore))
      : null;
  const missingEvidenceCount = args.proofSummary.items.reduce(
    (count, item) => count + item.missingEvidence.length,
    0
  );

  return {
    whatHappened: buildWhatHappened({
      status: args.status,
      severity: args.severity,
      description: args.description,
    }),
    whyItMatters: buildWhyItMatters({
      status: args.status,
      evidenceState,
      proofState,
      memoryCount: reusableMemoryCount,
      recurringResolutionReason,
      familySummary: args.familySummary,
    }),
    nextStep:
      args.familySummary.nextStep ||
      args.suggestedActions[0] ||
      "Review the records, record an operator decision, and attach evidence before exporting proof.",
    evidenceState,
    proofState,
    memoryState,
    evidenceCount: args.evidenceSummary.total,
    attestedEvidenceCount: args.evidenceSummary.attested,
    degradedEvidenceCount: args.evidenceSummary.degraded,
    proofPackageCount: args.proofSummary.total,
    finalizedProofPackageCount: args.proofSummary.finalized,
    bestCompletenessScore,
    missingEvidenceCount,
    memoryCount: reusableMemoryCount,
    recurringResolutionReason,
    familyLabel: args.familySummary.familyLabel,
    familyState: args.familySummary.state,
    supportingCaseCount: args.familySummary.supportingCaseCount,
    recurrencePosture: args.familySummary.recurrencePosture,
    reopenedCaseCount: args.familySummary.reopenedCaseCount,
    reopenRate: args.familySummary.reopenRate,
    dominantResolutionCode: args.familySummary.dominantResolutionCode,
    latestResolution,
  };
}

async function loadTopArchetypes(
  prisma: PrismaClient,
  tenantId: string,
  exceptionIds: string[]
): Promise<
  Map<
    string,
    { id: string; code: string; label: string; confidence: number; category?: string | null }
  >
> {
  const result = new Map<
    string,
    { id: string; code: string; label: string; confidence: number; category?: string | null }
  >();

  if (exceptionIds.length === 0) {
    return result;
  }

  const classifications = await prisma.exceptionArchetypeClassification.findMany({
    where: {
      tenantId,
      exceptionId: { in: exceptionIds },
    },
    select: {
      exceptionId: true,
      archetypeId: true,
      confidence: true,
    },
    orderBy: {
      confidence: "desc",
    },
  });

  const archetypeIds = Array.from(
    new Set(classifications.map((item: { archetypeId: string }) => item.archetypeId))
  );
  if (archetypeIds.length === 0) {
    return result;
  }

  const archetypes = await prisma.exceptionArchetype.findMany({
    where: {
      tenantId,
      id: { in: archetypeIds },
    },
    select: {
      id: true,
      code: true,
      label: true,
      category: true,
    },
  });

  const archetypeMap = new Map<
    string,
    { id: string; code: string; label: string; category: string | null }
  >(
    archetypes.map((item: { id: string; code: string; label: string; category: string | null }) => [
      item.id,
      item,
    ])
  );

  for (const classification of classifications) {
    if (result.has(classification.exceptionId)) {
      continue;
    }
    const archetype = archetypeMap.get(classification.archetypeId);
    if (!archetype) {
      continue;
    }
    result.set(classification.exceptionId, {
      id: archetype.id,
      code: archetype.code,
      label: archetype.label,
      confidence: Number(classification.confidence),
      category: archetype.category,
    });
  }

  return result;
}

function mapListItem(row: {
  id: string;
  runId: string;
  matchType: string;
  confidence: unknown;
  matchReason: string | null;
  status: string;
  reviewed: boolean;
  resolutionReason: string | null;
  notes: string | null;
  severity: string;
  createdAt: Date;
  sourceTransactionId: string;
  targetTransactionId: string | null;
  assignedTo: string | null;
  sourceTransaction: {
    amount: unknown;
    currency: string | null;
    description: string | null;
  } | null;
  latestMemory?: {
    resolutionReason: string | null;
    operatorNotes: string | null;
    completedAt: Date | null;
  } | null;
  topArchetype?: {
    code: string;
    label: string;
  } | null;
}): ReconciliationWorkbenchListItem {
  const canonicalStatus = toCanonicalExceptionStatus({
    status: row.status,
    reviewed: row.reviewed,
    matchReason: row.matchReason,
  });

  const tags: string[] = [];
  pushTag(tags, row.topArchetype?.code ?? null);
  pushTag(tags, row.matchType === "conflict" ? "conflict" : null);
  pushTag(tags, row.resolutionReason);
  pushTag(tags, row.matchReason?.toLowerCase().includes("date") ? "date_drift" : null);
  pushTag(tags, row.matchReason?.toLowerCase().includes("amount") ? "amount_mismatch" : null);

  return {
    id: row.id,
    type: resolveExceptionType({
      topArchetypeCode: row.topArchetype?.code ?? null,
      matchType: row.matchType,
      matchReason: row.matchReason,
    }),
    matchType: row.matchType,
    status: toOperatorExceptionStatus(canonicalStatus),
    canonicalStatus,
    severity: (row.severity || "medium") as "low" | "medium" | "high" | "critical",
    detectedAt: row.createdAt.toISOString(),
    description: buildDescription({
      sourceDescription: row.sourceTransaction?.description,
      matchReason: row.matchReason,
      matchType: row.matchType,
    }),
    statusDetail: buildStatusDetail({
      canonicalStatus,
      assignedTo: row.assignedTo,
      latestResolutionReason: row.latestMemory?.resolutionReason ?? row.resolutionReason,
      latestOperatorNotes: row.latestMemory?.operatorNotes ?? row.notes,
      latestCompletedAt: row.latestMemory?.completedAt ?? null,
    }),
    reasonTags: tags.length > 0 ? tags : undefined,
    amount:
      typeof row.sourceTransaction?.amount === "number"
        ? row.sourceTransaction.amount
        : row.sourceTransaction?.amount != null
          ? Number(row.sourceTransaction.amount)
          : undefined,
    currency: row.sourceTransaction?.currency ?? undefined,
    confidenceScore:
      row.confidence != null && row.confidence !== "" ? Number(row.confidence) : null,
    sourceTransactionId: row.sourceTransactionId,
    targetTransactionId: row.targetTransactionId,
    runId: row.runId,
    assignedTo: row.assignedTo,
    resolutionReason: row.resolutionReason,
  };
}

export async function listReconciliationWorkbenchExceptions(
  prisma: PrismaClient,
  filters: ReconciliationWorkbenchListFilters
): Promise<
  ReconciliationWorkbenchOutcome<{
    items: ReconciliationWorkbenchListItem[];
    total: number;
    limit: number;
    offset: number;
  }>
> {
  const scope = await resolveReconciliationExceptionScope({
    prisma,
    tenantId: filters.tenantId,
    runId: filters.runId,
    runKind: filters.runKind,
  });

  if (scope.kind === "not_found" || scope.kind === "ambiguous_uuid_collision") {
    return scope;
  }

  const where: Record<string, unknown> = {
    tenantId: filters.tenantId,
    matchType: { in: [...EXCEPTION_MATCH_TYPES] },
  };

  if (scope.kind === "scoped") {
    if (scope.runIds.length === 0) {
      return {
        kind: "ok",
        data: {
          items: [],
          total: 0,
          limit: filters.limit,
          offset: filters.offset,
        },
      };
    }
    where["runId"] = { in: scope.runIds };
  }

  const canonicalStatus = operatorStatusToCanonical(filters.status);
  if (canonicalStatus) {
    where["status"] = canonicalStatus;
  }

  if (filters.severity) {
    where["severity"] = filters.severity;
  }

  const normalizedType = filters.type?.trim().toLowerCase() ?? null;
  if (normalizedType === "conflict" || normalizedType === "conflicts") {
    where["matchType"] = "conflict";
  } else if (normalizedType === "unmatched") {
    where["matchType"] = "unmatched";
  }

  if (filters.search?.trim()) {
    where["OR"] = [
      { notes: { contains: filters.search.trim(), mode: "insensitive" } },
      { matchReason: { contains: filters.search.trim(), mode: "insensitive" } },
      {
        sourceTransaction: {
          description: { contains: filters.search.trim(), mode: "insensitive" },
        },
      },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.reconciliationMatch.findMany({
      where: where as any,
      include: {
        sourceTransaction: {
          select: {
            amount: true,
            currency: true,
            description: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.reconciliationMatch.count({ where: where as any }),
  ]);

  const runIdsOnPage = [...new Set(rows.map((row: (typeof rows)[number]) => row.runId))] as string[];
  const runComparisonByRunId = await buildExceptionRunComparisonSnapshotForRunIds(
    prisma,
    filters.tenantId,
    runIdsOnPage
  );

  const exceptionIds = rows.map((row: { id: string }) => row.id);
  const [topArchetypes, latestMemories, allMemories, evidenceArtifacts, proofPackages] =
    await Promise.all([
      loadTopArchetypes(prisma, filters.tenantId, exceptionIds),
      prisma.exceptionAdjudicationMemory.findMany({
        where: {
          tenantId: filters.tenantId,
          exceptionId: { in: exceptionIds },
        },
        select: {
          exceptionId: true,
          resolutionReason: true,
          resolutionCode: true,
          operatorNotes: true,
          completedAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.exceptionAdjudicationMemory.findMany({
        where: {
          tenantId: filters.tenantId,
          exceptionId: { in: exceptionIds },
        },
        select: {
          id: true,
          exceptionId: true,
          resolution: true,
          resolutionReason: true,
          resolutionCode: true,
          adjudicationType: true,
          adjudicatorId: true,
          adjudicatorType: true,
          outcome: true,
          confidence: true,
          sourceTrustScore: true,
          operatorNotes: true,
          systemNotes: true,
          evidenceIds: true,
          createdAt: true,
          completedAt: true,
          parentMemoryId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.evidenceArtifact.findMany({
        where: {
          tenantId: filters.tenantId,
          exceptionId: { in: exceptionIds },
        },
        select: {
          id: true,
          exceptionId: true,
          artifactType: true,
          artifactKey: true,
          capturedAt: true,
          capturedBy: true,
          degraded: true,
          degradedReasons: true,
          attested: true,
          reliabilityScore: true,
        },
        orderBy: {
          capturedAt: "desc",
        },
      }),
      exceptionIds.length > 0
        ? prisma.proofPackage.findMany({
            where: {
              tenantId: filters.tenantId,
              OR: exceptionIds.map((exceptionId: string) => ({
                packageKey: { startsWith: `exception:${exceptionId}:` },
              })),
            },
            select: {
              id: true,
              packageType: true,
              packageKey: true,
              status: true,
              completenessScore: true,
              missingEvidence: true,
              completenessFlags: true,
              evidenceIds: true,
              createdAt: true,
              finalizedAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          })
        : Promise.resolve([]),
    ]);

  const latestMemoryByException = new Map<
    string,
    { resolutionReason: string | null; operatorNotes: string | null; completedAt: Date | null }
  >();
  for (const memory of latestMemories) {
    if (!latestMemoryByException.has(memory.exceptionId)) {
      latestMemoryByException.set(memory.exceptionId, {
        resolutionReason: memory.resolutionReason,
        operatorNotes: memory.operatorNotes,
        completedAt: memory.completedAt,
      });
    }
  }

  const items = rows.map((row: (typeof rows)[number]) => {
    const mapped = mapListItem({
      id: row.id,
      runId: row.runId,
      matchType: row.matchType,
      confidence: row.confidence,
      matchReason: row.matchReason,
      status: row.status,
      reviewed: row.reviewed,
      resolutionReason: row.resolutionReason,
      notes: row.notes,
      severity: row.severity,
      createdAt: row.createdAt,
      sourceTransactionId: row.sourceTransactionId,
      targetTransactionId: row.targetTransactionId,
      assignedTo: row.assignedTo,
      sourceTransaction: row.sourceTransaction
        ? {
            amount: row.sourceTransaction.amount,
            currency: row.sourceTransaction.currency,
            description: row.sourceTransaction.description,
          }
        : null,
      latestMemory: latestMemoryByException.get(row.id) ?? null,
      topArchetype: topArchetypes.get(row.id) ?? null,
    });

    const memories = allMemories
      .filter((memory: (typeof allMemories)[number]) => memory.exceptionId === row.id)
      .map((memory: (typeof allMemories)[number]) => ({
        ...memory,
        resolutionReason: memory.resolutionReason ?? null,
        outcome: memory.outcome ?? null,
        confidence: memory.confidence != null ? Number(memory.confidence) : null,
        sourceTrustScore: memory.sourceTrustScore != null ? Number(memory.sourceTrustScore) : null,
        operatorNotes: memory.operatorNotes ?? null,
        systemNotes: memory.systemNotes ?? null,
        evidenceIds: Array.isArray(memory.evidenceIds) ? memory.evidenceIds.filter(isString) : [],
        createdAt: memory.createdAt.toISOString(),
        completedAt: memory.completedAt?.toISOString() ?? null,
        parentMemoryId: memory.parentMemoryId ?? null,
      }));

    const evidenceSummary = {
      total: 0,
      degraded: 0,
      attested: 0,
      latestCapturedAt: null as string | null,
      items: [] as ReconciliationWorkbenchDetail["evidenceSummary"]["items"],
    };

    for (const evidence of evidenceArtifacts.filter(
      (artifact: (typeof evidenceArtifacts)[number]) => artifact.exceptionId === row.id
    )) {
      evidenceSummary.total += 1;
      if (evidence.degraded) evidenceSummary.degraded += 1;
      if (evidence.attested) evidenceSummary.attested += 1;
      if (!evidenceSummary.latestCapturedAt) {
        evidenceSummary.latestCapturedAt = evidence.capturedAt.toISOString();
      }
      evidenceSummary.items.push({
        id: evidence.id,
        artifactType: evidence.artifactType,
        artifactKey: evidence.artifactKey,
        capturedAt: evidence.capturedAt.toISOString(),
        capturedBy: evidence.capturedBy,
        degraded: evidence.degraded,
        degradedReasons: Array.isArray(evidence.degradedReasons)
          ? evidence.degradedReasons.filter(isString)
          : [],
        attested: evidence.attested,
        reliabilityScore:
          evidence.reliabilityScore != null ? Number(evidence.reliabilityScore) : null,
      });
    }

    const proofSummary = {
      total: 0,
      finalized: 0,
      latestCreatedAt: null as string | null,
      items: [] as ReconciliationWorkbenchDetail["proofSummary"]["items"],
    };

    for (const proof of proofPackages.filter((item: (typeof proofPackages)[number]) =>
      item.packageKey.startsWith(`exception:${row.id}:`)
    )) {
      proofSummary.total += 1;
      if (proof.status === "finalized") {
        proofSummary.finalized += 1;
      }
      if (!proofSummary.latestCreatedAt) {
        proofSummary.latestCreatedAt = proof.createdAt.toISOString();
      }
      proofSummary.items.push({
        id: proof.id,
        packageType: proof.packageType,
        packageKey: proof.packageKey,
        status: proof.status,
        completenessScore: Number(proof.completenessScore),
        missingEvidence: Array.isArray(proof.missingEvidence)
          ? proof.missingEvidence.filter(isString)
          : [],
        completenessFlags: Array.isArray(proof.completenessFlags)
          ? proof.completenessFlags.filter(isString)
          : [],
        evidenceIds: Array.isArray(proof.evidenceIds) ? proof.evidenceIds.filter(isString) : [],
        createdAt: proof.createdAt.toISOString(),
        finalizedAt: proof.finalizedAt?.toISOString() ?? null,
      });
    }

    const operatorSummary = buildExceptionOperatorSummary({
      status: mapped.canonicalStatus,
      severity: mapped.severity,
      description: mapped.description,
      suggestedActions: buildSuggestedActions(mapped.canonicalStatus, evidenceSummary.total > 0),
      adjudicationMemories: memories,
      evidenceSummary,
      proofSummary,
      familySummary: buildExceptionFamilySummary({
        currentExceptionId: row.id,
        currentStatus: mapped.canonicalStatus,
        familyCode:
          topArchetypes.get(row.id)?.code ??
          predictExceptionArchetype({
            matchType: row.matchType,
            amountDiff: row.amountDiff != null ? Number(row.amountDiff) : null,
            dateDiff: row.dateDiff,
            confidence: row.confidence != null ? Number(row.confidence) : null,
            hasTargetTransaction: Boolean(row.targetTransactionId),
            matchReason: row.matchReason,
          }).code,
        familyLabel:
          topArchetypes.get(row.id)?.label ??
          predictExceptionArchetype({
            matchType: row.matchType,
            amountDiff: row.amountDiff != null ? Number(row.amountDiff) : null,
            dateDiff: row.dateDiff,
            confidence: row.confidence != null ? Number(row.confidence) : null,
            hasTargetTransaction: Boolean(row.targetTransactionId),
            matchReason: row.matchReason,
          }).label,
        familyCategory:
          topArchetypes.get(row.id)?.category ??
          predictExceptionArchetype({
            matchType: row.matchType,
            amountDiff: row.amountDiff != null ? Number(row.amountDiff) : null,
            dateDiff: row.dateDiff,
            confidence: row.confidence != null ? Number(row.confidence) : null,
            hasTargetTransaction: Boolean(row.targetTransactionId),
            matchReason: row.matchReason,
          }).category,
        memories: memories.map((memory: (typeof memories)[number]) => ({
          exceptionId: row.id,
          resolution: memory.resolution,
          resolutionReason: memory.resolutionReason,
          resolutionCode: memory.resolutionCode ?? null,
          outcome: memory.outcome,
          adjudicationType: memory.adjudicationType,
          confidence: memory.confidence,
          sourceTrustScore: memory.sourceTrustScore,
          createdAt: memory.createdAt,
        })),
      }),
    });

    const supportDegradedReasons: string[] = [];
    if (operatorSummary.evidenceState !== "ready") {
      supportDegradedReasons.push("Evidence is incomplete or degraded.");
    }
    if (operatorSummary.proofState !== "ready") {
      supportDegradedReasons.push("Proof package is not finalized and complete.");
    }
    if (operatorSummary.memoryState === "setup_required") {
      supportDegradedReasons.push("Recurring adjudication memory has not been established.");
    }

    const runComparison = runComparisonByRunId.get(row.runId);
    const proofDeltaChanged =
      runComparison?.changedSincePreviousRun === "changed"
        ? "changed"
        : runComparison?.changedSincePreviousRun === "unchanged"
          ? "unchanged"
          : "unavailable";
    const proofChangeSummary = runComparison?.summary
      ? runComparison.summary
      : "Run-over-run proof delta is unavailable; baseline or history is missing.";

    return {
      ...mapped,
      compactSummary: {
        recurrence: {
          memoryCount: operatorSummary.memoryCount,
          recurringResolutionReason: operatorSummary.recurringResolutionReason,
          familyLabel: operatorSummary.familyLabel,
          recurrencePosture: operatorSummary.recurrencePosture,
          state: operatorSummary.memoryState,
        },
        evidence: {
          total: operatorSummary.evidenceCount,
          degraded: operatorSummary.degradedEvidenceCount,
          attested: operatorSummary.attestedEvidenceCount,
          state: operatorSummary.evidenceState,
        },
        proof: {
          total: operatorSummary.proofPackageCount,
          finalized: operatorSummary.finalizedProofPackageCount,
          bestCompletenessScore: operatorSummary.bestCompletenessScore,
          missingEvidenceCount: operatorSummary.missingEvidenceCount,
          state: operatorSummary.proofState,
          changedSincePreviousRun: proofDeltaChanged,
          changeSummary: proofChangeSummary,
        },
        supportability: {
          degradedReasons: supportDegradedReasons,
          nextStep: operatorSummary.nextStep,
        },
      },
    };
  });

  return {
    kind: "ok",
    data: {
      items,
      total,
      limit: filters.limit,
      offset: filters.offset,
    },
  };
}

export async function getReconciliationWorkbenchExceptionDetail(
  prisma: PrismaClient,
  tenantId: string,
  exceptionId: string
): Promise<ReconciliationWorkbenchDetail | null> {
  const row = await prisma.reconciliationMatch.findFirst({
    where: {
      tenantId,
      id: exceptionId,
      matchType: { in: [...EXCEPTION_MATCH_TYPES] },
    },
    include: {
      sourceTransaction: {
        select: {
          id: true,
          amount: true,
          currency: true,
          date: true,
          description: true,
          externalId: true,
        },
      },
      run: {
        select: {
          id: true,
          tenantId: true,
          ingestionId: true,
          name: true,
          metadata: true,
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const targetIds = row.targetTransactionId ? [row.targetTransactionId] : [];
  const [
    targetTransactions,
    memories,
    evidenceArtifacts,
    proofPackages,
    provenance,
    topArchetypes,
    similarMemories,
    runComparisonByRunId,
  ] = await Promise.all([
    targetIds.length > 0
      ? prisma.normalizedTransaction.findMany({
          where: {
            tenantId,
            id: { in: targetIds },
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            date: true,
            description: true,
            externalId: true,
          },
        })
      : Promise.resolve([]),
    prisma.exceptionAdjudicationMemory.findMany({
      where: {
        tenantId,
        exceptionId,
      },
      select: {
        id: true,
        resolution: true,
        resolutionReason: true,
        resolutionCode: true,
        adjudicationType: true,
        adjudicatorId: true,
        adjudicatorType: true,
        outcome: true,
        confidence: true,
        sourceTrustScore: true,
        operatorNotes: true,
        systemNotes: true,
        evidenceIds: true,
        createdAt: true,
        completedAt: true,
        parentMemoryId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.evidenceArtifact.findMany({
      where: {
        tenantId,
        exceptionId,
      },
      select: {
        id: true,
        artifactType: true,
        artifactKey: true,
        capturedAt: true,
        capturedBy: true,
        degraded: true,
        degradedReasons: true,
        attested: true,
        reliabilityScore: true,
      },
      orderBy: {
        capturedAt: "desc",
      },
    }),
    prisma.proofPackage.findMany({
      where: {
        tenantId,
        packageKey: {
          startsWith: `exception:${exceptionId}:`,
        },
      },
      select: {
        id: true,
        packageType: true,
        packageKey: true,
        status: true,
        completenessScore: true,
        missingEvidence: true,
        completenessFlags: true,
        evidenceIds: true,
        createdAt: true,
        finalizedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.reconciliationProvenance.findMany({
      where: {
        tenantId,
        matchId: exceptionId,
      },
      select: {
        eventType: true,
        actorType: true,
        actorUserId: true,
        details: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    loadTopArchetypes(prisma, tenantId, [exceptionId]),
    // Fetch similar resolved cases for compounding intelligence
    prisma.exceptionAdjudicationMemory.findMany({
      where: {
        tenantId,
        exceptionId: { not: exceptionId },
        outcome: { in: ["resolved", "confirmed_dismissed"] },
      },
      select: {
        id: true,
        exceptionId: true,
        resolution: true,
        resolutionReason: true,
        resolutionCode: true,
        archetypeId: true,
        outcome: true,
        createdAt: true,
        confidence: true,
        sourceTrustScore: true,
        adjudicatorId: true,
        archetype: {
          select: { code: true, label: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: SIMILAR_RESOLVED_CASE_SCAN_LIMIT,
    }),
    buildExceptionRunComparisonSnapshotForRunIds(prisma, tenantId, [row.runId]),
  ]);

  const runComparisonSnapshot = runComparisonByRunId.get(row.runId) ?? null;

  const topArchetype = topArchetypes.get(exceptionId) ?? null;
  const predictedFamily = predictExceptionArchetype({
    matchType: row.matchType,
    amountDiff: row.amountDiff != null ? Number(row.amountDiff) : null,
    dateDiff: row.dateDiff,
    confidence: Number(row.confidence),
    hasTargetTransaction: Boolean(row.targetTransactionId),
    matchReason: row.matchReason,
  });
  const derivedFamilyArchetype =
    topArchetype ??
    (await prisma.exceptionArchetype
      .findFirst({
        where: {
          tenantId,
          code: predictedFamily.code,
        },
        select: {
          id: true,
          code: true,
          label: true,
          category: true,
        },
      })
      .then((item: { id: string; code: string; label: string; category: string } | null) =>
        item
          ? {
              id: item.id,
              code: item.code,
              label: item.label,
              confidence: predictedFamily.confidence,
              category: item.category,
            }
          : {
              id: "",
              code: predictedFamily.code,
              label: predictedFamily.label,
              confidence: predictedFamily.confidence,
              category: predictedFamily.category,
            }
      ));
  const familyMemories =
    derivedFamilyArchetype.id !== ""
      ? await prisma.exceptionAdjudicationMemory.findMany({
          where: {
            tenantId,
            archetypeId: derivedFamilyArchetype.id,
          },
          include: {
            archetype: {
              select: { code: true, label: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : [];
  const targetTransaction = targetTransactions[0] ?? null;
  const latestMemory = memories[0] ?? null;

  const listItem = mapListItem({
    id: row.id,
    runId: row.runId,
    matchType: row.matchType,
    confidence: row.confidence,
    matchReason: row.matchReason,
    status: row.status,
    reviewed: row.reviewed,
    resolutionReason: row.resolutionReason,
    notes: row.notes,
    severity: row.severity,
    createdAt: row.createdAt,
    sourceTransactionId: row.sourceTransactionId,
    targetTransactionId: row.targetTransactionId,
    assignedTo: row.assignedTo,
    sourceTransaction: row.sourceTransaction
      ? {
          amount: row.sourceTransaction.amount,
          currency: row.sourceTransaction.currency,
          description: row.sourceTransaction.description,
        }
      : null,
    latestMemory: latestMemory
      ? {
          resolutionReason: latestMemory.resolutionReason,
          operatorNotes: latestMemory.operatorNotes,
          completedAt: latestMemory.completedAt,
        }
      : null,
    topArchetype,
  });

  const auditTrail = [
    {
      timestamp: row.createdAt.toISOString(),
      action: "Detected",
      user: "system",
      details: row.matchReason ?? undefined,
    },
    ...provenance.map((entry: (typeof provenance)[number]) => ({
      timestamp: entry.createdAt.toISOString(),
      action: entry.eventType.replace(/_/g, " "),
      user: entry.actorUserId ?? entry.actorType,
      details:
        entry.details && typeof entry.details === "object"
          ? JSON.stringify(entry.details)
          : entry.details
            ? String(entry.details)
            : undefined,
    })),
    ...memories
      .slice()
      .reverse()
      .map((memory: (typeof memories)[number]) => ({
        timestamp: memory.completedAt?.toISOString() ?? memory.createdAt.toISOString(),
        action:
          memory.outcome === "reopened"
            ? "Reopened"
            : memory.resolution === "ignored"
              ? "Ignored"
              : memory.outcome === "re_adjudicated"
                ? "Re-adjudicated"
                : "Resolved",
        user: memory.adjudicatorId,
        details: memory.resolutionReason ?? memory.operatorNotes ?? undefined,
      })),
  ];

  const evidenceSummary = {
    total: evidenceArtifacts.length,
    degraded: evidenceArtifacts.filter((item: (typeof evidenceArtifacts)[number]) => item.degraded)
      .length,
    attested: evidenceArtifacts.filter((item: (typeof evidenceArtifacts)[number]) => item.attested)
      .length,
    latestCapturedAt: evidenceArtifacts[0]?.capturedAt.toISOString() ?? null,
    items: evidenceArtifacts.map((item: (typeof evidenceArtifacts)[number]) => ({
      id: item.id,
      artifactType: item.artifactType,
      artifactKey: item.artifactKey,
      capturedAt: item.capturedAt.toISOString(),
      capturedBy: item.capturedBy,
      degraded: item.degraded,
      degradedReasons: Array.isArray(item.degradedReasons)
        ? item.degradedReasons.filter(isString)
        : [],
      attested: item.attested,
      reliabilityScore: item.reliabilityScore != null ? Number(item.reliabilityScore) : null,
    })),
  };
  const proofSummary = {
    total: proofPackages.length,
    finalized: proofPackages.filter(
      (item: (typeof proofPackages)[number]) => item.status === "finalized"
    ).length,
    latestCreatedAt: proofPackages[0]?.createdAt.toISOString() ?? null,
    items: proofPackages.map((item: (typeof proofPackages)[number]) => ({
      id: item.id,
      packageType: item.packageType,
      packageKey: item.packageKey,
      status: item.status,
      completenessScore: Number(item.completenessScore),
      missingEvidence: Array.isArray(item.missingEvidence)
        ? item.missingEvidence.filter(isString)
        : [],
      completenessFlags: Array.isArray(item.completenessFlags)
        ? item.completenessFlags.filter(isString)
        : [],
      evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds.filter(isString) : [],
      createdAt: item.createdAt.toISOString(),
      finalizedAt: item.finalizedAt?.toISOString() ?? null,
    })),
  };
  const adjudicationMemories = memories.map((memory: (typeof memories)[number]) => ({
    id: memory.id,
    resolution: memory.resolution,
    resolutionReason: memory.resolutionReason,
    resolutionCode: memory.resolutionCode ?? null,
    adjudicationType: memory.adjudicationType,
    adjudicatorId: memory.adjudicatorId,
    adjudicatorType: memory.adjudicatorType,
    outcome: memory.outcome,
    confidence: memory.confidence != null ? Number(memory.confidence) : null,
    sourceTrustScore: memory.sourceTrustScore != null ? Number(memory.sourceTrustScore) : null,
    operatorNotes: memory.operatorNotes,
    systemNotes: memory.systemNotes,
    evidenceIds: Array.isArray(memory.evidenceIds) ? memory.evidenceIds.filter(isString) : [],
    createdAt: memory.createdAt.toISOString(),
    completedAt: memory.completedAt?.toISOString() ?? null,
    parentMemoryId: memory.parentMemoryId,
  }));
  const familySummary = buildExceptionFamilySummary({
    currentExceptionId: exceptionId,
    currentStatus: listItem.canonicalStatus,
    familyCode: derivedFamilyArchetype.code,
    familyLabel: derivedFamilyArchetype.label,
    familyCategory: derivedFamilyArchetype.category ?? null,
    memories: familyMemories.map((memory: (typeof familyMemories)[number]) => ({
      exceptionId: memory.exceptionId,
      resolution: memory.resolution,
      resolutionReason: memory.resolutionReason,
      resolutionCode: memory.resolutionCode ?? null,
      outcome: memory.outcome ?? null,
      adjudicationType: memory.adjudicationType,
      confidence: memory.confidence != null ? Number(memory.confidence) : null,
      sourceTrustScore: memory.sourceTrustScore != null ? Number(memory.sourceTrustScore) : null,
      createdAt: memory.createdAt,
    })),
  });
  const suggestedActions = buildSuggestedActions(
    listItem.canonicalStatus,
    evidenceArtifacts.length > 0
  );
  const operatorSummary = buildExceptionOperatorSummary({
    status: listItem.canonicalStatus,
    severity: listItem.severity,
    description: listItem.description,
    suggestedActions,
    adjudicationMemories,
    evidenceSummary,
    proofSummary,
    familySummary,
  });

  // Compounding intelligence: score similar resolved cases by match type + resolution pattern
  const currentMatchType = row.matchType;
  const currentMatchReason = row.matchReason ?? "";
  const currentResolutionCode =
    latestMemory?.resolutionCode ??
    normalizeExceptionResolutionReason({
      resolution: "manual",
      explicitReason: latestMemory?.resolutionReason ?? null,
      note: latestMemory?.operatorNotes ?? null,
    }).resolutionCode;
  const similarSource =
    familyMemories.length > 0
      ? familyMemories.filter(
          (memory: (typeof familyMemories)[number]) => memory.exceptionId !== exceptionId
        )
      : similarMemories;
  const scoredSimilarCases = similarSource
    .map((mem: SimilarResolvedMemoryRow): SimilarScoredCaseRow => {
      let score = 0;
      if (derivedFamilyArchetype.id && mem.archetypeId === derivedFamilyArchetype.id) {
        score += 0.45;
      }

      const normalizedCandidateResolutionCode =
        mem.resolutionCode ??
        normalizeExceptionResolutionReason({
          resolution:
            mem.resolution === "matched" ||
            mem.resolution === "manual" ||
            mem.resolution === "ignored" ||
            mem.resolution === "duplicate"
              ? mem.resolution
              : "manual",
          explicitReason: mem.resolutionReason,
        }).resolutionCode;
      if (normalizedCandidateResolutionCode === currentResolutionCode) {
        score += 0.25;
      } else if (mem.resolution === latestMemory?.resolution) {
        score += 0.15;
      }

      // Shared resolution reason keywords
      const memReason = mem.resolutionReason ?? "";
      if (memReason && currentMatchReason && memReason.includes(currentMatchReason.split(" ")[0])) {
        score += 0.15;
      }

      if (mem.outcome === "resolved" || mem.outcome === "confirmed_dismissed") {
        score += 0.1;
      }
      if (mem.sourceTrustScore != null && Number(mem.sourceTrustScore) >= 0.8) {
        score += 0.05;
      }
      // Recency boost: more recent = more relevant
      const ageDays = (Date.now() - mem.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 0.2 * (1 - ageDays / 90));
      return {
        memoryId: mem.id,
        exceptionId: mem.exceptionId,
        resolution: mem.resolution,
        resolutionReason: mem.resolutionReason,
        resolutionCode: normalizedCandidateResolutionCode,
        outcome: mem.outcome,
        confidence: mem.confidence != null && mem.confidence !== "" ? Number(mem.confidence) : null,
        adjudicatedAt: mem.createdAt.toISOString(),
        adjudicatorId: mem.adjudicatorId,
        archetypeCode: mem.archetype?.code ?? null,
        archetypeLabel: mem.archetype?.label ?? null,
        _score: score,
      };
    })
    .filter((c: SimilarScoredCaseRow) => c._score > 0.1)
    .sort((a: SimilarScoredCaseRow, b: SimilarScoredCaseRow) => b._score - a._score)
    .slice(0, 5)
    .map((item: SimilarScoredCaseRow) => {
      const { _score, ...rest } = item;
      void _score;
      return rest;
    });

  // Why-flagged: deterministic explanation of why this exception was created
  const primaryReasons: Array<{ reason: string; code: string; weight: number; evidence?: string }> =
    [];
  const secondaryReasons: Array<{ reason: string; code: string; weight: number }> = [];

  if (row.amountDiff != null && Number(row.amountDiff) !== 0) {
    primaryReasons.push({
      reason: `Amount mismatch: ${Number(row.amountDiff).toFixed(2)} difference detected`,
      code: "AMOUNT_MISMATCH",
      weight: Math.min(Math.abs(Number(row.amountDiff)) / 100, 1.0),
      evidence: row.sourceTransaction
        ? `Source amount: ${Number(row.sourceTransaction.amount)}`
        : undefined,
    });
  }
  if (row.dateDiff != null && Math.abs(row.dateDiff) > 0) {
    secondaryReasons.push({
      reason: `Date drift: ${row.dateDiff} day(s) difference`,
      code: "DATE_DRIFT",
      weight: Math.min(Math.abs(row.dateDiff) / 30, 1.0),
    });
  }
  const confidence = Number(row.confidence);
  if (confidence < 0.8) {
    primaryReasons.push({
      reason: `Low match confidence: ${(confidence * 100).toFixed(1)}%`,
      code: "LOW_CONFIDENCE",
      weight: 1.0 - confidence,
      evidence: "Confidence score below 0.8 threshold",
    });
  }
  if (!row.targetTransactionId) {
    primaryReasons.push({
      reason: "No matching record found in target dataset",
      code: "MISSING_IN_TARGET",
      weight: 0.9,
      evidence: `Source transaction ${row.sourceTransactionId} has no counterpart`,
    });
  }
  if (currentMatchType === "conflict") {
    primaryReasons.push({
      reason: "Conflicting match: multiple potential matches detected",
      code: "CONFLICT",
      weight: 0.85,
    });
  }

  const whyFlaggedConfidence =
    primaryReasons.length > 0
      ? primaryReasons.reduce((sum, r) => sum + r.weight, 0) / primaryReasons.length
      : 0.5;

  const whyFlagged = {
    primaryReasons,
    secondaryReasons,
    confidence: Math.round(whyFlaggedConfidence * 10000) / 10000,
    similarCaseCount: scoredSimilarCases.length,
  };

  const adjudicationOutcomeCounts: Record<string, number> = {};
  for (const m of memories) {
    const key = m.outcome ?? "unknown";
    adjudicationOutcomeCounts[key] = (adjudicationOutcomeCounts[key] ?? 0) + 1;
  }

  const exceptionIntelligence: ExceptionDetailIntelligence = {
    state: familySummary.state,
    reasonCodes: [...familySummary.reasonCodes],
    similarCaseScanLimit: SIMILAR_RESOLVED_CASE_SCAN_LIMIT,
    familySummary,
    recentAdjudicationsOnException: memories.slice(0, 20).map((m: (typeof memories)[number]) => ({
      memoryId: m.id,
      resolution: m.resolution,
      resolutionReason: m.resolutionReason,
      resolutionCode: m.resolutionCode,
      outcome: m.outcome,
      adjudicationType: m.adjudicationType,
      adjudicatorType: m.adjudicatorType,
      completedAt: m.completedAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
    adjudicationOutcomeCounts,
    similarResolvedCases: scoredSimilarCases.map((c: (typeof scoredSimilarCases)[number]) => ({
      exceptionId: c.exceptionId,
      memoryId: c.memoryId,
      resolution: c.resolution,
      resolutionReason: c.resolutionReason,
      resolutionCode: c.resolutionCode,
      outcome: c.outcome,
      adjudicatedAt: c.adjudicatedAt,
      adjudicatorId: c.adjudicatorId,
      archetypeCode: c.archetypeCode,
      archetypeLabel: c.archetypeLabel,
    })),
    recurrenceReasonCodes: [...familySummary.reasonCodes],
  };

  const proofLineage = buildExceptionProofLineage({
    runId: row.runId,
    evidenceArtifactIds: evidenceSummary.items.map(
      (i: ReconciliationWorkbenchDetail["evidenceSummary"]["items"][number]) => i.id
    ),
    proofPackageIds: proofSummary.items.map(
      (i: ReconciliationWorkbenchDetail["proofSummary"]["items"][number]) => i.id
    ),
    adjudicationMemoryIds: adjudicationMemories.map(
      (m: ReconciliationWorkbenchDetail["adjudicationMemories"][number]) => m.id
    ),
    runComparison: runComparisonSnapshot,
  });

  return {
    ...listItem,
    notes: row.notes,
    sourceSystem:
      (asJsonObject(row.run.metadata)["sourceAdapter"] as string | undefined) ??
      (asJsonObject(row.run.metadata)["sourceSystem"] as string | undefined) ??
      null,
    targetSystem:
      (asJsonObject(row.run.metadata)["targetAdapter"] as string | undefined) ??
      (asJsonObject(row.run.metadata)["targetSystem"] as string | undefined) ??
      null,
    runMetadata: asJsonObject(row.run.metadata),
    expectedValue: row.sourceTransaction
      ? {
          transactionId: row.sourceTransaction.id,
          amount: Number(row.sourceTransaction.amount),
          currency: row.sourceTransaction.currency,
          date: row.sourceTransaction.date.toISOString(),
          description: row.sourceTransaction.description,
          externalId: row.sourceTransaction.externalId,
        }
      : null,
    actualValue: targetTransaction
      ? {
          transactionId: targetTransaction.id,
          amount: Number(targetTransaction.amount),
          currency: targetTransaction.currency,
          date: targetTransaction.date.toISOString(),
          description: targetTransaction.description,
          externalId: targetTransaction.externalId,
          amountDiff:
            row.amountDiff != null
              ? Number(row.amountDiff)
              : Number(row.sourceTransaction?.amount ?? 0) - Number(targetTransaction.amount),
          dateDiff: row.dateDiff ?? null,
        }
      : {
          transactionId: null,
          amountDiff: row.amountDiff != null ? Number(row.amountDiff) : null,
          dateDiff: row.dateDiff ?? null,
          matchReason: row.matchReason,
        },
    resolution: latestMemory?.operatorNotes ?? row.notes ?? row.resolutionReason ?? null,
    resolvedAt:
      listItem.canonicalStatus === "resolved"
        ? (latestMemory?.completedAt?.toISOString() ?? row.reviewedAt?.toISOString() ?? null)
        : null,
    ignoredAt:
      listItem.canonicalStatus === "dismissed"
        ? (latestMemory?.completedAt?.toISOString() ?? row.reviewedAt?.toISOString() ?? null)
        : null,
    ignoredBy:
      listItem.canonicalStatus === "dismissed"
        ? (latestMemory?.adjudicatorId ?? row.reviewedBy ?? null)
        : null,
    suggestedActions,
    playbookApplied: derivedFamilyArchetype.label ?? null,
    operatorNotes: latestMemory?.operatorNotes ?? row.notes ?? null,
    sourceTrustScore: latestMemory?.sourceTrustScore ? Number(latestMemory.sourceTrustScore) : null,
    topArchetype,
    adjudicationMemories,
    evidenceSummary,
    proofSummary,
    auditTrail,
    operatorSummary,
    familySummary,
    runComparison: runComparisonSnapshot,
    exceptionIntelligence,
    proofLineage,
    similarCases: scoredSimilarCases,
    whyFlagged,
  };
}
