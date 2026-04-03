import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";

export type RunComparisonState = "available" | "unavailable" | "not_comparable" | "degraded";
export type RunDeltaChangeState = "changed" | "unchanged" | "unavailable";

type RunCertainty = "high" | "medium" | "low";
type RunTrend = "improving" | "regressing" | "stable" | "volatile" | "unavailable";
type RunPattern =
  | "worsening_pattern"
  | "recovering_pattern"
  | "stable_pattern"
  | "thin_history"
  | "unavailable";

export type RunOperatorReasonCode =
  | "baseline_missing"
  | "history_missing"
  | "history_query_failed"
  | "latest_result_missing"
  | "non_terminal_baseline"
  | "history_too_thin"
  | "history_window_evaluated"
  | "mixed_direction_signals"
  | "carryforward_concentration_increased"
  | "proof_completeness_weakened"
  | "proofpack_index_unavailable"
  | "run_proofpack_missing"
  | "ingestion_run_history_not_comparable"
  | "export_run_detail_not_found"
  | "export_run_detail_error"
  | `export_run_detail_${string}`
  | `support_${string}`
  | string;

export type RunOperatorExplainerCode =
  | "signal_strong"
  | "signal_weak"
  | "signal_degraded"
  | "signal_unavailable"
  | "signal_not_comparable"
  | "pattern_worsening"
  | "pattern_recovering"
  | "pattern_stable"
  | "pattern_thin_history"
  | "pattern_unavailable"
  | "comparison_state_available"
  | "comparison_state_unavailable"
  | "comparison_state_degraded"
  | "comparison_state_not_comparable"
  | "comparison_trust_high"
  | "comparison_trust_medium"
  | "comparison_trust_low"
  | "proof_posture_stronger"
  | "proof_posture_weaker"
  | "proof_posture_unchanged"
  | "proof_posture_unavailable"
  | "proof_posture_change_present"
  | "proof_posture_change_absent"
  | "history_lookup_failed"
  | "history_too_thin"
  | "history_not_comparable"
  | "history_unavailable"
  | "history_missing"
  | "proofpack_missing"
  | "ingestion_run_not_comparable"
  | "recurring_family_signal_present"
  | "recurring_family_signal_absent"
  | "comparison_change_detected"
  | "comparison_change_absent"
  | "comparison_change_unavailable";

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
      reasonCodes: RunOperatorReasonCode[];
    }>;
  };
  comparison: {
    state: RunComparisonState;
    changedSincePriorRun: RunDeltaChangeState;
    certainty: RunCertainty;
    reasonCodes: RunOperatorReasonCode[];
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
      pattern: RunPattern;
      reasonCodes: RunOperatorReasonCode[];
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

export type RunCompactProofSummary = {
  proofPackages: RunProofpackIndex["proofPackages"];
  recurrence: RunProofpackIndex["recurrence"];
  delta: {
    changedSincePreviousRun: RunProofpackIndex["comparison"]["changedSincePriorRun"];
    summary: RunProofpackIndex["comparison"]["summary"];
    state: RunProofpackIndex["comparison"]["state"];
    certainty: RunProofpackIndex["comparison"]["certainty"];
    reasonCodes: RunProofpackIndex["comparison"]["reasonCodes"];
    baseline: RunProofpackIndex["comparison"]["baseline"];
    history: RunProofpackIndex["comparison"]["history"];
    deltas: RunProofpackIndex["comparison"]["deltas"];
  };
  operatorSummary: {
    signal: "strong" | "weak" | "degraded" | "unavailable" | "not_comparable";
    pattern: RunProofpackIndex["comparison"]["history"]["pattern"];
    changedSincePreviousRun: RunProofpackIndex["comparison"]["changedSincePriorRun"];
    proofPosture: "stronger" | "weaker" | "unchanged" | "unavailable";
    primaryReasonCodes: RunOperatorReasonCode[];
    recurringFamilies: Array<{
      family: string;
      trend: RunProofpackIndex["recurrence"]["topRecurringFamilies"][number]["trend"];
      certainty: RunProofpackIndex["recurrence"]["topRecurringFamilies"][number]["certainty"];
      reasonCodes: string[];
    }>;
    summary: string;
    explainerCodes: RunOperatorExplainerCode[];
  };
};

type RunKindForSummary = "recon_job" | "ingestion_run";

export type RunCompactProofSummaryResolution = {
  compactProofSummary: RunCompactProofSummary;
  source: "compact_summary" | "proofpack_index" | "fallback_unavailable";
  fallbackReasonCode: RunOperatorReasonCode | null;
};

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
        pattern: "unavailable",
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

function dedupeReasonCodes(codes: RunOperatorReasonCode[]): RunOperatorReasonCode[] {
  return Array.from(new Set(codes));
}

function buildOperatorExplainerCodes(input: {
  index: RunProofpackIndex;
  signal: RunCompactProofSummary["operatorSummary"]["signal"];
  proofPosture: RunCompactProofSummary["operatorSummary"]["proofPosture"];
  hasRecurringFamilyHighlights: boolean;
}): RunOperatorExplainerCode[] {
  const { index, signal, proofPosture, hasRecurringFamilyHighlights } = input;
  const codes: RunOperatorExplainerCode[] = [];

  codes.push(
    signal === "strong"
      ? "signal_strong"
      : signal === "weak"
        ? "signal_weak"
        : signal === "degraded"
          ? "signal_degraded"
          : signal === "not_comparable"
            ? "signal_not_comparable"
            : "signal_unavailable"
  );

  codes.push(
    index.comparison.state === "available"
      ? "comparison_state_available"
      : index.comparison.state === "degraded"
        ? "comparison_state_degraded"
        : index.comparison.state === "not_comparable"
          ? "comparison_state_not_comparable"
          : "comparison_state_unavailable"
  );

  codes.push(
    index.comparison.certainty === "high"
      ? "comparison_trust_high"
      : index.comparison.certainty === "medium"
        ? "comparison_trust_medium"
        : "comparison_trust_low"
  );

  codes.push(
    index.comparison.history.pattern === "worsening_pattern"
      ? "pattern_worsening"
      : index.comparison.history.pattern === "recovering_pattern"
        ? "pattern_recovering"
        : index.comparison.history.pattern === "stable_pattern"
          ? "pattern_stable"
          : index.comparison.history.pattern === "thin_history"
            ? "pattern_thin_history"
            : "pattern_unavailable"
  );

  codes.push(
    proofPosture === "stronger"
      ? "proof_posture_stronger"
      : proofPosture === "weaker"
        ? "proof_posture_weaker"
        : proofPosture === "unchanged"
          ? "proof_posture_unchanged"
          : "proof_posture_unavailable"
  );
  codes.push(
    proofPosture === "stronger" || proofPosture === "weaker"
      ? "proof_posture_change_present"
      : "proof_posture_change_absent"
  );

  codes.push(
    index.comparison.changedSincePriorRun === "changed"
      ? "comparison_change_detected"
      : index.comparison.changedSincePriorRun === "unchanged"
        ? "comparison_change_absent"
        : "comparison_change_unavailable"
  );

  if (index.comparison.reasonCodes.includes("history_query_failed")) {
    codes.push("history_lookup_failed");
  }
  if (index.comparison.reasonCodes.includes("non_terminal_baseline")) {
    codes.push("history_not_comparable");
  }
  if (index.comparison.reasonCodes.includes("baseline_missing")) {
    codes.push("history_missing");
  }
  if (index.comparison.history.pattern === "thin_history") {
    codes.push("history_too_thin");
  }
  if (index.comparison.history.pattern === "unavailable") {
    codes.push("history_unavailable");
  }
  if (index.comparison.reasonCodes.includes("run_proofpack_missing")) {
    codes.push("proofpack_missing");
  }
  if (index.comparison.reasonCodes.includes("ingestion_run_history_not_comparable")) {
    codes.push("ingestion_run_not_comparable");
  }

  codes.push(hasRecurringFamilyHighlights ? "recurring_family_signal_present" : "recurring_family_signal_absent");
  return Array.from(new Set(codes));
}

export function toRunCompactProofSummary(index: RunProofpackIndex): RunCompactProofSummary {
  const signal: RunCompactProofSummary["operatorSummary"]["signal"] =
    index.comparison.state === "degraded"
      ? "degraded"
      : index.comparison.state === "not_comparable"
        ? "not_comparable"
        : index.comparison.state === "unavailable"
          ? index.comparison.history.pattern === "thin_history"
            ? "weak"
            : "unavailable"
          : index.comparison.history.pattern === "thin_history" || index.comparison.certainty === "low"
            ? "weak"
            : "strong";

  const proofPosture: RunCompactProofSummary["operatorSummary"]["proofPosture"] =
    index.comparison.deltas.proofCompleteness === "improved"
      ? "stronger"
      : index.comparison.deltas.proofCompleteness === "regressed"
        ? "weaker"
        : index.comparison.deltas.proofCompleteness === "unchanged"
          ? "unchanged"
          : index.proofPackages.state === "degraded"
            ? "weaker"
            : "unavailable";

  const primaryReasonCodes = dedupeReasonCodes([
    ...index.comparison.reasonCodes,
    ...index.comparison.history.reasonCodes,
    ...(index.comparison.history.pattern === "thin_history" ? (["history_too_thin"] as const) : []),
    ...(index.comparison.deltas.recurringFamilyConcentration === "stronger"
      ? (["carryforward_concentration_increased"] as const)
      : []),
    ...(proofPosture === "weaker" ? (["proof_completeness_weakened"] as const) : []),
  ]);

  const recurringFamilies = index.recurrence.topRecurringFamilies.slice(0, 3).map((family) => ({
    family: family.family,
    trend: family.trend,
    certainty: family.certainty,
    reasonCodes: family.reasonCodes,
  }));

  const explainerCodes = buildOperatorExplainerCodes({
    index,
    signal,
    proofPosture,
    hasRecurringFamilyHighlights: recurringFamilies.length > 0,
  });

  const summary =
    signal === "degraded"
      ? "Historical signal is degraded because comparison history could not be loaded deterministically."
      : signal === "not_comparable"
        ? "Historical signal is not comparable because baseline results are not in a completed terminal state."
        : signal === "unavailable"
          ? "Historical signal is unavailable for this run."
          : signal === "weak"
            ? "Historical signal is weak due to thin or low-certainty comparable history."
            : index.comparison.history.pattern === "worsening_pattern"
              ? "Historical signal is strong and worsening versus recent comparable runs."
              : index.comparison.history.pattern === "recovering_pattern"
                ? "Historical signal is strong and recovering versus recent comparable runs."
                : "Historical signal is strong and stable versus recent comparable runs.";

  return {
    proofPackages: index.proofPackages,
    recurrence: index.recurrence,
    delta: {
      changedSincePreviousRun: index.comparison.changedSincePriorRun,
      summary: index.comparison.summary,
      state: index.comparison.state,
      certainty: index.comparison.certainty,
      reasonCodes: index.comparison.reasonCodes,
      baseline: index.comparison.baseline,
      history: index.comparison.history,
      deltas: index.comparison.deltas,
    },
    operatorSummary: {
      signal,
      pattern: index.comparison.history.pattern,
      changedSincePreviousRun: index.comparison.changedSincePriorRun,
      proofPosture,
      primaryReasonCodes,
      recurringFamilies,
      summary,
      explainerCodes,
    },
  };
}

export function canonicalMissingProofpackReasonForRunKind(
  runKind: RunKindForSummary
): RunOperatorReasonCode {
  return runKind === "ingestion_run" ? "ingestion_run_history_not_comparable" : "run_proofpack_missing";
}

export function resolveRunCompactProofSummary(input: {
  runKind: RunKindForSummary;
  compactProofSummary?: RunCompactProofSummary;
  proofpackIndex?: RunProofpackIndex;
  fallbackReasonCode?: RunOperatorReasonCode;
}): RunCompactProofSummaryResolution {
  if (input.compactProofSummary) {
    return {
      compactProofSummary: input.compactProofSummary,
      source: "compact_summary",
      fallbackReasonCode: null,
    };
  }

  if (input.proofpackIndex) {
    return {
      compactProofSummary: toRunCompactProofSummary(input.proofpackIndex),
      source: "proofpack_index",
      fallbackReasonCode: null,
    };
  }

  const fallbackReasonCode =
    input.fallbackReasonCode ?? canonicalMissingProofpackReasonForRunKind(input.runKind);

  return {
    compactProofSummary: toRunCompactProofSummary(unavailableRunProofpackIndex(fallbackReasonCode)),
    source: "fallback_unavailable",
    fallbackReasonCode,
  };
}

export function unavailableRunProofpackIndex(
  reasonCode = "proofpack_index_unavailable"
): RunProofpackIndex {
  const base = defaultIndex();
  return {
    ...base,
    proofPackages: {
      ...base.proofPackages,
      state: "unavailable",
      degradedEvidenceReasons: [reasonCode],
    },
    recurrence: {
      ...base.recurrence,
      state: "unavailable",
    },
    comparison: {
      ...base.comparison,
      reasonCodes: [reasonCode],
      summary: "Run-level proofpack index is unavailable for this run type.",
      history: {
        ...base.comparison.history,
        pattern: "unavailable",
        reasonCodes: [reasonCode],
        summary: "Run history intelligence is unavailable for this run type.",
      },
    },
  };
}

type RunProofpackPrisma = {
  reconciliationMatch: { findMany: (args: unknown) => Promise<MatchRow[]> };
  exceptionAdjudicationMemory: {
    findMany: (
      args: unknown
    ) => Promise<Array<{ exceptionId: string; resolutionReason: string | null }>>;
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

function buildHistorySummary(
  rows: LatestPriorResultRow[]
): RunProofpackIndex["comparison"]["history"] {
  const comparableRows = toComparableHistory(rows);
  if (comparableRows.length < 2) {
    return {
      lookbackWindow: Math.min(rows.length, HISTORY_WINDOW),
      comparableWindowCount: comparableRows.length,
      certainty: "low",
      trend: "unavailable",
      pattern: "thin_history",
      reasonCodes: ["history_too_thin"],
      summary: "Fewer than two comparable completed results are available in the history window.",
    };
  }

  let improvingSignals = 0;
  let regressingSignals = 0;
  let volatileSignals = 0;
  for (let i = 0; i < comparableRows.length - 1; i += 1) {
    const current = comparableRows[i]!;
    const prior = comparableRows[i + 1]!;
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
  const certainty: RunCertainty =
    transitions >= 4 && dominanceRatio >= 0.75 ? "high" : dominanceRatio >= 0.5 ? "medium" : "low";

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

  const pattern: RunPattern =
    trend === "improving"
      ? "recovering_pattern"
      : trend === "regressing"
        ? "worsening_pattern"
        : "stable_pattern";

  return {
    lookbackWindow: Math.min(rows.length, HISTORY_WINDOW),
    comparableWindowCount: comparableRows.length,
    certainty,
    trend,
    pattern,
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
  runs: Array<Pick<CanonicalReconciliationListItem, "id" | "runKind">>;
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

  const exceptionIds = matches.map((match: MatchRow) => match.id);
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
      const reason =
        memory.resolutionReason?.trim() || match.resolutionReason?.trim() || "unclassified";
      const runReasons = reasonCountsByRun.get(runId) ?? new Map<string, number>();
      runReasons.set(reason, (runReasons.get(reason) ?? 0) + 1);
      reasonCountsByRun.set(runId, runReasons);

      const runFamilyStats =
        familyStatsByRun.get(runId) ??
        new Map<
          string,
          {
            occurrences: number;
            unresolvedCount: number;
            adjudicationTouches: number;
            highSeverityCount: number;
          }
        >();
      const family = runFamilyStats.get(reason) ?? {
        occurrences: 0,
        unresolvedCount: 0,
        adjudicationTouches: 0,
        highSeverityCount: 0,
      };
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

  let results: LatestPriorResultRow[] = [];
  let historyQueryFailed = false;
  try {
    results = (await prisma.$queryRaw`
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
    `) as LatestPriorResultRow[];
  } catch {
    historyQueryFailed = true;
  }

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
    state.missingEvidenceCount += Array.isArray(proof.missingEvidence)
      ? proof.missingEvidence.length
      : 0;
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
        const certainty: RunCertainty =
          stats.occurrences >= 3 ? "high" : stats.occurrences >= 2 ? "medium" : "low";
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
    const reasonCodes: RunOperatorReasonCode[] = [];

    let comparisonState: RunComparisonState = "unavailable";
    let changedSincePriorRun: RunDeltaChangeState = "unavailable";
    let summary = "No prior comparable run result is available yet.";
    let certainty: RunCertainty = "low";
    let matchedDelta: number | null = null;
    let unmatchedDelta: number | null = null;
    let conflictsDelta: number | null = null;

    if (historyQueryFailed) {
      comparisonState = "degraded";
      reasonCodes.push("history_query_failed");
      summary =
        "Prior-run comparison is degraded because run history could not be loaded from persistence.";
      certainty = "low";
    } else if (!latest) {
      reasonCodes.push("latest_result_missing");
      summary = "Run has no persisted result, so prior-run comparison is unavailable.";
    } else if (!prior) {
      reasonCodes.push("baseline_missing");
    } else {
      const statusesComparable = latest.status === "completed" && prior.status === "completed";
      if (!statusesComparable) {
        comparisonState = "not_comparable";
        reasonCodes.push("non_terminal_baseline");
        summary =
          "Baseline exists but one or both run results are not completed, so deterministic deltas are not comparable.";
        certainty = "medium";
      } else {
        comparisonState = "available";
        certainty = "high";
        matchedDelta = latest.matched_count - prior.matched_count;
        unmatchedDelta = totalUnmatched(latest) - totalUnmatched(prior);
        conflictsDelta = latest.conflict_count - prior.conflict_count;
        changedSincePriorRun =
          matchedDelta !== 0 || unmatchedDelta !== 0 || conflictsDelta !== 0
            ? "changed"
            : "unchanged";
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
        ...(historyQueryFailed
          ? {
              history: {
                lookbackWindow: 0,
                comparableWindowCount: 0,
                certainty: "low" as const,
                trend: "unavailable" as const,
                pattern: "unavailable" as const,
                reasonCodes: ["history_query_failed"],
                summary:
                  "Run history intelligence is degraded because comparable history could not be loaded.",
              },
            }
          : {
              history: buildHistorySummary(resultsByRun.get(run.id) ?? []),
            }),
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
