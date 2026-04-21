/**
 * Canonical operator run detail serializer for GET /api/runs/[id].
 *
 * Full detail resolution (tenant-scoped resolve → enrich → serialize) is implemented
 * in `operator-run-detail-resolve.ts` (`resolveOperatorRunDetailForTenants`).
 *
 * `runs` is the canonical operator surface. Any legacy `reconciliations` payload
 * remains compatibility scope only and must not become the source of truth.
 */

import type { RunStatus } from "@settler/types";
import type { CanonicalReconciliationRunDetail } from "./canonical-reconciliation.js";
import {
  resolveRunCompactProofSummary,
  type RunCompactProofSummary,
  type RunProofpackIndex,
} from "./run-proofpack-index.js";
import type { ApiRunsListLegacyItem } from "./api-runs-list-adapter.js";
import {
  buildRunProvenanceProjection,
  buildRunSummaryProjection,
  buildRunSummarySemanticsProjection,
  legacyAdapterDriftLabel,
} from "./run-surface-shaping.js";

type OperatorSummary = {
  total: number;
  sourceCount: number;
  targetCount: number;
  matched: number;
  unmatched: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflicts: number;
};

type OperatorSummarySemantics = {
  processed: number;
  matchedWithTolerance: number;
  exceptioned: number;
  unresolved: number;
  ignored: number;
  resolved: number;
};

type OperatorResultComparison = {
  previousResultId: string;
  previousResultStartedAt: string | null;
  deltaMatched: number;
  deltaUnmatched: number;
  deltaConflicts: number;
  snapshotChanged: boolean;
  inputHashChanged: boolean;
} | null;

type OperatorResultContext = {
  latestResultId: string | null;
  latestResultStatus: string | null;
  latestResultStartedAt: string | null;
  latestResultCompletedAt: string | null;
  persistedResultCount: number;
  comparison: OperatorResultComparison;
  note?: string;
};

type OperatorExceptions = {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  ignored: number;
  reviewRequired: number;
};

type OperatorRunConfig = {
  sourceAdapter: string | null;
  targetAdapter: string | null;
  reconStrategy: string | null;
  templateId: string | null;
  validationRuleCount: number;
  validationRuleLabels: string[];
  ruleVersionCount: number;
  ruleVersionLabels: string[];
  snapshotId: string | null;
  inputHash: string | null;
  configSource: "snapshot" | "job_definition";
  configCapturedAt: string | null;
  definitionDriftDetected: boolean;
  definitionDriftNotes: string[];
  summaryBasis: string;
};

type OperatorKindDetail =
  | {
      kind: "recon_job";
      reconJob: {
        rowRationale: { available: boolean; rowCount: number; codes: string[] };
      };
    }
  | {
      kind: "ingestion_run";
      ingestionRun: {
        exceptionWorkflowNote: string;
      };
    };

