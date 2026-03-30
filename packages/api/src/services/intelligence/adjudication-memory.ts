/**
 * Adjudication Memory Service
 *
 * First-class adjudication memory capture for compounding reconciliation intelligence.
 * Stores structured resolution decisions as reusable institutional knowledge.
 *
 * Key concepts:
 * - Every adjudication becomes searchable memory for future similar cases
 * - Archetype classification enables intelligent case matching
 * - Policy outcome ledger tracks resolution effectiveness over time
 * - Reopen/escalation lineage maintains complete decision chains
 */

import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

export type ResolutionType = "matched" | "manual" | "ignored" | "duplicate" | "escalated";
export type AdjudicationType = "initial" | "re_adjudication" | "escalated_review" | "auto_resolved";
export type AdjudicatorType = "operator" | "supervisor" | "system" | "automated_rule";

export interface AdjudicationMemoryInput {
  tenantId: string;
  exceptionId: string;
  archetypeId?: string;

  resolution: ResolutionType;
  resolutionReason?: string;
  resolutionCode?: string;

  adjudicatorId: string;
  adjudicatorType: AdjudicatorType;
  adjudicationType: AdjudicationType;

  evidenceIds?: string[];
  sourceTrustScore?: number;

  annotations?: Record<string, unknown>;
  operatorNotes?: string;
  systemNotes?: string;

  suggestedPolicyChange?: Record<string, unknown>;

  // For reopen/escalation
  parentMemoryId?: string;
  escalatedTo?: string;
  escalationReason?: string;
}

export interface AdjudicationMemoryRecord {
  id: string;
  tenantId: string;
  exceptionId: string;
  archetypeId?: string;

  resolution: ResolutionType;
  resolutionReason?: string;
  resolutionCode?: string;

  adjudicatorId: string;
  adjudicatorType: AdjudicatorType;
  adjudicationType: AdjudicationType;

  startedAt: Date;
  completedAt?: Date;
  durationMs?: bigint;

  outcome?: string;
  confidence?: number;
  reversibility?: string;

  parentMemoryId?: string;
  escalatedTo?: string;
  escalationReason?: string;

  evidenceIds: string[];
  sourceTrustScore?: number;

  annotations: Record<string, unknown>;
  operatorNotes?: string;
  systemNotes?: string;

  suggestedPolicyChange?: Record<string, unknown>;
  policyChangeAccepted?: boolean;

  entryHash: string;
  createdAt: Date;
}

export interface SimilarCaseQuery {
  tenantId: string;
  archetypeId?: string;
  resolution?: ResolutionType;
  resolutionReason?: string;
  limit?: number;
  minConfidence?: number;
  dateFrom?: Date;
  dateTo?: Date;
  excludeExceptionId?: string;
}

export interface SimilarCase {
  exceptionId: string;
  archetypeCode?: string;
  archetypeLabel?: string;
  resolution: ResolutionType;
  resolutionReason?: string;
  confidence: number;
  adjudicatedAt: Date;
  adjudicatorId: string;
  similarityScore: number; // 0-1, how similar to query
  matchFeatures: Record<string, number>; // Which features matched
}

export interface WhyFlaggedResult {
  primaryReasons: FlagReason[];
  secondaryReasons: FlagReason[];
  confidence: number;
  suggestedArchetypes: ArchetypeSuggestion[];
  similarCaseCount: number;
}

export interface FlagReason {
  reason: string;
  code: string;
  weight: number; // 0-1, contribution to flag
  evidence?: string;
}

export interface ArchetypeSuggestion {
  archetypeId: string;
  archetypeCode: string;
  archetypeLabel: string;
  confidence: number;
  matchFeatures: Record<string, number>;
}

export interface PolicyTuningHint {
  hintType: "threshold_adjustment" | "rule_addition" | "rule_modification" | "new_archetype";
  targetField?: string;
  currentValue?: unknown;
  suggestedValue?: unknown;
  rationale: string;
  supportingCases: number;
  confidence: number;
}

/**
 * Build entry hash for audit chain integrity
 */
