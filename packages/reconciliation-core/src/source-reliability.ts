/**
 * Evidence-based source reliability — derived only from explicit operator-truth signals.
 * Scores are 0..1; never invented from generative models.
 */

export type SourceReliabilityInput = {
  configDriftStatus: "none" | "detected" | "indeterminate";
  proofPackagesState: "ready" | "degraded" | "setup_required" | "unavailable";
  inputHashPresent: boolean;
  comparisonState?: "available" | "unavailable" | "not_comparable" | "degraded";
};

export type SourceReliabilityProjection = {
  source: number;
  target: number;
  combined: number;
  reasonCodes: string[];
};

export function computeSourceReliabilityProjection(
  input: SourceReliabilityInput
): SourceReliabilityProjection {
  const reasonCodes: string[] = [];
  let score = 1;

  if (input.configDriftStatus === "detected") {
    score -= 0.25;
    reasonCodes.push("SRC_CONFIG_DRIFT_DETECTED");
  } else if (input.configDriftStatus === "indeterminate") {
    score -= 0.1;
    reasonCodes.push("SRC_CONFIG_DRIFT_INDETERMINATE");
  }

  if (input.proofPackagesState === "degraded") {
    score -= 0.15;
    reasonCodes.push("SRC_PROOF_POSTURE_DEGRADED");
  } else if (input.proofPackagesState === "setup_required") {
    score -= 0.1;
    reasonCodes.push("SRC_PROOF_SETUP_REQUIRED");
  } else if (input.proofPackagesState === "unavailable") {
    score -= 0.2;
    reasonCodes.push("SRC_PROOF_UNAVAILABLE");
  }

  if (!input.inputHashPresent) {
    score -= 0.15;
    reasonCodes.push("SRC_INPUT_HASH_MISSING");
  }

  if (input.comparisonState === "degraded") {
    score -= 0.1;
    reasonCodes.push("SRC_PRIOR_RUN_COMPARISON_DEGRADED");
  } else if (input.comparisonState === "unavailable") {
    score -= 0.05;
    reasonCodes.push("SRC_PRIOR_RUN_COMPARISON_UNAVAILABLE");
  }

  const clamped = Math.max(0, Math.min(1, Number(score.toFixed(4))));
  return {
    source: clamped,
    target: clamped,
    combined: clamped,
    reasonCodes: [...new Set(reasonCodes)].sort(),
  };
}
