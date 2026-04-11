/**
 * Canonical exception-detail intelligence slice: family/adjudication memory + proof lineage refs.
 * Read-only assembly from stored facts; no inference beyond bounded similar-case retrieval.
 */

import type { ExceptionFamilySummary } from "./exception-intelligence.js";
import type { ExceptionRunComparisonSnapshot } from "./exception-run-comparison.js";

export type ExceptionDetailSimilarCaseRef = {
  exceptionId: string;
  memoryId: string | null;
  resolution: string;
  resolutionReason: string | null;
  resolutionCode: string | null;
  outcome: string | null;
  adjudicatedAt: string;
  adjudicatorId: string;
  archetypeCode: string | null;
  archetypeLabel: string | null;
};

export type ExceptionDetailIntelligence = {
  state: "available" | "building" | "unavailable";
  reasonCodes: string[];
  /** Bounded scan: similar-case query cap (stored facts only). */
  similarCaseScanLimit: number;
  familySummary: ExceptionFamilySummary;
  /** Prior adjudications on this exception id, newest first (bounded by caller). */
  recentAdjudicationsOnException: Array<{
    memoryId: string;
    resolution: string;
    resolutionReason: string | null;
    resolutionCode: string | null;
    outcome: string | null;
    adjudicationType: string;
    adjudicatorType: string;
    completedAt: string | null;
    createdAt: string;
  }>;
  /** Resolution outcome counts on this exception from stored memory rows. */
  adjudicationOutcomeCounts: Record<string, number>;
  /** Bounded similar resolved cases (deterministic ranking in workbench). */
  similarResolvedCases: ExceptionDetailSimilarCaseRef[];
  recurrenceReasonCodes: string[];
};

export type ExceptionProofLineage = {
  runId: string;
  evidenceArtifactIds: string[];
  proofPackageIds: string[];
  adjudicationMemoryIds: string[];
  /** Prior recon result id when run comparison baseline is present. */
  priorRunResultId: string | null;
};

/**
 * Assemble proof/evidence lineage references for export and API consumers.
 */
export function buildExceptionProofLineage(input: {
  runId: string;
  evidenceArtifactIds: string[];
  proofPackageIds: string[];
  adjudicationMemoryIds: string[];
  runComparison: ExceptionRunComparisonSnapshot | null;
}): ExceptionProofLineage {
  const priorRunResultId =
    input.runComparison?.available && input.runComparison.baseline?.priorResultId
      ? input.runComparison.baseline.priorResultId
      : null;
  return {
    runId: input.runId,
    evidenceArtifactIds: [...input.evidenceArtifactIds],
    proofPackageIds: [...input.proofPackageIds],
    adjudicationMemoryIds: [...input.adjudicationMemoryIds],
    priorRunResultId,
  };
}
