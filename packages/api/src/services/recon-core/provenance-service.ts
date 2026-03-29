/**
 * Evidence & Traceability Service
 *
 * Canonical provenance recorder for reconciliation decisions.
 * Persists deterministic provenance entries with tenant scoping.
 */

import crypto from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import { type DeterministicMatch } from "./deterministic-types";

function toJsonValue(input: unknown): Prisma.InputJsonValue {
  return (input ?? {}) as Prisma.InputJsonValue;
}

function buildEntryHash(input: {
  runResultId: string;
  snapshotId: string;
  sequence: number;
  operation: string;
  entityType: string;
  entityId: string;
  details: unknown;
}): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        runResultId: input.runResultId,
        snapshotId: input.snapshotId,
        sequence: input.sequence,
        operation: input.operation,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details,
      })
    )
    .digest("hex");
}

export class ProvenanceService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private async resolveTenantId(runResultId: string): Promise<string> {
    const result = await this.prisma.reconResult.findUnique({
      where: { id: runResultId },
      select: { tenantId: true },
    });

    if (!result) {
      throw new Error(`Cannot record provenance: run result ${runResultId} not found`);
    }

    return result.tenantId;
  }

  async recordMatch(
    runResultId: string,
    snapshotId: string,
    match: DeterministicMatch,
    sequence: number
  ): Promise<void> {
    const tenantId = await this.resolveTenantId(runResultId);
    await this.prisma.executionProvenance.create({
      data: {
        tenantId,
        runResultId,
        snapshotId,
        sequence,
        operation: "match_created",
        entityType: "reconciliation_match",
        entityId: match.id,
        confidence: match.confidence,
        ruleId: match.ruleId,
        ruleVersion: match.ruleVersion,
        actor: "system",
        details: toJsonValue({
          sourceRecordId: match.sourceId,
          targetRecordId: match.targetId,
          reason: match.reason,
          metadata: match.metadata,
        }),
        entryHash: buildEntryHash({
          runResultId,
          snapshotId,
          sequence,
          operation: "match_created",
          entityType: "reconciliation_match",
          entityId: match.id,
          details: match,
        }),
      },
    });
  }

  async recordReviewDecision(
    runResultId: string,
    snapshotId: string,
    matchId: string,
    decision: "approved" | "rejected" | "override",
    actor: "system" | "human",
    actorUserId: string | undefined,
    reason: string,
    sequence: number
  ): Promise<void> {
    const tenantId = await this.resolveTenantId(runResultId);
    await this.prisma.executionProvenance.create({
      data: {
        tenantId,
        runResultId,
        snapshotId,
        sequence,
        operation: "review_decision",
        entityType: "reconciliation_match",
        entityId: matchId,
        actor,
        actorUserId,
        details: toJsonValue({ decision, reason }),
        entryHash: buildEntryHash({
          runResultId,
          snapshotId,
          sequence,
          operation: "review_decision",
          entityType: "reconciliation_match",
          entityId: matchId,
          details: { decision, reason, actor, actorUserId },
        }),
      },
    });
  }

  async recordStatusTransition(
    runResultId: string,
    snapshotId: string,
    fromStatus: string,
    toStatus: string,
    actor: "system" | "human",
    actorUserId: string | undefined,
    reason: string,
    sequence: number
  ): Promise<void> {
    const tenantId = await this.resolveTenantId(runResultId);
    await this.prisma.executionProvenance.create({
      data: {
        tenantId,
        runResultId,
        snapshotId,
        sequence,
        operation: "status_transition",
        entityType: "recon_result",
        entityId: runResultId,
        actor,
        actorUserId,
        details: toJsonValue({ fromStatus, toStatus, reason }),
        entryHash: buildEntryHash({
          runResultId,
          snapshotId,
          sequence,
          operation: "status_transition",
          entityType: "recon_result",
          entityId: runResultId,
          details: { fromStatus, toStatus, reason, actor },
        }),
      },
    });
  }

  async getProvenanceForRun(runResultId: string): Promise<unknown[]> {
    return this.prisma.executionProvenance.findMany({
      where: { runResultId },
      orderBy: { sequence: "asc" },
    });
  }

  async getProvenanceForEntity(runResultId: string, entityId: string): Promise<unknown[]> {
    return this.prisma.executionProvenance.findMany({
      where: { runResultId, entityId },
      orderBy: { sequence: "asc" },
    });
  }
}
