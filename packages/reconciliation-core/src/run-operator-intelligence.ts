import { learnFromAdjudication } from "./policy-engine.js";
import type { RunDeltaClassification } from "./run-delta-classification.js";
import type { SourceReliabilityProjection } from "./source-reliability.js";

export type OperatorRunIntelligence = {
  state: "available" | "degraded" | "unavailable";
  reasonCodes: string[];
  operatorMessage: string;
  sourceReliability: SourceReliabilityProjection;
  adjudicationLearning: {
    sampleCount: number;
    reasoningCodes: string[];
    policyWeightHints: Record<string, number>;
  };
  runDelta: {
    recordId: string | null;
    previousRunId: string | null;
    classification: RunDeltaClassification;
  } | null;
  workforce: {
    triggerRunDeltaAnalysis: boolean;
    reasonCodes: string[];
  };
};

export function mergePolicyWeightHints(
  hints: Record<string, number>,
  next: Readonly<Record<string, number>>
): void {
  for (const [k, v] of Object.entries(next)) {
    hints[k] = (hints[k] ?? 0) + v;
  }
}

export function buildWorkforceHints(classification: RunDeltaClassification): {
  triggerRunDeltaAnalysis: boolean;
  reasonCodes: string[];
} {
  const trigger =
    classification.anomalySeverity === "medium" ||
    classification.anomalySeverity === "high" ||
    classification.category === "quality_regression";
  const codes = [...classification.reasoningCodes];
  if (trigger) {
    codes.push("WORKFORCE_PRIOR_RUN_DELTA_SUGGESTED");
  }
  return { triggerRunDeltaAnalysis: trigger, reasonCodes: [...new Set(codes)].sort() };
}

export function aggregateAdjudicationLearning(
  rows: Array<{
    resolutionReason: string | null;
    adjudicationType: string;
    matchType?: string | null;
  }>
): OperatorRunIntelligence["adjudicationLearning"] {
  const mergedHints: Record<string, number> = {};
  const allCodes = new Set<string>();

  for (const row of rows) {
    const out = learnFromAdjudication({
      resolutionReason: row.resolutionReason,
      adjudicationType: row.adjudicationType,
      exceptionType: row.matchType ?? undefined,
    });
    for (const c of out.reasoningCodes) {
      allCodes.add(c);
    }
    mergePolicyWeightHints(mergedHints, out.policyWeightHints);
  }

  return {
    sampleCount: rows.length,
    reasoningCodes: [...allCodes].sort(),
    policyWeightHints: mergedHints,
  };
}
