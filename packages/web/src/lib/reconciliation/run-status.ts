import {
  buildCanonicalRunResultContract,
  buildLegacyRunSummary,
  deriveRunStatus,
  extractProgressPercent,
  getRunProgressState,
  getRunStatusLabel,
  getRunSummaryState,
  isTerminalRunState,
  normalizeRunStatus,
  toLegacyRunTruth,
  toStageRows as toStageRowsFromCore,
  type CanonicalRunStatus,
  type CanonicalRunTruth,
  type ReconAuditRow as ReconAuditRowCore,
  type RunProgressState,
  type RunSummaryState,
} from "@settler/reconciliation-core";

export type { CanonicalRunStatus, RunSummaryState, RunProgressState, CanonicalRunTruth };

export interface RunSummary {
  total: number;
  sourceCount: number;
  targetCount: number;
  // Canonical contract fields
  processed?: number;
  matched: number;
  matchedWithTolerance?: number;
  unmatched: number;
  mismatched?: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflicts: number;
  // Extended fields from canonical
  exceptioned?: number;
  unresolved?: number;
  resolved?: number;
  ignored?: number;
}

export interface ReconResultRow {
  id: string;
  recon_job_id: string;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  source_count: number | null;
  target_count: number | null;
  matched_count: number | null;
  unmatched_source_count: number | null;
  unmatched_target_count: number | null;
  conflict_count: number | null;
  error_message?: string | null;
  summary?: unknown;
  metadata?: Record<string, unknown> | null;
  input_hash?: string | null;
  snapshot_id?: string | null;
}

export type ReconAuditRow = ReconAuditRowCore;

export {
  normalizeRunStatus,
  deriveRunStatus,
  extractProgressPercent,
  getRunStatusLabel,
  isTerminalRunState,
  getRunSummaryState,
  getRunProgressState,
};

export function buildRunSummary(result: ReconResultRow | null): RunSummary {
  return buildLegacyRunSummary(result);
}

export function buildCanonicalRunTruth(
  jobStatus: string | null | undefined,
  result: ReconResultRow | null
): CanonicalRunTruth {
  return toLegacyRunTruth(
    buildCanonicalRunResultContract({
      job: {
        id: result?.recon_job_id || "run",
        status: jobStatus ?? null,
      },
      result,
    })
  );
}

export function toStageRows(audits: ReconAuditRow[]): Array<{
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  error?: string;
}> {
  return toStageRowsFromCore(audits);
}
