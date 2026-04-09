import crypto from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { ProvenanceService } from "../../services/recon-core/provenance-service";
import { NotFoundError } from "../../utils/typed-errors";
import {
  EXCEPTION_MATCH_TYPES,
  normalizeExceptionResolutionReason,
  predictExceptionArchetype,
} from "./exception-intelligence-adapter";

export type ExceptionResolution = "matched" | "manual" | "ignored" | "duplicate";
export type ExceptionStatus = "open" | "in_progress" | "resolved" | "dismissed";
export type ExceptionReviewOutcome =
  | "resolved"
  | "re_adjudicated"
  | "already_resolved"
  | "workflow_step";

export interface ResolveExceptionInput {
  tenantId: string;
  userId: string;
  exceptionId: string;
  resolution: ExceptionResolution;
  resolutionReason?: string;
  notes?: string;
  traceId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResolveExceptionResult {
  exceptionId: string;
  resolution: ExceptionResolution;
  resolutionReason: string;
  status: ExceptionStatus;
  outcome: ExceptionReviewOutcome;
  reviewedAt: string | null;
  reviewedBy: string | null;
  notes: string | null;
}

export interface BulkResolveExceptionsInput {
  tenantId: string;
  userId: string;
  exceptionIds: string[];
  resolution: ExceptionResolution;
  resolutionReason?: string;
  notes?: string;
  traceId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BulkResolveExceptionsResult {
  requestedCount: number;
  uniqueExceptionCount: number;
  duplicateRequestCount: number;
  resolvedCount: number;
  reAdjudicatedCount: number;
  alreadyResolvedCount: number;
  notFoundCount: number;
  results: ResolveExceptionResult[];
}

interface ExceptionReviewRecord {
  id: string;
  runId: string;
  sourceTransactionId: string;
  targetTransactionId: string | null;
  confidence: Prisma.Decimal | number | string;
  amountDiff: Prisma.Decimal | number | string | null;
  dateDiff: number | null;
  matchType: string;
  metadata: Prisma.JsonValue;
  reviewed: boolean;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  matchReason: string | null;
  resolutionReason: string | null;
  notes: string | null;
}

interface AdjudicationMetadataEntry {
  actorId: string;
  resolution: ExceptionResolution;
  notes: string | null;
  reason: string;
  resolutionReason: string;
  resolutionCode: string;
  previousState: "pending_review" | "reviewed";
  resultingState: "reviewed" | "pending_review";
  previousResolution: ExceptionResolution | null;
  previousStatus: string;
  previousReason: string | null;
  outcome: ExceptionReviewOutcome;
  occurredAt: string;
  traceId?: string;
  requestId?: string;
  status: ExceptionStatus;
  memoryId?: string;
  evidenceIds?: string[];
  proofPackageId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asMetadataObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return isRecord(value) ? { ...value } : {};
}

function asResolution(value: unknown): ExceptionResolution | null {
  if (value === "matched" || value === "manual" || value === "ignored" || value === "duplicate") {
    return value;
  }
  return null;
}

function extractResolutionFromMetadata(
  metadata: Prisma.JsonValue | null | undefined
): ExceptionResolution | null {
  const base = asMetadataObject(metadata);

  const latest = base["latestAdjudication"];
  if (isRecord(latest)) {
    const latestResolution = asResolution(latest["resolution"]);
    if (latestResolution) {
      return latestResolution;
    }
  }

  const history = base["adjudicationHistory"];
  if (Array.isArray(history)) {
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const entry = history[index];
      if (!isRecord(entry)) {
        continue;
      }
      const resolution = asResolution(entry["resolution"]);
      if (resolution) {
        return resolution;
      }
    }
  }

