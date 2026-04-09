/**
 * Canonical support-intake enrichment helpers.
 *
 * These attach tenant-scoped run and exception intelligence to support intake so downstream
 * support, export, and proof surfaces do not have to reconstruct context from scratch.
 */

import type { CanonicalExceptionStatus, OperatorExceptionStatus } from "./exception-workbench.js";
import {
  EXCEPTION_MATCH_TYPES,
  toCanonicalExceptionStatus,
  toOperatorExceptionStatus,
} from "./exception-workbench.js";
import {
  buildExceptionFamilySummary,
  predictExceptionArchetype,
  type ExceptionFamilySummary,
} from "./exception-intelligence.js";
import { resolveOperatorRunDetailForTenants } from "./operator-run-detail-resolve.js";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";
import { resolveRunCompactProofSummary } from "./run-proofpack-index.js";

type SupportContextState = "ok" | "unavailable" | "degraded";

type SupportExceptionOperatorSummary = {
  familyLabel: string | null;
  familyState: ExceptionFamilySummary["state"];
  supportingCaseCount: number;
  recurrencePosture: ExceptionFamilySummary["recurrencePosture"];
  recurringResolutionReason: string | null;
  nextStep: string;
};

export interface SupportIntakeRunContext {
  state: SupportContextState;
  reason?: string;
  runId: string;
  runKind?: "recon_job" | "ingestion_run";
  status?: string;
  compactProofSummary: ReturnType<typeof resolveRunCompactProofSummary>["compactProofSummary"];
  fallbackReason?: string | null;
}

export interface SupportIntakeExceptionContext {
  state: SupportContextState;
  reason?: string;
  exceptionId: string;
  runId: string | null;
  type: string | null;
  matchType: string | null;
  status: OperatorExceptionStatus | null;
  canonicalStatus: CanonicalExceptionStatus | null;
  severity: string | null;
  familySummary: ExceptionFamilySummary | null;
  operatorSummary: SupportExceptionOperatorSummary | null;
}

type SupportExceptionRow = {
  id: string;
  runId: string;
  matchType: string;
  amountDiff: unknown;
  dateDiff: number | null;
  confidence: unknown;
  targetTransactionId: string | null;
  matchReason: string | null;
  status: string;
  reviewed: boolean;
  severity: string | null;
};

type ResolvedArchetype = {
  id: string;
  code: string;
  label: string;
  category: string | null;
};

function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

async function loadResolvedArchetype(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  exceptionId: string
): Promise<ResolvedArchetype | null> {
  const classification = await prisma.exceptionArchetypeClassification.findFirst({
    where: {
      tenantId,
      exceptionId,
    },
    select: {
      archetypeId: true,
    },
    orderBy: {
      confidence: "desc",
    },
  });

  if (!classification?.archetypeId) {
    return null;
  }

  const archetype = await prisma.exceptionArchetype.findFirst({
    where: {
      tenantId,
      id: classification.archetypeId,
    },
    select: {
      id: true,
      code: true,
      label: true,
      category: true,
    },
  });

  return archetype
    ? {
        id: archetype.id,
        code: archetype.code,
        label: archetype.label,
        category: archetype.category ?? null,
      }
    : null;
}

async function resolveFamilyArchetype(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  exceptionId: string,
  row: SupportExceptionRow
): Promise<ResolvedArchetype | { id: ""; code: string; label: string; category: string | null }> {
  const classified = await loadResolvedArchetype(prisma, tenantId, exceptionId);
  if (classified) {
    return classified;
  }

  const predicted = predictExceptionArchetype({
    matchType: row.matchType,
    amountDiff: safeNumber(row.amountDiff),
    dateDiff: row.dateDiff,
    confidence: safeNumber(row.confidence),
    hasTargetTransaction: Boolean(row.targetTransactionId),
    matchReason: row.matchReason,
  });

  const existing = await prisma.exceptionArchetype.findFirst({
    where: {
      tenantId,
      code: predicted.code,
    },
    select: {
      id: true,
      code: true,
      label: true,
      category: true,
    },
  });

  if (existing) {
    return {
      id: existing.id,
      code: existing.code,
      label: existing.label,
      category: existing.category ?? null,
    };
  }

  return {
    id: "",
    code: predicted.code,
    label: predicted.label,
    category: predicted.category,
  };
}

