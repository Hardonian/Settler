/**
 * Prisma fetch helpers for merged reconciliation list pagination.
 */

import {
  mapIngestionReconciliationRunToCanonicalListItem,
  mapReconJobRowToCanonicalListItem,
  type CanonicalReconciliationListItem,
} from "./canonical-reconciliation.js";
import type { MergedRunsCursorV1 } from "./merged-list-pagination.js";
import type { ReconResultRecordLike } from "./canonical-run-result.js";
import { mergeDualStreamPage, type MergeCandidate } from "./merged-list-pagination.js";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";

export type ReconciliationRunKindFilter = "all" | "recon_job" | "ingestion_run";

export interface MergedReconciliationListResponse {
  runs: CanonicalReconciliationListItem[];
  next_cursor: string | null;
  pagination: {
    limit: number;
    returned: number;
    has_more: boolean;
    job_stream_has_more: boolean;
    ingestion_stream_has_more: boolean;
    job_stream_exhausted: boolean;
    ingestion_stream_exhausted: boolean;
  };
  response_meta: {
    contract_version: 1;
    included_run_kinds: Array<"recon_job" | "ingestion_run">;
    ordering: string;
    consistency: "read_committed";
  };
}

function sortTimeMsForIngestionRow(row: { startedAt: Date; createdAt: Date }): number {
  return Math.max(row.startedAt.getTime(), row.createdAt.getTime());
}

type IngestionRunRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  ingestion_id: string | null;
  name: string | null;
  status: string;
  started_at: Date;
  completed_at: Date | null;
  source_count: number;
  target_count: number;
  matched_count: number;
  unmatched_source_count: number;
  unmatched_target_count: number;
  confidence_avg: unknown;
  error_message: string | null;
  trace_id: string | null;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
};

