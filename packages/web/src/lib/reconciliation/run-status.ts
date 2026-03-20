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
  type CanonicalRunStatus,
  type CanonicalRunTruth,
  type RunProgressState,
  type RunSummaryState,
} from "@/lib/reconciliation/canonical-run-result";

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

export interface ReconJobRow {
  id: string;
  name: string | null;
  status: string | null;
  created_at: string;
  updated_at?: string | null;
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

export interface ReconAuditRow {
  id: string;
  audit_type: string | null;
  action: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export {
  normalizeRunStatus,
  deriveRunStatus,
  extractProgressPercent,
  getRunStatusLabel,
  isTerminalRunState,
  getRunSummaryState,
  getRunProgressState,
};

export function getCanonicalRunStatus(
  jobStatus: string | null | undefined,
  resultStatus: string | null | undefined
): CanonicalRunStatus {
  return deriveRunStatus(jobStatus, resultStatus);
}

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
  return audits.map((audit) => {
    const auditType = audit.audit_type ?? "event";
    const action = (audit.action ?? "").toLowerCase();
    const metadata = audit.metadata ?? {};
    const error =
      typeof metadata.error === "string"
        ? metadata.error
        : typeof metadata.errorMessage === "string"
          ? metadata.errorMessage
          : undefined;

    let status: "pending" | "running" | "completed" | "failed" = "pending";
    if (auditType.includes("failed") || action === "failed" || Boolean(error)) {
      status = "failed";
    } else if (auditType.includes("start") || action === "start" || action === "execute") {
      status = "running";
    } else if (
      auditType.includes("completed") ||
      auditType.includes("approved") ||
      action === "complete" ||
      action === "completed"
    ) {
      status = "completed";
    }

    return {
      id: audit.id,
      name: auditType.replaceAll("_", " "),
      status,
      startedAt: status === "running" ? audit.created_at : undefined,
      completedAt: status === "completed" || status === "failed" ? audit.created_at : undefined,
      ...(error ? { error } : {}),
    };
  });
}
