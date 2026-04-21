/**
 * Shared field shaping for operator/API run surfaces.
 * List rows (GET /api/runs) and run detail base (GET /api/runs/[id]) must use the same summary
 * and drift projections — {@link mapCanonicalListItemToApiRunsLegacyRow} and
 * {@link operatorRunDetailToApiRunsLegacyRow} stay aligned via these helpers.
 */

import type { CanonicalRunSummary } from "@settler/types";
import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import type { AdapterDriftSignal } from "./canonical-run-result.js";

export function legacyAdapterDriftLabel(
  signal: AdapterDriftSignal
): "source" | "target" | "both" | "none" {
  if (signal.sourceChanged && signal.targetChanged) return "both";
  if (signal.sourceChanged) return "source";
  if (signal.targetChanged) return "target";
  return "none";
}

export function buildRunSummaryProjection(summary: CanonicalRunSummary) {
  return {
    total: summary.total,
    sourceCount: summary.sourceCount,
    targetCount: summary.targetCount,
    matched: summary.matched,
    unmatched: summary.unmatched,
    unmatchedSourceCount: summary.unmatchedSourceCount,
    unmatchedTargetCount: summary.unmatchedTargetCount,
    conflicts: summary.conflicts,
  };
}

export function buildRunSummarySemanticsProjection(summary: CanonicalRunSummary) {
  return {
    processed: summary.processed,
    matchedWithTolerance: summary.matchedWithTolerance,
    exceptioned: summary.exceptioned,
    unresolved: summary.unresolved,
    ignored: summary.ignored,
    resolved: summary.resolved,
  };
}

export function buildRunProvenanceProjection(
  r: CanonicalReconciliationListItem,
  startedAt: string,
  completedAt: string | null
) {
  return {
    sourceModel: r.provenance.sourceModel,
    runKind: r.provenance.runKind,
    ingestionId: r.provenance.ingestionId,
    reconJobId: r.provenance.reconJobId,
    executedAt: startedAt,
    completedAt,
    sourceAdapter: r.adapters.sourceAdapter,
    targetAdapter: r.adapters.targetAdapter,
  };
}
