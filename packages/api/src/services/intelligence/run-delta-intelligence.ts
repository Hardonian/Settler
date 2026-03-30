/**
 * Run Delta Intelligence Service
 *
 * Run-to-run change detection and comparison service.
 * Part of Section 5: Run-to-Run Change Intelligence
 */

import { PrismaClient, ReconciliationMatch, ReconResult, ReconJob } from "@prisma/client";

export interface RunSummary {
  totalMatches: number;
  matched: number;
  unmatched: number;
  exceptions: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  avgConfidence: number;
  qualityScore: number;
  sourceCount: number;
  targetCount: number;
}

export interface InputDelta {
  sourceCount: { previous: number; current: number; delta: number };
  targetCount: { previous: number; current: number; delta: number };
  sourceSchema?: Record<string, unknown>;
  targetSchema?: Record<string, unknown>;
}

export interface CountDelta {
  total: { previous: number; current: number; delta: number };
  matched: { previous: number; current: number; delta: number };
  unmatched: { previous: number; current: number; delta: number };
  exceptions: { previous: number; current: number; delta: number };
}

export interface SeverityDelta {
  critical: { previous: number; current: number; delta: number };
  high: { previous: number; current: number; delta: number };
  medium: { previous: number; current: number; delta: number };
  low: { previous: number; current: number; delta: number };
}

export interface NewExceptionPattern {
  archetypeId: string;
  archetypeName: string;
  firstSeenAt: Date;
  count: number;
}

export interface ResolvedPattern {
  archetypeId: string;
  archetypeName: string;
  lastSeenAt: Date;
  resolvedAfter: number;
}

export interface ConfigDrift {
  field: string;
  previousValue: unknown;
  currentValue: unknown;
  driftType: "added" | "removed" | "changed";
}

export interface RunDeltaAnalysis {
  runId: string;
  previousRunId: string | null;
  jobId: string;

  inputDelta: InputDelta;
  countDelta: CountDelta;
  severityDelta: SeverityDelta;

  newExceptionPatterns: NewExceptionPattern[];
  resolvedPatterns: ResolvedPattern[];

  configDriftDetected: boolean;
  configDrift: ConfigDrift[];

  qualitySignals: {
    confidenceDelta: number | null;
    qualityScoreDelta: number | null;
    overallTrend: "improving" | "stable" | "degrading";
  };

  processingTimeMs: number | null;
  generatedAt: Date;
}

export interface RunDeltaResult {
  id: string;
  tenantId: string;
  jobId: string;
  currentRunId: string;
  previousRunId: string;

  inputChanged: boolean;
  inputDelta: InputDelta;
  sourceDataChanged: boolean;
  targetDataChanged: boolean;

  countDelta: CountDelta;
  severityDelta: SeverityDelta;

  newExceptionPatterns: NewExceptionPattern[];
  resolvedPatterns: ResolvedPattern[];

  configDriftDetected: boolean;
  configDrift: ConfigDrift[];

  qualitySignals: {
    confidenceDelta: number | null;
    qualityScoreDelta: number | null;
  };

  analysisVersion: number;
  processingTimeMs: number | null;
  createdAt: Date;
}

interface RunWithMatches extends ReconResult {
  reconJob: Pick<ReconJob, "id" | "name" | "reconciliationConfig">;
  matches: ReconciliationMatch[];
}

interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export class RunDeltaIntelligence {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate delta analysis between two runs
   */
  async generateDelta(
    tenantId: string,
    currentRunId: string,
    previousRunId: string | null
  ): Promise<RunDeltaAnalysis> {
    const startTime = Date.now();

    const currentRun = await this.getRunWithMatches(currentRunId, tenantId);
    if (!currentRun) {
      throw new Error(`Run ${currentRunId} not found`);
    }

    const previousRun = previousRunId
      ? await this.getRunWithMatches(previousRunId, tenantId)
      : null;

    const currentSummary = this.computeRunSummary(currentRun);
    const previousSummary = previousRun ? this.computeRunSummary(previousRun) : this.zeroSummary();

    const inputDelta = this.computeInputDelta(currentRun, previousRun);
    const countDelta = this.computeCountDelta(currentSummary, previousSummary);
    const severityDelta = this.computeSeverityDelta(currentSummary, previousSummary);

    const newExceptionPatterns = await this.findNewExceptionPatterns(
      tenantId,
      currentRun.jobId,
      previousRunId
    );
    const resolvedPatterns = await this.findResolvedPatterns(
      tenantId,
      currentRun.jobId,
      previousRunId
    );

    const configDrift = this.detectConfigDrift(currentRun, previousRun);

    const qualitySignals = this.computeQualitySignals(currentSummary, previousSummary);

    const processingTimeMs = Date.now() - startTime;

    return {
      runId: currentRunId,
      previousRunId,
      jobId: currentRun.jobId,
      inputDelta,
      countDelta,
      severityDelta,
      newExceptionPatterns,
      resolvedPatterns,
      configDriftDetected: configDrift.length > 0,
      configDrift,
      qualitySignals,
      processingTimeMs,
      generatedAt: new Date(),
    };
  }

  /**
   * Store delta analysis in database
   */
  async storeDelta(tenantId: string, analysis: RunDeltaAnalysis): Promise<RunDeltaResult> {
    const result = await this.prisma.runDelta.create({
      data: {
        tenantId,
        currentRunId: analysis.runId,
        previousRunId: analysis.previousRunId || "",
        jobId: analysis.jobId,
        inputChanged:
          analysis.inputDelta.sourceCount.delta !== 0 ||
          analysis.inputDelta.targetCount.delta !== 0,
        inputDelta: analysis.inputDelta as unknown as Record<string, unknown>,
        sourceDataChanged: analysis.inputDelta.sourceCount.delta !== 0,
        targetDataChanged: analysis.inputDelta.targetCount.delta !== 0,
        totalDelta: analysis.countDelta.total.delta,
        matchedDelta: analysis.countDelta.matched.delta,
        unmatchedDelta: analysis.countDelta.unmatched.delta,
        exceptionDelta: analysis.countDelta.exceptions.delta,
        criticalDelta: analysis.severityDelta.critical.delta,
        highDelta: analysis.severityDelta.high.delta,
        mediumDelta: analysis.severityDelta.medium.delta,
        lowDelta: analysis.severityDelta.low.delta,
        newExceptionPatterns: analysis.newExceptionPatterns as unknown as Record<string, unknown>,
        resolvedPatterns: analysis.resolvedPatterns as unknown as Record<string, unknown>,
        configDriftDetected: analysis.configDriftDetected,
        configDriftSummary: analysis.configDrift as unknown as Record<string, unknown>,
        confidenceDelta: analysis.qualitySignals.confidenceDelta
          ? analysis.qualitySignals.confidenceDelta
          : undefined,
        qualityScoreDelta: analysis.qualitySignals.qualityScoreDelta
          ? analysis.qualitySignals.qualityScoreDelta
          : undefined,
        processingTimeMs: BigInt(analysis.processingTimeMs || 0),
      },
    });

    return this.toRunDeltaResult(result, analysis);
  }

  /**
   * Get the previous run for a job
   */
  async getPreviousRunId(
    tenantId: string,
    jobId: string,
    currentRunId: string
  ): Promise<string | null> {
    const previousRun = await this.prisma.reconResult.findFirst({
      where: {
        tenantId,
        jobId,
        status: "completed",
        id: { not: currentRunId },
        completedAt: { lt: new Date() },
      },
      orderBy: { completedAt: "desc" },
      select: { id: true },
    });

    return previousRun?.id || null;
  }

  /**
   * Get stored delta for a run
   */
  async getStoredDelta(tenantId: string, runId: string): Promise<RunDeltaResult | null> {
    const delta = await this.prisma.runDelta.findUnique({
      where: { currentRunId: runId },
    });

    if (!delta) return null;

    return {
      id: delta.id,
      tenantId: delta.tenantId,
      jobId: delta.jobId,
      currentRunId: delta.currentRunId,
      previousRunId: delta.previousRunId,
      inputChanged: delta.inputChanged,
      inputDelta: delta.inputDelta as unknown as InputDelta,
      sourceDataChanged: delta.sourceDataChanged,
      targetDataChanged: delta.targetDataChanged,
      countDelta: {
        total: {
          previous: 0,
          current: 0,
          delta: delta.totalDelta,
        },
        matched: {
          previous: 0,
          current: 0,
          delta: delta.matchedDelta,
        },
        unmatched: {
          previous: 0,
          current: 0,
          delta: delta.unmatchedDelta,
        },
        exceptions: {
          previous: 0,
          current: 0,
          delta: delta.exceptionDelta,
        },
      },
      severityDelta: {
        critical: { previous: 0, current: 0, delta: delta.criticalDelta },
        high: { previous: 0, current: 0, delta: delta.highDelta },
        medium: { previous: 0, current: 0, delta: delta.mediumDelta },
        low: { previous: 0, current: 0, delta: delta.lowDelta },
      },
      newExceptionPatterns: delta.newExceptionPatterns as unknown as NewExceptionPattern[],
      resolvedPatterns: delta.resolvedPatterns as unknown as ResolvedPattern[],
      configDriftDetected: delta.configDriftDetected,
      configDrift: delta.configDriftSummary as unknown as ConfigDrift[],
      qualitySignals: {
        confidenceDelta: delta.confidenceDelta ? delta.confidenceDelta.toNumber() : null,
        qualityScoreDelta: delta.qualityScoreDelta ? delta.qualityScoreDelta.toNumber() : null,
      },
      analysisVersion: delta.analysisVersion,
      processingTimeMs: delta.processingTimeMs ? Number(delta.processingTimeMs) : null,
      createdAt: delta.createdAt,
    };
  }

  /**
   * Get run history with deltas for trend analysis
   */
  async getRunTrendHistory(
    tenantId: string,
    jobId: string,
    limit: number = 10
  ): Promise<RunDeltaResult[]> {
    const deltas = await this.prisma.runDelta.findMany({
      where: { tenantId, jobId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return deltas.map((delta) => ({
      id: delta.id,
      tenantId: delta.tenantId,
      jobId: delta.jobId,
      currentRunId: delta.currentRunId,
      previousRunId: delta.previousRunId,
      inputChanged: delta.inputChanged,
      inputDelta: delta.inputDelta as unknown as InputDelta,
      sourceDataChanged: delta.sourceDataChanged,
      targetDataChanged: delta.targetDataChanged,
      countDelta: {
        total: { previous: 0, current: 0, delta: delta.totalDelta },
        matched: { previous: 0, current: 0, delta: delta.matchedDelta },
        unmatched: { previous: 0, current: 0, delta: delta.unmatchedDelta },
        exceptions: { previous: 0, current: 0, delta: delta.exceptionDelta },
      },
      severityDelta: {
        critical: { previous: 0, current: 0, delta: delta.criticalDelta },
        high: { previous: 0, current: 0, delta: delta.highDelta },
        medium: { previous: 0, current: 0, delta: delta.mediumDelta },
        low: { previous: 0, current: 0, delta: delta.lowDelta },
      },
      newExceptionPatterns: delta.newExceptionPatterns as unknown as NewExceptionPattern[],
      resolvedPatterns: delta.resolvedPatterns as unknown as ResolvedPattern[],
      configDriftDetected: delta.configDriftDetected,
      configDrift: delta.configDriftSummary as unknown as ConfigDrift[],
      qualitySignals: {
        confidenceDelta: delta.confidenceDelta ? delta.confidenceDelta.toNumber() : null,
        qualityScoreDelta: delta.qualityScoreDelta ? delta.qualityScoreDelta.toNumber() : null,
      },
      analysisVersion: delta.analysisVersion,
      processingTimeMs: delta.processingTimeMs ? Number(delta.processingTimeMs) : null,
      createdAt: delta.createdAt,
    }));
  }

  /**
   * Compute trend summary across multiple runs
   */
  async computeTrendSummary(
    tenantId: string,
    jobId: string,
    runs: number = 5
  ): Promise<{
    overallTrend: "improving" | "stable" | "degrading";
    exceptionTrend: number;
    qualityTrend: number;
    volatility: number;
    avgExceptionRate: number;
    projectedExceptions: number;
  }> {
    const history = await this.getRunTrendHistory(tenantId, jobId, runs);

    if (history.length < 2) {
      return {
        overallTrend: "stable",
        exceptionTrend: 0,
        qualityTrend: 0,
        volatility: 0,
        avgExceptionRate: 0,
        projectedExceptions: 0,
      };
    }

    const exceptionDeltas = history.map(
      (h) => h.severityDelta.critical.delta + h.severityDelta.high.delta
    );
    const qualityDeltas = history
      .map((h) => h.qualitySignals.qualityScoreDelta)
      .filter((v): v is number => v !== null);

    const exceptionTrend = this.computeTrend(exceptionDeltas);
    const qualityTrend = this.computeTrend(qualityDeltas);

    const volatility = this.computeVolatility(exceptionDeltas);

    const avgExceptionRate = exceptionDeltas.reduce((a, b) => a + b, 0) / exceptionDeltas.length;

    const lastDelta = exceptionDeltas[0] || 0;
    const projectedExceptions = lastDelta + avgExceptionRate;

    let overallTrend: "improving" | "stable" | "degrading" = "stable";
    if (exceptionTrend < -0.5 && qualityTrend > 0) {
      overallTrend = "improving";
    } else if (exceptionTrend > 0.5 || qualityTrend < -0.1) {
      overallTrend = "degrading";
    }

    return {
      overallTrend,
      exceptionTrend,
      qualityTrend,
      volatility,
      avgExceptionRate,
      projectedExceptions,
    };
  }

  private async getRunWithMatches(runId: string, tenantId: string): Promise<RunWithMatches | null> {
    return this.prisma.reconResult.findUnique({
      where: { id: runId },
      include: {
        reconJob: {
          select: {
            id: true,
            name: true,
            reconciliationConfig: true,
          },
        },
        matches: true,
      },
    });
  }

  private computeRunSummary(run: RunWithMatches): RunSummary {
    const summary = run.summary as { [key: string]: unknown } | null;
    const severityCounts = this.countSeverities(run.matches);

    const sourceCount = (summary?.sourceCount as number) || 0;
    const targetCount = (summary?.targetCount as number) || 0;

    return {
      totalMatches: run.matches.length,
      matched: run.matches.filter((m) => m.status === "matched").length,
      unmatched: run.matches.filter((m) => m.status === "unmatched").length,
      exceptions: run.matches.filter((m) =>
        ["exception", "flagged", "review_required"].includes(m.status)
      ).length,
      ...severityCounts,
      avgConfidence:
        run.matches.length > 0
          ? run.matches.reduce((sum, m) => {
              const confidence =
                typeof m.matchMetadata === "object" &&
                m.matchMetadata !== null &&
                "confidence" in m.matchMetadata
                  ? (m.matchMetadata.confidence as number)
                  : 0.5;
              return sum + confidence;
            }, 0) / run.matches.length
          : 0,
      qualityScore: 0,
      sourceCount,
      targetCount,
    };
  }

  private countSeverities(matches: ReconciliationMatch[]): SeverityCounts {
    const counts: SeverityCounts = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const match of matches) {
      const severity =
        typeof match.matchMetadata === "object" &&
        match.matchMetadata !== null &&
        "severity" in match.matchMetadata
          ? (match.matchMetadata.severity as keyof SeverityCounts)
          : null;

      if (severity && severity in counts) {
        counts[severity]++;
      } else if (match.status === "exception" || match.status === "flagged") {
        counts.medium++;
      }
    }

    return counts;
  }

  private zeroSummary(): RunSummary {
    return {
      totalMatches: 0,
      matched: 0,
      unmatched: 0,
      exceptions: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      avgConfidence: 0,
      qualityScore: 0,
      sourceCount: 0,
      targetCount: 0,
    };
  }

  private computeInputDelta(current: RunWithMatches, previous: RunWithMatches | null): InputDelta {
    const currentSummary = this.computeRunSummary(current);
    const previousSummary = previous ? this.computeRunSummary(previous) : this.zeroSummary();

    return {
      sourceCount: {
        previous: previousSummary.sourceCount,
        current: currentSummary.sourceCount,
        delta: currentSummary.sourceCount - previousSummary.sourceCount,
      },
      targetCount: {
        previous: previousSummary.targetCount,
        current: currentSummary.targetCount,
        delta: currentSummary.targetCount - previousSummary.targetCount,
      },
    };
  }

  private computeCountDelta(current: RunSummary, previous: RunSummary): CountDelta {
    return {
      total: {
        previous: previous.totalMatches,
        current: current.totalMatches,
        delta: current.totalMatches - previous.totalMatches,
      },
      matched: {
        previous: previous.matched,
        current: current.matched,
        delta: current.matched - previous.matched,
      },
      unmatched: {
        previous: previous.unmatched,
        current: current.unmatched,
        delta: current.unmatched - previous.unmatched,
      },
      exceptions: {
        previous: previous.exceptions,
        current: current.exceptions,
        delta: current.exceptions - previous.exceptions,
      },
    };
  }

  private computeSeverityDelta(current: RunSummary, previous: RunSummary): SeverityDelta {
    return {
      critical: {
        previous: previous.criticalCount,
        current: current.criticalCount,
        delta: current.criticalCount - previous.criticalCount,
      },
      high: {
        previous: previous.highCount,
        current: current.highCount,
        delta: current.highCount - previous.highCount,
      },
      medium: {
        previous: previous.mediumCount,
        current: current.mediumCount,
        delta: current.mediumCount - previous.mediumCount,
      },
      low: {
        previous: previous.lowCount,
        current: current.lowCount,
        delta: current.lowCount - previous.lowCount,
      },
    };
  }

  private async findNewExceptionPatterns(
    tenantId: string,
    jobId: string,
    previousRunId: string | null
  ): Promise<NewExceptionPattern[]> {
    if (!previousRunId) return [];

    const previousExceptions = await this.prisma.reconciliationMatch.findMany({
      where: {
        reconResultId: previousRunId,
        status: { in: ["exception", "flagged", "review_required"] },
        archetypeClassifications: { some: {} },
      },
      select: { id: true },
    });

    const previousArchetypeIds = new Set(previousExceptions.map((e) => e.id));

    const currentExceptions = await this.prisma.reconciliationMatch.findMany({
      where: {
        reconResult: { jobId, tenantId },
        status: { in: ["exception", "flagged", "review_required"] },
        archetypeClassifications: { some: {} },
      },
      include: {
        archetypeClassifications: {
          include: {
            archetype: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const newPatterns: NewExceptionPattern[] = [];

    for (const exception of currentExceptions) {
      for (const classification of exception.archetypeClassifications) {
        if (!previousArchetypeIds.has(exception.id)) {
          newPatterns.push({
            archetypeId: classification.archetype.id,
            archetypeName: classification.archetype.name,
            firstSeenAt: exception.createdAt,
            count: 1,
          });
        }
      }
    }

    return newPatterns;
  }

  private async findResolvedPatterns(
    tenantId: string,
    jobId: string,
    previousRunId: string | null
  ): Promise<ResolvedPattern[]> {
    if (!previousRunId) return [];

    const currentRun = await this.prisma.reconResult.findFirst({
      where: { jobId, tenantId },
      orderBy: { completedAt: "desc" },
      select: { id: true },
    });

    if (!currentRun) return [];

    const currentExceptions = await this.prisma.reconciliationMatch.findMany({
      where: {
        reconResultId: currentRun.id,
        status: { in: ["exception", "flagged", "review_required"] },
      },
      select: { id: true },
    });

    const currentExceptionIds = new Set(currentExceptions.map((e) => e.id));

    const previousExceptions = await this.prisma.reconciliationMatch.findMany({
      where: {
        reconResultId: previousRunId,
        status: { in: ["exception", "flagged", "review_required"] },
      },
      include: {
        archetypeClassifications: {
          include: {
            archetype: { select: { id: true, name: true } },
          },
        },
      },
    });

    const resolvedPatterns: ResolvedPattern[] = [];

    for (const exception of previousExceptions) {
      if (!currentExceptionIds.has(exception.id)) {
        for (const classification of exception.archetypeClassifications) {
          resolvedPatterns.push({
            archetypeId: classification.archetype.id,
            archetypeName: classification.archetype.name,
            lastSeenAt: exception.createdAt,
            resolvedAfter: 1,
          });
        }
      }
    }

    return resolvedPatterns;
  }

  private detectConfigDrift(
    current: RunWithMatches,
    previous: RunWithMatches | null
  ): ConfigDrift[] {
    if (!previous) return [];

    const drifts: ConfigDrift[] = [];
    const currentConfig = (current.reconJob.reconciliationConfig as Record<string, unknown>) || {};
    const previousConfig =
      (previous.reconJob.reconciliationConfig as Record<string, unknown>) || {};

    const allKeys = new Set([...Object.keys(currentConfig), ...Object.keys(previousConfig)]);

    for (const key of allKeys) {
      const currentValue = currentConfig[key];
      const previousValue = previousConfig[key];

      if (currentValue !== undefined && previousValue === undefined) {
        drifts.push({
          field: key,
          previousValue,
          currentValue,
          driftType: "added",
        });
      } else if (currentValue === undefined && previousValue !== undefined) {
        drifts.push({
          field: key,
          previousValue,
          currentValue,
          driftType: "removed",
        });
      } else if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
        drifts.push({
          field: key,
          previousValue,
          currentValue,
          driftType: "changed",
        });
      }
    }

    return drifts;
  }

  private computeQualitySignals(
    current: RunSummary,
    previous: RunSummary
  ): RunDeltaAnalysis["qualitySignals"] {
    const confidenceDelta =
      previous.avgConfidence > 0 ? current.avgConfidence - previous.avgConfidence : null;

    const qualityScoreDelta =
      previous.qualityScore > 0 ? current.qualityScore - previous.qualityScore : null;

    let overallTrend: "improving" | "stable" | "degrading" = "stable";
    if (confidenceDelta !== null && qualityScoreDelta !== null) {
      if (confidenceDelta > 0.05 && qualityScoreDelta > 0.05) {
        overallTrend = "improving";
      } else if (confidenceDelta < -0.05 || qualityScoreDelta < -0.05) {
        overallTrend = "degrading";
      }
    }

    return {
      confidenceDelta,
      qualityScoreDelta,
      overallTrend,
    };
  }

  private computeTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private computeVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(variance);
  }

  private toRunDeltaResult(
    delta: {
      id: string;
      tenantId: string;
      jobId: string;
      currentRunId: string;
      previousRunId: string;
      inputChanged: boolean;
      inputDelta: unknown;
      sourceDataChanged: boolean;
      targetDataChanged: boolean;
      totalDelta: number;
      matchedDelta: number;
      unmatchedDelta: number;
      exceptionDelta: number;
      criticalDelta: number;
      highDelta: number;
      mediumDelta: number;
      lowDelta: number;
      newExceptionPatterns: unknown;
      resolvedPatterns: unknown;
      configDriftDetected: boolean;
      configDriftSummary: unknown;
      confidenceDelta: { toNumber(): number } | null;
      qualityScoreDelta: { toNumber(): number } | null;
      analysisVersion: number;
      processingTimeMs: bigint | null;
      createdAt: Date;
    },
    analysis: RunDeltaAnalysis
  ): RunDeltaResult {
    return {
      id: delta.id,
      tenantId: delta.tenantId,
      jobId: delta.jobId,
      currentRunId: delta.currentRunId,
      previousRunId: delta.previousRunId,
      inputChanged: delta.inputChanged,
      inputDelta: delta.inputDelta as unknown as InputDelta,
      sourceDataChanged: delta.sourceDataChanged,
      targetDataChanged: delta.targetDataChanged,
      countDelta: {
        total: { previous: 0, current: 0, delta: delta.totalDelta },
        matched: { previous: 0, current: 0, delta: delta.matchedDelta },
        unmatched: { previous: 0, current: 0, delta: delta.unmatchedDelta },
        exceptions: { previous: 0, current: 0, delta: delta.exceptionDelta },
      },
      severityDelta: {
        critical: { previous: 0, current: 0, delta: delta.criticalDelta },
        high: { previous: 0, current: 0, delta: delta.highDelta },
        medium: { previous: 0, current: 0, delta: delta.mediumDelta },
        low: { previous: 0, current: 0, delta: delta.lowDelta },
      },
      newExceptionPatterns: delta.newExceptionPatterns as unknown as NewExceptionPattern[],
      resolvedPatterns: delta.resolvedPatterns as unknown as ResolvedPattern[],
      configDriftDetected: delta.configDriftDetected,
      configDrift: delta.configDriftSummary as unknown as ConfigDrift[],
      qualitySignals: {
        confidenceDelta: delta.confidenceDelta ? delta.confidenceDelta.toNumber() : null,
        qualityScoreDelta: delta.qualityScoreDelta ? delta.qualityScoreDelta.toNumber() : null,
      },
      analysisVersion: delta.analysisVersion,
      processingTimeMs: delta.processingTimeMs ? Number(delta.processingTimeMs) : null,
      createdAt: delta.createdAt,
    };
  }
}
