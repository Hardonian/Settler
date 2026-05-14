/**
 * Prior Run Delta Analyst — deterministic briefing from canonical run-delta measures.
 * No LLM; suitable for shared use by API workers and console surfaces.
 */

/** Minimal slice of run delta truth required for analysis */
export interface PriorRunDeltaSource {
  id: string;
  currentRunId: string;
  previousRunId: string | null;
  jobId: string;
  exceptionDelta: number;
  matchedDelta: number;
  unmatchedDelta: number;
  inputChanged: boolean;
  configDriftDetected: boolean;
  severityDeltas: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  newExceptionPatterns: string[];
  resolvedPatterns: string[];
}

export interface PriorRunDeltaBriefing {
  headline: string;
  posture: "improving" | "worsening" | "mixed" | "stable" | "first_run_or_incomparable";
  summaryBullets: string[];
  recommendedNextSteps: string[];
  basis: {
    exceptionDelta: number;
    matchedDelta: number;
    severityNet: { critical: number; high: number; medium: number; low: number };
    newPatternCount: number;
    resolvedPatternCount: number;
    configDriftDetected: boolean;
    inputChanged: boolean;
    priorRunPresent: boolean;
  };
}

function severityNet(delta: PriorRunDeltaSource): number {
  const s = delta.severityDeltas;
  return s.critical + s.high + s.medium + s.low;
}

export function buildEvidenceRefs(delta: PriorRunDeltaSource): Array<{
  kind: string;
  ref: string;
  detail?: string;
}> {
  return [
    { kind: "run_delta", ref: delta.id, detail: "Canonical RunDelta row" },
    { kind: "current_run", ref: delta.currentRunId },
    ...(delta.previousRunId ? [{ kind: "previous_run" as const, ref: delta.previousRunId }] : []),
    { kind: "job", ref: delta.jobId },
  ];
}

/** Exported for unit tests — deterministic template over RunDelta fields only */
export function buildPriorRunDeltaBriefing(delta: PriorRunDeltaSource): PriorRunDeltaBriefing {
  const priorPresent = delta.previousRunId !== null;
  const netSev = severityNet(delta);

  let posture: PriorRunDeltaBriefing["posture"] = "stable";
  if (!priorPresent) {
    posture = "first_run_or_incomparable";
  } else if (delta.exceptionDelta > 0 && netSev > 0) {
    posture = "worsening";
  } else if (delta.exceptionDelta < 0 && netSev <= 0) {
    posture = "improving";
  } else if (delta.exceptionDelta !== 0 || netSev !== 0 || delta.newExceptionPatterns.length > 0) {
    posture = "mixed";
  }

  const bullets: string[] = [];
  if (!priorPresent) {
    bullets.push(
      "No prior comparable run id on this delta — period-over-period posture is not yet established."
    );
  } else {
    bullets.push(
      `Exception count delta (conflicts): ${delta.exceptionDelta >= 0 ? "+" : ""}${delta.exceptionDelta} vs prior run.`
    );
    bullets.push(
      `Match delta: ${delta.matchedDelta >= 0 ? "+" : ""}${delta.matchedDelta}; unmatched volume delta: ${delta.unmatchedDelta >= 0 ? "+" : ""}${delta.unmatchedDelta}.`
    );
    const s = delta.severityDeltas;
    bullets.push(
      `Severity posture (net archetype deltas): critical ${s.critical}, high ${s.high}, medium ${s.medium}, low ${s.low}.`
    );
  }
  if (delta.newExceptionPatterns.length > 0) {
    bullets.push(`New exception patterns vs prior: ${delta.newExceptionPatterns.length} (archetype labels).`);
  }
  if (delta.resolvedPatterns.length > 0) {
    bullets.push(`Patterns no longer present vs prior: ${delta.resolvedPatterns.length}.`);
  }
  if (delta.configDriftDetected) {
    bullets.push("Configuration drift was flagged between snapshots — treat like-for-like comparisons cautiously.");
  }
  if (delta.inputChanged) {
    bullets.push("Input hash changed vs prior run — volume and exception shifts may reflect input change, not quality.");
  }

  const nextSteps: string[] = [];
  if (delta.configDriftDetected) {
    nextSteps.push("Reconcile job or adapter configuration with the prior period before interpreting exception trends.");
  }
  if (delta.newExceptionPatterns.length > 0) {
    nextSteps.push("Triage new archetype labels first; capture adjudications to grow institutional memory.");
  }
  if (delta.exceptionDelta > 0 && priorPresent) {
    nextSteps.push("Drill into conflicts and open exceptions for this run; prioritize by severity net and materiality.");
  }
  if (nextSteps.length === 0 && priorPresent) {
    nextSteps.push("Spot-check open exceptions and source trust signals; no automatic action required from delta alone.");
  }
  if (!priorPresent) {
    nextSteps.push("After the next run, re-open this briefing — prior-run comparison will be available.");
  }

  const headline =
    posture === "first_run_or_incomparable"
      ? "Prior-run comparison not available for this delta."
      : posture === "worsening"
        ? "Run delta suggests increased reconciliation pressure vs prior."
        : posture === "improving"
          ? "Run delta suggests reduced conflict load vs prior."
          : posture === "mixed"
            ? "Run delta shows a mixed signal — review patterns and config context."
            : "Run delta is stable vs prior on recorded measures.";

  return {
    headline,
    posture,
    summaryBullets: bullets,
    recommendedNextSteps: nextSteps,
    basis: {
      exceptionDelta: delta.exceptionDelta,
      matchedDelta: delta.matchedDelta,
      severityNet: { ...delta.severityDeltas },
      newPatternCount: delta.newExceptionPatterns.length,
      resolvedPatternCount: delta.resolvedPatterns.length,
      configDriftDetected: delta.configDriftDetected,
      inputChanged: delta.inputChanged,
      priorRunPresent: priorPresent,
    },
  };
}
