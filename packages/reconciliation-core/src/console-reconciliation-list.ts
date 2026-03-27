/**
 * Shared JSON body for Next `GET /api/console/reconciliation` list (no `id` query).
 * Keeps Express merged pagination and console legacy projection aligned.
 */

import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import type { MergedReconciliationListResponse } from "./merged-runs-query.js";

export type ConsoleReconciliationRunKindParam = "all" | "recon_job" | "ingestion_run";

function toLegacyReconciliation(r: CanonicalReconciliationListItem) {
  return {
    id: r.id,
    name: r.name,
    status: r.lifecycle.status,
    sourceAdapter: r.adapters.sourceAdapter ?? "",
    targetAdapter: r.adapters.targetAdapter ?? "",
    createdAt: r.timestamps.createdAt,
    updatedAt: r.timestamps.updatedAt,
    latestResult: r.reconResultId
      ? {
          id: r.reconResultId,
          status: r.lifecycle.status,
          startedAt: r.timestamps.startedAt ?? r.timestamps.createdAt,
          completedAt: r.timestamps.completedAt,
          counts: {
            source: r.summary.sourceCount,
            target: r.summary.targetCount,
            matched: r.summary.matched,
            unmatchedSource: r.summary.unmatchedSourceCount,
            unmatchedTarget: r.summary.unmatchedTargetCount,
            conflicts: r.summary.conflicts,
          },
          errorMessage: null,
        }
      : null,
  };
}

/**
 * @param page — result of {@link fetchMergedReconciliationRunsPage}
 * @param runKind — validated `run_kind` query (`all` default in Next route)
 */
export function buildConsoleReconciliationListBody(
  page: MergedReconciliationListResponse,
  runKind: ConsoleReconciliationRunKindParam
): Record<string, unknown> {
  const runs = page.runs.map((r) => ({
    ...r,
    sourceModel: r.provenance.sourceModel,
    detailHref: `/console/runs/${r.id}`,
  }));
  const reconciliations =
    runKind === "ingestion_run"
      ? []
      : runs.filter((r) => r.runKind === "recon_job").map(toLegacyReconciliation);

  const body: Record<string, unknown> = {
    contract_version: 1,
    runs,
    next_cursor: page.next_cursor,
    pagination: page.pagination,
    response_meta: {
      ...page.response_meta,
      default_run_kind: "all",
      requested_run_kind: runKind,
      legacy_reconciliations_field_scope: "recon_job_only",
    },
  };

  body.reconciliations = reconciliations;
  return body;
}
