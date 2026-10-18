/**
 * Canonical prior-run comparison for exception surfaces (list compact summary, exception proofpack).
 * Delegates to {@link buildRunProofpackIndexByRunId} so exception exports align with run detail truth.
 */

import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";
import {
  buildRunProofpackIndexByRunId,
  canonicalMissingProofpackReasonForRunKind,
  unavailableRunProofpackIndex,
  type RunDeltaChangeState,
  type RunProofpackIndex,
} from "./run-proofpack-index.js";

export type ExceptionRunComparisonSnapshot = {
  available: boolean;
  state: RunProofpackIndex["comparison"]["state"];
  certainty: RunProofpackIndex["comparison"]["certainty"];
  reasonCodes: RunProofpackIndex["comparison"]["reasonCodes"];
  summary: string;
  baseline: RunProofpackIndex["comparison"]["baseline"];
  deltas: RunProofpackIndex["comparison"]["deltas"];
  changedSincePreviousRun: RunDeltaChangeState;
};

function snapshotFromProofpackIndex(index: RunProofpackIndex): ExceptionRunComparisonSnapshot {
  const { comparison } = index;
  return {
    available: comparison.state === "available",
    state: comparison.state,
    certainty: comparison.certainty,
    reasonCodes: comparison.reasonCodes,
    summary: comparison.summary,
    baseline: comparison.baseline,
    deltas: comparison.deltas,
    changedSincePreviousRun: comparison.changedSincePriorRun,
  };
}

/**
 * Resolve ReconciliationRun.id -> ReconJob.id mapping before indexing comparisons.
 */
export async function resolveCanonicalRunAndJobIds(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  incomingIds: string[]
): Promise<{
  uniqueIncomingIds: string[];
  resolvedJobIds: string[];
  runIdToJobIdMap: Map<string, string>;
}> {
  const uniqueIncomingIds = Array.from(
    new Set(incomingIds.map((id) => id?.trim()).filter((id): id is string => Boolean(id)))
  );

  if (uniqueIncomingIds.length === 0) {
    return { uniqueIncomingIds: [], resolvedJobIds: [], runIdToJobIdMap: new Map() };
  }

  const runs = await prisma.reconciliationRun.findMany({
    where: { tenantId, id: { in: uniqueIncomingIds } },
    select: {
      id: true,
      jobId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      inputHash: true,
      outputHash: true,
      merkleRoot: true,
    },
  });

  const runIdToJobIdMap = new Map<string, string>();
  const jobIdSet = new Set<string>(uniqueIncomingIds);

  for (const run of runs) {
    if (run.jobId) {
      runIdToJobIdMap.set(run.id, run.jobId);
      jobIdSet.add(run.jobId);
    }
  }

  return {
    uniqueIncomingIds,
    resolvedJobIds: Array.from(jobIdSet),
    runIdToJobIdMap,
  };
}

/**
 * Resolve whether each run id is a recon job or ingestion-scoped reconciliation run.
 * When both exist (UUID collision), prefers recon job — consistent with {@link resolveReconciliationRunForTenants}.
 */
export async function resolveRunKindsForTenantRunIds(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  runIds: string[]
): Promise<Map<string, "recon_job" | "ingestion_run">> {
  const unique = [...new Set(runIds)];
  const out = new Map<string, "recon_job" | "ingestion_run">();
  if (unique.length === 0) {
    return out;
  }

  const [jobs, ingestionRuns] = await Promise.all([
    prisma.reconJob.findMany({
      where: { tenantId, id: { in: unique }, deletedAt: null },
      select: { id: true },
    }),
    prisma.reconciliationRun.findMany({
      where: { tenantId, id: { in: unique } },
      select: { id: true },
    }),
  ]);

  const jobIds = new Set(jobs.map((j: { id: string }) => j.id));
  const ingestionIds = new Set(ingestionRuns.map((r: { id: string }) => r.id));

  for (const id of unique) {
    if (jobIds.has(id)) {
      out.set(id, "recon_job");
    } else if (ingestionIds.has(id)) {
      out.set(id, "ingestion_run");
    }
  }

  return out;
}

/**
 * Batch-build deterministic run-over-run comparison snapshots for exception UX and exports.
 */
export async function buildExceptionRunComparisonSnapshotForRunIds(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  runIds: string[]
): Promise<Map<string, ExceptionRunComparisonSnapshot>> {
  const { uniqueIncomingIds, resolvedJobIds, runIdToJobIdMap } = await resolveCanonicalRunAndJobIds(
    prisma,
    tenantId,
    runIds
  );

  const out = new Map<string, ExceptionRunComparisonSnapshot>();
  if (uniqueIncomingIds.length === 0) {
    return out;
  }

  const kinds = await resolveRunKindsForTenantRunIds(prisma, tenantId, resolvedJobIds);
  const reconIds = resolvedJobIds.filter((id) => kinds.get(id) === "recon_job");

  const indexByRun =
    reconIds.length > 0
      ? await buildRunProofpackIndexByRunId({
          prisma,
          tenantId,
          runs: reconIds.map((id) => ({ id, runKind: "recon_job" as const })),
        })
      : new Map<string, RunProofpackIndex>();

  for (const id of resolvedJobIds) {
    const kind = kinds.get(id);
    if (kind === "recon_job") {
      const index =
        indexByRun.get(id) ?? unavailableRunProofpackIndex("proofpack_index_unavailable");
      out.set(id, snapshotFromProofpackIndex(index));
      continue;
    }
    if (kind === "ingestion_run") {
      out.set(
        id,
        snapshotFromProofpackIndex(
          unavailableRunProofpackIndex(canonicalMissingProofpackReasonForRunKind("ingestion_run"))
        )
      );
      continue;
    }
    out.set(
      id,
      snapshotFromProofpackIndex(unavailableRunProofpackIndex("proofpack_index_unavailable"))
    );
  }

  // Index the returned snapshot entries under BOTH run.id and job.id so callers passing
  // reconciliation_matches.run_id receive the full prior-run comparison snapshot.
  for (const [runId, jobId] of runIdToJobIdMap.entries()) {
    const jobSnapshot = out.get(jobId);
    if (jobSnapshot) {
      out.set(runId, jobSnapshot);
    }
  }

  return out;
}
