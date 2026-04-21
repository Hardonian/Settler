/**
 * First-class RunDelta classification from persisted `run_deltas` rows — deterministic only.
 */

export type RunDeltaRowLike = {
  matchedDelta: number;
  unmatchedDelta: number;
  exceptionDelta: number;
  inputChanged: boolean;
  configDriftDetected: boolean;
  criticalDelta?: number | null;
  highDelta?: number | null;
};

export type RunDeltaClassification = {
  category: "stable" | "volume_shift" | "quality_regression" | "input_or_config_change" | "unknown";
  anomalySeverity: "none" | "low" | "medium" | "high";
  reasoningCodes: string[];
};

export function classifyRunDelta(row: RunDeltaRowLike): RunDeltaClassification {
  const codes: string[] = [];
  const crit = Number(row.criticalDelta ?? 0);
  const high = Number(row.highDelta ?? 0);

  if (row.configDriftDetected) {
    codes.push("DELTA_CONFIG_DRIFT");
  }
  if (row.inputChanged) {
    codes.push("DELTA_INPUT_CHANGED");
  }
  if (row.exceptionDelta > 0) {
    codes.push("DELTA_EXCEPTIONS_INCREASED");
  }
  if (row.exceptionDelta < 0) {
    codes.push("DELTA_EXCEPTIONS_DECREASED");
  }
  if (row.unmatchedDelta > 0) {
    codes.push("DELTA_UNMATCHED_INCREASED");
  }
  if (row.unmatchedDelta < 0) {
    codes.push("DELTA_UNMATCHED_DECREASED");
  }
  if (row.matchedDelta > 0) {
    codes.push("DELTA_MATCHED_INCREASED");
  }
  if (row.matchedDelta < 0) {
    codes.push("DELTA_MATCHED_DECREASED");
  }

  let category: RunDeltaClassification["category"] = "stable";
  if (row.inputChanged || row.configDriftDetected) {
    category = "input_or_config_change";
  } else if (row.unmatchedDelta > 0 || row.exceptionDelta > 0) {
    category = "quality_regression";
  } else if (row.matchedDelta !== 0 || row.unmatchedDelta !== 0 || row.exceptionDelta !== 0) {
    category = "volume_shift";
  }

  let anomalySeverity: RunDeltaClassification["anomalySeverity"] = "none";
  if (crit > 0 || high > 2) {
    anomalySeverity = "high";
    codes.push("DELTA_SEVERITY_HIGH");
  } else if (high > 0 || row.exceptionDelta > 2) {
    anomalySeverity = "medium";
    codes.push("DELTA_SEVERITY_MEDIUM");
  } else if (row.unmatchedDelta > 0 || row.exceptionDelta > 0) {
    anomalySeverity = "low";
    codes.push("DELTA_SEVERITY_LOW");
  }

  return {
    category,
    anomalySeverity,
    reasoningCodes: [...new Set(codes)].sort(),
  };
}
