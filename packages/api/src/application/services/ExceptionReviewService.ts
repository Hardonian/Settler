import { Prisma, PrismaClient } from "@prisma/client";
import { ProvenanceService } from "../../services/recon-core/provenance-service";
import { NotFoundError } from "../../utils/typed-errors";

export type ExceptionResolution = "matched" | "manual" | "ignored" | "duplicate";
export type ExceptionStatus = "open" | "in_progress" | "resolved" | "dismissed";
export type ExceptionReviewOutcome = "resolved" | "re_adjudicated" | "already_resolved";

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
  previousState: "pending_review" | "reviewed";
  resultingState: "reviewed";
  previousResolution: ExceptionResolution | null;
  previousStatus: string;
  previousReason: string | null;
  outcome: ExceptionReviewOutcome;
  occurredAt: string;
  traceId?: string;
  requestId?: string;
  status: ExceptionStatus;
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

function normalizeResolutionReason(
  resolution: ExceptionResolution,
  resolutionReason?: string
): string {
  const trimmed = resolutionReason?.trim();
  if (trimmed) {
    return trimmed;
  }
  return resolution;
}

function sanitizeTraceUuid(value?: string): string | null {
  if (!value) {
    return null;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
    ? value
    : null;
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
    return this.prisma.$transaction(async (tx) => {
      const exceptionMatchModel = tx.reconciliationMatch as any;
      const existing = (await exceptionMatchModel.findFirst({
        where: {
          id: input.exceptionId,
          tenantId: input.tenantId,
          matchType: "unmatched",
        },
        select: {
          id: true,
          runId: true,
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
      alreadyResolvedCount: results.filter((result) => result.outcome === "already_resolved").length,
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
    const normalizedReason = normalizeNotes(input.resolution, input.notes);
    const normalizedResolutionReason = normalizeResolutionReason(
      input.resolution,
      input.resolutionReason
    );
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

    const metadata = buildAdjudicationMetadata(existing.metadata, {
      actorId: input.userId,
      resolution: input.resolution,
      notes: input.notes?.trim() || null,
      reason: normalizedReason,
      resolutionReason: normalizedResolutionReason,
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
          notes: input.notes?.trim() || null,
          reason: normalizedReason,
          outcome,
          previousResolution,
          previousStatus: existing.status,
          previousReason: existing.matchReason,
          runId: existing.runId,
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
}
