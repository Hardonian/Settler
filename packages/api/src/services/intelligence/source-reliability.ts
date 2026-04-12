/**
 * Source Reliability Service
 *
 * Compounds historical reconciliation outcomes, drift events, and operator
 * adjudications into a dynamic reliability/trust score for ingestion sources.
 *
 * Moat: Reusable Institutional Memory + Source Reliability Scoring.
 */

import { PrismaClient, IngestionSource } from "@prisma/client";
import { logInfo, logError } from "../../utils/logger";

export interface SourceReliabilityScore {
  sourceId: string;
  reliabilityScore: number; // 0.0 to 1.0
  trustLevel: "high" | "medium" | "low" | "unverified";
  factors: ReliabilityFactor[];
  lastCalculatedAt: Date;
}

export interface ReliabilityFactor {
  kind: "drift" | "adjudication" | "match_rate" | "error_rate" | "manual_override";
  impact: number; // Positive or negative contribution to score
  description: string;
  weight: number;
}

export class SourceReliabilityService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Calculate and retrieve the reliability score for a source
   */
  async getSourceReliability(tenantId: string, sourceId: string): Promise<SourceReliabilityScore> {
    const source = await this.prisma.ingestionSource.findFirst({
      where: { id: sourceId, tenantId },
    });

    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    const factors: ReliabilityFactor[] = [];

    // 1. Analyze Drift Events
    const driftFactor = await this.analyzeDriftEvents(tenantId, sourceId);
    factors.push(driftFactor);

    // 2. Analyze Adjudication History (Manual overrides of system decisions)
    const adjudicationFactor = await this.analyzeAdjudicationHistory(tenantId, sourceId);
    factors.push(adjudicationFactor);

    // 3. Analyze Ingestion Stability
    const stabilityFactor = this.calculateStabilityFactor(source);
    factors.push(stabilityFactor);

    // 4. Analyze Match Rates
    const matchRateFactor = await this.analyzeMatchPerformance(tenantId, sourceId);
    factors.push(matchRateFactor);

    // Compute final weighted score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedScore =
      factors.reduce((sum, f) => sum + f.impact * f.weight, 0) / (totalWeight || 1);

    // Normalize score to 0.0 - 1.0
    const finalScore = Math.max(0, Math.min(1, 0.5 + weightedScore));

    return {
      sourceId,
      reliabilityScore: Math.round(finalScore * 10000) / 10000,
      trustLevel: this.determineTrustLevel(finalScore),
      factors,
      lastCalculatedAt: new Date(),
    };
  }

  private async analyzeDriftEvents(tenantId: string, sourceId: string): Promise<ReliabilityFactor> {
    // Find drift events linked to this source via reconJobId if available
    // or through the ingestion history
    const driftCount = await this.prisma.driftEvent.count({
      where: {
        tenantId,
        metadata: { path: ["source_id"], equals: sourceId },
      },
    });

    const impact = driftCount === 0 ? 0.2 : -Math.min(driftCount * 0.05, 0.5);

    return {
      kind: "drift",
      impact,
      weight: 0.3,
      description:
        driftCount === 0 ? "No schema drift detected" : `${driftCount} drift events detected`,
    };
  }

  private async analyzeAdjudicationHistory(
    tenantId: string,
    sourceId: string
  ): Promise<ReliabilityFactor> {
    // How many times have operators manually resolved exceptions where this source was involved?
    const adjudications = await this.prisma.exceptionAdjudicationMemory.findMany({
      where: {
        tenantId,
        exception: {
          sourceTransaction: { sourceId },
        },
      },
      select: {
        resolution: true,
        sourceTrustScore: true,
      },
      take: 100,
    });

    if (adjudications.length === 0) {
      return {
        kind: "adjudication",
        impact: 0,
        weight: 0.2,
        description: "No adjudication history available",
      };
    }

    const explicitTrustScores = adjudications
      .filter((a) => a.sourceTrustScore !== null)
      .map((a) => Number(a.sourceTrustScore));

    const avgExplicitTrust =
      explicitTrustScores.length > 0
        ? explicitTrustScores.reduce((a, b) => a + b, 0) / explicitTrustScores.length
        : 0.5;

    // Penalty for manual resolutions (suggesting the system couldn't trust the source data automatically)
    const manualRate =
      adjudications.filter((a) => a.resolution === "manual").length / adjudications.length;
    const impact = (avgExplicitTrust - 0.5) * 0.5 - manualRate * 0.2;

    return {
      kind: "adjudication",
      impact,
      weight: 0.3,
      description: `Based on ${adjudications.length} historical adjudications`,
    };
  }

  private calculateStabilityFactor(source: IngestionSource): ReliabilityFactor {
    const successRate = source.lastSyncStatus === "success" ? 0.3 : -0.2;

    return {
      kind: "error_rate",
      impact: successRate,
      weight: 0.1,
      description: `Last sync status: ${source.lastSyncStatus ?? "Unknown"}`,
    };
  }

  private async analyzeMatchPerformance(
    tenantId: string,
    sourceId: string
  ): Promise<ReliabilityFactor> {
    // Match rates for transactions from this source
    const recentNormalized = await this.prisma.normalizedTransaction.findMany({
      where: { tenantId, sourceId },
      include: {
        sourceMatches: {
          select: { matchType: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    if (recentNormalized.length === 0) {
      return { kind: "match_rate", impact: 0, weight: 0.1, description: "No transaction data" };
    }

    const matchCount = recentNormalized.filter((t) => t.sourceMatches.length > 0).length;
    const matchRate = matchCount / recentNormalized.length;

    const impact = (matchRate - 0.7) * 0.4; // 70% match rate is neutral

    return {
      kind: "match_rate",
      impact,
      weight: 0.1,
      description: `Historical match rate: ${(matchRate * 100).toFixed(1)}%`,
    };
  }

  private determineTrustLevel(score: number): "high" | "medium" | "low" | "unverified" {
    if (score >= 0.8) return "high";
    if (score >= 0.5) return "medium";
    if (score >= 0.3) return "low";
    return "unverified";
  }

  /**
   * Update the reliability score artifact for the source
   */
  async updateSourceReliabilityArtifact(tenantId: string, sourceId: string): Promise<void> {
    const reliability = await this.getSourceReliability(tenantId, sourceId);

    const artifactKey = `reliability:source:${sourceId}`;

    await this.prisma.policyMemoryArtifact.upsert({
      where: { tenantId_artifactKey: { tenantId, artifactKey } },
      update: {
        payload: reliability as any,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        artifactKey,
        artifactType: "source_reliability",
        payload: reliability as any,
      },
    });

    logInfo(`Updated reliability score for source ${sourceId}`, {
      tenantId,
      reliabilityScore: reliability.reliabilityScore,
    });
  }
}
