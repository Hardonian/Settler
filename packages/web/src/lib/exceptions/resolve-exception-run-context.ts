import type { CanonicalReconciliationRunDetail } from "@settler/reconciliation-core";
import { resolveReconciliationRunForTenant } from "@settler/reconciliation-core";
import type { PrismaClient } from "@prisma/client";

export type ExceptionProvenanceRunDto = {
  id: string;
  /** Which persistence model backs this id for the workspace. */
  runKind: "recon_job" | "ingestion_run";
  sourceModel: "recon_jobs" | "recon_results";
  name: string | null;
  /** Normalized lifecycle status (shared with run list / canonical contract). */
  normalizedStatus: string;
  /** Operator-facing label from canonical reconciliation mapping. */
  statusLabel: string;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  ingestionId: string | null;
  /** When runKind is recon_job, same as id; otherwise null. */
  reconJobId: string | null;
  href: string;
  recordFound: boolean;
  /** Latest recon_result execution id when this is a recon_job run; null for ingestion-only. */
  latestResultId: string | null;
  /** UUID collision: same id exists in both recon_jobs and recon_results (extremely rare). */
  uuidCollision: boolean;
  collision?: { reconJobId: string; reconciliationRunId: string };
};

function mapDetailToDto(detail: CanonicalReconciliationRunDetail): ExceptionProvenanceRunDto {
  return {
    id: detail.id,
    runKind: detail.runKind,
    sourceModel: detail.provenance.sourceModel,
    name: detail.name?.trim() ? detail.name : null,
    normalizedStatus: detail.lifecycle.status,
    statusLabel: detail.lifecycle.statusLabel,
    createdAt: detail.timestamps.createdAt,
    startedAt: detail.timestamps.startedAt,
    completedAt: detail.timestamps.completedAt,
    ingestionId: detail.provenance.ingestionId,
    reconJobId: detail.provenance.reconJobId,
    href: `/console/runs/${detail.id}`,
    recordFound: true,
    latestResultId: detail.latestResultId,
    uuidCollision: false,
  };
}

/**
 * Resolves DriftEvent.reconJobId against both recon_jobs and recon_results (tenant-scoped),
 * matching console run list semantics.
 */
export async function resolveExceptionProvenanceRun(
  prisma: PrismaClient,
  tenantId: string,
  runId: string | null
): Promise<ExceptionProvenanceRunDto | null> {
  if (!runId) {
    return null;
  }

  const resolution = await resolveReconciliationRunForTenant(prisma, tenantId, runId);

  if (resolution.kind === "not_found") {
    return {
      id: runId,
      runKind: "ingestion_run",
      sourceModel: "recon_results",
      name: null,
      normalizedStatus: "unknown",
      statusLabel: "Not found",
      createdAt: null,
      startedAt: null,
      completedAt: null,
      ingestionId: null,
      reconJobId: null,
      href: `/console/runs/${runId}`,
      recordFound: false,
      latestResultId: null,
      uuidCollision: false,
    };
  }

  if (resolution.kind === "ambiguous_uuid_collision") {
    return {
      id: runId,
      runKind: "ingestion_run",
      sourceModel: "recon_results",
      name: null,
      normalizedStatus: "unknown",
      statusLabel: "Ambiguous id",
      createdAt: null,
      startedAt: null,
      completedAt: null,
      ingestionId: null,
      reconJobId: null,
      href: `/console/runs/${runId}`,
      recordFound: false,
      latestResultId: null,
      uuidCollision: true,
      collision: {
        reconJobId: resolution.jobId,
        reconciliationRunId: resolution.ingestionRunId,
      },
    };
  }

  return mapDetailToDto(resolution.detail);
}
