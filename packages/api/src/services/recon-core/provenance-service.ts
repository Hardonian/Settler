/**
 * Evidence & Traceability Service
 *
 * Provides comprehensive audit trail for reconciliation decisions:
 * - Rule ID + version tracking per match
 * - Actor tracking (system vs human)
 * - Status transition logging
 * - Evidence chain normalization
 *
 * Part of Phase III: Evidence & Traceability
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { generateProvenanceHash, type DeterministicMatch } from "./deterministic-types";

/**
 * Provenance service for recording execution evidence
 */
export class ProvenanceService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Record a match creation event
   */
  async recordMatch(
    runResultId: string,
    snapshotId: string,
    match: DeterministicMatch,
    sequence: number
  ): Promise<void> {
    const entry = {
      runResultId,
      snapshotId,
      sequence,
      operation: "match_created" as const,
      entityType: "match" as const,
      entityId: match.id,
      ruleId: match.ruleId,
      ruleVersion: match.ruleVersion,
      confidence: match.confidence,
      actor: match.actor,
      actorUserId: match.actorUserId,
      details: {
        sourceId: match.sourceId,
        targetId: match.targetId,
        amount: match.amount,
        currency: match.currency,
        matchedFields: match.matchedFields,
        reason: match.reason,
        matchStrategy: match.matchStrategy,
      },
    };

    await this.prisma.executionProvenance.create({
      data: {
        ...entry,
        entryHash: generateProvenanceHash({
          runResultId: entry.runResultId,
          sequence: entry.sequence,
          timestamp: new Date().toISOString(),
          operation: entry.operation,
          entityId: entry.entityId,
          details: entry.details,
        }),
      },
    });
  }

  /**
   * Record a review decision
   */
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
    const operation = decision === "approved" ? "review_approved" 
      : decision === "rejected" ? "review_rejected" 
      : "match_created"; // Override creates a new match

    const entry = {
      runResultId,
      snapshotId,
      sequence,
      operation,
      entityType: "match" as const,
      entityId: matchId,
      actor,
      actorUserId,
      details: {
        decision,
        reason,
        previousState: "pending_review",
        newState: decision === "approved" ? "approved" 
          : decision === "rejected" ? "rejected" 
          : "override",
      },
    };

    await this.prisma.executionProvenance.create({
      data: {
        ...entry,
        entryHash: generateProvenanceHash({
          runResultId: entry.runResultId,
          sequence: entry.sequence,
          timestamp: new Date().toISOString(),
          operation: entry.operation,
          entityId: entry.entityId,
          details: entry.details,
        }),
      },
    });
  }

  /**
   * Record run status transition
   */
  async recordStatusTransition(
    runResultId: string,
    snapshotId: string,
    fromStatus: string,
    toStatus: string,
    sequence: number
  ): Promise<void> {
    const operation = toStatus === "completed" ? "run_completed"
      : toStatus === "failed" ? "run_failed"
      : "run_started";

    const entry = {
      runResultId,
      snapshotId,
      sequence,
      operation,
      entityType: "run" as const,
      entityId: runResultId,
      actor: "system" as const,
      details: {
        fromStatus,
        toStatus,
      },
    };

    await this.prisma.executionProvenance.create({
      data: {
        ...entry,
        entryHash: generateProvenanceHash({
          runResultId: entry.runResultId,
          sequence: entry.sequence,
          timestamp: new Date().toISOString(),
          operation: entry.operation,
          entityId: entry.entityId,
          details: entry.details,
        }),
      },
    });
  }

  /**
   * Get full evidence chain for a run
   */
  async getEvidenceChain(runResultId: string): Promise<{
    matches: DeterministicMatch[];
    reviewDecisions: Array<{
      matchId: string;
      decision: string;
      actor: string;
      actorUserId?: string;
      reason: string;
      timestamp: Date;
    }>;
    statusTransitions: Array<{
      fromStatus: string;
      toStatus: string;
      timestamp: Date;
    }>;
  }> {
    const provenance = await this.prisma.executionProvenance.findMany({
      where: { runResultId },
      orderBy: { sequence: "asc" },
    });

    const matches: DeterministicMatch[] = [];
    const reviewDecisions: Array<{
      matchId: string;
      decision: string;
      actor: string;
      actorUserId?: string;
      reason: string;
      timestamp: Date;
    }> = [];
    const statusTransitions: Array<{
      fromStatus: string;
      toStatus: string;
      timestamp: Date;
    }> = [];

    for (const entry of provenance) {
      const details = entry.details as Record<string, unknown>;

      if (entry.operation === "match_created") {
        matches.push({
          id: entry.entityId,
          sourceId: String(details.sourceId || ""),
          targetId: String(details.targetId || ""),
          confidence: Number(entry.confidence || 0),
          amount: details.amount as number | undefined,
          currency: details.currency as string | undefined,
          matchedFields: details.matchedFields as Record<string, unknown>,
          ruleId: entry.ruleId || "",
          ruleVersion: entry.ruleVersion || 1,
          matchStrategy: String(details.matchStrategy || "manual"),
          matchedAt: entry.timestamp.toISOString(),
          actor: entry.actor as "system" | "human",
          actorUserId: entry.actorUserId || undefined,
          reason: String(details.reason || ""),
          metadata: {},
        });
      } else if (entry.operation === "review_approved" || entry.operation === "review_rejected") {
        reviewDecisions.push({
          matchId: entry.entityId,
          decision: entry.operation === "review_approved" ? "approved" : "rejected",
          actor: entry.actor,
          actorUserId: entry.actorUserId || undefined,
          reason: String(details.reason || ""),
          timestamp: entry.timestamp,
        });
      } else if (entry.operation === "run_started" || entry.operation === "run_completed" || entry.operation === "run_failed") {
        statusTransitions.push({
          fromStatus: String(details.fromStatus || "unknown"),
          toStatus: String(details.toStatus || entry.operation.replace("run_", "")),
          timestamp: entry.timestamp,
        });
      }
    }

    return { matches, reviewDecisions, statusTransitions };
  }
}

