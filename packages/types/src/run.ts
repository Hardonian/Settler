/**
 * Canonical Run Types
 *
 * These types define the unified schema for reconciliation runs/executions.
 * Used across API, web, and worker packages.
 */

// =============================================================================
// Run Status Types
// =============================================================================

/**
 * Core run execution status - used in Run.status field
 */
export type RunStatus = "pending" | "running" | "completed" | "failed" | "unknown";

/**
 * Detailed run lifecycle status for display purposes
 */
export type RunSummaryState =
  | "success"
  | "review_needed"
  | "in_progress"
  | "failed"
  | "empty"
  | "unknown";

/**
 * Progress tracking state
 */
export type RunProgressState = "not_started" | "in_progress" | "completed" | "failed" | "unknown";

// =============================================================================
// Run Summary Types
// =============================================================================

/**
 * Basic run summary with counts
 */
export interface RunSummary {
  totalItems: number;
  matched: number;
  missing: number;
  drift: number;
  mismatched: number;
}

/**
 * Extended run summary with detailed breakdown
 */
export interface CanonicalRunSummary {
  total: number;
  sourceCount: number;
  targetCount: number;
  processed: number;
  matched: number;
  matchedWithTolerance: number;
  unmatched: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflicts: number;
  exceptioned: number;
  unresolved: number;
  ignored: number;
  resolved: number;
}

/**
 * Exception counts for a run
 */
export interface RunExceptionCounts {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  ignored: number;
  unresolved: number;
}

// =============================================================================
// Run Provenance Types
// =============================================================================

/**
 * Run provenance information
 */
export interface RunProvenance {
  runId: string;
  runResultId: string | null;
  snapshotId: string | null;
  inputHash: string | null;
  executedAt: string | null;
  completedAt: string | null;
  configSource: string | null;
  configVersion: string | null;
  templateId: string | null;
  matchingRuleIds: string[];
  ruleVersionCount: number;
  sourceAdapter: string | null;
  targetAdapter: string | null;
  sourceReference: string;
}

// =============================================================================
// Main Run Types
// =============================================================================

/**
 * Core Run interface - canonical representation of a reconciliation run
 */
export interface Run {
  id: string;
  name: string;
  status: RunStatus;
  statusLabel?: string;
  startedAt: string;
  completedAt: string | null;
  summary?: RunSummary;
  summaryState?: RunSummaryState;
  progress?: number;
  progressState?: RunProgressState;
  isTerminal?: boolean;
}

/**
 * Extended run with full lifecycle details
 */
export interface RunWithLifecycle extends Run {
  lifecycle: {
    status: RunStatus;
    statusLabel: string;
    isTerminal: boolean;
    progressPercent: number;
    progressState: RunProgressState;
  };
  provenance: RunProvenance;
  exceptions: RunExceptionCounts;
}

/**
 * Run list item for list views
 */
export interface RunListItem {
  run_id: string;
  created_at: string;
  status: RunStatus;
  status_label: string;
  policy: string;
  manual?: boolean;
  matched_records?: number;
  confidence?: number;
}

/**
 * Run detail response
 */
export interface RunDetail {
  id: string;
  status: RunStatus;
  status_label: string;
  summary_state: RunSummaryState;
  progress_state: RunProgressState;
  is_terminal: boolean;
  progress_percent: number;
  summary: CanonicalRunSummary | null;
  metadata: Record<string, unknown>;
  policy: { id: string; hash: string };
  fingerprint: string | null;
  created_at: string;
  tenant_id: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Paginated run list response
 */
export interface RunListResponse {
  data: Run[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * v1 API run response format
 * @deprecated Use RunListResponse instead
 */
export interface RunListResponseV1 {
  rows: RunV1Item[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  timestamp: string;
}

/**
 * Individual run item in v1 format
 * @deprecated
 */
export interface RunV1Item {
  run_id: string;
  created_at: string;
  status: string;
  policy: string;
  total_records: number;
  matched: number;
  unmatched: number;
  unmatchedSourceCount?: number;
  unmatchedTargetCount?: number;
}