export async function buildSupportIntakeRunContext(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  runId: string
): Promise<SupportIntakeRunContext> {
  try {
    const outcome = await resolveOperatorRunDetailForTenants(prisma, [tenantId], runId);
    if (outcome.kind !== "ok") {
      return {
        state: "unavailable",
        reason: outcome.kind,
        runId,
        compactProofSummary: resolveRunCompactProofSummary({
          runKind: "recon_job",
          fallbackReasonCode: "support_run_detail_unavailable",
        }).compactProofSummary,
      };
    }

    const summaryResolution = resolveRunCompactProofSummary({
      runKind: outcome.detail.runKind,
      compactProofSummary: outcome.detail.compactProofSummary,
      proofpackIndex: outcome.detail.proofpackIndex,
    });

    return {
      state: "ok",
      runId: outcome.detail.id,
      runKind: outcome.detail.runKind,
      status: outcome.detail.status,
      compactProofSummary: summaryResolution.compactProofSummary,
      fallbackReason: summaryResolution.fallbackReasonCode,
    };
  } catch {
    return {
      state: "degraded",
      reason: "support_run_context_error",
      runId,
      compactProofSummary: resolveRunCompactProofSummary({
        runKind: "recon_job",
        fallbackReasonCode: "support_run_context_error",
      }).compactProofSummary,
    };
  }
}

export async function buildSupportIntakeExceptionContext(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  exceptionId: string
): Promise<SupportIntakeExceptionContext> {
  try {
    const row = (await prisma.reconciliationMatch.findFirst({
      where: {
        tenantId,
        id: exceptionId,
        matchType: { in: [...EXCEPTION_MATCH_TYPES] },
      },
      select: {
        id: true,
        runId: true,
        matchType: true,
        amountDiff: true,
        dateDiff: true,
        confidence: true,
        targetTransactionId: true,
        matchReason: true,
        status: true,
        reviewed: true,
        severity: true,
      },
    })) as SupportExceptionRow | null;

    if (!row) {
      return {
        state: "unavailable",
        reason: "not_found",
        exceptionId,
        runId: null,
        type: null,
        matchType: null,
        status: null,
        canonicalStatus: null,
        severity: null,
        familySummary: null,
        operatorSummary: null,
      };
    }

    const familyArchetype = await resolveFamilyArchetype(prisma, tenantId, exceptionId, row);
    const familyMemories =
      familyArchetype.id !== ""
        ? await prisma.exceptionAdjudicationMemory.findMany({
            where: {
              tenantId,
              archetypeId: familyArchetype.id,
            },
            select: {
              exceptionId: true,
              resolution: true,
              resolutionReason: true,
              resolutionCode: true,
              outcome: true,
              adjudicationType: true,
              confidence: true,
              sourceTrustScore: true,
              createdAt: true,
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 200,
          })
        : [];

    const canonicalStatus = toCanonicalExceptionStatus({
      status: row.status,
      reviewed: row.reviewed,
      matchReason: row.matchReason,
    });
    const familySummary = buildExceptionFamilySummary({
      currentExceptionId: row.id,
      currentStatus: canonicalStatus,
      familyCode: familyArchetype.code,
      familyLabel: familyArchetype.label,
      familyCategory: familyArchetype.category,
      memories: familyMemories.map(
        (memory: {
          exceptionId: string;
          resolution: string;
          resolutionReason: string | null;
          resolutionCode: string | null;
          outcome: string | null;
          adjudicationType: string | null;
          confidence: unknown;
          sourceTrustScore: unknown;
          createdAt: Date | string;
        }) => ({
          exceptionId: memory.exceptionId,
          resolution: memory.resolution,
          resolutionReason: memory.resolutionReason,
          resolutionCode: memory.resolutionCode,
          outcome: memory.outcome,
          adjudicationType: memory.adjudicationType,
          confidence: safeNumber(memory.confidence),
          sourceTrustScore: safeNumber(memory.sourceTrustScore),
          createdAt: memory.createdAt,
        })
      ),
    });

    return {
      state: "ok",
      exceptionId: row.id,
      runId: row.runId ?? null,
      type: familyArchetype.code.toLowerCase(),
      matchType: row.matchType,
      status: toOperatorExceptionStatus(canonicalStatus),
      canonicalStatus,
      severity: row.severity ?? null,
      familySummary,
      operatorSummary: {
        familyLabel: familySummary.familyLabel,
        familyState: familySummary.state,
        supportingCaseCount: familySummary.supportingCaseCount,
        recurrencePosture: familySummary.recurrencePosture,
        recurringResolutionReason: familySummary.dominantResolutionReason,
        nextStep: familySummary.nextStep,
      },
    };
  } catch {
    return {
      state: "degraded",
      reason: "support_exception_context_error",
      exceptionId,
      runId: null,
      type: null,
      matchType: null,
      status: null,
      canonicalStatus: null,
      severity: null,
      familySummary: null,
      operatorSummary: null,
    };
  }
}
