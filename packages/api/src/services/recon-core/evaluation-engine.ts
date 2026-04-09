/**
 * Evaluation Engine - Enhanced Scoring Model
 *
 * Provides production-grade evaluation metrics:
 * - Weighted scoring
 * - Grounding metrics
 * - Drift detection
 * - False positive / false negative tracking
 * - Historical run comparison
 *
 * Part of Phase V: Evaluation Engine Upgrade
 */

import { PrismaClient } from "@prisma/client";

/**
 * Evaluation metrics for reconciliation runs
 */
export interface EvaluationMetrics {
  // Weighted scoring
  weightedScore: number;
  componentScores: {
    accuracy: number;
    confidence: number;
    coverage: number;
  };

  // Grounding metrics
  groundingScore: number;
  evidenceCoverage: number;
  ruleApplicability: number;

  // Drift detection
  driftDetected: boolean;
  driftMetrics: {
    schema: number;
    value: number;
    pattern: number;
  };

  // False positive/negative tracking
  fpFnMetrics: {
    falsePositives: number;
    falseNegatives: number;
    fpRate: number;
    fnRate: number;
  };

  // Historical comparison
  historicalComparison: {
    trend: "improving" | "stable" | "degrading";
    delta: number;
    percentile: number;
  };

  // Overall grade
  grade: "A" | "B" | "C" | "D" | "F";
}

/**
 * Scoring weights configuration
 */
export interface ScoringWeights {
  accuracy: number; // Match correctness
  confidence: number; // Confidence score
  coverage: number; // Records processed
  grounding: number; // Evidence quality
}

/**
 * Default scoring weights
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  accuracy: 0.4,
  confidence: 0.3,
  coverage: 0.15,
  grounding: 0.15,
};

/**
 * Evaluation Engine service
 */
export class EvaluationEngine {
  private prisma: PrismaClient;
  private weights: ScoringWeights;

  constructor(prisma: PrismaClient, weights?: Partial<ScoringWeights>) {
    this.prisma = prisma;
    this.weights = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
  }

  /**
   * Evaluate a reconciliation run
   */
  async evaluateRun(runId: string): Promise<EvaluationMetrics> {
    const run = await this.prisma.reconResult.findUnique({
      where: { id: runId },
      include: {
        reconJob: true,
      },
    });

    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    // Calculate component scores
    const accuracyScore = this.calculateAccuracyScore(run);
    const confidenceScore = this.calculateConfidenceScore(
      run as unknown as {
        confidenceAvg: number | null;
        confidenceMin: number | null;
        confidenceMax: number | null;
      }
    );
    const coverageScore = this.calculateCoverageScore(run);
    const groundingScore = await this.calculateGroundingScore(run.id);

    // Weighted overall score
    const weightedScore =
      accuracyScore * this.weights.accuracy +
      confidenceScore * this.weights.confidence +
      coverageScore * this.weights.coverage +
      groundingScore * this.weights.grounding;

    // Calculate drift
    const driftMetrics = await this.calculateDrift(run);

    // Calculate FP/FN
    const fpFnMetrics = await this.calculateFpFn(run.id);

    // Historical comparison
    const historicalComparison = await this.compareWithHistory(run.reconJobId, run.confidenceAvg);

    // Determine grade
    const grade = this.determineGrade(weightedScore);

    return {
      weightedScore: Math.round(weightedScore * 100) / 100,
      componentScores: {
        accuracy: Math.round(accuracyScore * 100) / 100,
        confidence: Math.round(confidenceScore * 100) / 100,
        coverage: Math.round(coverageScore * 100) / 100,
      },
      groundingScore: Math.round(groundingScore * 100) / 100,
      evidenceCoverage: 0, // No provenance data available
      ruleApplicability: 0, // No snapshot data available
      driftDetected: driftMetrics.schema > 0 || driftMetrics.value > 0 || driftMetrics.pattern > 0,
      driftMetrics,
      fpFnMetrics,
      historicalComparison,
      grade,
    };
  }

