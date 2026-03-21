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
  const [job, ingestionRun] = await Promise.all([
    prisma.reconJob.findFirst({
      where: { id: runId, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        sourceAdapter: true,
        targetAdapter: true,
        reconStrategy: true,
        templateId: true,
        validationRules: true,
        sourceConfigEncrypted: true,
        targetConfigEncrypted: true,
        metadata: true,
      },
    }),
    prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
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
      tenantId,
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
    const latestResult = await prisma.reconResult.findFirst({
      where: { reconJobId: job.id, tenantId },
      orderBy: { startedAt: "desc" },
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
    });

    const latest: ReconResultRecordLike | null = latestResult
      ? {
          id: latestResult.id,
          recon_job_id: latestResult.reconJobId,
          status: latestResult.status,
          started_at: latestResult.startedAt?.toISOString() ?? null,
          completed_at: latestResult.completedAt?.toISOString() ?? null,
          source_count: latestResult.sourceCount,
          target_count: latestResult.targetCount,
          matched_count: latestResult.matchedCount,
          unmatched_source_count: latestResult.unmatchedSourceCount,
          unmatched_target_count: latestResult.unmatchedTargetCount,
          conflict_count: latestResult.conflictCount,
          error_message: latestResult.errorMessage,
          input_hash: latestResult.inputHash,
          snapshot_id: latestResult.snapshotId,
          summary: latestResult.summary as Record<string, unknown> | null,
          metadata: (latestResult.metadata as Record<string, unknown> | null) ?? null,
        }
      : null;

    return {
      kind: "recon_job",
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
      detail: mapIngestionReconciliationRunToCanonicalDetail(ingestionRun),
    };
  }

  return { kind: "not_found" };
}
