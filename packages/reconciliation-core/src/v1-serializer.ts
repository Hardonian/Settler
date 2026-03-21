/**
 * Express `/api/v1/reconciliation` JSON shape: canonical first, legacy field names in `legacy_v1`.
 */

import type { CanonicalReconciliationRunDetail } from "./canonical-reconciliation.js";

export function serializeV1ReconciliationRunDetail(
  detail: CanonicalReconciliationRunDetail
): Record<string, unknown> {
  const legacy =
    detail.runKind === "ingestion_run"
      ? {
          id: detail.id,
          ingestionId: detail.provenance.ingestionId,
          status: detail.lifecycle.status,
          startedAt: detail.timestamps.startedAt,
          completedAt: detail.timestamps.completedAt,
          sourceCount: detail.summary.sourceCount,
          targetCount: detail.summary.targetCount,
          matchedCount: detail.summary.matched,
          unmatchedSourceCount: detail.summary.unmatchedSourceCount,
          unmatchedTargetCount: detail.summary.unmatchedTargetCount,
          confidenceAvg: null,
          errorMessage: detail.errorMessage,
          traceId: detail.traceId,
          metadata: detail.metadata,
        }
      : {
          id: detail.id,
          ingestionId: null,
          status: detail.lifecycle.status,
          startedAt: detail.timestamps.startedAt,
          completedAt: detail.timestamps.completedAt,
          sourceCount: detail.summary.sourceCount,
          targetCount: detail.summary.targetCount,
          matchedCount: detail.summary.matched,
          unmatchedSourceCount: detail.summary.unmatchedSourceCount,
          unmatchedTargetCount: detail.summary.unmatchedTargetCount,
          confidenceAvg: null,
          errorMessage: detail.errorMessage,
          traceId: detail.traceId,
          metadata: detail.metadata,
        };

  return {
    contract_version: 1,
    run_kind: detail.runKind,
    canonical: detail,
    legacy_v1: legacy,
  };
}