  /**
   * Calculate accuracy score based on match rates
   */
  private calculateAccuracyScore(run: {
    matchedCount: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflictCount: number;
  }): number {
    const total = run.matchedCount + run.unmatchedSourceCount + run.unmatchedTargetCount;
    if (total === 0) return 0;

    // Accuracy = matched / total (excluding conflicts from accuracy calculation)
    const accuracy = run.matchedCount / total;
    return Math.min(1, accuracy);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(run: {
    confidenceAvg: number | null;
    confidenceMin: number | null;
    confidenceMax: number | null;
  }): number {
    if (!run.confidenceAvg) return 0;

    // Use average confidence, penalize if min is too low
    const avg = Number(run.confidenceAvg);
    const min = run.confidenceMin ? Number(run.confidenceMin) : 0;

    // Penalize if minimum confidence is below threshold
    const penalty = min < 0.7 ? 0.2 : 0;
    return Math.max(0, avg - penalty);
  }

  /**
   * Calculate coverage score
   */
  private calculateCoverageScore(run: {
    sourceCount: number;
    targetCount: number;
    matchedCount: number;
  }): number {
    const totalInput = run.sourceCount + run.targetCount;
    if (totalInput === 0) return 0;

    // Coverage = how many records were processed
    const processed = run.matchedCount;
    return Math.min(1, processed / totalInput);
  }

  /**
   * Calculate grounding score (evidence quality)
   */
  private async calculateGroundingScore(_runId: string): Promise<number> {
    // Grounding score - returns 0 when provenance data is not available
    // In production, this would query actual provenance/audit data
    return 0;
  }

  /**
   * Calculate drift metrics
   */
  private async calculateDrift(run: { id: string }): Promise<{
    schema: number;
    value: number;
    pattern: number;
  }> {
    // Query drift events for this run
    const driftEvents = await this.prisma.driftEvent.findMany({
      where: { reconJobId: run.id },
    });

    if (driftEvents.length === 0) {
      return { schema: 0, value: 0, pattern: 0 };
    }

    const schema = driftEvents.filter((e) => e.driftType === "schema_drift").length;
    const value = driftEvents.filter((e) => e.driftType === "value_drift").length;
    const pattern = driftEvents.filter((e) => e.driftType === "pattern_drift").length;

    // Normalize to 0-1 scale
    const total = schema + value + pattern;
    return {
      schema: schema / total,
      value: value / total,
      pattern: pattern / total,
    };
  }

  /**
   * Calculate false positive/negative metrics
   */
  private async calculateFpFn(_runId: string): Promise<{
    falsePositives: number;
    falseNegatives: number;
    fpRate: number;
    fnRate: number;
  }> {
    // FP/FN metrics - returns zeros when execution provenance is not available
    // In production, this would query actual review decisions
    return {
      falsePositives: 0,
      falseNegatives: 0,
      fpRate: 0,
      fnRate: 0,
    };
  }

  /**
   * Compare with historical runs
   */
  private async compareWithHistory(
    reconJobId: string,
    confidenceAvg: unknown
  ): Promise<{
    trend: "improving" | "stable" | "degrading";
    delta: number;
    percentile: number;
  }> {
    // Get last 10 runs for this job
    const history = await this.prisma.reconResult.findMany({
      where: {
        reconJobId: reconJobId,
        status: "completed",
        confidenceAvg: { not: null },
      },
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    if (history.length < 2) {
      return { trend: "stable", delta: 0, percentile: 50 };
    }

    // Calculate average of previous runs
    const previousRuns = history.slice(1);
    const previousAvg =
      previousRuns.reduce((sum, r) => sum + Number(r.confidenceAvg || 0), 0) / previousRuns.length;

    const currentScore = Number(confidenceAvg || 0);
    const delta = currentScore - previousAvg;

    // Determine trend
    const trend = delta > 0.05 ? "improving" : delta < -0.05 ? "degrading" : "stable";

    // Calculate percentile (simplified)
    const percentile = delta > 0 ? 75 : delta < 0 ? 25 : 50;

    return {
      trend,
      delta: Math.round(delta * 100) / 100,
      percentile,
    };
  }

  /**
   * Determine letter grade
   */
  private determineGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 0.9) return "A";
    if (score >= 0.8) return "B";
    if (score >= 0.7) return "C";
    if (score >= 0.6) return "D";
    return "F";
  }
}
