import type {
  RunCompactProofSummaryResolution,
  RunOperatorReasonCode,
} from "./run-proofpack-index.js";

export type RunInstitutionalMemoryRunKind = "recon_job" | "ingestion_run" | "unknown";

export interface RunInstitutionalMemorySummary {
  state: "ready" | "degraded" | "setup_required" | "unavailable" | "not_comparable";
  summary: string;
  reasonCodes: RunOperatorReasonCode[];
  provenance: {
    runKind: RunInstitutionalMemoryRunKind;
    source: RunCompactProofSummaryResolution["source"];
    fallbackReasonCode: RunCompactProofSummaryResolution["fallbackReasonCode"];
    memorySource: "exception_adjudication_memory";
    proofSource: "proof_packages";
    deltaSource: "recon_results" | "not_comparable" | "unavailable";
  };
  memory: {
    source: "exception_adjudication_memory";
    state: RunCompactProofSummaryResolution["compactProofSummary"]["recurrence"]["state"];
    exceptionsWithMemories: number;
    repeatedResolutionReasons: string[];
    recurringFamilies: RunCompactProofSummaryResolution["compactProofSummary"]["operatorSummary"]["recurringFamilies"];
  };
  proof: RunCompactProofSummaryResolution["compactProofSummary"]["proofPackages"] & {
    source: "proof_packages";
  };
  deltaBasis: RunCompactProofSummaryResolution["compactProofSummary"]["delta"] & {
    source: "recon_results" | "not_comparable" | "unavailable";
  };
}

export function buildRunInstitutionalMemorySummary(input: {
  runKind: RunInstitutionalMemoryRunKind;
  summaryResolution: RunCompactProofSummaryResolution;
}): RunInstitutionalMemorySummary {
  const summary = input.summaryResolution.compactProofSummary;
  const reasonCodes = uniqueReasonCodes([
    ...(summary.operatorSummary.primaryReasonCodes ?? []),
    ...(summary.delta.reasonCodes ?? []),
    ...(summary.proofPackages.degradedEvidenceReasons ?? []),
    ...(input.summaryResolution.fallbackReasonCode
      ? [input.summaryResolution.fallbackReasonCode]
      : []),
  ]);

  const state = resolveState({
    runKind: input.runKind,
    source: input.summaryResolution.source,
    fallbackReasonCode: input.summaryResolution.fallbackReasonCode,
    proofState: summary.proofPackages.state,
    recurrenceState: summary.recurrence.state,
    deltaState: summary.delta.state,
  });

  const deltaSource =
    input.runKind === "recon_job"
      ? "recon_results"
      : input.runKind === "ingestion_run"
        ? "not_comparable"
        : "unavailable";

  return {
    state,
    summary: buildSummary(state, summary.operatorSummary.summary),
    reasonCodes,
    provenance: {
      runKind: input.runKind,
      source: input.summaryResolution.source,
      fallbackReasonCode: input.summaryResolution.fallbackReasonCode,
      memorySource: "exception_adjudication_memory",
      proofSource: "proof_packages",
      deltaSource,
    },
    memory: {
      source: "exception_adjudication_memory",
      state: summary.recurrence.state,
      exceptionsWithMemories: summary.recurrence.exceptionsWithMemories,
      repeatedResolutionReasons: summary.recurrence.repeatedResolutionReasons,
      recurringFamilies: summary.operatorSummary.recurringFamilies,
    },
    proof: {
      source: "proof_packages",
      ...summary.proofPackages,
    },
    deltaBasis: {
      source: deltaSource,
      ...summary.delta,
    },
  };
}

function buildSummary(
  state: RunInstitutionalMemorySummary["state"],
  operatorSummary: string
): string {
  switch (state) {
    case "ready":
      return `Institutional memory is ready and grounded in adjudication memory, proof packages, and prior-run comparison. ${operatorSummary}`;
    case "degraded":
      return `Institutional memory is partially available. ${operatorSummary}`;
    case "setup_required":
      return `Institutional memory is still building from adjudications and proof packages. ${operatorSummary}`;
    case "not_comparable":
      return `Institutional memory is available only for proof and adjudication posture; this run kind does not support prior-run comparison. ${operatorSummary}`;
    case "unavailable":
    default:
      return `Institutional memory is unavailable for this run. ${operatorSummary}`;
  }
}

function resolveState(input: {
  runKind: RunInstitutionalMemoryRunKind;
  source: RunCompactProofSummaryResolution["source"];
  fallbackReasonCode: RunCompactProofSummaryResolution["fallbackReasonCode"];
  proofState: RunCompactProofSummaryResolution["compactProofSummary"]["proofPackages"]["state"];
  recurrenceState: RunCompactProofSummaryResolution["compactProofSummary"]["recurrence"]["state"];
  deltaState: RunCompactProofSummaryResolution["compactProofSummary"]["delta"]["state"];
}): RunInstitutionalMemorySummary["state"] {
  if (
    input.runKind === "ingestion_run" ||
    input.fallbackReasonCode === "ingestion_run_history_not_comparable" ||
    input.deltaState === "not_comparable"
  ) {
    return "not_comparable";
  }

  if (
    input.source === "fallback_unavailable" ||
    input.proofState === "unavailable" ||
    input.recurrenceState === "unavailable" ||
    input.deltaState === "unavailable" ||
    input.runKind === "unknown"
  ) {
    return "unavailable";
  }

  if (
    input.proofState === "degraded" ||
    input.recurrenceState === "degraded" ||
    input.deltaState === "degraded"
  ) {
    return "degraded";
  }

  if (input.proofState === "setup_required" || input.recurrenceState === "setup_required") {
    return "setup_required";
  }

  return "ready";
}

function uniqueReasonCodes(values: string[]): RunOperatorReasonCode[] {
  return [...new Set(values.filter((value): value is RunOperatorReasonCode => value.length > 0))];
}