function buildEntryHash(input: Omit<AdjudicationMemoryInput, "entryHash">): string {
  const payload = {
    exceptionId: input.exceptionId,
    resolution: input.resolution,
    resolutionReason: input.resolutionReason ?? "none",
    adjudicatorId: input.adjudicatorId,
    adjudicationType: input.adjudicationType,
    completedAt: new Date().toISOString(),
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Compute similarity score between exceptions
 */
function computeSimilarity(
  query: Record<string, unknown>,
  candidate: Record<string, unknown>,
  weights: Record<string, number>
): { score: number; features: Record<string, number> } {
  let totalWeight = 0;
  let weightedSum = 0;
  const features: Record<string, number> = {};

  for (const [key, weight] of Object.entries(weights)) {
    totalWeight += weight;
    let featureScore = 0;

    const queryVal = query[key];
    const candidateVal = candidate[key];

    if (queryVal === candidateVal) {
      featureScore = 1.0;
    } else if (typeof queryVal === "number" && typeof candidateVal === "number") {
      // For numeric values, use inverse of relative difference
      const diff = Math.abs(queryVal - candidateVal);
      const max = Math.max(Math.abs(queryVal), Math.abs(candidateVal));
      featureScore = max === 0 ? 1.0 : 1.0 - Math.min(diff / max, 1.0);
    }

    features[key] = featureScore;
    weightedSum += weight * featureScore;
  }

  return {
    score: totalWeight === 0 ? 0 : weightedSum / totalWeight,
    features,
  };
}

/**
 * Adjudication Memory Service
 */
export class AdjudicationMemoryService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Record an adjudication as memory
   */
  async recordAdjudication(input: AdjudicationMemoryInput): Promise<AdjudicationMemoryRecord> {
    const entryHash = buildEntryHash(input);
    const completedAt = new Date();
    const startedAt = new Date();

    const record = await this.prisma.exceptionAdjudicationMemory.create({
      data: {
        tenantId: input.tenantId,
        exceptionId: input.exceptionId,
        archetypeId: input.archetypeId,

        resolution: input.resolution,
        resolutionReason: input.resolutionReason,
        resolutionCode: input.resolutionCode,

        adjudicatorId: input.adjudicatorId,
        adjudicatorType: input.adjudicatorType,
        adjudicationType: input.adjudicationType,

        startedAt,
        completedAt,
        durationMs: BigInt(completedAt.getTime() - startedAt.getTime()),

        outcome: this.computeOutcome(input),
        confidence: this.computeResolutionConfidence(input),
        reversibility: this.computeReversibility(input),

        parentMemoryId: input.parentMemoryId,
        escalatedTo: input.escalatedTo,
        escalationReason: input.escalationReason,

        evidenceIds: input.evidenceIds ?? [],
        sourceTrustScore: input.sourceTrustScore,

        annotations: input.annotations ?? {},
        operatorNotes: input.operatorNotes,
        systemNotes: input.systemNotes,

        suggestedPolicyChange: input.suggestedPolicyChange ?? undefined,

        entryHash,
      },
    });

    // Update archetype occurrence count if classified
    if (input.archetypeId) {
      await this.prisma.exceptionArchetype.update({
        where: { id: input.archetypeId },
        data: {
          occurrenceCount: { increment: 1 },
          lastOccurrenceAt: completedAt,
        },
      });
    }

    return record as unknown as AdjudicationMemoryRecord;
  }

  /**
   * Find similar prior cases for an exception
   */
  async findSimilarCases(query: SimilarCaseQuery): Promise<SimilarCase[]> {
    const { prisma } = this;

    // Build where clause
    const where: any = {
      tenantId: query.tenantId,
      outcome: { in: ["resolved", "confirmed_dismissed"] },
    };

    if (query.archetypeId) {
      where.archetypeId = query.archetypeId;
    }

    if (query.resolution) {
      where.resolution = query.resolution;
    }

    if (query.resolutionReason) {
      where.resolutionReason = { contains: query.resolutionReason, mode: "insensitive" };
    }

    if (query.dateFrom) {
      where.createdAt = { ...where.createdAt, gte: query.dateFrom };
    }

    if (query.dateTo) {
      where.createdAt = { ...where.createdAt, lte: query.dateTo };
    }

    if (query.excludeExceptionId) {
      where.exceptionId = { not: query.excludeExceptionId };
    }

    // Fetch candidate cases
    const candidates = await prisma.exceptionAdjudicationMemory.findMany({
      where,
      include: {
        archetype: {
          select: { code: true, label: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit candidates for performance
    });

    // Score and rank by similarity
    const SIMILARITY_WEIGHTS: Record<string, number> = {
      archetypeId: 0.4,
      resolution: 0.3,
      resolutionReason: 0.2,
      sourceTrustScore: 0.1,
    };

    const queryFeatures = {
      archetypeId: query.archetypeId ?? "none",
      resolution: query.resolution ?? "none",
      resolutionReason: query.resolutionReason ?? "none",
    };

    const scoredCases: SimilarCase[] = [];

    for (const candidate of candidates) {
      const candidateFeatures = {
        archetypeId: candidate.archetypeId ?? "none",
        resolution: candidate.resolution,
        resolutionReason: candidate.resolutionReason ?? "none",
        sourceTrustScore: candidate.sourceTrustScore ?? 0.5,
      };

      const { score, features } = computeSimilarity(
        queryFeatures,
        candidateFeatures,
        SIMILARITY_WEIGHTS
      );

      if (query.minConfidence && score < query.minConfidence) {
        continue;
      }

      scoredCases.push({
        exceptionId: candidate.exceptionId,
        archetypeCode: candidate.archetype?.code,
        archetypeLabel: candidate.archetype?.label,
        resolution: candidate.resolution as ResolutionType,
        resolutionReason: candidate.resolutionReason ?? undefined,
        confidence: candidate.confidence ? Number(candidate.confidence) : 0,
        adjudicatedAt: candidate.createdAt,
        adjudicatorId: candidate.adjudicatorId,
        similarityScore: Math.round(score * 10000) / 10000,
        matchFeatures: features,
      });
    }

    // Sort by similarity and return top results
    scoredCases.sort((a, b) => b.similarityScore - a.similarityScore);

    return scoredCases.slice(0, query.limit ?? 10);
  }

  /**
   * Generate "why flagged" explanation for an exception
   */
  async explainWhyFlagged(exceptionId: string, tenantId: string): Promise<WhyFlaggedResult> {
    const { prisma } = this;

    const exception = await prisma.reconciliationMatch.findFirst({
      where: { id: exceptionId, tenantId },
      include: {
        sourceTransaction: true,
        archetypeClassifications: {
          include: { archetype: true },
          orderBy: { confidence: "desc" },
        },
      },
    });

    if (!exception) {
      throw new Error(`Exception ${exceptionId} not found`);
    }

    const primaryReasons: FlagReason[] = [];
    const secondaryReasons: FlagReason[] = [];

    // Amount difference analysis
    if (exception.amountDiff && Number(exception.amountDiff) !== 0) {
      primaryReasons.push({
        reason: `Amount mismatch: ${Number(exception.amountDiff).toFixed(2)} difference detected`,
        code: "AMOUNT_MISMATCH",
        weight: Math.min(Math.abs(Number(exception.amountDiff)) / 100, 1.0), // Scaled by amount
        evidence: `Source: ${exception.sourceTransaction?.amount}, Target: ${exception.targetTransactionId}`,
      });
    }

    // Date drift analysis
    if (exception.dateDiff && Math.abs(exception.dateDiff) > 0) {
      secondaryReasons.push({
        reason: `Date drift: ${exception.dateDiff} day(s) difference`,
        code: "DATE_DRIFT",
        weight: Math.min(Math.abs(exception.dateDiff) / 30, 1.0),
      });
    }

    // Low confidence analysis
    const confidence = Number(exception.confidence);
    if (confidence < 0.8) {
      primaryReasons.push({
        reason: `Low match confidence: ${(confidence * 100).toFixed(1)}%`,
        code: "LOW_CONFIDENCE",
        weight: 1.0 - confidence,
        evidence: `Confidence score below 0.8 threshold`,
      });
    }

    // No target match
    if (!exception.targetTransactionId) {
      primaryReasons.push({
        reason: "No matching record found in target dataset",
        code: "MISSING_IN_TARGET",
        weight: 0.9,
        evidence: `Source transaction ${exception.sourceTransactionId} has no counterpart`,
      });
    }

    // Build archetype suggestions from classifications
    const suggestedArchetypes: ArchetypeSuggestion[] = exception.archetypeClassifications
      .filter((c) => Number(c.confidence) > 0.3)
      .map((c) => ({
        archetypeId: c.archetypeId,
        archetypeCode: c.archetype?.code ?? "UNKNOWN",
        archetypeLabel: c.archetype?.label ?? "Unknown",
        confidence: Number(c.confidence),
        matchFeatures: c.matchFeatures as Record<string, number>,
      }));

    // Count similar historical cases
    const similarCaseCount = await prisma.exceptionAdjudicationMemory.count({
      where: {
        tenantId,
        archetypeId: { in: exception.archetypeClassifications.map((c) => c.archetypeId) },
        outcome: { in: ["resolved", "confirmed_dismissed"] },
      },
    });

    // Compute overall confidence
    const overallConfidence =
      primaryReasons.length > 0
        ? primaryReasons.reduce((sum, r) => sum + r.weight, 0) / primaryReasons.length
        : 0.5;

    return {
      primaryReasons,
      secondaryReasons,
      confidence: Math.round(overallConfidence * 10000) / 10000,
      suggestedArchetypes,
      similarCaseCount,
    };
  }

  /**
   * Generate policy tuning hints based on adjudication patterns
   */
  async generatePolicyTuningHints(tenantId: string, jobId?: string): Promise<PolicyTuningHint[]> {
    const { prisma } = this;

    const hints: PolicyTuningHint[] = [];

    // Analyze high-confidence cases that were re-adjudicated (suggesting policy issues)
    const reAdjudicatedCases = await prisma.exceptionAdjudicationMemory.groupBy({
      by: ["archetypeId", "resolution", "resolutionReason"],
      where: {
        tenantId,
        adjudicationType: "re_adjudication",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      _count: { _all: true },
    });

    for (const group of reAdjudicatedCases) {
      if (group._count._all >= 5) {
        // Threshold for generating a hint
        hints.push({
          hintType: "threshold_adjustment",
          rationale: `${group._count._all} cases required re-adjudication, suggesting threshold tuning needed`,
          supportingCases: group._count._all,
          confidence: Math.min(group._count._all / 20, 0.9),
        });
      }
    }

    // Analyze ignored vs resolved ratio by archetype
    const resolutionBreakdown = await prisma.exceptionAdjudicationMemory.groupBy({
      by: ["archetypeId", "resolution"],
      where: { tenantId },
      _count: { _all: true },
    });

    // Group by archetype and analyze
    const byArchetype = new Map<string, Record<string, number>>();
    for (const item of resolutionBreakdown) {
      if (!item.archetypeId) continue;
      const existing = byArchetype.get(item.archetypeId) ?? {};
      existing[item.resolution] = item._count._all;
      byArchetype.set(item.archetypeId, existing);
    }

    for (const [archetypeId, resolutions] of byArchetype) {
      const ignored = resolutions["ignored"] ?? 0;
      const resolved = resolutions["resolved"] ?? 0;
      const total = ignored + resolved;

      if (total >= 10) {
        const ignoreRate = ignored / total;

        // High ignore rate suggests false positives
        if (ignoreRate > 0.3) {
          hints.push({
            hintType: "rule_modification",
            rationale: `${(ignoreRate * 100).toFixed(1)}% of cases ignored - rules may be too strict`,
            supportingCases: total,
            confidence: Math.min(ignoreRate, 0.9),
          });
        }
      }
    }

    return hints;
  }

  private computeOutcome(input: AdjudicationMemoryInput): string {
    if (input.adjudicationType === "escalated_review") {
      return "escalated";
    }
    if (input.adjudicationType === "re_adjudication") {
      return "reopened";
    }
    if (input.resolution === "ignored") {
      return "confirmed_dismissed";
    }
    return "resolved";
  }

  private computeResolutionConfidence(input: AdjudicationMemoryInput): number {
    let confidence = 0.7; // Base confidence

    // Archetype classification adds confidence
    if (input.archetypeId) {
      confidence += 0.15;
    }

    // Evidence presence adds confidence
    if (input.evidenceIds && input.evidenceIds.length > 0) {
      confidence += 0.1;
    }

    // Source trust score contributes
    if (input.sourceTrustScore) {
      confidence = confidence * 0.5 + input.sourceTrustScore * 0.5;
    }

    // Operator notes add confidence for edge cases
    if (input.operatorNotes && input.operatorNotes.length > 50) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  private computeReversibility(input: AdjudicationMemoryInput): string {
    if (input.resolution === "ignored") {
      return "reversible"; // Ignored can always be re-reviewed
    }
    if (input.adjudicationType === "auto_resolved") {
      return "pending_reversal"; // Automated resolutions should be verifiable
    }
    if (input.confidence && input.confidence > 0.9) {
      return "irreversible"; // High confidence, low reversal probability
    }
    return "reversible";
  }
}
