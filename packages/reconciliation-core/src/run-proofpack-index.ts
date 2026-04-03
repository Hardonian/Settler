import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";

export type RunComparisonState = "available" | "unavailable" | "not_comparable" | "degraded";
export type RunDeltaChangeState = "changed" | "unchanged" | "unavailable";

type RunCertainty = "high" | "medium" | "low";
type RunTrend = "improving" | "regressing" | "stable" | "volatile" | "unavailable";

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
    topRecurringFamilies: Array<{
      family: string;
      trend: "strengthening" | "weakening" | "stable" | "unavailable";
      certainty: RunCertainty;
      score: number;
      factors: {
        occurrences: number;
        unresolvedCount: number;
        adjudicationTouches: number;
        highSeverityCount: number;
      };
      reasonCodes: string[];
    }>;
  };
  comparison: {
    state: RunComparisonState;
    changedSincePriorRun: RunDeltaChangeState;
    certainty: RunCertainty;
    reasonCodes: string[];
    summary: string;
    baseline: {
      priorResultId: string | null;
      priorResultStartedAt: string | null;
    };
    history: {
      lookbackWindow: number;
      comparableWindowCount: number;
      certainty: RunCertainty;
      trend: RunTrend;
      reasonCodes: string[];
      summary: string;
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

type MatchRow = {
  id: string;
  runId: string;
  severity: string | null;
  status: string | null;
  resolutionReason: string | null;
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
      topRecurringFamilies: [],
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
      history: {
        lookbackWindow: 0,
        comparableWindowCount: 0,
        certainty: "low",
        trend: "unavailable",
        reasonCodes: ["history_missing"],
        summary: "History window is unavailable.",
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

type RunProofpackPrisma = {
  reconciliationMatch: { findMany: (args: unknown) => Promise<MatchRow[]> };
  exceptionAdjudicationMemory: {
    findMany: (args: unknown) => Promise<Array<{ exceptionId: string; resolutionReason: string | null }>>;
  };
  proofPackage: {
    findMany: (args: unknown) => Promise<
      Array<{
        packageKey: string;
        status: string;
        completenessScore: unknown;
        missingEvidence: unknown;
        createdAt: Date;
      }>
    >;
  };
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

const HISTORY_WINDOW = 6;

function totalUnmatched(row: LatestPriorResultRow) {
  return row.unmatched_source_count + row.unmatched_target_count;
}

function toComparableHistory(rows: LatestPriorResultRow[]) {
  const ordered = [...rows].sort((a, b) => (b.rn ?? 0) - (a.rn ?? 0));
  return ordered.filter((row) => row.status === "completed").slice(0, HISTORY_WINDOW);
}

function buildHistorySummary(rows: LatestPriorResultRow[]): RunProofpackIndex["comparison"]["history"] {
  const comparableRows = toComparableHistory(rows);
  if (comparableRows.length < 2) {
    return {
      lookbackWindow: Math.min(rows.length, HISTORY_WINDOW),
      comparableWindowCount: comparableRows.length,
      certainty: "low",
      trend: "unavailable",
      reasonCodes: ["history_too_thin"],
      summary: "Fewer than two comparable completed results are available in the history window.",
    };
  }

  let improvingSignals = 0;
  let regressingSignals = 0;
  let volatileSignals = 0;
  for (let i = 0; i < comparableRows.length - 1; i += 1) {
    const current = comparableRows[i];
    const prior = comparableRows[i + 1];
    const matchedDelta = current.matched_count - prior.matched_count;
    const unmatchedDelta = totalUnmatched(current) - totalUnmatched(prior);
    const conflictsDelta = current.conflict_count - prior.conflict_count;

    if (matchedDelta > 0 && unmatchedDelta <= 0 && conflictsDelta <= 0) {
      improvingSignals += 1;
    } else if (matchedDelta < 0 || unmatchedDelta > 0 || conflictsDelta > 0) {
      regressingSignals += 1;
    } else {
      volatileSignals += 1;
    }
  }

  const transitions = comparableRows.length - 1;
  const dominant = Math.max(improvingSignals, regressingSignals, volatileSignals);
  const dominanceRatio = dominant / transitions;
  const certainty: RunCertainty = transitions >= 4 && dominanceRatio >= 0.75 ? "high" : dominanceRatio >= 0.5 ? "medium" : "low";

  const trend: RunTrend =
    improvingSignals === regressingSignals && improvingSignals > 0
      ? "volatile"
      : improvingSignals > regressingSignals && improvingSignals >= volatileSignals
        ? "improving"
        : regressingSignals > improvingSignals && regressingSignals >= volatileSignals
          ? "regressing"
          : volatileSignals > 0
            ? "stable"
            : "stable";

  return {
    lookbackWindow: Math.min(rows.length, HISTORY_WINDOW),
    comparableWindowCount: comparableRows.length,
    certainty,
    trend,
    reasonCodes: [trend === "volatile" ? "mixed_direction_signals" : "history_window_evaluated"],
    summary:
      trend === "improving"
        ? "Recent comparable history shows improving reconciliation posture."
        : trend === "regressing"
          ? "Recent comparable history shows regressing reconciliation posture."
          : trend === "volatile"
            ? "Recent comparable history is mixed and volatile."
            : "Recent comparable history is stable.",
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
    select: { id: true, runId: true, severity: true, status: true, resolutionReason: true },
  });

  const runByExceptionId = new Map<string, string>();
  const runExceptionCounts = new Map<string, number>();
  const matchByExceptionId = new Map<string, MatchRow>();
  for (const match of matches) {
    runByExceptionId.set(match.id, match.runId);
    matchByExceptionId.set(match.id, match);
    runExceptionCounts.set(match.runId, (runExceptionCounts.get(match.runId) ?? 0) + 1);
  }

  const reasonCountsByRun = new Map<string, Map<string, number>>();
  const familyStatsByRun = new Map<
    string,
    Map<
      string,
      {
        occurrences: number;
        unresolvedCount: number;
        adjudicationTouches: number;
        highSeverityCount: number;
      }
    >
  >();

  const exceptionIds = matches.map((match) => match.id);
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
      const match = matchByExceptionId.get(memory.exceptionId);
      if (!runId || !match) continue;
      const reason = memory.resolutionReason?.trim() || match.resolutionReason?.trim() || "unclassified";
      const runReasons = reasonCountsByRun.get(runId) ?? new Map<string, number>();
      runReasons.set(reason, (runReasons.get(reason) ?? 0) + 1);
      reasonCountsByRun.set(runId, runReasons);

      const runFamilyStats = familyStatsByRun.get(runId) ?? new Map<string, { occurrences: number; unresolvedCount: number; adjudicationTouches: number; highSeverityCount: number; }>();
      const family = runFamilyStats.get(reason) ?? { occurrences: 0, unresolvedCount: 0, adjudicationTouches: 0, highSeverityCount: 0 };
      family.occurrences += 1;
      family.adjudicationTouches += 1;
      if (match.status !== "resolved") family.unresolvedCount += 1;
      if (match.severity === "high" || match.severity === "critical") family.highSeverityCount += 1;
      runFamilyStats.set(reason, family);
      familyStatsByRun.set(runId, runFamilyStats);
    }
  }

  const proofPackages =
    exceptionIds.length > 0
      ? await prisma.proofPackage.findMany({
          where: {
            tenantId,
            OR: exceptionIds.map((exceptionId) => ({
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

  const resultsByRun = new Map<string, LatestPriorResultRow[]>();
  for (const row of results) {
    const list = resultsByRun.get(row.recon_job_id) ?? [];
    list.push(row);
    resultsByRun.set(row.recon_job_id, list);
  }

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

    const rankedFamilies = Array.from(familyStatsByRun.get(run.id)?.entries() ?? [])
      .map(([family, stats]) => {
        const score =
          stats.occurrences * 4 +
          stats.unresolvedCount * 3 +
          stats.highSeverityCount * 2 +
          stats.adjudicationTouches;
        const trend: "strengthening" | "weakening" | "stable" | "unavailable" =
          stats.unresolvedCount > 0 && stats.adjudicationTouches > stats.occurrences
            ? "strengthening"
            : stats.unresolvedCount === 0 && stats.adjudicationTouches > 0
              ? "weakening"
              : "stable";
        const certainty: RunCertainty = stats.occurrences >= 3 ? "high" : stats.occurrences >= 2 ? "medium" : "low";
        return {
          family,
          trend,
          certainty,
          score,
          factors: stats,
          reasonCodes: [
            stats.unresolvedCount > 0 ? "unresolved_carryforward" : "resolved_or_no_carryforward",
            stats.highSeverityCount > 0 ? "high_severity_present" : "severity_not_elevated",
          ],
        };
      })
      .sort((a, b) => b.score - a.score || a.family.localeCompare(b.family))
      .slice(0, 5);

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
    let certainty: RunCertainty = "low";
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
        unmatchedDelta = totalUnmatched(latest) - totalUnmatched(prior);
        conflictsDelta = latest.conflict_count - prior.conflict_count;
        changedSincePriorRun =
          matchedDelta !== 0 || unmatchedDelta !== 0 || conflictsDelta !== 0 ? "changed" : "unchanged";
        summary =
          changedSincePriorRun === "changed"
            ? "Deterministic run-over-run differences detected versus the most recent comparable baseline."
            : "No deterministic run-over-run differences detected versus the most recent comparable baseline.";
      }
    }

    const recurringFamilyConcentration =
      rankedFamilies.length === 0
        ? "unavailable"
        : rankedFamilies[0]!.factors.occurrences >= 3
          ? "stronger"
          : rankedFamilies[0]!.factors.occurrences === 1
            ? "weaker"
            : "stable";

    byRun.set(run.id, {
      proofPackages: {
        ...proof,
        state: proofState,
      },
      recurrence: {
        exceptionsWithMemories,
        repeatedResolutionReasons: repeatedReasons,
        state: recurrenceState,
        topRecurringFamilies: rankedFamilies,
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
        history: buildHistorySummary(resultsByRun.get(run.id) ?? []),
        deltas: {
          matched: matchedDelta,
          unmatched: unmatchedDelta,
          conflicts: conflictsDelta,
          proofCompleteness: proof.bestCompletenessScore == null ? "unavailable" : "unchanged",
          recurringFamilyConcentration,
        },
      },
    });
  }

  return byRun;
}
