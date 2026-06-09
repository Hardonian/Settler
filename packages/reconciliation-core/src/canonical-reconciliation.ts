/**
 * Canonical reconciliation run DTOs shared by Express v1 and Next console surfaces.
 * Built on top of {@link buildCanonicalRunResultContract} for recon_jobs + recon_results.
 */

import type {
  CanonicalRunSummary,
  RunProgressState,
  RunStatus,
  RunSummaryState,
} from "@settler/types";
import {
  buildCanonicalRunResultContract,
  extractProgressPercent,
  getRunProgressState,
  getRunStatusLabel,
  getRunSummaryState,
  normalizeRunStatus,
  type CanonicalConfigDrift,
  type ReconJobRecordLike,
  type ReconResultRecordLike,
} from "./canonical-run-result.js";

export type ReconciliationRunKind = "recon_job" | "ingestion_run";

export interface CanonicalReconciliationProvenance {
  sourceModel: "recon_jobs" | "recon_results";
  runKind: ReconciliationRunKind;
  /** Ingestion-scoped execution id when runKind === ingestion_run */
  ingestionId: string | null;
  /** Recon job id when runKind === recon_job */
  reconJobId: string | null;
}

export interface CanonicalReconciliationListItem {
  runKind: ReconciliationRunKind;
  id: string;
  tenantId: string;
  name: string;
  configDrift: CanonicalConfigDrift;
  /** Latest persisted recon_results row for recon_job runs; null for ingestion runs or jobs without results */
  reconResultId: string | null;
  lifecycle: {
    status: RunStatus;
    statusLabel: string;
    isTerminal: boolean;
    progressPercent: number;
    progressState: RunProgressState;
  };
  summaryState: RunSummaryState;
  summary: CanonicalRunSummary;
  provenance: CanonicalReconciliationProvenance;
  adapters: { sourceAdapter: string | null; targetAdapter: string | null };
  timestamps: {
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    updatedAt: string | null;
  };
}

export interface CanonicalReconciliationRunDetail extends CanonicalReconciliationListItem {
  errorMessage: string | null;
  traceId: string | null;
  metadata: Record<string, unknown>;
  latestResultId: string | null;
}

