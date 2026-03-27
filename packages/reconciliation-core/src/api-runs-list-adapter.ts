/**
 * Maps {@link CanonicalReconciliationListItem} rows to the legacy console/API run list
 * projection (same shape historically returned by GET /api/runs for recon_jobs).
 */

import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import type { AdapterDriftSignal } from "./canonical-run-result.js";

function legacyAdapterDriftLabel(
  signal: AdapterDriftSignal
): "source" | "target" | "both" | "none" {
  if (signal.sourceChanged && signal.targetChanged) return "both";
  if (signal.sourceChanged) return "source";
  if (signal.targetChanged) return "target";
  return "none";
}

export type ApiRunsListLegacyItem = {
  runKind: "recon_job" | "ingestion_run";
  sourceModel: "recon_jobs" | "reconciliation_runs";
  id: string;
  detailHref: string;
  name: string;
  status: string;
  statusLabel: string;
  startedAt: string;
  completedAt: string | null;
  summary: {
    total: number;
    sourceCount: number;
    targetCount: number;
    matched: number;
    unmatched: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflicts: number;
  };
  summarySemantics: {
    processed: number;
    matchedWithTolerance: number;
    exceptioned: number;
    unresolved: number;
    ignored: number;
    resolved: number;
  };
  summaryState: string;
  progress: number;
  progressState: string;
  isTerminal: boolean;
  provenance: Record<string, unknown>;
  configDrift: {
    status: "none" | "detected" | "indeterminate";
    adapter: "source" | "target" | "both" | "none";
  };
  /** Ingestion-scoped execution id when runKind === ingestion_run */
  ingestionId: string | null;
  sourceAdapter: string | null;
  targetAdapter: string | null;
};

export function mapCanonicalListItemToApiRunsLegacyRow(
  r: CanonicalReconciliationListItem
): ApiRunsListLegacyItem {
  const startedAt = r.timestamps.startedAt ?? r.timestamps.createdAt ?? new Date().toISOString();
  return {
    runKind: r.runKind,
    sourceModel: r.provenance.sourceModel,
    id: r.id,
    detailHref: `/console/runs/${r.id}`,
    name: r.name,
    status: r.lifecycle.status,
    statusLabel: r.lifecycle.statusLabel,
    startedAt,
    completedAt: r.timestamps.completedAt,
    summary: {
      total: r.summary.total,
      sourceCount: r.summary.sourceCount,
      targetCount: r.summary.targetCount,
      matched: r.summary.matched,
      unmatched: r.summary.unmatched,
      unmatchedSourceCount: r.summary.unmatchedSourceCount,
      unmatchedTargetCount: r.summary.unmatchedTargetCount,
      conflicts: r.summary.conflicts,
    },
    summarySemantics: {
      processed: r.summary.processed,
      matchedWithTolerance: r.summary.matchedWithTolerance,
      exceptioned: r.summary.exceptioned,
      unresolved: r.summary.unresolved,
      ignored: r.summary.ignored,
      resolved: r.summary.resolved,
    },
    summaryState: r.summaryState,
    progress: r.lifecycle.progressPercent,
    progressState: r.lifecycle.progressState,
    isTerminal: r.lifecycle.isTerminal,
    provenance: {
      sourceModel: r.provenance.sourceModel,
      runKind: r.provenance.runKind,
      ingestionId: r.provenance.ingestionId,
      reconJobId: r.provenance.reconJobId,
      executedAt: startedAt,
      completedAt: r.timestamps.completedAt,
      sourceAdapter: r.adapters.sourceAdapter,
      targetAdapter: r.adapters.targetAdapter,
    },
    configDrift: {
      status: r.configDrift.status,
      adapter: legacyAdapterDriftLabel(r.configDrift.adapter),
    },
    ingestionId: r.provenance.ingestionId,
    sourceAdapter: r.adapters.sourceAdapter,
    targetAdapter: r.adapters.targetAdapter,
  };
}
