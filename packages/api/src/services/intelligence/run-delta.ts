/**
 * Run Delta Intelligence Service
 *
 * Computes run-to-run deltas, detects changes, and surfaces meaningful patterns.
 * Part of Section 6: Multi-Agent Evolution Layer
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { logError } from "../../utils/logger";
import { PriorRunDeltaAnalystService } from "./prior-run-delta-analyst";

export interface RunDeltaInput {
  tenantId: string;
  currentRunId: string;
  previousRunId: string | null;
  jobId: string;
}

export interface RunDeltaResult {
  id: string;
  tenantId: string;
  currentRunId: string;
  previousRunId: string | null;
  jobId: string;
  inputChanged: boolean;
  sourceDataChanged: boolean;
  targetDataChanged: boolean;
  totalDelta: number;
  matchedDelta: number;
  unmatchedDelta: number;
  exceptionDelta: number;
  severityDeltas: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  newExceptionPatterns: string[];
  resolvedPatterns: string[];
  configDriftDetected: boolean;
  configDriftSummary: ConfigDrift[];
  confidenceDelta: number | null;
  qualityScoreDelta: number | null;
  deltaGeneratedAt: Date;
}

export interface ConfigDrift {
  field: string;
  previousValue: unknown;
  currentValue: unknown;
  significance: "low" | "medium" | "high";
}

export interface RunComparisonMetrics {
  runId: string;
  totalRecords: number;
  matchedCount: number;
  unmatchedCount: number;
  conflictCount: number;
  confidenceAvg: number | null;
  qualityScore: number | null;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface RunSnapshotData {
  id: string;
  inputHash: string | null;
  sourceDataHash: string | null;
  targetDataHash: string | null;
  adapterConfigHashes: Prisma.JsonValue;
  jobConfig: Prisma.JsonValue;
  ruleVersions: Prisma.JsonValue;
}

interface ReconResultData {
  id: string;
  sourceCount: number;
  targetCount: number;
  matchedCount: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflictCount: number;
  confidenceAvg: Prisma.Decimal | null | undefined;
}

interface ExceptionArchetypeForDelta {
  archetypeId: string;
  archetypeName: string;
  exceptionCount: number;
}

export class RunDeltaService {
  private prisma: PrismaClient;
  private analyst: PriorRunDeltaAnalystService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.analyst = new PriorRunDeltaAnalystService(prisma);
  }

  /**
   * Compute delta between two runs
   */
  async computeDelta(input: RunDeltaInput): Promise<RunDeltaResult> {
    const startTime = Date.now();

    const currentSnapshot = await this.getRunSnapshot(input.currentRunId);
    const previousSnapshot = input.previousRunId
      ? await this.getRunSnapshot(input.previousRunId)
      : null;

    const currentResult = await this.getRunResult(input.currentRunId);
    const previousResult = input.previousRunId
      ? await this.getRunResult(input.previousRunId)
      : null;

    const currentExceptions = await this.getExceptionBreakdown(input.tenantId, input.currentRunId);
    const previousExceptions = input.previousRunId
      ? await this.getExceptionBreakdown(input.tenantId, input.previousRunId)
      : [];

    const inputChanged = this.detectInputChange(currentSnapshot, previousSnapshot);
    const [sourceDataChanged, targetDataChanged] = this.detectDataChange(
      currentSnapshot,
      previousSnapshot
    );
    const configDrift = this.detectConfigDrift(currentSnapshot, previousSnapshot);

    const countDeltas = this.computeCountDeltas(currentResult, previousResult);
    const severityDeltas = this.computeSeverityDeltas(currentExceptions, previousExceptions);

    const newPatterns = this.identifyNewPatterns(currentExceptions, previousExceptions);
    const resolvedPatterns = this.identifyResolvedPatterns(currentExceptions, previousExceptions);

    const confidenceDelta = this.computeDecimalDelta(
      (currentResult?.confidenceAvg ?? null) as Prisma.Decimal | null,
      (previousResult?.confidenceAvg ?? null) as Prisma.Decimal | null
    );
    const qualityScoreDelta = this.computeQualityDelta(currentResult, previousResult);

    const delta = await this.prisma.runDelta.create({
      data: {
        tenantId: input.tenantId,
        currentRunId: input.currentRunId,
        previousRunId: input.previousRunId,
        jobId: input.jobId,
        inputChanged,
        inputDelta: JSON.stringify({
          currentHash: currentSnapshot?.inputHash,
          previousHash: previousSnapshot?.inputHash,
        }),
        sourceDataChanged,
        targetDataChanged,
        totalDelta: countDeltas.totalDelta,
        matchedDelta: countDeltas.matchedDelta,
        unmatchedDelta: countDeltas.unmatchedDelta,
        exceptionDelta: countDeltas.exceptionDelta,
        criticalDelta: severityDeltas.critical,
        highDelta: severityDeltas.high,
        mediumDelta: severityDeltas.medium,
        lowDelta: severityDeltas.low,
        newExceptionPatterns: JSON.stringify(newPatterns),
        resolvedPatterns: JSON.stringify(resolvedPatterns),
        configDriftDetected: configDrift.length > 0,
        configDriftSummary: JSON.stringify(configDrift),
        confidenceDelta: confidenceDelta ? new Prisma.Decimal(confidenceDelta) : null,
        qualityScoreDelta: qualityScoreDelta ? new Prisma.Decimal(qualityScoreDelta) : null,
        processingTimeMs: BigInt(Date.now() - startTime),
        metadata: JSON.stringify({
          computationTimeMs: Date.now() - startTime,
          currentExceptions: currentExceptions.length,
          previousExceptions: previousExceptions.length,
        }),
      },
    });

    const mapped = this.mapToResult(delta, {
      currentSnapshot,
      previousSnapshot,
      newPatterns,
      resolvedPatterns,
      configDrift,
      confidenceDelta,
      qualityScoreDelta,
      currentExceptions,
      previousExceptions,
      currentResult,
      previousResult,
    });

    await this.analyst.recordAnalysis({
      tenantId: input.tenantId,
      runDeltaId: delta.id,
      delta: mapped,
      trigger: "run_delta_computed",
    });

    return mapped;
  }

  /**
   * Get the most recent successful run for a job
   */
  async getLatestSuccessfulRun(
    tenantId: string,
    jobId: string,
    excludeRunId?: string
  ): Promise<string | null> {
    const result = await this.prisma.reconResult.findFirst({
      where: {
        tenantId,
        reconJobId: jobId,
        status: "completed",
        ...(excludeRunId && { id: { not: excludeRunId } }),
      },
      orderBy: { completedAt: "desc" },
      select: { id: true },
    });
    return result?.id ?? null;
  }

  /**
   * Get delta history for a job
   */
  async getDeltaHistory(tenantId: string, jobId: string, limit = 10): Promise<RunDeltaResult[]> {
    const deltas = await this.prisma.runDelta.findMany({
      where: { tenantId, jobId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return Promise.all(deltas.map((d) => this.enrichDeltaWithPatterns(d)));
  }

  /**
   * Get significant changes summary for a job
   */
  async getSignificantChanges(
    tenantId: string,
    jobId: string,
    days = 7
  ): Promise<{
    totalRuns: number;
    runsWithChanges: number;
    totalExceptionsDelta: number;
    newPatterns: string[];
    resolvedPatterns: string[];
    configDriftEvents: number;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const deltas = await this.prisma.runDelta.findMany({
      where: {
        tenantId,
        jobId,
        createdAt: { gte: since },
      },
    });

    const runsWithChanges = deltas.filter(
      (d) =>
        d.inputChanged ||
        d.sourceDataChanged ||
        d.targetDataChanged ||
        d.configDriftDetected ||
        d.exceptionDelta !== 0
    ).length;

    const allNewPatterns = new Set<string>();
    const allResolvedPatterns = new Set<string>();
    let configDriftEvents = 0;

    for (const delta of deltas) {
      const newPatterns = (delta.newExceptionPatterns as string[]) || [];
      newPatterns.forEach((p) => allNewPatterns.add(p));

      const resolvedPatterns = (delta.resolvedPatterns as string[]) || [];
      resolvedPatterns.forEach((p) => allResolvedPatterns.add(p));

      if (delta.configDriftDetected) configDriftEvents++;
    }

    return {
      totalRuns: deltas.length,
      runsWithChanges,
      totalExceptionsDelta: deltas.reduce((sum, d) => sum + d.exceptionDelta, 0),
      newPatterns: Array.from(allNewPatterns),
      resolvedPatterns: Array.from(allResolvedPatterns),
      configDriftEvents,
    };
  }

  /**
   * Auto-compute delta after run completion
   */
  async onRunCompleted(
    tenantId: string,
    jobId: string,
    runId: string
  ): Promise<RunDeltaResult | null> {
    try {
      const previousRunId = await this.getLatestSuccessfulRun(tenantId, jobId, runId);

      return this.computeDelta({
        tenantId,
        currentRunId: runId,
        previousRunId,
        jobId,
      });
    } catch (error) {
      logError("RunDeltaService.onRunCompleted failed", {
        tenantId,
        jobId,
        runId,
        error,
      });
      return null;
    }
  }

  /**
   * Get comparison metrics for two runs
   */
  async getRunComparison(
    tenantId: string,
    currentRunId: string,
    previousRunId: string
  ): Promise<{
    current: RunComparisonMetrics;
    previous: RunComparisonMetrics;
    deltas: RunDeltaResult;
  } | null> {
    const [currentResult, previousResult] = await Promise.all([
      this.prisma.reconResult.findUnique({
        where: { id: currentRunId },
        select: {
          id: true,
          sourceCount: true,
          targetCount: true,
          matchedCount: true,
          unmatchedSourceCount: true,
          unmatchedTargetCount: true,
          conflictCount: true,
          confidenceAvg: true,
        },
      }),
      this.prisma.reconResult.findUnique({
        where: { id: previousRunId },
        select: {
          id: true,
          sourceCount: true,
          targetCount: true,
          matchedCount: true,
          unmatchedSourceCount: true,
          unmatchedTargetCount: true,
          conflictCount: true,
          confidenceAvg: true,
        },
      }),
    ]);

    if (!currentResult || !previousResult) {
      return null;
    }

    const delta = await this.computeDelta({
      tenantId,
      currentRunId,
      previousRunId,
      jobId: "",
    });

    return {
      current: this.mapToMetrics(currentResult),
      previous: this.mapToMetrics(previousResult),
      deltas: delta,
    };
  }

  private async getRunSnapshot(runId: string): Promise<RunSnapshotData | null> {
    const result = await this.prisma.reconResult.findUnique({
      where: { id: runId },
      include: { snapshot: true },
    });
    return result?.snapshot ?? null;
  }

  private async getRunResult(runId: string): Promise<ReconResultData | null> {
    const result = await this.prisma.reconResult.findUnique({
      where: { id: runId },
      select: {
        id: true,
        sourceCount: true,
        targetCount: true,
        matchedCount: true,
        unmatchedSourceCount: true,
        unmatchedTargetCount: true,
        conflictCount: true,
        confidenceAvg: true,
      },
    });
    return result as ReconResultData | null;
  }

  private async getExceptionBreakdown(
    tenantId: string,
    runId: string
  ): Promise<ExceptionArchetypeForDelta[]> {
    const classifications = await this.prisma.exceptionArchetypeClassification.findMany({
      where: {
        tenantId,
        exception: {
          runId,
          status: { in: ["open", "in_progress"] },
        },
      },
      include: {
        archetype: true,
      },
    });

    const breakdown = new Map<string, { id: string; label: string; count: number }>();

    for (const c of classifications) {
      if (!c.archetype) continue;
      const existing = breakdown.get(c.archetypeId);
      if (existing) {
        existing.count++;
      } else {
        breakdown.set(c.archetypeId, {
          id: c.archetypeId,
          label: c.archetype.label,
          count: 1,
        });
      }
    }

    return Array.from(breakdown.values()).map((b) => ({
      archetypeId: b.id,
      archetypeName: b.label,
      exceptionCount: b.count,
    }));
  }

  private detectInputChange(
    current: RunSnapshotData | null,
    previous: RunSnapshotData | null
  ): boolean {
    if (!current || !previous) return false;
    return current.inputHash !== previous.inputHash;
  }

  private detectDataChange(
    current: RunSnapshotData | null,
    previous: RunSnapshotData | null
  ): [boolean, boolean] {
    if (!current || !previous) return [false, false];
    return [
      current.sourceDataHash !== previous.sourceDataHash,
      current.targetDataHash !== previous.targetDataHash,
    ];
  }

  private detectConfigDrift(
    current: RunSnapshotData | null,
    previous: RunSnapshotData | null
  ): ConfigDrift[] {
    if (!current || !previous) return [];

    const drifts: ConfigDrift[] = [];

    const currentConfig = (current.jobConfig as Record<string, unknown>) ?? {};
    const previousConfig = (previous.jobConfig as Record<string, unknown>) ?? {};

    const allKeys = new Set([...Object.keys(currentConfig), ...Object.keys(previousConfig)]);

    for (const key of allKeys) {
      if (key.startsWith("_") || key === "metadata") continue;

      const currentVal = currentConfig[key];
      const previousVal = previousConfig[key];
      const significance = this.assessDriftSignificance(key, currentVal, previousVal);

      if (JSON.stringify(currentVal) !== JSON.stringify(previousVal)) {
        drifts.push({
          field: key,
          previousValue: previousVal,
          currentValue: currentVal,
          significance,
        });
      }
    }

    return drifts;
  }

  private assessDriftSignificance(
    field: string,
    _current: unknown,
    _previous: unknown
  ): "low" | "medium" | "high" {
    const highSignificanceFields = [
      "reconStrategy",
      "matchingRules",
      "validationRules",
      "threshold",
    ];
    const mediumSignificanceFields = ["transformRules", "filterConditions", "groupingFields"];

    if (highSignificanceFields.includes(field)) return "high";
    if (mediumSignificanceFields.includes(field)) return "medium";
    return "low";
  }

  private computeCountDeltas(
    current: ReconResultData | null,
    previous: ReconResultData | null
  ): {
    totalDelta: number;
    matchedDelta: number;
    unmatchedDelta: number;
    exceptionDelta: number;
  } {
    if (!current || !previous) {
      return { totalDelta: 0, matchedDelta: 0, unmatchedDelta: 0, exceptionDelta: 0 };
    }

    const currentTotal = current.sourceCount;
    const previousTotal = previous.sourceCount;
    const currentUnmatched = current.unmatchedSourceCount + current.unmatchedTargetCount;
    const previousUnmatched = previous.unmatchedSourceCount + previous.unmatchedTargetCount;

    return {
      totalDelta: currentTotal - previousTotal,
      matchedDelta: current.matchedCount - previous.matchedCount,
      unmatchedDelta: currentUnmatched - previousUnmatched,
      exceptionDelta: current.conflictCount - previous.conflictCount,
    };
  }

  private computeSeverityDeltas(
    current: ExceptionArchetypeForDelta[],
    previous: ExceptionArchetypeForDelta[]
  ): { critical: number; high: number; medium: number; low: number } {
    const archetypeCountMap = new Map<string, number>();
    for (const e of previous) {
      archetypeCountMap.set(e.archetypeId, e.exceptionCount);
    }

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const e of current) {
      const prevCount = archetypeCountMap.get(e.archetypeId) ?? 0;
      const delta = e.exceptionCount - prevCount;

      const archetype = this.getArchetypeSeverity(e.archetypeName);
      switch (archetype) {
        case "critical":
          critical += delta;
          break;
        case "high":
          high += delta;
          break;
        case "medium":
          medium += delta;
          break;
        case "low":
          low += delta;
          break;
      }
    }

    return { critical, high, medium, low };
  }

  private getArchetypeSeverity(archetypeName: string): "critical" | "high" | "medium" | "low" {
    const name = archetypeName.toLowerCase();
    if (name.includes("critical") || name.includes("fraud")) return "critical";
    if (name.includes("high") || name.includes("material")) return "high";
    if (name.includes("medium") || name.includes("potential")) return "medium";
    return "low";
  }

  private identifyNewPatterns(
    current: ExceptionArchetypeForDelta[],
    previous: ExceptionArchetypeForDelta[]
  ): string[] {
    const previousIds = new Set(previous.map((p) => p.archetypeId));
    return current.filter((c) => !previousIds.has(c.archetypeId)).map((c) => c.archetypeName);
  }

  private identifyResolvedPatterns(
    current: ExceptionArchetypeForDelta[],
    previous: ExceptionArchetypeForDelta[]
  ): string[] {
    const currentIds = new Set(current.map((c) => c.archetypeId));
    return previous.filter((p) => !currentIds.has(p.archetypeId)).map((p) => p.archetypeName);
  }

  private computeDecimalDelta(
    current: Prisma.Decimal | null,
    previous: Prisma.Decimal | null
  ): number | null {
    if (current === null || previous === null) return null;
    return current.toNumber() - previous.toNumber();
  }

  private computeQualityDelta(
    current: ReconResultData | null,
    previous: ReconResultData | null
  ): number | null {
    if (!current?.confidenceAvg || !previous?.confidenceAvg) return null;
    return current.confidenceAvg.toNumber() - previous.confidenceAvg.toNumber();
  }

  private async enrichDeltaWithPatterns(delta: any): Promise<RunDeltaResult> {
    const newPatterns = (delta.newExceptionPatterns as string[]) || [];
    const resolvedPatterns = (delta.resolvedPatterns as string[]) || [];
    const configDrift = (delta.configDriftSummary as any[]) || [];

    return {
      id: delta.id,
      tenantId: delta.tenantId,
      currentRunId: delta.currentRunId,
      previousRunId: delta.previousRunId,
      jobId: delta.jobId,
      inputChanged: delta.inputChanged,
      sourceDataChanged: delta.sourceDataChanged,
      targetDataChanged: delta.targetDataChanged,
      totalDelta: delta.totalDelta,
      matchedDelta: delta.matchedDelta,
      unmatchedDelta: delta.unmatchedDelta,
      exceptionDelta: delta.exceptionDelta,
      severityDeltas: {
        critical: delta.criticalDelta,
        high: delta.highDelta,
        medium: delta.mediumDelta,
        low: delta.lowDelta,
      },
      newExceptionPatterns: newPatterns,
      resolvedPatterns,
      configDriftDetected: delta.configDriftDetected,
      configDriftSummary: configDrift,
      confidenceDelta: delta.confidenceDelta?.toNumber() ?? null,
      qualityScoreDelta: delta.qualityScoreDelta?.toNumber() ?? null,
      deltaGeneratedAt: delta.deltaGeneratedAt,
    };
  }

  private mapToResult(
    delta: any,
    enrich: {
      currentSnapshot: RunSnapshotData | null;
      previousSnapshot: RunSnapshotData | null;
      newPatterns: string[];
      resolvedPatterns: string[];
      configDrift: ConfigDrift[];
      confidenceDelta: number | null;
      qualityScoreDelta: number | null;
      currentExceptions: ExceptionArchetypeForDelta[];
      previousExceptions: ExceptionArchetypeForDelta[];
      currentResult: ReconResultData | null;
      previousResult: ReconResultData | null;
    }
  ): RunDeltaResult {
    const severityDeltas = this.computeSeverityDeltas(
      enrich.currentExceptions,
      enrich.previousExceptions
    );

    return {
      id: delta.id,
      tenantId: delta.tenantId,
      currentRunId: delta.currentRunId,
      previousRunId: delta.previousRunId,
      jobId: delta.jobId,
      inputChanged: delta.inputChanged,
      sourceDataChanged: delta.sourceDataChanged,
      targetDataChanged: delta.targetDataChanged,
      totalDelta: delta.totalDelta,
      matchedDelta: delta.matchedDelta,
      unmatchedDelta: delta.unmatchedDelta,
      exceptionDelta: delta.exceptionDelta,
      severityDeltas,
      newExceptionPatterns: enrich.newPatterns,
      resolvedPatterns: enrich.resolvedPatterns,
      configDriftDetected: delta.configDriftDetected,
      configDriftSummary: enrich.configDrift,
      confidenceDelta: enrich.confidenceDelta,
      qualityScoreDelta: enrich.qualityScoreDelta,
      deltaGeneratedAt: delta.deltaGeneratedAt,
    };
  }

  private mapToMetrics(result: ReconResultData): RunComparisonMetrics {
    return {
      runId: result.id,
      totalRecords: result.sourceCount,
      matchedCount: result.matchedCount,
      unmatchedCount: result.unmatchedSourceCount + result.unmatchedTargetCount,
      conflictCount: result.conflictCount,
      confidenceAvg: result.confidenceAvg?.toNumber() ?? null,
      qualityScore: null,
      severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    };
  }
}