  return null;
}

function inferResolutionFromReason(matchReason: string | null): ExceptionResolution | null {
  const normalized = (matchReason ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes("ignored")) {
    return "ignored";
  }

  if (
    normalized === "matched" ||
    normalized.endsWith("matched resolution") ||
    normalized.includes("manually matched")
  ) {
    return "matched";
  }

  if (normalized.includes("duplicate")) {
    return "duplicate";
  }

  return "manual";
}

export function deriveStoredResolution(
  reviewed: boolean,
  matchReason: string | null,
  metadata: Prisma.JsonValue | null | undefined
): ExceptionResolution | null {
  if (!reviewed) {
    return null;
  }

  return extractResolutionFromMetadata(metadata) ?? inferResolutionFromReason(matchReason);
}

export function deriveExceptionStatus(
  reviewed: boolean,
  matchReason: string | null
): ExceptionStatus {
  if (!reviewed) {
    return "open";
  }

  return (matchReason ?? "").toLowerCase().includes("ignored") ? "dismissed" : "resolved";
}

function statusForResolution(resolution: ExceptionResolution): ExceptionStatus {
  return resolution === "ignored" ? "dismissed" : "resolved";
}

function normalizeNotes(resolution: ExceptionResolution, notes?: string): string {
  const trimmed = notes?.trim();
  if (trimmed) {
    return trimmed;
  }
  return `${resolution} resolution`;
}

function sanitizeTraceUuid(value?: string): string | null {
  if (!value) {
    return null;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function buildHash(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function computeCompleteness(input: {
  resolution: ExceptionResolution;
  notes: string | null;
  hasTarget: boolean;
  evidenceCount: number;
}) {
  const missingEvidence: string[] = [];
  const completenessFlags: string[] = [];

  if (!input.notes) {
    missingEvidence.push("operator_note");
  }
  if (!input.hasTarget && input.resolution !== "ignored") {
    missingEvidence.push("target_transaction");
    completenessFlags.push("manual_resolution_without_counterpart");
  }
  if (input.evidenceCount < 2) {
    completenessFlags.push("limited_evidence_capture");
  }

  const score = Math.max(
    0,
    Math.min(1, 1 - missingEvidence.length * 0.2 - (input.evidenceCount < 2 ? 0.1 : 0))
  );

  return {
    score: Math.round(score * 10000) / 10000,
    missingEvidence,
    completenessFlags,
  };
}

function mapResolutionToDecision(
  resolution: ExceptionResolution
): "approved" | "rejected" | "override" {
  if (resolution === "ignored") {
    return "rejected";
  }

  if (resolution === "matched") {
    return "approved";
  }

  return "override";
}

function toReviewSnapshot(
  record: ExceptionReviewRecord,
  resolution: ExceptionResolution | null
): Record<string, unknown> {
  return {
    reviewed: record.reviewed,
    reviewedBy: record.reviewedBy,
    reviewedAt: record.reviewedAt ? record.reviewedAt.toISOString() : null,
    resolution,
    status:
      record.status === "resolved" ||
      record.status === "dismissed" ||
      record.status === "in_progress" ||
      record.status === "open"
        ? (record.status as ExceptionStatus)
        : deriveExceptionStatus(record.reviewed, record.matchReason),
    resolutionReason: record.resolutionReason,
    notes: record.notes,
    reason: record.matchReason,
  };
}

function buildAdjudicationMetadata(
  metadata: Prisma.JsonValue | null | undefined,
  entry: AdjudicationMetadataEntry
): Prisma.InputJsonValue {
  const base = asMetadataObject(metadata);
  const history = Array.isArray(base["adjudicationHistory"])
    ? [...base["adjudicationHistory"]]
    : [];

  const serializedEntry: Record<string, unknown> = {
    actorId: entry.actorId,
    resolution: entry.resolution,
    notes: entry.notes,
    reason: entry.reason,
    resolutionReason: entry.resolutionReason,
    resolutionCode: entry.resolutionCode,
    previousState: entry.previousState,
    resultingState: entry.resultingState,
    previousResolution: entry.previousResolution,
    previousStatus: entry.previousStatus,
    previousReason: entry.previousReason,
    outcome: entry.outcome,
    occurredAt: entry.occurredAt,
    status: entry.status,
  };

  if (entry.traceId) {
    serializedEntry.traceId = entry.traceId;
  }

  if (entry.requestId) {
    serializedEntry.requestId = entry.requestId;
  }

  if (entry.memoryId) {
    serializedEntry.memoryId = entry.memoryId;
  }

  if (entry.proofPackageId) {
    serializedEntry.proofPackageId = entry.proofPackageId;
  }

  if (entry.evidenceIds && entry.evidenceIds.length > 0) {
    serializedEntry.evidenceIds = entry.evidenceIds;
  }

  history.push(serializedEntry);

  return {
    ...base,
    latestAdjudication: serializedEntry,
    adjudicationHistory: history.slice(-50),
  } as Prisma.InputJsonValue;
}

export class ExceptionReviewService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly provenanceService: ProvenanceService = new ProvenanceService(prisma)
  ) {}

  async resolveException(input: ResolveExceptionInput): Promise<ResolveExceptionResult> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const exceptionMatchModel = tx.reconciliationMatch as any;
      const existing = (await exceptionMatchModel.findFirst({
        where: {
          id: input.exceptionId,
          tenantId: input.tenantId,
          matchType: { in: [...EXCEPTION_MATCH_TYPES] },
        },
        select: {
          id: true,
          runId: true,
          sourceTransactionId: true,
          targetTransactionId: true,
          confidence: true,
          amountDiff: true,
          dateDiff: true,
          matchType: true,
          metadata: true,
          reviewed: true,
          status: true,
          reviewedBy: true,
          reviewedAt: true,
          matchReason: true,
          resolutionReason: true,
          notes: true,
        },
      })) as ExceptionReviewRecord | null;

      if (!existing) {
        throw new NotFoundError("Exception not found", "exception", input.exceptionId);
      }

      return this.resolveExistingException(tx, existing, input);
    });
  }

  async resolveExceptions(input: BulkResolveExceptionsInput): Promise<BulkResolveExceptionsResult> {
    const uniqueExceptionIds = [...new Set(input.exceptionIds)];
    const results: ResolveExceptionResult[] = [];
    let notFoundCount = 0;

    for (const exceptionId of uniqueExceptionIds) {
      try {
        const result = await this.resolveException({
          ...input,
          exceptionId,
        });
        results.push(result);
      } catch (error) {
        if (error instanceof NotFoundError) {
          notFoundCount += 1;
          continue;
        }

        throw error;
      }
    }

    return {
      requestedCount: input.exceptionIds.length,
      uniqueExceptionCount: uniqueExceptionIds.length,
      duplicateRequestCount: input.exceptionIds.length - uniqueExceptionIds.length,
      resolvedCount: results.filter((result) => result.outcome === "resolved").length,
      reAdjudicatedCount: results.filter((result) => result.outcome === "re_adjudicated").length,
      alreadyResolvedCount: results.filter((result) => result.outcome === "already_resolved")
        .length,
      notFoundCount,
      results,
    };
  }

  private async resolveExistingException(
    tx: Prisma.TransactionClient,
    existing: ExceptionReviewRecord,
    input: ResolveExceptionInput
  ): Promise<ResolveExceptionResult> {
    const exceptionMatchModel = tx.reconciliationMatch as any;
    const adjudicationMemoryModel = (tx as any).exceptionAdjudicationMemory;
    const evidenceArtifactModel = (tx as any).evidenceArtifact;
    const proofPackageModel = (tx as any).proofPackage;
    const normalizedReason = normalizeNotes(input.resolution, input.notes);
    const normalizedResolution = normalizeExceptionResolutionReason({
      resolution: input.resolution,
      explicitReason: input.resolutionReason,
      note: input.notes,
    });
    const normalizedResolutionReason = normalizedResolution.resolutionReason;
    const previousResolution = deriveStoredResolution(
      existing.reviewed,
      existing.matchReason,
      existing.metadata
    );
    const previousSnapshot = toReviewSnapshot(existing, previousResolution);

    if (
      (existing.status === "resolved" || existing.status === "dismissed") &&
      previousResolution === input.resolution &&
      existing.matchReason === normalizedReason &&
      (existing.resolutionReason ?? previousResolution ?? null) === normalizedResolutionReason
    ) {
      return {
        exceptionId: existing.id,
        resolution: input.resolution,
        resolutionReason: normalizedResolutionReason,
        status: previousSnapshot["status"] as ExceptionStatus,
        outcome: "already_resolved",
        reviewedAt: existing.reviewedAt ? existing.reviewedAt.toISOString() : null,
        reviewedBy: existing.reviewedBy,
        notes: existing.notes,
      };
    }

    const outcome: ExceptionReviewOutcome =
      existing.status === "resolved" || existing.status === "dismissed"
        ? "re_adjudicated"
        : "resolved";
    const reviewedAt = new Date();
    const status = statusForResolution(input.resolution);

    const [sourceTransaction, targetTransaction] = await Promise.all([
      tx.normalizedTransaction.findFirst({
        where: {
          id: existing.sourceTransactionId,
          tenantId: input.tenantId,
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          date: true,
          description: true,
          externalId: true,
        },
      }),
      existing.targetTransactionId
        ? tx.normalizedTransaction.findFirst({
            where: {
              id: existing.targetTransactionId,
              tenantId: input.tenantId,
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
        : Promise.resolve(null),
    ]);

    const decisionPayload = {
      exceptionId: existing.id,
      runId: existing.runId,
      outcome,
      resolution: input.resolution,
      resolutionReason: normalizedResolutionReason,
      resolutionCode: normalizedResolution.resolutionCode,
      notes: input.notes?.trim() || null,
      previousStatus: existing.status,
      nextStatus: status,
      sourceTransaction: sourceTransaction
        ? {
            id: sourceTransaction.id,
            amount: Number(sourceTransaction.amount),
            currency: sourceTransaction.currency,
            date: sourceTransaction.date.toISOString(),
            description: sourceTransaction.description,
            externalId: sourceTransaction.externalId,
          }
        : null,
      targetTransaction: targetTransaction
        ? {
            id: targetTransaction.id,
            amount: Number(targetTransaction.amount),
            currency: targetTransaction.currency,
            date: targetTransaction.date.toISOString(),
            description: targetTransaction.description,
            externalId: targetTransaction.externalId,
          }
        : null,
      amountDiff: existing.amountDiff != null ? Number(existing.amountDiff) : null,
      dateDiff: existing.dateDiff,
      confidenceScore: Number(existing.confidence),
    };

    const decisionArtifact = await evidenceArtifactModel.create({
      data: {
        tenantId: input.tenantId,
        artifactType: "operator_annotation",
        artifactKey: `exception:${existing.id}:decision:${reviewedAt.toISOString()}`,
        payload: decisionPayload as Prisma.InputJsonValue,
        payloadHash: buildHash(decisionPayload),
        payloadSizeBytes: JSON.stringify(decisionPayload).length,
        sourceType: "exception_review_service",
        sourceId: existing.id,
        capturedBy: "operator",
        capturedByUserId: input.userId,
        runId: existing.runId,
        exceptionId: existing.id,
        reliabilityScore: 0.95,
        reliabilityFactors: ["operator_authenticated", "tenant_scoped", "persisted_snapshot"],
        degraded: false,
      },
    });

    const comparisonPayload = {
      exceptionId: existing.id,
      runId: existing.runId,
      sourceTransactionId: existing.sourceTransactionId,
      targetTransactionId: existing.targetTransactionId,
      matchType: existing.matchType,
      matchReason: existing.matchReason,
      amountDiff: existing.amountDiff != null ? Number(existing.amountDiff) : null,
      dateDiff: existing.dateDiff,
    };

    const comparisonArtifact = await evidenceArtifactModel.create({
      data: {
        tenantId: input.tenantId,
        artifactType: "match_comparison",
        artifactKey: `exception:${existing.id}:comparison:${reviewedAt.toISOString()}`,
        payload: comparisonPayload as Prisma.InputJsonValue,
        payloadHash: buildHash(comparisonPayload),
        payloadSizeBytes: JSON.stringify(comparisonPayload).length,
        sourceType: "reconciliation_match",
        sourceId: existing.id,
        capturedBy: "system",
        runId: existing.runId,
        exceptionId: existing.id,
        reliabilityScore: 0.85,
        reliabilityFactors: ["canonical_match_record"],
        degraded: false,
      },
    });

    const evidenceIds = [decisionArtifact.id, comparisonArtifact.id];
    const sourceTrustScore =
      targetTransaction || input.resolution === "ignored"
        ? 0.9
        : existing.matchType === "conflict"
          ? 0.75
          : 0.6;

    const memory = await adjudicationMemoryModel.create({
      data: {
        tenantId: input.tenantId,
        exceptionId: existing.id,
        resolution: input.resolution,
        resolutionReason: normalizedResolutionReason,
        resolutionCode: normalizedResolution.resolutionCode,
        adjudicatorId: input.userId,
        adjudicatorType: "operator",
        adjudicationType: outcome === "re_adjudicated" ? "re_adjudication" : "initial",
        startedAt: reviewedAt,
        completedAt: reviewedAt,
        durationMs: BigInt(0),
        outcome,
        confidence: Number(existing.confidence),
        reversibility: input.resolution === "ignored" ? "reversible" : "pending_reversal",
        evidenceIds,
        sourceTrustScore,
        annotations: {
          matchType: existing.matchType,
          previousStatus: existing.status,
          resolutionCode: normalizedResolution.resolutionCode,
          traceId: sanitizeTraceUuid(input.traceId) ?? undefined,
          requestId: input.requestId,
        } as Prisma.InputJsonValue,
        operatorNotes: input.notes?.trim() || null,
        systemNotes: "Decision recorded by ExceptionReviewService.",
        entryHash: buildHash({
          exceptionId: existing.id,
          resolution: input.resolution,
          reviewedAt: reviewedAt.toISOString(),
          userId: input.userId,
        }),
      },
    });

    const completeness = computeCompleteness({
      resolution: input.resolution,
      notes: input.notes?.trim() || null,
      hasTarget: Boolean(targetTransaction),
      evidenceCount: evidenceIds.length,
    });

    const proofPayload = {
      exceptionId: existing.id,
      runId: existing.runId,
      memoryId: memory.id,
      outcome,
      resolution: input.resolution,
      resolutionReason: normalizedResolutionReason,
      resolutionCode: normalizedResolution.resolutionCode,
      evidenceIds,
      sourceTrustScore,
    };

    const proofPackage = await proofPackageModel.create({
      data: {
        tenantId: input.tenantId,
        packageType: "exception_resolution",
        packageKey: `exception:${existing.id}:memory:${memory.id}`,
        evidenceIds,
        summary: proofPayload as Prisma.InputJsonValue,
        narrative: input.notes?.trim() || normalizedReason,
        completenessScore: completeness.score,
        missingEvidence: completeness.missingEvidence,
        completenessFlags: completeness.completenessFlags,
        packageHash: buildHash({
          proofPayload,
          completeness,
        }),
        scope: "exception",
        scopeIds: [existing.id, existing.runId],
        periodStart: existing.reviewedAt ?? reviewedAt,
        periodEnd: reviewedAt,
        status: completeness.score >= 0.75 ? "finalized" : "draft",
        finalizedAt: completeness.score >= 0.75 ? reviewedAt : null,
        metadata: {
          exceptionId: existing.id,
          memoryId: memory.id,
          outcome,
          resolutionCode: normalizedResolution.resolutionCode,
        } as Prisma.InputJsonValue,
      },
    });

    await this.ensureExceptionFamilyClassification(tx, {
      tenantId: input.tenantId,
      exceptionId: existing.id,
      memoryId: memory.id,
      matchType: existing.matchType,
      amountDiff: existing.amountDiff != null ? Number(existing.amountDiff) : null,
      dateDiff: existing.dateDiff,
      confidence: Number(existing.confidence),
      hasTargetTransaction: Boolean(existing.targetTransactionId),
      matchReason: existing.matchReason,
    });

    const metadata = buildAdjudicationMetadata(existing.metadata, {
      actorId: input.userId,
      resolution: input.resolution,
      notes: input.notes?.trim() || null,
      reason: normalizedReason,
      resolutionReason: normalizedResolutionReason,
      resolutionCode: normalizedResolution.resolutionCode,
      previousState: existing.reviewed ? "reviewed" : "pending_review",
      resultingState: "reviewed",
      previousResolution,
      previousStatus: existing.status,
      previousReason: existing.matchReason,
      outcome,
      occurredAt: reviewedAt.toISOString(),
      traceId: sanitizeTraceUuid(input.traceId) ?? undefined,
      requestId: input.requestId,
      status,
      memoryId: memory.id,
      evidenceIds,
      proofPackageId: proofPackage.id,
    });

    await exceptionMatchModel.update({
      where: { id: existing.id },
      data: {
        status,
        reviewed: true,
        reviewedBy: input.userId,
        reviewedAt,
        matchReason: normalizedReason,
        resolutionReason: normalizedResolutionReason,
        notes: input.notes?.trim() || null,
        metadata,
      },
    });

    await this.provenanceService.recordReviewDecisionInTransaction(tx, {
      tenantId: input.tenantId,
      runId: existing.runId,
      matchId: existing.id,
      decision: mapResolutionToDecision(input.resolution),
      actorUserId: input.userId,
      reason: input.resolutionReason?.trim() || normalizedReason,
    });

    await tx.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        action: "exception_resolved",
        resourceType: "reconciliation_match",
        resourceId: existing.id,
        changes: {
          before: previousSnapshot,
          after: {
            reviewed: true,
            reviewedBy: input.userId,
            reviewedAt: reviewedAt.toISOString(),
            resolution: input.resolution,
            status,
            resolutionReason: normalizedResolutionReason,
            notes: input.notes?.trim() || null,
            reason: normalizedReason,
          },
        } as Prisma.InputJsonValue,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: {
          resolution: input.resolution,
          resolutionReason: normalizedResolutionReason,
          resolutionCode: normalizedResolution.resolutionCode,
          notes: input.notes?.trim() || null,
          reason: normalizedReason,
          outcome,
          previousResolution,
          previousStatus: existing.status,
          previousReason: existing.matchReason,
          runId: existing.runId,
          memoryId: memory.id,
          proofPackageId: proofPackage.id,
          evidenceIds,
        } as Prisma.InputJsonValue,
        traceId: sanitizeTraceUuid(input.traceId),
        requestId: input.requestId ?? null,
        actorType: "user",
        actorId: input.userId,
        reason: normalizedReason,
      },
    });

    return {
      exceptionId: existing.id,
      resolution: input.resolution,
      resolutionReason: normalizedResolutionReason,
      status,
      outcome,
      reviewedAt: reviewedAt.toISOString(),
      reviewedBy: input.userId,
      notes: input.notes?.trim() || null,
    };
  }

  private async ensureExceptionFamilyClassification(
    tx: Prisma.TransactionClient,
    args: {
      tenantId: string;
      exceptionId: string;
      memoryId: string;
      matchType: string;
      amountDiff: number | null;
      dateDiff: number | null;
      confidence: number | null;
      hasTargetTransaction: boolean;
      matchReason: string | null;
    }
  ) {
    const prediction = predictExceptionArchetype({
      matchType: args.matchType,
      amountDiff: args.amountDiff,
      dateDiff: args.dateDiff,
      confidence: args.confidence,
      hasTargetTransaction: args.hasTargetTransaction,
      matchReason: args.matchReason,
    });
    const exceptionArchetypeModel = (tx as any).exceptionArchetype;
    const classificationModel = (tx as any).exceptionArchetypeClassification;

    let archetype = await exceptionArchetypeModel.findFirst({
      where: {
        tenantId: args.tenantId,
        code: prediction.code,
      },
      select: {
        id: true,
        occurrenceCount: true,
      },
    });

    if (!archetype) {
      archetype = await exceptionArchetypeModel.create({
        data: {
          tenantId: args.tenantId,
          code: prediction.code,
          label: prediction.label,
          category: prediction.category,
          severityDefault: prediction.severityDefault,
          typicalResolution: prediction.typicalResolutionCode,
          resolutionTaxonomy: prediction.resolutionTaxonomy,
          matchFieldWeights: prediction.matchFeatures as Prisma.InputJsonValue,
          isSystem: true,
          occurrenceCount: 0,
          metadata: {},
        },
        select: {
          id: true,
          occurrenceCount: true,
        },
      });
    }

    const existingClassification = await classificationModel.findFirst({
      where: {
        tenantId: args.tenantId,
        exceptionId: args.exceptionId,
        archetypeId: archetype.id,
      },
      select: {
        id: true,
      },
    });

    if (existingClassification) {
      await classificationModel.update({
        where: {
          id: existingClassification.id,
        },
        data: {
          confidence: prediction.confidence,
          matchFeatures: prediction.matchFeatures as Prisma.InputJsonValue,
          classifiedBy: "system",
          metadata: {
            memoryId: args.memoryId,
            service: "ExceptionReviewService",
          } as Prisma.InputJsonValue,
        },
      });
      return;
    }

    await classificationModel.create({
      data: {
        tenantId: args.tenantId,
        exceptionId: args.exceptionId,
        archetypeId: archetype.id,
        confidence: prediction.confidence,
        matchFeatures: prediction.matchFeatures as Prisma.InputJsonValue,
        classifiedBy: "system",
        metadata: {
          memoryId: args.memoryId,
          service: "ExceptionReviewService",
        } as Prisma.InputJsonValue,
      },
    });

    await exceptionArchetypeModel.update({
      where: { id: archetype.id },
      data: {
        occurrenceCount: { increment: 1 },
        lastOccurrenceAt: new Date(),
      },
    });
  }

  async assignException(input: {
    tenantId: string;
    userId: string;
    exceptionId: string;
    assignedTo: string;
    notes?: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = (await (tx.reconciliationMatch as any).findFirst({
        where: { id: input.exceptionId, tenantId: input.tenantId },
        select: { id: true, runId: true, metadata: true, status: true, assignedTo: true },
      })) as any;

      if (!existing) {
        throw new NotFoundError("Exception not found", "exception", input.exceptionId);
      }

      const occurredAt = new Date();
      const resolution = "assigned";

      const memory = await (tx as any).exceptionAdjudicationMemory.create({
        data: {
          tenantId: input.tenantId,
          exceptionId: existing.id,
          resolution,
          resolutionReason: `Assigned to ${input.assignedTo}`,
          resolutionCode: "WORKFLOW_ASSIGNMENT",
          adjudicatorId: input.userId,
          adjudicatorType: "operator",
          adjudicationType: "workflow",
          startedAt: occurredAt,
          completedAt: occurredAt,
          durationMs: BigInt(0),
          outcome: "updated",
          confidence: 1.0,
          reversibility: "reversible",
          evidenceIds: [],
          sourceTrustScore: 1.0,
          operatorNotes: input.notes?.trim() || null,
          systemNotes: `Exception assigned through consolidated workbench. Previous: ${existing.assignedTo || "unassigned"}.`,
          entryHash: buildHash({
            exceptionId: existing.id,
            action: "assign",
            assignedTo: input.assignedTo,
            occurredAt: occurredAt.toISOString(),
          }),
        },
      });

      const updatedMetadata = buildAdjudicationMetadata(existing.metadata, {
        actorId: input.userId,
        resolution: resolution as any,
        notes: input.notes?.trim() || null,
        reason: `Assigned to ${input.assignedTo}`,
        resolutionReason: `Assigned to ${input.assignedTo}`,
        resolutionCode: "WORKFLOW_ASSIGNMENT",
        previousState: existing.reviewed ? "reviewed" : "pending_review",
        resultingState: existing.reviewed ? "reviewed" : "pending_review",
        previousResolution: extractResolutionFromMetadata(existing.metadata),
        previousStatus: existing.status,
        previousReason: null,
        outcome: "workflow_step" as any,
        occurredAt: occurredAt.toISOString(),
        status: existing.status as any,
        memoryId: memory.id,
      });

      await (tx.reconciliationMatch as any).update({
        where: { id: existing.id },
        data: {
          assignedTo: input.assignedTo,
          metadata: updatedMetadata,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          action: "exception_assigned",
          resourceType: "reconciliation_match",
          resourceId: existing.id,
          metadata: {
            assignedTo: input.assignedTo,
            previousAssignedTo: existing.assignedTo,
            notes: input.notes,
            memoryId: memory.id,
            resolutionCode: "WORKFLOW_ASSIGNMENT",
          } as Prisma.InputJsonValue,
          actorId: input.userId,
          actorType: "user",
        },
      });
    });
  }

  async updateExceptionStatus(input: {
    tenantId: string;
    userId: string;
    exceptionId: string;
    status: ExceptionStatus;
    notes?: string;
    resolutionReason?: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = (await (tx.reconciliationMatch as any).findFirst({
        where: { id: input.exceptionId, tenantId: input.tenantId },
        select: { id: true, runId: true, metadata: true, status: true, reviewed: true },
      })) as any;

      if (!existing) {
        throw new NotFoundError("Exception not found", "exception", input.exceptionId);
      }

      const occurredAt = new Date();
      const resolution = "status_transition";

      const memory = await (tx as any).exceptionAdjudicationMemory.create({
        data: {
          tenantId: input.tenantId,
          exceptionId: existing.id,
          resolution,
          resolutionReason: input.resolutionReason || `Transitioned to ${input.status}`,
          resolutionCode: "WORKFLOW_STATUS_CHANGE",
          adjudicatorId: input.userId,
          adjudicatorType: "operator",
          adjudicationType: "workflow",
          startedAt: occurredAt,
          completedAt: occurredAt,
          outcome: "updated",
          confidence: 1.0,
          evidenceIds: [],
          sourceTrustScore: 1.0,
          operatorNotes: input.notes?.trim() || null,
          systemNotes: `Status changed from ${existing.status} to ${input.status}.`,
          entryHash: buildHash({
            exceptionId: existing.id,
            action: "status_change",
            from: existing.status,
            to: input.status,
            occurredAt: occurredAt.toISOString(),
          }),
        },
      });

      const updatedMetadata = buildAdjudicationMetadata(existing.metadata, {
        actorId: input.userId,
        resolution: resolution as any,
        notes: input.notes?.trim() || null,
        reason: `Status: ${input.status}`,
        resolutionReason: input.resolutionReason || `Transitioned to ${input.status}`,
        resolutionCode: "WORKFLOW_STATUS_CHANGE",
        previousState: existing.reviewed ? "reviewed" : "pending_review",
        resultingState:
          input.status === "resolved" || input.status === "dismissed"
            ? "reviewed"
            : existing.reviewed
              ? "reviewed"
              : "pending_review",
        previousResolution: extractResolutionFromMetadata(existing.metadata),
        previousStatus: existing.status,
        previousReason: null,
        outcome: "workflow_step" as any,
        occurredAt: occurredAt.toISOString(),
        status: input.status as any,
        memoryId: memory.id,
      });

      await (tx.reconciliationMatch as any).update({
        where: { id: existing.id },
        data: {
          status: input.status,
          reviewed: input.status === "resolved" || input.status === "dismissed",
          reviewedBy:
            input.status === "resolved" || input.status === "dismissed" ? input.userId : undefined,
          reviewedAt:
            input.status === "resolved" || input.status === "dismissed" ? occurredAt : undefined,
          notes: input.notes || undefined,
          resolutionReason: input.resolutionReason || undefined,
          metadata: updatedMetadata,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          action: "exception_status_changed",
          resourceType: "reconciliation_match",
          resourceId: existing.id,
          metadata: {
            fromStatus: existing.status,
            toStatus: input.status,
            notes: input.notes,
            memoryId: memory.id,
            resolutionCode: "WORKFLOW_STATUS_CHANGE",
          } as Prisma.InputJsonValue,
          actorId: input.userId,
          actorType: "user",
        },
      });
    });
  }

  async addExceptionNote(input: {
    tenantId: string;
    userId: string;
    exceptionId: string;
    notes: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = (await (tx.reconciliationMatch as any).findFirst({
        where: { id: input.exceptionId, tenantId: input.tenantId },
        select: { id: true, runId: true, metadata: true, status: true, notes: true },
      })) as any;

      if (!existing) {
        throw new NotFoundError("Exception not found", "exception", input.exceptionId);
      }

      const occurredAt = new Date();
      const resolution = "operator_note";

      const memory = await (tx as any).exceptionAdjudicationMemory.create({
        data: {
          tenantId: input.tenantId,
          exceptionId: existing.id,
          resolution,
          resolutionReason: "Note added by operator",
          resolutionCode: "WORKFLOW_NOTE",
          adjudicatorId: input.userId,
          adjudicatorType: "operator",
          adjudicationType: "workflow",
          startedAt: occurredAt,
          completedAt: occurredAt,
          outcome: "updated",
          confidence: 1.0,
          evidenceIds: [],
          sourceTrustScore: 1.0,
          operatorNotes: input.notes.trim(),
          systemNotes: "Operator added a textual annotation.",
          entryHash: buildHash({
            exceptionId: existing.id,
            action: "add_note",
            notes: input.notes,
            occurredAt: occurredAt.toISOString(),
          }),
        },
      });

      const updatedMetadata = buildAdjudicationMetadata(existing.metadata, {
        actorId: input.userId,
        resolution: resolution as any,
        notes: input.notes.trim(),
        reason: "Annotation added",
        resolutionReason: "Note added",
        resolutionCode: "WORKFLOW_NOTE",
        previousState: "pending_review", // Placeholder
        resultingState: "pending_review",
        previousResolution: null,
        previousStatus: existing.status,
        previousReason: null,
        outcome: "workflow_step" as any,
        occurredAt: occurredAt.toISOString(),
        status: existing.status as any,
        memoryId: memory.id,
      });

      await (tx.reconciliationMatch as any).update({
        where: { id: existing.id },
        data: {
          notes: input.notes,
          metadata: updatedMetadata,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          action: "exception_note_added",
          resourceType: "reconciliation_match",
          resourceId: existing.id,
          metadata: { memoryId: memory.id } as Prisma.InputJsonValue,
          actorId: input.userId,
          actorType: "user",
          reason: input.notes.slice(0, 100),
        },
      });
    });
  }

  async bulkAssignExceptions(input: {
    tenantId: string;
    userId: string;
    exceptionIds: string[];
    assignedTo: string;
  }): Promise<number> {
    let count = 0;
    for (const id of input.exceptionIds) {
      try {
        await this.assignException({
          tenantId: input.tenantId,
          userId: input.userId,
          exceptionId: id,
          assignedTo: input.assignedTo,
        });
        count += 1;
      } catch {
        // Continue to next one
      }
    }
    return count;
  }

  async bulkUpdateExceptionStatus(input: {
    tenantId: string;
    userId: string;
    exceptionIds: string[];
    status: ExceptionStatus;
    notes?: string;
  }): Promise<number> {
    let count = 0;
    for (const id of input.exceptionIds) {
      try {
        await this.updateExceptionStatus({
          tenantId: input.tenantId,
          userId: input.userId,
          exceptionId: id,
          status: input.status,
          notes: input.notes,
        });
        count += 1;
      } catch {
        // Continue to next one
      }
    }
    return count;
  }
}
