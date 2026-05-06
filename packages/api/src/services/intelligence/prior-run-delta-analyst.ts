/**
 * Prior Run Delta Analyst — bounded deterministic worker over canonical RunDelta rows.
 * Briefing logic lives in @settler/reconciliation-core; this module persists audit rows.
 */

import crypto from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  buildEvidenceRefs,
  buildPriorRunDeltaBriefing,
  type PriorRunDeltaBriefing,
  type PriorRunDeltaSource,
} from "@settler/reconciliation-core";
import { logError } from "../../utils/logger";
import type { RunDeltaResult } from "./run-delta";

export const PRIOR_RUN_DELTA_ANALYST_KEY = "prior_run_delta_analyst";
export const PRIOR_RUN_DELTA_ANALYST_VERSION = "1";

export interface WorkerRunPublic {
  id: string;
  tenantId: string;
  workerKey: string;
  workerVersion: string;
  trigger: string;
  runDeltaId: string;
  status: string;
  output: PriorRunDeltaBriefing & { contentHash?: string };
  evidence: Array<{ kind: string; ref: string; detail?: string }>;
  degradedReasons: string[];
  createdAt: Date;
  completedAt: Date;
}

function runDeltaResultToSource(delta: RunDeltaResult): PriorRunDeltaSource {
  return {
    id: delta.id,
    currentRunId: delta.currentRunId,
    previousRunId: delta.previousRunId,
    jobId: delta.jobId,
    exceptionDelta: delta.exceptionDelta,
    matchedDelta: delta.matchedDelta,
    unmatchedDelta: delta.unmatchedDelta,
    inputChanged: delta.inputChanged,
    configDriftDetected: delta.configDriftDetected,
    severityDeltas: delta.severityDeltas,
    newExceptionPatterns: delta.newExceptionPatterns,
    resolvedPatterns: delta.resolvedPatterns,
  };
}

function hashBriefing(
  briefing: PriorRunDeltaBriefing,
  evidence: Array<{ kind: string; ref: string }>
): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        briefing,
        evidenceRefs: evidence.map((e) => e.ref).sort(),
      })
    )
    .digest("hex");
}

export class PriorRunDeltaAnalystService {
  constructor(private readonly prisma: PrismaClient) {}

  async recordAnalysis(args: {
    tenantId: string;
    runDeltaId: string;
    delta: RunDeltaResult;
    trigger: string;
  }): Promise<WorkerRunPublic | null> {
    const source = runDeltaResultToSource(args.delta);
    const briefing = buildPriorRunDeltaBriefing(source);
    const evidence = buildEvidenceRefs(source);
    const contentHash = hashBriefing(briefing, evidence);
    const outputWithHash = { ...briefing, contentHash };

    const degradedReasons: string[] = [];
    if (!briefing.basis.priorRunPresent) {
      degradedReasons.push("no_prior_run_on_delta");
    }
    if (args.delta.configDriftDetected) {
      degradedReasons.push("config_drift_flagged");
    }

    try {
      const row = await this.prisma.workerRun.create({
        data: {
          tenantId: args.tenantId,
          workerKey: PRIOR_RUN_DELTA_ANALYST_KEY,
          workerVersion: PRIOR_RUN_DELTA_ANALYST_VERSION,
          trigger: args.trigger,
          runDeltaId: args.runDeltaId,
          status: "succeeded",
          output: outputWithHash as Prisma.InputJsonValue,
          evidence: evidence as unknown as Prisma.InputJsonValue,
          degradedReasons: degradedReasons as unknown as Prisma.InputJsonValue,
        },
      });
      return this.toPublic(row);
    } catch (error) {
      logError("PriorRunDeltaAnalystService.recordAnalysis failed", {
        tenantId: args.tenantId,
        runDeltaId: args.runDeltaId,
        error,
      });
      return null;
    }
  }

  async getLatestForRunDelta(
    tenantId: string,
    runDeltaId: string
  ): Promise<WorkerRunPublic | null> {
    const row = await this.prisma.workerRun.findFirst({
      where: { tenantId, runDeltaId, workerKey: PRIOR_RUN_DELTA_ANALYST_KEY },
      orderBy: { createdAt: "desc" },
    });
    return row ? this.toPublic(row) : null;
  }

  async listRecent(tenantId: string, limit: number): Promise<WorkerRunPublic[]> {
    const rows = await this.prisma.workerRun.findMany({
      where: { tenantId, workerKey: PRIOR_RUN_DELTA_ANALYST_KEY },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return rows.map((r) => this.toPublic(r));
  }

  private toPublic(row: {
    id: string;
    tenantId: string;
    workerKey: string;
    workerVersion: string;
    trigger: string;
    runDeltaId: string;
    status: string;
    output: unknown;
    evidence: unknown;
    degradedReasons: unknown;
    createdAt: Date;
    completedAt: Date;
  }): WorkerRunPublic {
    const output = row.output as PriorRunDeltaBriefing & { contentHash?: string };
    return {
      id: row.id,
      tenantId: row.tenantId,
      workerKey: row.workerKey,
      workerVersion: row.workerVersion,
      trigger: row.trigger,
      runDeltaId: row.runDeltaId,
      status: row.status,
      output,
      evidence: Array.isArray(row.evidence) ? (row.evidence as WorkerRunPublic["evidence"]) : [],
      degradedReasons: Array.isArray(row.degradedReasons) ? (row.degradedReasons as string[]) : [],
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    };
  }
}
