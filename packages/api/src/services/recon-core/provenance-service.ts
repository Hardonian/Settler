import crypto from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { type DeterministicMatch } from "./deterministic-types";

export type ProvenanceEventType = "match_created" | "review_decision" | "status_transition";

export interface ProvenanceRecordInput {
  tenantId: string;
  runId: string;
  matchId?: string;
  eventType: ProvenanceEventType;
  actorType: "system" | "human";
  actorUserId?: string;
  details: Record<string, unknown>;
}

function toJsonValue(input: unknown): Prisma.InputJsonValue {
  return (input ?? {}) as Prisma.InputJsonValue;
}

function stableStringify(input: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  Object.keys(input)
    .sort()
    .forEach((key) => {
      sorted[key] = input[key];
    });
  return JSON.stringify(sorted);
}

function buildEntryHash(
  input: ProvenanceRecordInput & { sequence: number; previousEntryHash?: string }
): string {
  return crypto
    .createHash("sha256")
    .update(
      [
        input.previousEntryHash ?? "genesis",
        input.tenantId,
        input.runId,
        input.matchId ?? "none",
        String(input.sequence),
        input.eventType,
        input.actorType,
        input.actorUserId ?? "none",
        stableStringify(input.details),
      ].join("|")
    )
    .digest("hex");
}

export class ProvenanceService {
  constructor(private readonly prisma: PrismaClient) {}

  private async nextSequenceAndPreviousHash(
    client: Prisma.TransactionClient | PrismaClient,
    runId: string
  ): Promise<{ sequence: number; previousEntryHash: string | undefined }> {
    const latest = await client.reconciliationProvenance.findFirst({
      where: { runId },
      select: { sequence: true, entryHash: true },
      orderBy: { sequence: "desc" },
    });
    return {
      sequence: (latest?.sequence ?? 0) + 1,
      previousEntryHash: latest?.entryHash,
    };
  }

  private async nextSequence(
    client: Prisma.TransactionClient | PrismaClient,
    runId: string
  ): Promise<number> {
    const latest = await client.reconciliationProvenance.findFirst({
      where: { runId },
      select: { sequence: true },
      orderBy: { sequence: "desc" },
    });
    return (latest?.sequence ?? 0) + 1;
  }

  private async recordEventWithClient(
    client: Prisma.TransactionClient | PrismaClient,
    input: ProvenanceRecordInput
  ): Promise<void> {
    const run = await client.reconciliationRun.findFirst({
      where: {
        id: input.runId,
        tenantId: input.tenantId,
      },
      select: { id: true },
    });

    if (!run) {
      throw new Error(`Cannot record provenance: run ${input.runId} not found in tenant scope`);
    }

    if (input.matchId) {
      const match = await client.reconciliationMatch.findFirst({
        where: { id: input.matchId, runId: input.runId, tenantId: input.tenantId },
        select: { id: true },
      });
      if (!match) {
        throw new Error(
          `Cannot record provenance: match ${input.matchId} not found for run ${input.runId}`
        );
      }
    }

    const { sequence, previousEntryHash } = await this.nextSequenceAndPreviousHash(
      client,
      input.runId
    );
    const entryHash = buildEntryHash({ ...input, sequence, previousEntryHash });

    await client.reconciliationProvenance.create({
      data: {
        tenantId: input.tenantId,
        runId: input.runId,
        matchId: input.matchId,
        sequence,
        eventType: input.eventType,
        actorType: input.actorType,
        actorUserId: input.actorUserId,
        details: toJsonValue(input.details),
        entryHash,
      },
    });
  }

  async recordEvent(input: ProvenanceRecordInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.recordEventWithClient(tx, input);
    });
  }

  async recordEventInTransaction(
    tx: Prisma.TransactionClient,
    input: ProvenanceRecordInput
  ): Promise<void> {
    await this.recordEventWithClient(tx, input);
  }

  async recordMatch(runId: string, tenantId: string, match: DeterministicMatch): Promise<void> {
    await this.recordEvent({
      tenantId,
      runId,
      matchId: match.id,
      eventType: "match_created",
      actorType: "system",
      details: {
        sourceRecordId: match.sourceId,
        targetRecordId: match.targetId,
        confidence: match.confidence,
        ruleId: match.ruleId,
        ruleVersion: match.ruleVersion,
        reason: match.reason,
        metadata: match.metadata ?? {},
      },
    });
  }

  async recordReviewDecision(input: {
    tenantId: string;
    runId: string;
    matchId: string;
    decision: "approved" | "rejected" | "override";
    actorUserId?: string;
    reason?: string;
  }): Promise<void> {
    await this.recordEvent({
      tenantId: input.tenantId,
      runId: input.runId,
      matchId: input.matchId,
      eventType: "review_decision",
      actorType: "human",
      actorUserId: input.actorUserId,
      details: { decision: input.decision, reason: input.reason ?? null },
    });
  }

  async recordReviewDecisionInTransaction(
    tx: Prisma.TransactionClient,
    input: {
      tenantId: string;
      runId: string;
      matchId: string;
      decision: "approved" | "rejected" | "override";
      actorUserId?: string;
      reason?: string;
    }
  ): Promise<void> {
    await this.recordEventInTransaction(tx, {
      tenantId: input.tenantId,
      runId: input.runId,
      matchId: input.matchId,
      eventType: "review_decision",
      actorType: "human",
      actorUserId: input.actorUserId,
      details: { decision: input.decision, reason: input.reason ?? null },
    });
  }

  async recordStatusTransition(input: {
    tenantId: string;
    runId: string;
    fromStatus: string;
    toStatus: string;
    actorType?: "system" | "human";
    actorUserId?: string;
    reason?: string;
  }): Promise<void> {
    await this.recordEvent({
      tenantId: input.tenantId,
      runId: input.runId,
      eventType: "status_transition",
      actorType: input.actorType ?? "system",
      actorUserId: input.actorUserId,
      details: {
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        reason: input.reason ?? null,
      },
    });
  }

  async getRunProvenance(tenantId: string, runId: string) {
    return this.prisma.reconciliationProvenance.findMany({
      where: { tenantId, runId },
      orderBy: { sequence: "asc" },
    });
  }
}