/** Audit-derived or synthetic stage rows emitted with operator run detail JSON */
export interface OperatorRunStageRow {
  id: string;
  name: string;
  /** Subset of {@link RunStatus} used for stage lifecycle in operator UI */
  status: Extract<RunStatus, "pending" | "running" | "completed" | "failed">;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface OperatorRunDetailBase {
  runKind: "recon_job" | "ingestion_run";
  sourceModel: "recon_jobs" | "reconciliation_runs";
  id: string;
  detailHref: string;
  name: string;
  /** Normalized lifecycle status (same contract as canonical reconciliation lifecycle) */
  status: RunStatus;
  statusLabel: string;
  isTerminal: boolean;
  progress: number;
  progressState: string;
  startedAt: string;
  completedAt: string | null;
  error?: string;
  summary: OperatorSummary;
  summarySemantics: OperatorSummarySemantics;
  summaryState: string;
  summaryMath: {
    sourceCount: number;
    targetCount: number;
    matchedCount: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflictCount: number;
    note: string;
  };
  provenance: {
    sourceModel: "recon_jobs" | "reconciliation_runs";
    runKind: "recon_job" | "ingestion_run";
    ingestionId: string | null;
    reconJobId: string | null;
    executedAt: string;
    completedAt: string | null;
    sourceAdapter: string | null;
    targetAdapter: string | null;
  };
  resultContext: OperatorResultContext;
  config: OperatorRunConfig;
  configDrift: {
    status: "none" | "detected" | "indeterminate";
    adapter: "source" | "target" | "both" | "none";
  };
  exceptions: OperatorExceptions;
  rowRationale: { available: boolean; rowCount: number; codes: string[] };
  rowResultsPreview: unknown[];
  stages: OperatorRunStageRow[];
  metadata?: Record<string, unknown>;
  traceId?: string | null;
  exceptionWorkflowNote?: string;
  runDelta?: {
    inputChanged: boolean;
    matchedDelta: number;
    unmatchedDelta: number;
    exceptionDelta: number;
    configDriftDetected: boolean;
    newExceptionPatterns: string[];
    resolvedPatterns: string[];
    confidenceDelta: number | null;
  } | null;
  proofpackIndex?: RunProofpackIndex;
  compactProofSummary: RunCompactProofSummary;
  kindDetail: OperatorKindDetail;
}

export type OperatorRunDetail = OperatorRunDetailBase;

/**
 * Same legacy list row contract as {@link mapCanonicalListItemToApiRunsLegacyRow} — use with
 * {@link assertCanonicalConsistency} to prove list vs detail alignment for a run id.
 */
export function operatorRunDetailToApiRunsLegacyRow(d: OperatorRunDetail): ApiRunsListLegacyItem {
  return {
    runKind: d.runKind,
    sourceModel: d.sourceModel,
    id: d.id,
    detailHref: d.detailHref,
    name: d.name,
    status: d.status,
    statusLabel: d.statusLabel,
    startedAt: d.startedAt,
    completedAt: d.completedAt,
    summary: d.summary,
    summarySemantics: d.summarySemantics,
    summaryState: d.summaryState,
    progress: d.progress,
    progressState: d.progressState,
    isTerminal: d.isTerminal,
    provenance: d.provenance,
    configDrift: d.configDrift,
    ingestionId: d.provenance.ingestionId,
    sourceAdapter: d.provenance.sourceAdapter,
    targetAdapter: d.provenance.targetAdapter,
  };
}

function buildCompactProofSummaryForRunDetail(
  runKind: OperatorRunDetail["runKind"],
  proofpackIndex?: RunProofpackIndex
): RunCompactProofSummary {
  return resolveRunCompactProofSummary({ runKind, proofpackIndex }).compactProofSummary;
}

function baseFromCanonical(
  detail: CanonicalReconciliationRunDetail,
  startedAt: string,
  completedAt: string | null
) {
  return {
    runKind: detail.runKind,
    sourceModel: detail.provenance.sourceModel,
    id: detail.id,
    detailHref: `/console/runs/${detail.id}`,
    name: detail.name,
    status: detail.lifecycle.status,
    statusLabel: detail.lifecycle.statusLabel,
    isTerminal: detail.lifecycle.isTerminal,
    progress: detail.lifecycle.progressPercent,
    progressState: detail.lifecycle.progressState,
    startedAt,
    completedAt,
    summary: buildRunSummaryProjection(detail.summary),
    summarySemantics: buildRunSummarySemanticsProjection(detail.summary),
    summaryState: detail.summaryState,
    provenance: buildRunProvenanceProjection(detail, startedAt, completedAt),
    configDrift: {
      status: detail.configDrift.status,
      adapter: legacyAdapterDriftLabel(detail.configDrift.adapter),
    },
  };
}

export function buildOperatorIngestionRunDetailJson(input: {
  detail: CanonicalReconciliationRunDetail;
  stages: OperatorRunStageRow[];
  proofpackIndex?: RunProofpackIndex;
}): OperatorRunDetail {
  const startedAt = input.detail.timestamps.startedAt ?? input.detail.timestamps.createdAt;
  const completedAt = input.detail.timestamps.completedAt;
  const base = baseFromCanonical(input.detail, startedAt, completedAt);

  const payload: OperatorRunDetail = {
    ...base,
    ...(input.detail.errorMessage ? { error: input.detail.errorMessage } : {}),
    summaryMath: {
      sourceCount: input.detail.summary.sourceCount,
      targetCount: input.detail.summary.targetCount,
      matchedCount: input.detail.summary.matched,
      unmatchedSourceCount: input.detail.summary.unmatchedSourceCount,
      unmatchedTargetCount: input.detail.summary.unmatchedTargetCount,
      conflictCount: input.detail.summary.conflicts,
      note: "Ingestion-backed run: counts come from reconciliation_runs; exception workflow and snapshot-backed config apply to recon job runs only.",
    },
    resultContext: {
      latestResultId: null,
      latestResultStatus: input.detail.lifecycle.status,
      latestResultStartedAt: startedAt,
      latestResultCompletedAt: completedAt,
      persistedResultCount: 0,
      comparison: null,
      note: "This run is stored in reconciliation_runs (ingestion path), not recon_jobs + recon_results.",
    },
    config: {
      sourceAdapter: input.detail.adapters.sourceAdapter,
      targetAdapter: input.detail.adapters.targetAdapter,
      reconStrategy: null,
      templateId: null,
      validationRuleCount: 0,
      validationRuleLabels: [],
      ruleVersionCount: 0,
      ruleVersionLabels: [],
      snapshotId: null,
      inputHash: null,
      configSource: "job_definition",
      configCapturedAt: null,
      definitionDriftDetected: false,
      definitionDriftNotes: [],
      summaryBasis: "Ingestion run row only; no job snapshot.",
    },
    exceptions: {
      total: 0,
      pending: 0,
      investigating: 0,
      resolved: 0,
      ignored: 0,
      reviewRequired: 0,
    },
    exceptionWorkflowNote:
      "Drift events are keyed to recon_job_id today; ingestion-backed runs may not appear in exception lists filtered by this run id.",
    rowRationale: { available: false, rowCount: 0, codes: [] },
    rowResultsPreview: [],
    stages: input.stages,
    metadata: input.detail.metadata,
    traceId: input.detail.traceId,
    proofpackIndex: input.proofpackIndex,
    compactProofSummary: buildCompactProofSummaryForRunDetail(
      input.detail.runKind,
      input.proofpackIndex
    ),
    kindDetail: {
      kind: "ingestion_run",
      ingestionRun: {
        exceptionWorkflowNote:
          "Drift events are keyed to recon_job_id today; ingestion-backed runs may not appear in exception lists filtered by this run id.",
      },
    },
  };

  return payload;
}

export function buildOperatorReconRunDetailJson(input: {
  detail: CanonicalReconciliationRunDetail;
  status: RunStatus;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  summaryMathNote: string;
  resultContext: OperatorResultContext;
  config: OperatorRunConfig;
  exceptions: OperatorExceptions;
  rowRationaleCodes: string[];
  rowResultsPreview: unknown[];
  stages: OperatorRunStageRow[];
  proofpackIndex?: RunProofpackIndex;
  runDelta?: OperatorRunDetail["runDelta"];
}): OperatorRunDetail {
  const base = baseFromCanonical(input.detail, input.startedAt, input.completedAt);

  return {
    ...base,
    ...(input.errorMessage ? { error: input.errorMessage } : {}),
    status: input.status,
    summaryMath: {
      sourceCount: input.detail.summary.sourceCount,
      targetCount: input.detail.summary.targetCount,
      matchedCount: input.detail.summary.matched,
      unmatchedSourceCount: input.detail.summary.unmatchedSourceCount,
      unmatchedTargetCount: input.detail.summary.unmatchedTargetCount,
      conflictCount: input.detail.summary.conflicts,
      note: input.summaryMathNote,
    },
    resultContext: input.resultContext,
    config: input.config,
    exceptions: input.exceptions,
    rowRationale: {
      available: input.rowResultsPreview.length > 0,
      rowCount: input.rowResultsPreview.length,
      codes: input.rowRationaleCodes,
    },
    rowResultsPreview: input.rowResultsPreview,
    stages: input.stages,
    metadata: input.detail.metadata,
    traceId: input.detail.traceId,
    proofpackIndex: input.proofpackIndex,
    compactProofSummary: buildCompactProofSummaryForRunDetail(
      input.detail.runKind,
      input.proofpackIndex
    ),
    runDelta: input.runDelta,
    kindDetail: {
      kind: "recon_job",
      reconJob: {
        rowRationale: {
          available: input.rowResultsPreview.length > 0,
          rowCount: input.rowResultsPreview.length,
          codes: input.rowRationaleCodes,
        },
      },
    },
  };
}