export function mapReconJobRowToCanonicalListItem(input: {
  job: {
    id: string;
    tenantId: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    sourceAdapter: string;
    targetAdapter: string;
    reconStrategy?: string | null;
    templateId?: string | null;
    validationRules?: unknown;
    sourceConfigEncrypted?: string;
    targetConfigEncrypted?: string;
  };
  latestResult: ReconResultRecordLike | null;
}): CanonicalReconciliationListItem {
  const contract = buildCanonicalRunResultContract({
    job: {
      id: input.job.id,
      tenantId: input.job.tenantId,
      name: input.job.name,
      status: input.job.status,
      created_at: input.job.createdAt.toISOString(),
      sourceAdapter: input.job.sourceAdapter,
      targetAdapter: input.job.targetAdapter,
      reconStrategy: input.job.reconStrategy ?? undefined,
      templateId: input.job.templateId ?? undefined,
      validationRules: input.job.validationRules,
      sourceConfigEncrypted: input.job.sourceConfigEncrypted,
      targetConfigEncrypted: input.job.targetConfigEncrypted,
    } as ReconJobRecordLike,
    result: input.latestResult,
  });

  return {
    runKind: "recon_job",
    id: input.job.id,
    tenantId: input.job.tenantId,
    name: contract.name,
    reconResultId: input.latestResult?.id ?? null,
    lifecycle: {
      status: contract.lifecycle.status,
      statusLabel: contract.lifecycle.statusLabel,
      isTerminal: contract.lifecycle.isTerminal,
      progressPercent: contract.lifecycle.progressPercent,
      progressState: contract.lifecycle.progressState,
    },
    summaryState: contract.summaryState,
    summary: contract.summary,
    provenance: {
      sourceModel: "recon_jobs",
      runKind: "recon_job",
      ingestionId: null,
      reconJobId: input.job.id,
    },
    adapters: {
      sourceAdapter: contract.provenance.sourceAdapter,
      targetAdapter: contract.provenance.targetAdapter,
    },
    timestamps: {
      createdAt: input.job.createdAt.toISOString(),
      startedAt: contract.provenance.executedAt,
      completedAt: contract.provenance.completedAt,
      updatedAt: input.job.updatedAt.toISOString(),
    },
    configDrift: contract.configDrift,
  };
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function mapIngestionReconciliationRunToCanonicalDetail(row: {
  id: string;
  tenantId: string;
  userId: string;
  ingestionId: string | null;
  name: string | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  sourceCount: number;
  targetCount: number;
  matchedCount: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  confidenceAvg: unknown;
  errorMessage: string | null;
  traceId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CanonicalReconciliationRunDetail {
  const status = normalizeRunStatus(row.status);
  const pseudoResult: ReconResultRecordLike = {
    id: `synthetic:ingestion:${row.id}`,
    status: row.status,
    started_at: row.startedAt.toISOString(),
    completed_at: row.completedAt?.toISOString() ?? null,
    source_count: row.sourceCount,
    target_count: row.targetCount,
    matched_count: row.matchedCount,
    unmatched_source_count: row.unmatchedSourceCount,
    unmatched_target_count: row.unmatchedTargetCount,
    conflict_count: 0,
    error_message: row.errorMessage,
    metadata: asObject(row.metadata) ?? {},
  };

  const progressPercent = extractProgressPercent(pseudoResult);
  const lifecycleStatus = normalizeRunStatus(row.status);
  const summary: CanonicalRunSummary = {
    total: row.sourceCount + row.targetCount,
    sourceCount: row.sourceCount,
    targetCount: row.targetCount,
    processed: row.matchedCount + row.unmatchedSourceCount + row.unmatchedTargetCount,
    matched: row.matchedCount,
    matchedWithTolerance: 0,
    unmatched: row.unmatchedSourceCount + row.unmatchedTargetCount,
    unmatchedSourceCount: row.unmatchedSourceCount,
    unmatchedTargetCount: row.unmatchedTargetCount,
    conflicts: 0,
    exceptioned: 0,
    unresolved: 0,
    ignored: 0,
    resolved: 0,
  };

  const summaryState = getRunSummaryState(lifecycleStatus, summary);
  const meta = asObject(row.metadata) ?? {};

  return {
    runKind: "ingestion_run",
    id: row.id,
    tenantId: row.tenantId,
    name:
      typeof row.name === "string" && row.name.trim()
        ? row.name
        : `Ingestion run ${row.id.slice(0, 8)}`,
    lifecycle: {
      status: lifecycleStatus,
      statusLabel: getRunStatusLabel(lifecycleStatus),
      isTerminal: lifecycleStatus === "completed" || lifecycleStatus === "failed",
      progressPercent,
      progressState: getRunProgressState(lifecycleStatus, progressPercent),
    },
    summaryState,
    summary,
    provenance: {
      sourceModel: "recon_results",
      runKind: "ingestion_run",
      ingestionId: row.ingestionId,
      reconJobId: null,
    },
    adapters: {
      sourceAdapter: typeof meta.sourceAdapter === "string" ? meta.sourceAdapter : null,
      targetAdapter: typeof meta.targetAdapter === "string" ? meta.targetAdapter : null,
    },
    timestamps: {
      createdAt: row.createdAt.toISOString(),
      startedAt: row.startedAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    },
    configDrift: {
      status: "none",
      strategyChanged: false,
      templateChanged: false,
      validationRulesChanged: false,
      adapter: {
        status: "none",
        comparisonMode: "unavailable",
        sourceChanged: null,
        targetChanged: null,
        sourceHashPresent: false,
        targetHashPresent: false,
      },
      notes: [],
    },
    errorMessage: row.errorMessage,
    traceId: row.traceId,
    metadata: meta,
    latestResultId: null,
    reconResultId: null,
  };
}

export function mapIngestionReconciliationRunToCanonicalListItem(row: {
  id: string;
  tenantId: string;
  userId: string;
  ingestionId: string | null;
  name: string | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  sourceCount: number;
  targetCount: number;
  matchedCount: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  confidenceAvg: unknown;
  errorMessage: string | null;
  traceId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CanonicalReconciliationListItem {
  const detail = mapIngestionReconciliationRunToCanonicalDetail(row);
  return {
    runKind: detail.runKind,
    id: detail.id,
    tenantId: detail.tenantId,
    name: detail.name,
    reconResultId: null,
    lifecycle: detail.lifecycle,
    summaryState: detail.summaryState,
    summary: detail.summary,
    provenance: detail.provenance,
    adapters: detail.adapters,
    timestamps: detail.timestamps,
    configDrift: detail.configDrift,
  };
}

export function mapReconJobRowToCanonicalDetail(input: {
  job: {
    id: string;
    tenantId: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    sourceAdapter: string;
    targetAdapter: string;
    reconStrategy?: string | null;
    templateId?: string | null;
    validationRules?: unknown;
    sourceConfigEncrypted?: string;
    targetConfigEncrypted?: string;
    metadata?: unknown;
  };
  latestResult: ReconResultRecordLike | null;
}): CanonicalReconciliationRunDetail {
  const list = mapReconJobRowToCanonicalListItem(input);
  const meta = asObject(input.job.metadata) ?? {};

  return {
    ...list,
    errorMessage: input.latestResult
      ? typeof input.latestResult.error_message === "string"
        ? input.latestResult.error_message
        : typeof input.latestResult.errorMessage === "string"
          ? input.latestResult.errorMessage
          : null
      : null,
    traceId: null,
    metadata: meta,
    latestResultId: input.latestResult?.id ?? null,
  };
}
