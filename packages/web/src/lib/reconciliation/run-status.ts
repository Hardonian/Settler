export type CanonicalRunStatus = "pending" | "running" | "completed" | "failed" | "unknown";
export type RunSummaryState =
  | "success"
  | "review_needed"
  | "in_progress"
  | "failed"
  | "empty"
  | "unknown";
export type RunProgressState = "not_started" | "in_progress" | "completed" | "failed" | "unknown";

export interface RunSummary {
  total: number;
  matched: number;
  unmatched: number;
  conflicts: number;
}

export interface CanonicalRunTruth {
  status: CanonicalRunStatus;
  statusLabel: string;
  summary: RunSummary;
  summaryState: RunSummaryState;
  progressPercent: number;
  progressState: RunProgressState;
  isTerminal: boolean;
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
  metadata?: Record<string, unknown> | null;
}

export interface ReconAuditRow {
  id: string;
  audit_type: string | null;
  action: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

const STATUS_ALIAS_TO_CANONICAL: Record<string, CanonicalRunStatus> = {
  pending: "pending",
  queued: "pending",
  created: "pending",
  active: "pending",
  running: "running",
  processing: "running",
  ingesting: "running",
  validating: "running",
  reconciling: "running",
  in_progress: "running",
  completed: "completed",
  succeeded: "completed",
  success: "completed",
  approved: "completed",
  failed: "failed",
  error: "failed",
  dead: "failed",
  cancelled: "failed",
  canceled: "failed",
};

export function normalizeRunStatus(raw: string | null | undefined): CanonicalRunStatus {
  if (!raw) return "unknown";
  const value = raw.trim().toLowerCase();
  return STATUS_ALIAS_TO_CANONICAL[value] || "unknown";
}

export function deriveRunStatus(
  jobStatus: string | null,
  resultStatus: string | null
): CanonicalRunStatus {
  const normalizedResult = normalizeRunStatus(resultStatus);
  if (normalizedResult !== "unknown") {
    return normalizedResult;
  }
  return normalizeRunStatus(jobStatus);
}

function asNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function buildRunSummary(result: ReconResultRow | null): {
  total: number;
  matched: number;
  unmatched: number;
  conflicts: number;
} {
  const source = asNumber(result?.source_count);
  const target = asNumber(result?.target_count);
  const matched = asNumber(result?.matched_count);
  const unmatchedSource = asNumber(result?.unmatched_source_count);
  const unmatchedTarget = asNumber(result?.unmatched_target_count);
  const conflicts = asNumber(result?.conflict_count);

  return {
    total: source + target,
    matched,
    unmatched: unmatchedSource + unmatchedTarget,
    conflicts,
  };
}

export function extractProgressPercent(result: ReconResultRow | null): number {
  const metadata = result?.metadata;
  const progress = metadata && typeof metadata === "object" ? metadata.progress : null;
  if (progress && typeof progress === "object") {
    const rawPercentage = (progress as { percentage?: unknown }).percentage;
    if (typeof rawPercentage === "number" && Number.isFinite(rawPercentage)) {
      return Math.min(100, Math.max(0, rawPercentage));
    }
  }

  const status = normalizeRunStatus(result?.status);
  const source = asNumber(result?.source_count);
  const target = asNumber(result?.target_count);
  const matched = asNumber(result?.matched_count);
  const unmatchedSource = asNumber(result?.unmatched_source_count);
  const unmatchedTarget = asNumber(result?.unmatched_target_count);
  const conflicts = asNumber(result?.conflict_count);
  const total = source + target;
  const resolved = matched + unmatchedSource + unmatchedTarget + conflicts;

  if (total > 0 && (status === "running" || status === "pending")) {
    return Math.min(100, Math.max(0, Math.round((resolved / total) * 100)));
  }

  if (status === "completed") return 100;
  if (status === "failed") return 100;
  if (status === "running") return 50;
  return 0;
}

export function getCanonicalRunStatus(
  jobStatus: string | null | undefined,
  resultStatus: string | null | undefined
): CanonicalRunStatus {
  return deriveRunStatus(jobStatus ?? null, resultStatus ?? null);
}

export function getRunStatusLabel(status: CanonicalRunStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

export function isTerminalRunState(status: CanonicalRunStatus): boolean {
  return status === "completed" || status === "failed";
}

export function getRunSummaryState(
  status: CanonicalRunStatus,
  summary: RunSummary
): RunSummaryState {
  if (status === "failed") {
    return "failed";
  }

  if (status === "pending" || status === "running") {
    return "in_progress";
  }

  if (status === "completed") {
    if (summary.total <= 0) {
      return "empty";
    }
    if (summary.unmatched > 0 || summary.conflicts > 0) {
      return "review_needed";
    }
    return "success";
  }

  return "unknown";
}

export function getRunProgressState(
  status: CanonicalRunStatus,
  progressPercent: number
): RunProgressState {
  if (status === "failed") {
    return "failed";
  }
  if (status === "completed") {
    return "completed";
  }
  if ((status === "pending" || status === "running") && progressPercent <= 0) {
    return "not_started";
  }
  if (status === "pending" || status === "running") {
    return "in_progress";
  }
  return "unknown";
}

export function buildCanonicalRunTruth(
  jobStatus: string | null | undefined,
  result: ReconResultRow | null
): CanonicalRunTruth {
  const status = getCanonicalRunStatus(jobStatus, result?.status);
  const summary = buildRunSummary(result);
  const progressPercent = extractProgressPercent(result);
  return {
    status,
    statusLabel: getRunStatusLabel(status),
    summary,
    summaryState: getRunSummaryState(status, summary),
    progressPercent,
    progressState: getRunProgressState(status, progressPercent),
    isTerminal: isTerminalRunState(status),
  };
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
