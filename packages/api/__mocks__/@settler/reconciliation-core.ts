/**
 * Manual mock: shared across all API tests (avoids parallel worker mock factory races).
 */

export const decodeMergedRunsCursor = jest.fn();
export const encodeMergedRunsCursor = jest.fn((cursor: unknown) => JSON.stringify(cursor));
export const fetchMergedReconciliationRunsPage = jest.fn();

export const mapCanonicalListItemToApiRunsLegacyRow = jest.fn((row: any) => ({
  runKind: row.runKind,
  sourceModel: row.provenance.sourceModel,
  id: row.id,
  detailHref: `/console/runs/${row.id}`,
  name: row.name,
  status: row.lifecycle.status,
  statusLabel: row.lifecycle.statusLabel,
  startedAt: row.timestamps.startedAt ?? row.timestamps.createdAt,
  completedAt: row.timestamps.completedAt,
  summary: {
    total: row.summary.total,
    sourceCount: row.summary.sourceCount,
    targetCount: row.summary.targetCount,
    matched: row.summary.matched,
    unmatched: row.summary.unmatched,
    unmatchedSourceCount: row.summary.unmatchedSourceCount,
    unmatchedTargetCount: row.summary.unmatchedTargetCount,
    conflicts: row.summary.conflicts,
  },
  summarySemantics: {
    processed: row.summary.processed,
    matchedWithTolerance: row.summary.matchedWithTolerance,
    exceptioned: row.summary.exceptioned,
    unresolved: row.summary.unresolved,
    ignored: row.summary.ignored,
    resolved: row.summary.resolved,
  },
  summaryState: row.summaryState,
  progress: row.lifecycle.progressPercent,
  progressState: row.lifecycle.progressState,
  isTerminal: row.lifecycle.isTerminal,
  provenance: row.provenance,
  configDrift: {
    status: row.configDrift.status,
    adapter: "none",
  },
  ingestionId: row.provenance.ingestionId,
  sourceAdapter: row.adapters.sourceAdapter,
  targetAdapter: row.adapters.targetAdapter,
}));

export class MergedRunsCursorError extends Error {}

export const scanMergedRunsForLegacyPage = jest.fn();
export const resolveOperatorRunDetailForTenants = jest.fn();
export const buildRunProofpackIndexByRunId = jest.fn().mockResolvedValue(new Map());
export const toRunCompactProofSummary = jest.fn((value: unknown) => value);