/**
 * Evidence normalization utilities
 */
export const EvidenceNormalizer = {
  /**
   * Normalize match evidence for export/audit
   */
  normalizeMatch(match: DeterministicMatch): Record<string, unknown> {
    return {
      id: match.id,
      source: {
        id: match.sourceId,
      },
      target: {
        id: match.targetId,
      },
      confidence: {
        score: match.confidence,
        grade: match.confidence >= 0.9 ? "high" 
          : match.confidence >= 0.7 ? "medium" 
          : "low",
      },
      rule: {
        id: match.ruleId,
        version: match.ruleVersion,
      },
      timing: {
        matchedAt: match.matchedAt,
      },
      actor: {
        type: match.actor,
        userId: match.actorUserId,
      },
      evidence: {
        matchedFields: match.matchedFields,
        reason: match.reason,
        strategy: match.matchStrategy,
      },
    };
  },

  /**
   * Generate audit-friendly summary
   */
  generateAuditSummary(evidence: {
    matches: DeterministicMatch[];
    reviewDecisions: Array<{ decision: string; actor: string; timestamp: Date }>;
  }): {
    totalMatches: number;
    highConfidenceMatches: number;
    humanReviewedMatches: number;
    systemMatches: number;
    approvedMatches: number;
    rejectedMatches: number;
    auditTrailComplete: boolean;
  } {
    const matches = evidence.matches;
    const decisions = evidence.reviewDecisions;

    const highConfidenceMatches = matches.filter((m) => m.confidence >= 0.9).length;
    const humanReviewedMatches = matches.filter((m) => m.actor === "human").length;
    const systemMatches = matches.filter((m) => m.actor === "system").length;
    const approvedMatches = decisions.filter((d) => d.decision === "approved").length;
    const rejectedMatches = decisions.filter((d) => d.decision === "rejected").length;

    return {
      totalMatches: matches.length,
      highConfidenceMatches,
      humanReviewedMatches,
      systemMatches,
      approvedMatches,
      rejectedMatches,
      auditTrailComplete: decisions.length > 0,
    };
  },
};
