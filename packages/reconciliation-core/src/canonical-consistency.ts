/**
 * Cross-surface canonical consistency checks — list vs detail vs proofpack projections
 * must not drift when driven from the same canonical reconciliation rows.
 */

import type { ApiRunsListLegacyItem } from "./api-runs-list-adapter.js";

export type CanonicalConsistencyViolation = {
  path: string;
  listValue: unknown;
  detailValue: unknown;
};

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[key] = (v as Record<string, unknown>)[key];
      }
      return sorted;
    }
    return v;
  });
}

/**
 * Assert list row and operator detail expose the same legacy-shaped overlap when both
 * originate from the same canonical run entity (same id).
 *
 * Ignores proofpack/list-only extensions (`compactProofSummary`, etc.).
 */
export function assertCanonicalConsistency(input: {
  runId: string;
  listRow: ApiRunsListLegacyItem;
  detailRow: ApiRunsListLegacyItem;
}): void {
  const { runId, listRow, detailRow } = input;

  if (listRow.id !== runId || detailRow.id !== runId) {
    throw new Error(
      `assertCanonicalConsistency: runId mismatch (expected ${runId}, list=${listRow.id}, detail=${detailRow.id})`
    );
  }

  const keys = [
    "runKind",
    "sourceModel",
    "id",
    "detailHref",
    "name",
    "status",
    "statusLabel",
    "startedAt",
    "completedAt",
    "summary",
    "summarySemantics",
    "summaryState",
    "progress",
    "progressState",
    "isTerminal",
    "provenance",
    "configDrift",
    "ingestionId",
    "sourceAdapter",
    "targetAdapter",
  ] as const;

  const violations: CanonicalConsistencyViolation[] = [];

  for (const key of keys) {
    const a = listRow[key];
    const b = detailRow[key];
    if (stableStringify(a) !== stableStringify(b)) {
      violations.push({ path: key, listValue: a, detailValue: b });
    }
  }

  if (violations.length > 0) {
    const detail = violations
      .map(
        (v) =>
          `${v.path}: list=${stableStringify(v.listValue)} detail=${stableStringify(v.detailValue)}`
      )
      .join("; ");
    throw new Error(`assertCanonicalConsistency failed for run ${runId}: ${detail}`);
  }
}
