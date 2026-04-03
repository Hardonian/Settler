import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";

export type RunComparisonState = "available" | "unavailable" | "not_comparable" | "degraded";
export type RunDeltaChangeState = "changed" | "unchanged" | "unavailable";

export interface RunProofpackIndex {
  proofPackages: {
    total: number;
    finalized: number;
    bestCompletenessScore: number | null;
    missingEvidenceCount: number;
    latestCreatedAt: string | null;
    state: "ready" | "degraded" | "setup_required" | "unavailable";
    degradedEvidenceReasons: string[];
  };
  recurrence: {
    exceptionsWithMemories: number;
    repeatedResolutionReasons: string[];
    state: "ready" | "degraded" | "setup_required" | "unavailable";
  };
  comparison: {
    state: RunComparisonState;
    changedSincePriorRun: RunDeltaChangeState;
    certainty: "high" | "medium" | "low";
    reasonCodes: string[];
    summary: string;
    baseline: {
      priorResultId: string | null;
      priorResultStartedAt: string | null;
    };
    deltas: {
      matched: number | null;
      unmatched: number | null;
      conflicts: number | null;
      proofCompleteness: "improved" | "regressed" | "unchanged" | "unavailable";
      recurringFamilyConcentration: "stronger" | "weaker" | "stable" | "unavailable";
    };
  };
}

type LatestPriorResultRow = {
  recon_job_id: string;
  rn: number;
  id: string;
  started_at: Date | null;
  status: string;
  matched_count: number;
  unmatched_source_count: number;
  unmatched_target_count: number;
  conflict_count: number;
};

function defaultIndex(): RunProofpackIndex {
  return {
    proofPackages: {
      total: 0,
      finalized: 0,
      bestCompletenessScore: null,
      missingEvidenceCount: 0,
      latestCreatedAt: null,
      state: "setup_required",
      degradedEvidenceReasons: [],
    },
    recurrence: {
      exceptionsWithMemories: 0,
      repeatedResolutionReasons: [],
      state: "setup_required",
    },
    comparison: {
      state: "unavailable",
      changedSincePriorRun: "unavailable",
      certainty: "low",
      reasonCodes: ["baseline_missing"],
      summary: "No prior comparable run result is available yet.",
      baseline: {
        priorResultId: null,
        priorResultStartedAt: null,
      },
      deltas: {
        matched: null,
        unmatched: null,
        conflicts: null,
        proofCompleteness: "unavailable",
        recurringFamilyConcentration: "unavailable",
      },
    },
  };
}

