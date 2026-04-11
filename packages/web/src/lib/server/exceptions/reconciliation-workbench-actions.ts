import crypto from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  EXCEPTION_MATCH_TYPES,
  normalizeExceptionResolutionReason,
  predictExceptionArchetype,
  toCanonicalExceptionStatus,
  type CanonicalExceptionStatus,
} from "@settler/reconciliation-core";

export type ReconciliationWorkbenchAction = "resolve" | "ignore" | "reopen";

export interface ReconciliationWorkbenchActionInput {
  tenantId: string;
  userId: string;
  exceptionId: string;
  action: ReconciliationWorkbenchAction;
  notes?: string;
}

export interface ReconciliationWorkbenchActionResult {
  success: boolean;
  exceptionId: string;
  status: CanonicalExceptionStatus;
  outcome: "resolved" | "ignored" | "reopened" | "already_in_state";
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asMetadataObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return isRecord(value) ? { ...value } : {};
}

function buildHash(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function normalizeNotes(action: ReconciliationWorkbenchAction, notes?: string): string | null {
  const trimmed = notes?.trim();
  if (trimmed) {
    return trimmed;
  }

  switch (action) {
    case "ignore":
      return "Ignored from canonical exception workbench.";
    case "reopen":
      return "Reopened for further investigation.";
    default:
      return "Resolved from canonical exception workbench.";
  }
}

function buildAdjudicationMetadata(
  metadata: Prisma.JsonValue | null | undefined,
  entry: Record<string, unknown>
): Prisma.InputJsonValue {
  const base = asMetadataObject(metadata);
  const history = Array.isArray(base["adjudicationHistory"])
    ? [...base["adjudicationHistory"]]
    : [];

  history.push(entry);

  return {
    ...base,
    latestAdjudication: entry,
    adjudicationHistory: history.slice(-50),
  } as Prisma.InputJsonValue;
}

function defaultResolutionForAction(action: ReconciliationWorkbenchAction): {
  status: CanonicalExceptionStatus;
  resolution: string;
  outcome: "resolved" | "ignored" | "reopened";
} {
  switch (action) {
    case "ignore":
      return {
        status: "dismissed",
        resolution: "ignored",
        outcome: "ignored",
      };
    case "reopen":
      return {
        status: "open",
        resolution: "manual",
        outcome: "reopened",
      };
    default:
      return {
        status: "resolved",
        resolution: "manual",
        outcome: "resolved",
      };
  }
}

function computeCompleteness(args: {
  action: ReconciliationWorkbenchAction;
  notes: string | null;
  hasTarget: boolean;
  evidenceCount: number;
}): { score: number; missingEvidence: string[]; completenessFlags: string[] } {
  const missingEvidence: string[] = [];
  const completenessFlags: string[] = [];

  if (!args.notes) {
    missingEvidence.push("operator_note");
  }
  if (!args.hasTarget && args.action === "resolve") {
    missingEvidence.push("target_transaction");
    completenessFlags.push("manual_resolution_without_counterpart");
  }
  if (args.evidenceCount < 2) {
    completenessFlags.push("limited_evidence_capture");
  }

  const score = Math.max(
    0,
    Math.min(1, 1 - missingEvidence.length * 0.2 - (args.evidenceCount < 2 ? 0.1 : 0))
  );
  return {
    score: Math.round(score * 10000) / 10000,
    missingEvidence,
    completenessFlags,
  };
}

export async function applyReconciliationWorkbenchAction(
  prisma: PrismaClient,
  input: ReconciliationWorkbenchActionInput
): Promise<ReconciliationWorkbenchActionResult> {
  return prisma.$transaction(async (tx: PrismaClient) => {
    const exception = await tx.reconciliationMatch.findFirst({
      where: {
        tenantId: input.tenantId,
        id: input.exceptionId,
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
      },
    });

    if (!exception) {
      throw Object.assign(new Error("Exception not found"), { status: 404 });
    }

    const canonicalStatus = toCanonicalExceptionStatus({
      status: exception.status,
      reviewed: exception.reviewed,
      matchReason: exception.matchReason,
    });
    const plan = defaultResolutionForAction(input.action);
    const note = normalizeNotes(input.action, input.notes);
    const normalizedResolution = normalizeExceptionResolutionReason({
      resolution:
        plan.resolution === "matched" ||
        plan.resolution === "manual" ||
        plan.resolution === "ignored" ||
        plan.resolution === "duplicate"
          ? plan.resolution
          : "manual",
      note,
      action: input.action,
    });
    const now = new Date();

    if (canonicalStatus === plan.status && input.action !== "reopen") {
      return {
        success: true,
        exceptionId: exception.id,
        status: canonicalStatus,
        outcome: "already_in_state",
        message: `Exception already ${canonicalStatus === "dismissed" ? "ignored" : "resolved"}.`,
      };
    }

    if (canonicalStatus === "open" && input.action === "reopen") {
      return {
        success: true,
        exceptionId: exception.id,
        status: canonicalStatus,
        outcome: "already_in_state",
        message: "Exception is already open.",
      };
    }

    const adjudicationFingerprint = buildHash({
      v: 1,
      action: input.action,
      resolution: plan.resolution,
      resolutionCode: normalizedResolution.resolutionCode,
    });

    const targetTransaction = exception.targetTransactionId
      ? await tx.normalizedTransaction.findFirst({
          where: {
            tenantId: input.tenantId,
            id: exception.targetTransactionId,
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
      : null;

    const latestMemory = await tx.exceptionAdjudicationMemory.findFirst({
      where: {
        tenantId: input.tenantId,
        exceptionId: exception.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        resolution: true,
      },
    });

    const metadataEntry = {
      actorId: input.userId,
      action: input.action,
      resolution: plan.resolution,
      resolutionReason: normalizedResolution.resolutionReason,
      resolutionCode: normalizedResolution.resolutionCode,
      previousStatus: canonicalStatus,
      status: plan.status,
      occurredAt: now.toISOString(),
      notes: note,
    };

    const decisionPayload = {
      exceptionId: exception.id,
      runId: exception.runId,
      action: input.action,
      previousStatus: canonicalStatus,
      nextStatus: plan.status,
      resolution: plan.resolution,
      resolutionReason: normalizedResolution.resolutionReason,
      resolutionCode: normalizedResolution.resolutionCode,
      notes: note,
      sourceTransaction: exception.sourceTransaction
        ? {
            id: exception.sourceTransaction.id,
            amount: Number(exception.sourceTransaction.amount),
            currency: exception.sourceTransaction.currency,
            date: exception.sourceTransaction.date.toISOString(),
            description: exception.sourceTransaction.description,
            externalId: exception.sourceTransaction.externalId,
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
      amountDiff: exception.amountDiff != null ? Number(exception.amountDiff) : null,
      dateDiff: exception.dateDiff,
      confidenceScore: Number(exception.confidence),
    };

    const snapshotArtifactKey = `exception:${exception.id}:decision:${now.toISOString()}`;
    const comparisonArtifactKey = `exception:${exception.id}:comparison:${now.toISOString()}`;

    const comparisonPayload = {
      exceptionId: exception.id,
      runId: exception.runId,
      sourceTransactionId: exception.sourceTransactionId,
      targetTransactionId: exception.targetTransactionId,
      matchType: exception.matchType,
      matchReason: exception.matchReason,
      amountDiff: exception.amountDiff != null ? Number(exception.amountDiff) : null,
      dateDiff: exception.dateDiff,
    };

    const decisionArtifact = await tx.evidenceArtifact.create({
      data: {
        tenantId: input.tenantId,
        artifactType: "operator_annotation",
        artifactKey: snapshotArtifactKey,
        payload: decisionPayload as Prisma.InputJsonValue,
        payloadHash: buildHash(decisionPayload),
        payloadSizeBytes: JSON.stringify(decisionPayload).length,
        sourceType: "reconciliation_workbench",
        sourceId: exception.id,
        capturedBy: "operator",
        capturedByUserId: input.userId,
        runId: exception.runId,
        exceptionId: exception.id,
        reliabilityScore: 0.95,
        reliabilityFactors: ["operator_authenticated", "tenant_scoped", "persisted_snapshot"],
        degraded: false,
      },
    });

    const comparisonArtifact = await tx.evidenceArtifact.create({
      data: {
        tenantId: input.tenantId,
        artifactType: "match_comparison",
        artifactKey: comparisonArtifactKey,
        payload: comparisonPayload as Prisma.InputJsonValue,
        payloadHash: buildHash(comparisonPayload),
        payloadSizeBytes: JSON.stringify(comparisonPayload).length,
        sourceType: "reconciliation_match",
        sourceId: exception.id,
        capturedBy: "system",
        runId: exception.runId,
        exceptionId: exception.id,
        reliabilityScore: 0.85,
        reliabilityFactors: ["canonical_match_record"],
        degraded: false,
      },
    });

    const evidenceIds = [decisionArtifact.id, comparisonArtifact.id];
    const sourceTrustScore =
      targetTransaction || input.action === "ignore"
        ? 0.9
        : exception.matchType === "conflict"
          ? 0.75
          : 0.6;

    let memory;
    try {
      memory = await tx.exceptionAdjudicationMemory.create({
        data: {
          tenantId: input.tenantId,
          exceptionId: exception.id,
          adjudicationFingerprint,
          resolution: plan.resolution,
          resolutionReason: normalizedResolution.resolutionReason,
          resolutionCode: normalizedResolution.resolutionCode,
          adjudicatorId: input.userId,
          adjudicatorType: "operator",
          adjudicationType: input.action === "reopen" ? "re_adjudication" : "initial",
          startedAt: now,
          completedAt: now,
          durationMs: BigInt(0),
          outcome: plan.outcome,
          confidence: Number(exception.confidence),
          reversibility: input.action === "reopen" ? "reversible" : "pending_reversal",
          parentMemoryId: latestMemory?.id ?? null,
          evidenceIds,
          sourceTrustScore,
          annotations: {
            action: input.action,
            previousStatus: canonicalStatus,
            matchType: exception.matchType,
            resolutionCode: normalizedResolution.resolutionCode,
          } as Prisma.InputJsonValue,
          operatorNotes: note,
          systemNotes:
            input.action === "reopen"
              ? "Exception reopened from canonical operator workbench."
              : "Decision recorded from canonical operator workbench.",
          entryHash: buildHash({
            exceptionId: exception.id,
            action: input.action,
            occurredAt: now.toISOString(),
            userId: input.userId,
          }),
        },
      });
    } catch (e: unknown) {
      const code =
        typeof e === "object" && e !== null && "code" in e
          ? String((e as { code?: unknown }).code ?? "")
          : "";
      if (code === "P2002") {
        return {
          success: true,
          exceptionId: exception.id,
          status: plan.status,
          outcome: plan.outcome,
          message: "Identical adjudication already recorded (idempotent).",
        };
      }
      throw e;
    }

    // ── Auto-classify exception into an archetype on resolve/ignore ──
    if (input.action !== "reopen") {
      const prediction = predictExceptionArchetype({
        matchType: exception.matchType,
        amountDiff: exception.amountDiff != null ? Number(exception.amountDiff) : null,
        dateDiff: exception.dateDiff,
        confidence: Number(exception.confidence),
        hasTargetTransaction: Boolean(exception.targetTransactionId),
        matchReason: exception.matchReason,
      });

      // Find or create the archetype for this tenant
      let archetype = await tx.exceptionArchetype.findFirst({
        where: { tenantId: input.tenantId, code: prediction.code },
        select: { id: true, occurrenceCount: true },
      });

      if (!archetype) {
        archetype = await tx.exceptionArchetype.create({
          data: {
            tenantId: input.tenantId,
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
          select: { id: true, occurrenceCount: true },
        });
      }

      const existingClassification = await tx.exceptionArchetypeClassification.findFirst({
        where: {
          tenantId: input.tenantId,
          exceptionId: exception.id,
          archetypeId: archetype.id,
        },
        select: { id: true },
      });

      if (existingClassification) {
        await tx.exceptionArchetypeClassification.update({
          where: { id: existingClassification.id },
          data: {
            confidence: prediction.confidence,
            matchFeatures: prediction.matchFeatures as Prisma.InputJsonValue,
            classifiedBy: "system",
            metadata: {
              action: input.action,
              memoryId: memory.id,
              resolutionCode: normalizedResolution.resolutionCode,
            } as Prisma.InputJsonValue,
          },
        });
      } else {
        await tx.exceptionArchetypeClassification.create({
          data: {
            tenantId: input.tenantId,
            exceptionId: exception.id,
            archetypeId: archetype.id,
            confidence: prediction.confidence,
            matchFeatures: prediction.matchFeatures as Prisma.InputJsonValue,
            classifiedBy: "system",
            metadata: {
              action: input.action,
              memoryId: memory.id,
              resolutionCode: normalizedResolution.resolutionCode,
            } as Prisma.InputJsonValue,
          },
        });

        // Increment occurrence count and update last occurrence timestamp on first classification.
        await tx.exceptionArchetype.update({
          where: { id: archetype.id },
          data: {
            occurrenceCount: archetype.occurrenceCount + 1,
            lastOccurrenceAt: now,
          },
        });
      }
    }

    if (input.action !== "reopen") {
      const completeness = computeCompleteness({
        action: input.action,
        notes: note,
        hasTarget: Boolean(targetTransaction),
        evidenceCount: evidenceIds.length,
      });

      const proofSummary = {
        exceptionId: exception.id,
        runId: exception.runId,
        action: input.action,
        resultingStatus: plan.status,
        memoryId: memory.id,
        evidenceIds,
        sourceTrustScore,
        resolutionCode: normalizedResolution.resolutionCode,
      };

      await tx.proofPackage.create({
        data: {
          tenantId: input.tenantId,
          packageType: "exception_resolution",
          packageKey: `exception:${exception.id}:memory:${memory.id}`,
          evidenceIds,
          summary: proofSummary as Prisma.InputJsonValue,
          narrative: note,
          completenessScore: completeness.score,
          missingEvidence: completeness.missingEvidence,
          completenessFlags: completeness.completenessFlags,
          packageHash: buildHash({
            proofSummary,
            completeness,
          }),
          scope: "exception",
          scopeIds: [exception.id, exception.runId],
          periodStart: exception.createdAt,
          periodEnd: now,
          status: completeness.score >= 0.75 ? "finalized" : "draft",
          finalizedAt: completeness.score >= 0.75 ? now : null,
          metadata: {
            exceptionId: exception.id,
            memoryId: memory.id,
            action: input.action,
            resolutionCode: normalizedResolution.resolutionCode,
          } as Prisma.InputJsonValue,
        },
      });
    }

    await tx.reconciliationMatch.update({
      where: {
        id: exception.id,
      },
      data: {
        status: plan.status,
        reviewed: input.action === "reopen" ? false : true,
        reviewedBy: input.action === "reopen" ? null : input.userId,
        reviewedAt: input.action === "reopen" ? null : now,
        resolutionReason: input.action === "reopen" ? null : normalizedResolution.resolutionReason,
        notes: note,
        metadata: buildAdjudicationMetadata(exception.metadata, {
          ...metadataEntry,
          memoryId: memory.id,
          evidenceIds,
        }),
      },
    });

    const auditLogModel = (
      tx as unknown as { auditLog?: { create: (input: unknown) => Promise<void> } }
    ).auditLog;
    if (auditLogModel?.create) {
      await auditLogModel.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          action: `exception_${input.action}`,
          resourceType: "reconciliation_match",
          resourceId: exception.id,
          metadata: {
            runId: exception.runId,
            action: input.action,
            previousStatus: canonicalStatus,
            nextStatus: plan.status,
            memoryId: memory.id,
            evidenceIds,
            resolutionReason: normalizedResolution.resolutionReason,
            resolutionCode: normalizedResolution.resolutionCode,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return {
      success: true,
      exceptionId: exception.id,
      status: plan.status,
      outcome: plan.outcome,
      message:
        input.action === "ignore"
          ? "Exception ignored."
          : input.action === "reopen"
            ? "Exception reopened."
            : "Exception resolved.",
    };
  });
}
