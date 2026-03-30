import type { PrismaClient } from "@prisma/client";
import {
  EXCEPTION_MATCH_TYPES,
  operatorStatusToCanonical,
  resolveReconciliationExceptionScope,
  toCanonicalExceptionStatus,
  toOperatorExceptionStatus,
  type CanonicalExceptionStatus,
} from "@settler/reconciliation-core";

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

  const exceptionIds = rows.map((row: { id: string }) => row.id);
  const [topArchetypes, latestMemories] = await Promise.all([
    loadTopArchetypes(prisma, filters.tenantId, exceptionIds),
    prisma.exceptionAdjudicationMemory.findMany({
      where: {
        tenantId: filters.tenantId,
        exceptionId: { in: exceptionIds },
      },
      select: {
        exceptionId: true,
        resolutionReason: true,
        operatorNotes: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
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

  const items = rows.map((row: (typeof rows)[number]) =>
    mapListItem({
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
    })
  );

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
  ]);

  const topArchetype = topArchetypes.get(exceptionId) ?? null;
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
    suggestedActions: buildSuggestedActions(listItem.canonicalStatus, evidenceArtifacts.length > 0),
    playbookApplied: topArchetype?.label ?? null,
    operatorNotes: latestMemory?.operatorNotes ?? row.notes ?? null,
    sourceTrustScore: latestMemory?.sourceTrustScore ? Number(latestMemory.sourceTrustScore) : null,
    topArchetype,
    adjudicationMemories: memories.map((memory: (typeof memories)[number]) => ({
      id: memory.id,
      resolution: memory.resolution,
      resolutionReason: memory.resolutionReason,
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
    })),
    evidenceSummary: {
      total: evidenceArtifacts.length,
      degraded: evidenceArtifacts.filter(
        (item: (typeof evidenceArtifacts)[number]) => item.degraded
      ).length,
      attested: evidenceArtifacts.filter(
        (item: (typeof evidenceArtifacts)[number]) => item.attested
      ).length,
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
    },
    proofSummary: {
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
    },
    auditTrail,
  };
}
