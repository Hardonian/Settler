import { DEFAULT_TOLERANCES } from "../../matching-rules-loader";
import { ReconciliationMatch, ReviewResult, RESOLUTION_RULES } from "./types";

/**
 * Apply rule-based resolution for medium-confidence matches
 */
export async function applyRuleBasedResolution(
  match: ReconciliationMatch,
  matchingConfig?: { amountTolerance: number; dateToleranceDays: number }
): Promise<{ action: ReviewResult["action"]; rule: string }> {
  // Use config values or fall back to defaults
  const amountMismatchThreshold = matchingConfig?.amountTolerance ?? DEFAULT_TOLERANCES.amount;
  const dateMismatchThreshold = matchingConfig?.dateToleranceDays ?? DEFAULT_TOLERANCES.dateDays;
  const exactMatchThreshold = 0.85; // High confidence for exact match

  // Rule 1: Amount mismatch within rounding tolerance
  if (match.amountDiff !== null && Math.abs(match.amountDiff) <= amountMismatchThreshold) {
    return {
      action: "rule_resolved",
      rule: "amount_mismatch_within_tolerance",
    };
  }

  // Rule 2: Date mismatch within acceptable window
  if (match.dateDiff !== null && Math.abs(match.dateDiff) <= dateMismatchThreshold) {
    return {
      action: "rule_resolved",
      rule: "date_mismatch_within_window",
    };
  }

  // Rule 3: Exact match type with high confidence
  if (match.matchType === "exact" && match.confidence >= exactMatchThreshold) {
    return {
      action: "rule_resolved",
      rule: "exact_match_high_confidence",
    };
  }

  // Default: Handle as exception
  return {
    action: "exception_handled",
    rule: "rule_based_default_exception",
  };
}

/**
 * Handle exceptions for low-confidence matches
 */
export async function handleException(
  match: ReconciliationMatch
): Promise<{ action: ReviewResult["action"]; rule: string }> {
  // Exception 1: Amount mismatch (rounding difference)
  if (
    match.amountDiff !== null &&
    Math.abs(match.amountDiff) <= RESOLUTION_RULES.ROUNDING_TOLERANCE
  ) {
    return {
      action: "exception_handled",
      rule: "rounding_difference_auto_resolve",
    };
  }

  // Exception 2: Date mismatch (timing difference)
  if (
    match.dateDiff !== null &&
    Math.abs(match.dateDiff) <= RESOLUTION_RULES.DATE_MISMATCH_THRESHOLD_DAYS
  ) {
    return {
      action: "exception_handled",
      rule: "timing_difference_auto_resolve",
    };
  }

  // Exception 3: Missing target transaction (create placeholder)
  if (!match.targetTransactionId && match.confidence >= 0.7) {
    // Pattern-based placeholder creation would go here
    return {
      action: "exception_handled",
      rule: "missing_transaction_pattern_match",
    };
  }

  // Default: Flag for system review
  return {
    action: "system_flagged",
    rule: "exception_default_system_review",
  };
}