export async function buildRunProofpackIndexByRunId(input: {
  prisma: ReconciliationCorePrismaClient;
  tenantId: string;
  runs: CanonicalReconciliationListItem[];
}): Promise<Map<string, RunProofpackIndex>> {
  const { prisma, tenantId, runs } = input;
  const byRun = new Map<string, RunProofpackIndex>();
  for (const run of runs) byRun.set(run.id, defaultIndex());

  const reconRuns = runs.filter((item) => item.runKind === "recon_job");
  if (reconRuns.length === 0) {
    return byRun;
  }

  const runIds = reconRuns.map((item) => item.id);
  const matches = await prisma.reconciliationMatch.findMany({
    where: {
      tenantId,
      runId: { in: runIds },
      matchType: { in: ["unmatched", "conflict"] },
    },
    select: { id: true, runId: true },
  });

  const runByExceptionId = new Map<string, string>();
  const runExceptionCounts = new Map<string, number>();
  for (const match of matches) {
    runByExceptionId.set(match.id, match.runId);
    runExceptionCounts.set(match.runId, (runExceptionCounts.get(match.runId) ?? 0) + 1);
  }

  const reasonCountsByRun = new Map<string, Map<string, number>>();
  const exceptionIds = matches.map((match: { id: string }) => match.id);
  if (exceptionIds.length > 0) {
    const memories = await prisma.exceptionAdjudicationMemory.findMany({
      where: {
        tenantId,
        exceptionId: { in: exceptionIds },
      },
      select: { exceptionId: true, resolutionReason: true },
    });

    for (const memory of memories) {
      const runId = runByExceptionId.get(memory.exceptionId);
      if (!runId) continue;
      const reason = memory.resolutionReason?.trim();
      if (!reason) continue;
      const runReasons = reasonCountsByRun.get(runId) ?? new Map<string, number>();
      runReasons.set(reason, (runReasons.get(reason) ?? 0) + 1);
      reasonCountsByRun.set(runId, runReasons);
    }
  }

  const proofPackages =
    exceptionIds.length > 0
      ? await prisma.proofPackage.findMany({
          where: {
            tenantId,
            OR: exceptionIds.map((exceptionId: string) => ({
              packageKey: { startsWith: `exception:${exceptionId}:` },
            })),
          },
          select: {
            packageKey: true,
            status: true,
            completenessScore: true,
            missingEvidence: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const results = (await prisma.$queryRaw`
    SELECT
      recon_job_id,
      id,
      started_at,
      status,
      matched_count,
      unmatched_source_count,
      unmatched_target_count,
      conflict_count,
      ROW_NUMBER() OVER (
        PARTITION BY recon_job_id
        ORDER BY started_at DESC NULLS LAST, id::text DESC
      ) as rn
    FROM recon_results
    WHERE tenant_id = ${tenantId}::uuid
      AND recon_job_id = ANY(${runIds}::uuid[])
  `.catch(() => [])) as LatestPriorResultRow[];

  const latestByRun = new Map<string, LatestPriorResultRow>();
  const priorByRun = new Map<string, LatestPriorResultRow>();
  for (const row of results) {
    if (row.rn === 1) latestByRun.set(row.recon_job_id, row);
    if (row.rn === 2) priorByRun.set(row.recon_job_id, row);
  }

  const proofByRun = new Map<string, RunProofpackIndex["proofPackages"]>();
  for (const proof of proofPackages) {
    const exceptionId = proof.packageKey.split(":")[1];
    if (!exceptionId) continue;
    const runId = runByExceptionId.get(exceptionId);
    if (!runId) continue;
    const state =
      proofByRun.get(runId) ??
      ({
        total: 0,
        finalized: 0,
        missingEvidenceCount: 0,
        bestCompletenessScore: null,
        latestCreatedAt: null,
        state: "setup_required",
        degradedEvidenceReasons: [],
      } satisfies RunProofpackIndex["proofPackages"]);

    state.total += 1;
    if (proof.status === "finalized") state.finalized += 1;
    state.missingEvidenceCount += Array.isArray(proof.missingEvidence) ? proof.missingEvidence.length : 0;
    const completenessScore = Number(proof.completenessScore);
    state.bestCompletenessScore =
      state.bestCompletenessScore == null
        ? completenessScore
        : Math.max(state.bestCompletenessScore, completenessScore);
    if (!state.latestCreatedAt) state.latestCreatedAt = proof.createdAt.toISOString();
    if (Array.isArray(proof.missingEvidence)) {
      for (const reason of proof.missingEvidence) {
        if (typeof reason === "string" && !state.degradedEvidenceReasons.includes(reason)) {
          state.degradedEvidenceReasons.push(reason);
        }
      }
    }
    proofByRun.set(runId, state);
  }

  for (const run of reconRuns) {
    const base = byRun.get(run.id) ?? defaultIndex();
    const proof =
      proofByRun.get(run.id) ??
      ({ ...base.proofPackages, state: "setup_required", degradedEvidenceReasons: [] } as const);

    const repeatedReasons = Array.from(reasonCountsByRun.get(run.id)?.entries() ?? [])
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason);

    const exceptionsWithMemories = Array.from(reasonCountsByRun.get(run.id)?.values() ?? []).reduce(
      (total, count) => total + (count > 0 ? 1 : 0),
      0
    );

    const proofState =
      proof.total === 0
        ? "setup_required"
        : proof.finalized > 0 && proof.missingEvidenceCount === 0
          ? "ready"
          : "degraded";

    const recurrenceState =
      exceptionsWithMemories > 0
        ? "ready"
        : (runExceptionCounts.get(run.id) ?? 0) > 0
          ? "degraded"
          : "setup_required";

    const latest = latestByRun.get(run.id);
    const prior = priorByRun.get(run.id);
    const reasonCodes: string[] = [];

    let comparisonState: RunComparisonState = "unavailable";
    let changedSincePriorRun: RunDeltaChangeState = "unavailable";
    let summary = "No prior comparable run result is available yet.";
    let certainty: "high" | "medium" | "low" = "low";
    let matchedDelta: number | null = null;
    let unmatchedDelta: number | null = null;
    let conflictsDelta: number | null = null;

    if (!latest) {
      reasonCodes.push("latest_result_missing");
      summary = "Run has no persisted result, so prior-run comparison is unavailable.";
    } else if (!prior) {
      reasonCodes.push("baseline_missing");
    } else {
      const statusesComparable = latest.status === "completed" && prior.status === "completed";
      if (!statusesComparable) {
        comparisonState = "not_comparable";
        reasonCodes.push("non_terminal_baseline");
        summary = "Baseline exists but one or both run results are not completed, so deterministic deltas are not comparable.";
        certainty = "medium";
      } else {
        comparisonState = "available";
        certainty = "high";
        matchedDelta = latest.matched_count - prior.matched_count;
        unmatchedDelta =
          latest.unmatched_source_count +
          latest.unmatched_target_count -
          (prior.unmatched_source_count + prior.unmatched_target_count);
        conflictsDelta = latest.conflict_count - prior.conflict_count;
        changedSincePriorRun =
          matchedDelta !== 0 || unmatchedDelta !== 0 || conflictsDelta !== 0 ? "changed" : "unchanged";
        summary =
          changedSincePriorRun === "changed"
            ? "Deterministic run-over-run differences detected versus the most recent comparable baseline."
            : "No deterministic run-over-run differences detected versus the most recent comparable baseline.";
      }
    }

    byRun.set(run.id, {
      proofPackages: {
        ...proof,
        state: proofState,
      },
      recurrence: {
        exceptionsWithMemories,
        repeatedResolutionReasons: repeatedReasons,
        state: recurrenceState,
      },
      comparison: {
        state: comparisonState,
        changedSincePriorRun,
        certainty,
        reasonCodes,
        summary,
        baseline: {
          priorResultId: prior?.id ?? null,
          priorResultStartedAt: prior?.started_at?.toISOString() ?? null,
        },
        deltas: {
          matched: matchedDelta,
          unmatched: unmatchedDelta,
          conflicts: conflictsDelta,
          proofCompleteness:
            proof.bestCompletenessScore == null
              ? "unavailable"
              : proof.bestCompletenessScore >= 0.9
                ? "improved"
                : proof.bestCompletenessScore >= 0.7
                  ? "unchanged"
                  : "regressed",
          recurringFamilyConcentration:
            repeatedReasons.length === 0
              ? "unavailable"
              : repeatedReasons.length === 1
                ? "stronger"
                : "stable",
        },
      },
    });
  }

  return byRun;
}