async function fetchIngestionRunsPage(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  cursor: { t: string; id: string } | null | undefined,
  take: number
): Promise<IngestionRunRow[]> {
  if (!cursor) {
    const rows = await prisma.$queryRaw`
      SELECT
        id,
        tenant_id,
        user_id,
        ingestion_id,
        name,
        status,
        started_at,
        completed_at,
        source_count,
        target_count,
        matched_count,
        unmatched_source_count,
        unmatched_target_count,
        confidence_avg,
        error_message,
        trace_id,
        metadata,
        created_at,
        updated_at
      FROM reconciliation_runs
      WHERE tenant_id = ${tenantId}::uuid
      ORDER BY GREATEST(started_at, created_at) DESC NULLS LAST, id::text DESC
      LIMIT ${take}
    `;
    return rows as IngestionRunRow[];
  }

  const t = new Date(cursor.t);
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      tenant_id,
      user_id,
      ingestion_id,
      name,
      status,
      started_at,
      completed_at,
      source_count,
      target_count,
      matched_count,
      unmatched_source_count,
      unmatched_target_count,
      confidence_avg,
      error_message,
      trace_id,
      metadata,
      created_at,
      updated_at
    FROM reconciliation_runs
    WHERE tenant_id = ${tenantId}::uuid
      AND (
        GREATEST(started_at, created_at) < ${t}
        OR (
          GREATEST(started_at, created_at) = ${t}
          AND id::text < ${cursor.id}
        )
      )
    ORDER BY GREATEST(started_at, created_at) DESC NULLS LAST, id::text DESC
    LIMIT ${take}
  `;
  return rows as IngestionRunRow[];
}

type ReconJobSqlRow = {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  source_adapter: string;
  target_adapter: string;
  recon_strategy: string | null;
  template_id: string | null;
  validation_rules: unknown;
  source_config_encrypted: string;
  target_config_encrypted: string;
  latest_result_id: string | null;
  latest_result_status: string | null;
  latest_result_started_at: Date | null;
  latest_result_completed_at: Date | null;
  latest_result_source_count: number | null;
  latest_result_target_count: number | null;
  latest_result_matched_count: number | null;
  latest_result_unmatched_source_count: number | null;
  latest_result_unmatched_target_count: number | null;
  latest_result_conflict_count: number | null;
  latest_result_error_message: string | null;
  latest_result_input_hash: string | null;
  latest_result_snapshot_id: string | null;
  latest_result_summary: unknown;
  latest_result_metadata: unknown;
};

async function fetchReconJobsPage(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  cursor: { t: string; id: string } | null | undefined,
  take: number
): Promise<ReconJobSqlRow[]> {
  if (!cursor) {
    const rows = await prisma.$queryRaw`
      SELECT
        j.id,
        j.tenant_id,
        j.name,
        j.status,
        j.created_at,
        j.updated_at,
        j.source_adapter,
        j.target_adapter,
        j.recon_strategy,
        j.template_id,
        j.validation_rules,
        j.source_config_encrypted,
        j.target_config_encrypted,
        lr.id as latest_result_id,
        lr.status as latest_result_status,
        lr.started_at as latest_result_started_at,
        lr.completed_at as latest_result_completed_at,
        lr.source_count as latest_result_source_count,
        lr.target_count as latest_result_target_count,
        lr.matched_count as latest_result_matched_count,
        lr.unmatched_source_count as latest_result_unmatched_source_count,
        lr.unmatched_target_count as latest_result_unmatched_target_count,
        lr.conflict_count as latest_result_conflict_count,
        lr.error_message as latest_result_error_message,
        lr.input_hash as latest_result_input_hash,
        lr.snapshot_id as latest_result_snapshot_id,
        lr.summary as latest_result_summary,
        lr.metadata as latest_result_metadata
      FROM recon_jobs j
      LEFT JOIN LATERAL (
        SELECT
          id,
          status,
          started_at,
          completed_at,
          source_count,
          target_count,
          matched_count,
          unmatched_source_count,
          unmatched_target_count,
          conflict_count,
          error_message,
          input_hash,
          snapshot_id,
          summary,
          metadata
        FROM recon_results r
        WHERE r.recon_job_id = j.id
        ORDER BY r.started_at DESC
        LIMIT 1
      ) lr ON true
      WHERE j.tenant_id = ${tenantId}::uuid
        AND j.deleted_at IS NULL
      ORDER BY j.created_at DESC, j.id::text DESC
      LIMIT ${take}
    `;
    return rows as ReconJobSqlRow[];
  }

  const t = new Date(cursor.t);
  const rows = await prisma.$queryRaw`
    SELECT
      j.id,
      j.tenant_id,
      j.name,
      j.status,
      j.created_at,
      j.updated_at,
      j.source_adapter,
      j.target_adapter,
      j.recon_strategy,
      j.template_id,
      j.validation_rules,
      j.source_config_encrypted,
      j.target_config_encrypted,
      lr.id as latest_result_id,
      lr.status as latest_result_status,
      lr.started_at as latest_result_started_at,
      lr.completed_at as latest_result_completed_at,
      lr.source_count as latest_result_source_count,
      lr.target_count as latest_result_target_count,
      lr.matched_count as latest_result_matched_count,
      lr.unmatched_source_count as latest_result_unmatched_source_count,
      lr.unmatched_target_count as latest_result_unmatched_target_count,
      lr.conflict_count as latest_result_conflict_count,
      lr.error_message as latest_result_error_message,
      lr.input_hash as latest_result_input_hash,
      lr.snapshot_id as latest_result_snapshot_id,
      lr.summary as latest_result_summary,
      lr.metadata as latest_result_metadata
    FROM recon_jobs j
    LEFT JOIN LATERAL (
      SELECT
        id,
        status,
        started_at,
        completed_at,
        source_count,
        target_count,
        matched_count,
        unmatched_source_count,
        unmatched_target_count,
        conflict_count,
        error_message,
        input_hash,
        snapshot_id,
        summary,
        metadata
      FROM recon_results r
      WHERE r.recon_job_id = j.id
      ORDER BY r.started_at DESC
      LIMIT 1
    ) lr ON true
    WHERE j.tenant_id = ${tenantId}::uuid
      AND j.deleted_at IS NULL
      AND (
        j.created_at < ${t}
        OR (j.created_at = ${t} AND j.id::text < ${cursor.id})
      )
    ORDER BY j.created_at DESC, j.id::text DESC
    LIMIT ${take}
  `;
  return rows as ReconJobSqlRow[];
}

export type ReconJobListRow = {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  sourceAdapter: string;
  targetAdapter: string;
  reconStrategy: string | null;
  templateId: string | null;
  validationRules: unknown;
  sourceConfigEncrypted: string;
  targetConfigEncrypted: string;
};

function mapReconJobSqlRow(row: ReconJobSqlRow): {
  job: ReconJobListRow;
  latestResult: ReconResultRecordLike | null;
} {
  const job = {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceAdapter: row.source_adapter,
    targetAdapter: row.target_adapter,
    reconStrategy: row.recon_strategy,
    templateId: row.template_id,
    validationRules: row.validation_rules,
    sourceConfigEncrypted: row.source_config_encrypted,
    targetConfigEncrypted: row.target_config_encrypted,
  };

  const latestResult = row.latest_result_id
    ? {
        id: row.latest_result_id,
        recon_job_id: row.id,
        status: row.latest_result_status,
        started_at: row.latest_result_started_at?.toISOString() ?? null,
        completed_at: row.latest_result_completed_at?.toISOString() ?? null,
        source_count: row.latest_result_source_count,
        target_count: row.latest_result_target_count,
        matched_count: row.latest_result_matched_count,
        unmatched_source_count: row.latest_result_unmatched_source_count,
        unmatched_target_count: row.latest_result_unmatched_target_count,
        conflict_count: row.latest_result_conflict_count,
        error_message: row.latest_result_error_message,
        input_hash: row.latest_result_input_hash,
        snapshot_id: row.latest_result_snapshot_id,
        summary: row.latest_result_summary as Record<string, unknown> | null,
        metadata: (row.latest_result_metadata as Record<string, unknown> | null) ?? null,
      }
    : null;

  return { job, latestResult };
}

function mapIngestionRow(row: IngestionRunRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    ingestionId: row.ingestion_id,
    name: row.name,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    sourceCount: row.source_count,
    targetCount: row.target_count,
    matchedCount: row.matched_count,
    unmatchedSourceCount: row.unmatched_source_count,
    unmatchedTargetCount: row.unmatched_target_count,
    confidenceAvg: row.confidence_avg,
    errorMessage: row.error_message,
    traceId: row.trace_id,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchMergedReconciliationRunsPage(input: {
  prisma: ReconciliationCorePrismaClient;
  tenantId: string;
  limit: number;
  cursorState: MergedRunsCursorV1 | null;
  runKind: ReconciliationRunKindFilter;
  encodeCursor: (s: MergedRunsCursorV1) => string;
}): Promise<MergedReconciliationListResponse> {
  const { prisma, tenantId, limit, cursorState, runKind, encodeCursor } = input;
  const take = limit + 1;

  const jobCursor = runKind === "ingestion_run" ? null : (cursorState?.ij ?? null);
  const ingCursor = runKind === "recon_job" ? null : (cursorState?.ir ?? null);

  const [jobSqlRows, ingestionRuns] = await Promise.all([
    runKind === "ingestion_run"
      ? Promise.resolve([] as ReconJobSqlRow[])
      : fetchReconJobsPage(prisma, tenantId, jobCursor ?? null, take),
    runKind === "recon_job"
      ? Promise.resolve([] as IngestionRunRow[])
      : fetchIngestionRunsPage(prisma, tenantId, ingCursor ?? null, take),
  ]);

  const jobsAndResults = jobSqlRows.map(mapReconJobSqlRow);

  const jobCandidates: MergeCandidate<{
    job: ReconJobListRow;
    latestResult: ReconResultRecordLike | null;
  }>[] = jobsAndResults.map((j) => ({
    row: j,
    sortTimeMs: j.job.createdAt.getTime(),
    id: j.job.id,
  }));

  const ingestionCandidates: MergeCandidate<ReturnType<typeof mapIngestionRow>>[] =
    ingestionRuns.map((r) => {
      const m = mapIngestionRow(r);
      return {
        row: m,
        sortTimeMs: sortTimeMsForIngestionRow(m),
        id: m.id,
      };
    });

  const merged = mergeDualStreamPage({
    limit,
    jobCandidates,
    ingestionCandidates,
    mapJob: (j: { job: ReconJobListRow; latestResult: ReconResultRecordLike | null }) =>
      mapReconJobRowToCanonicalListItem(j),
    mapIngestion: (r) => mapIngestionReconciliationRunToCanonicalListItem(r),
    prev: cursorState,
  });

  const includedKinds: ["recon_job", "ingestion_run"] | ["recon_job"] | ["ingestion_run"] =
    runKind === "all"
      ? ["recon_job", "ingestion_run"]
      : runKind === "recon_job"
        ? ["recon_job"]
        : ["ingestion_run"];

  return {
    runs: merged.items as CanonicalReconciliationListItem[],
    next_cursor: merged.nextCursor ? encodeCursor(merged.nextCursor) : null,
    pagination: merged.pagination,
    response_meta: {
      contract_version: 1,
      included_run_kinds: includedKinds,
      ordering:
        "merged: recon_jobs.created_at DESC,id DESC + reconciliation_runs GREATEST(started_at,created_at) DESC,id DESC",
      consistency: "read_committed",
    },
  };
}
