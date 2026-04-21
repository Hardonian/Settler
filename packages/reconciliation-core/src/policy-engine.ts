/**
 * Deterministic policy hooks — no ML, no hidden inference.
 * `learnFromAdjudication` maps persisted adjudication signals to stable reasoning codes
 * for suggestions and future run metadata (callers persist outcomes; this only computes).
 */

export type AdjudicationMemoryInput = {
  /** Normalized resolution reason from operator or system */
  resolutionReason?: string | null | undefined;
  /** e.g. manual_review, ignore, resolve */
  adjudicationType: string;
  /** Exception family/type when known */
  exceptionType?: string | null;
};

export type AdjudicationLearningOutcome = {
  reasoningCodes: readonly string[];
  /** Non-negative integer weights keyed by deterministic policy bucket */
  policyWeightHints: Readonly<Record<string, number>>;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * Deterministic learning step from a single adjudication row.
 * Codes are stable, sortable, and safe to log in audit trails.
 */
export function learnFromAdjudication(input: AdjudicationMemoryInput): AdjudicationLearningOutcome {
  const codes: string[] = [];
  const hints: Record<string, number> = {};

  const reason = norm(input.resolutionReason);
  const adjType = norm(input.adjudicationType) || "unknown";

  if (!reason) {
    codes.push("ADJ_REASON_MISSING");
  }

  if (adjType === "ignore" || adjType === "ignored") {
    codes.push("ADJ_PATH_IGNORE");
    hints.exception_ignore = (hints.exception_ignore ?? 0) + 1;
  } else if (adjType === "resolve" || adjType === "resolved") {
    codes.push("ADJ_PATH_RESOLVE");
    hints.exception_resolve = (hints.exception_resolve ?? 0) + 1;
  } else if (adjType === "manual_review" || adjType === "review") {
    codes.push("ADJ_PATH_REVIEW");
    hints.exception_review = (hints.exception_review ?? 0) + 1;
  } else {
    codes.push("ADJ_PATH_OTHER");
  }

  if (reason.includes("duplicate") || reason.includes("dup")) {
    codes.push("ADJ_SEMANTIC_DUPLICATE");
    hints.match_duplicate_tolerance = (hints.match_duplicate_tolerance ?? 0) + 1;
  }
  if (reason.includes("timing") || reason.includes("date")) {
    codes.push("ADJ_SEMANTIC_TIMING");
    hints.tolerance_date = (hints.tolerance_date ?? 0) + 1;
  }
  if (reason.includes("fee") || reason.includes("fx")) {
    codes.push("ADJ_SEMANTIC_AMOUNT_FX");
    hints.tolerance_amount = (hints.tolerance_amount ?? 0) + 1;
  }

  const exType = norm(input.exceptionType);
  if (exType) {
    codes.push(`ADJ_EXCEPTION_FAMILY_${exType.replace(/[^a-z0-9_]+/g, "_").slice(0, 48)}`);
  }

  const unique = [...new Set(codes)].sort();
  return { reasoningCodes: unique, policyWeightHints: hints };
}

/** Namespace object for callers that expect `PolicyEngine.learnFromAdjudication` */
export const PolicyEngine = {
  learnFromAdjudication,
} as const;
