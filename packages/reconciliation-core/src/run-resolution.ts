/**
 * Explicit resolution of a reconciliation run id across recon_jobs and reconciliation_runs.
 */

import type { PrismaClient } from "@prisma/client";
import { logConflict } from "./uuid-collision-log.js";
import {
  mapIngestionReconciliationRunToCanonicalDetail,
  mapReconJobRowToCanonicalDetail,
  type CanonicalReconciliationRunDetail,
} from "./canonical-reconciliation.js";
import type { ReconResultRecordLike } from "./canonical-run-result.js";

export type ReconciliationRunResolution =
  | { kind: "recon_job"; detail: CanonicalReconciliationRunDetail }
  | { kind: "ingestion_run"; detail: CanonicalReconciliationRunDetail }
  | { kind: "ambiguous_uuid_collision"; jobId: string; ingestionRunId: string }
  | { kind: "not_found" };

export async function resolveReconciliationRunForTenant(
  prisma: PrismaClient,
  tenantId: string,
  runId: string
): Promise<ReconciliationRunResolution> {
  const resolved = await resolveReconciliationRunForTenants(prisma, [tenantId], runId);
  if (resolved.kind === "recon_job" || resolved.kind === "ingestion_run") {
    return { kind: resolved.kind, detail: resolved.detail };
  }
  return resolved;
}

export type ResolvedReconciliationRunForTenants =
  | {
      kind: "recon_job";
      tenantId: string;
      detail: CanonicalReconciliationRunDetail;
      jobRecord: any;
      latestResultRecord: ReconResultRecordLike | null;
      previousResultRecord: ReconResultRecordLike | null;
      persistedResultCount: number;
    }
  | {
      kind: "ingestion_run";
      tenantId: string;
      detail: CanonicalReconciliationRunDetail;
      ingestionRunRecord: any;
    }
  | { kind: "ambiguous_uuid_collision"; jobId: string; ingestionRunId: string }
  | { kind: "not_found" };

/**
 * Resolve a run id when the caller has membership in multiple tenants (console scope).
 * Uses at most one row per table across the allowed tenant set.
 */
export async function resolveReconciliationRunForTenants(
  prisma: PrismaClient,
  tenantIds: string[],
  runId: string
): Promise<ResolvedReconciliationRunForTenants> {
  if (tenantIds.length === 0) {
    return { kind: "not_found" };
  }

  const [job, ingestionRun] = await Promise.all([
    prisma.reconJob.findFirst({
      where: { id: runId, tenantId: { in: tenantIds }, deletedAt: null },
      include: {
        results: {
          orderBy: { startedAt: "desc" },
          take: 2,
          select: {
            id: true,
            reconJobId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            sourceCount: true,
            targetCount: true,
            matchedCount: true,
            unmatchedSourceCount: true,
            unmatchedTargetCount: true,
            conflictCount: true,
            errorMessage: true,
            inputHash: true,
            snapshotId: true,
            summary: true,
            metadata: true,
          },
        },
        _count: {
          select: { results: true },
        },
      },
    }),
    prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId: { in: tenantIds } },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        ingestionId: true,
        name: true,
        status: true,
        startedAt: true,
        completedAt: true,
        sourceCount: true,
        targetCount: true,
        matchedCount: true,
        unmatchedSourceCount: true,
        unmatchedTargetCount: true,
        confidenceAvg: true,
        errorMessage: true,
        traceId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  if (job && ingestionRun) {
    await logConflict({
      tenantId: job.tenantId,
      duplicateUuid: runId,
      reconJobId: job.id,
      reconciliationRunId: ingestionRun.id,
    });
    return {
      kind: "ambiguous_uuid_collision",
      jobId: job.id,
      ingestionRunId: ingestionRun.id,
    };
  }

  if (job) {
    const mapToLike = (row: any): ReconResultRecordLike => ({
      id: row.id,
      recon_job_id: row.reconJobId,
      status: row.status,
      started_at: row.startedAt?.toISOString() ?? null,
      completed_at: row.completedAt?.toISOString() ?? null,
      source_count: row.sourceCount,
      target_count: row.targetCount,
      matched_count: row.matchedCount,
      unmatched_source_count: row.unmatchedSourceCount,
      unmatched_target_count: row.unmatchedTargetCount,
      conflict_count: row.conflictCount,
      error_message: row.errorMessage,
      input_hash: row.inputHash,
      snapshot_id: row.snapshotId,
      summary: row.summary as Record<string, unknown> | null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    });

    const results = job.results || [];
    const latest = results[0] ? mapToLike(results[0]) : null;
    const previous = results[1] ? mapToLike(results[1]) : null;
    const persistedResultCount = job._count?.results ?? 0;

    return {
      kind: "recon_job",
      tenantId: job.tenantId,
      jobRecord: job,
      latestResultRecord: latest,
      previousResultRecord: previous,
      persistedResultCount: persistedResultCount,
      detail: mapReconJobRowToCanonicalDetail({
        job: {
          id: job.id,
          tenantId: job.tenantId,
          name: job.name,
          status: job.status,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          sourceAdapter: job.sourceAdapter,
          targetAdapter: job.targetAdapter,
          reconStrategy: job.reconStrategy,
          templateId: job.templateId,
          validationRules: job.validationRules,
          sourceConfigEncrypted: job.sourceConfigEncrypted,
          targetConfigEncrypted: job.targetConfigEncrypted,
          metadata: job.metadata,
        },
        latestResult: latest,
      }),
    };
  }

  if (ingestionRun) {
    return {
      kind: "ingestion_run",
      tenantId: ingestionRun.tenantId,
      ingestionRunRecord: ingestionRun,
      detail: mapIngestionReconciliationRunToCanonicalDetail(ingestionRun),
    };
  }

  return { kind: "not_found" };
}
