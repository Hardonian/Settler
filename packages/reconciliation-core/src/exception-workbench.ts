import type { PrismaClient } from "@prisma/client";
import { resolveReconciliationRunForTenant } from "./run-resolution.js";
import type { CanonicalExceptionCounts } from "./canonical-run-result.js";

export const EXCEPTION_MATCH_TYPES = ["unmatched", "conflict"] as const;

export type CanonicalExceptionStatus = "open" | "in_progress" | "resolved" | "dismissed";
export type OperatorExceptionStatus = "pending" | "investigating" | "resolved" | "ignored";

export type ExceptionScopeResolution =
  | { kind: "all" }
  | {
      kind: "scoped";
      subjectKind: "recon_job" | "ingestion_run";
      runIds: string[];
      requestedRunId: string;
    }
  | { kind: "not_found"; requestedRunId: string }
  | {
      kind: "ambiguous_uuid_collision";
      requestedRunId: string;
      jobId: string;
      ingestionRunId: string;
    };

type ExceptionScopeOptions = {
  prisma: PrismaClient;
  tenantId: string;
  runId?: string | null;
  runKind?: "recon_job" | "ingestion_run" | null;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function runMetadataReferencesJob(metadata: unknown, jobId: string): boolean {
  if (!isObjectRecord(metadata)) {
    return false;
  }

  const directKeys = ["jobId", "job_id", "reconJobId", "recon_job_id"];
  for (const key of directKeys) {
    if (metadata[key] === jobId) {
      return true;
    }
  }

  const matchingConfig = metadata["matchingConfig"];
  if (isObjectRecord(matchingConfig) && matchingConfig["jobId"] === jobId) {
    return true;
  }

  return false;
}

export function toCanonicalExceptionStatus(input: {
  status?: string | null;
  reviewed?: boolean | null;
  matchReason?: string | null;
}): CanonicalExceptionStatus {
  const normalized = (input.status ?? "").trim().toLowerCase();
  if (
    normalized === "open" ||
    normalized === "in_progress" ||
    normalized === "resolved" ||
    normalized === "dismissed"
  ) {
    return normalized;
  }

  if (input.reviewed) {
    return (input.matchReason ?? "").toLowerCase().includes("ignored") ? "dismissed" : "resolved";
  }

  return "open";
}

export function toOperatorExceptionStatus(
  status: CanonicalExceptionStatus
): OperatorExceptionStatus {
  switch (status) {
    case "in_progress":
      return "investigating";
    case "resolved":
      return "resolved";
    case "dismissed":
      return "ignored";
    default:
      return "pending";
  }
}

export function operatorStatusToCanonical(
  status: string | null | undefined
): CanonicalExceptionStatus | null {
  switch ((status ?? "").trim().toLowerCase()) {
    case "pending":
      return "open";
    case "investigating":
      return "in_progress";
    case "resolved":
      return "resolved";
    case "ignored":
      return "dismissed";
    default:
      return null;
  }
}

async function resolveRunIdsForJob(
  prisma: PrismaClient,
  tenantId: string,
  jobId: string
): Promise<string[]> {
  const linkedRuns = await prisma.reconciliationRun.findMany({
    where: {
      tenantId,
      OR: [
        { metadata: { path: ["jobId"], equals: jobId } },
        { metadata: { path: ["job_id"], equals: jobId } },
        { metadata: { path: ["reconJobId"], equals: jobId } },
        { metadata: { path: ["recon_job_id"], equals: jobId } },
        { metadata: { path: ["matchingConfig", "jobId"], equals: jobId } },
      ],
    },
    select: {
      id: true,
    },
  });

  return linkedRuns.map((run: { id: string }) => run.id);
}

export async function resolveReconciliationExceptionScope({
  prisma,
  tenantId,
  runId,
  runKind,
}: ExceptionScopeOptions): Promise<ExceptionScopeResolution> {
  if (!runId) {
    return { kind: "all" };
  }

  if (runKind === "ingestion_run") {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      select: { id: true },
    });
    if (!run) {
      return { kind: "not_found", requestedRunId: runId };
    }
    return {
      kind: "scoped",
      subjectKind: "ingestion_run",
      requestedRunId: runId,
      runIds: [run.id],
    };
  }

  if (runKind === "recon_job") {
    const job = await prisma.reconJob.findFirst({
      where: { id: runId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!job) {
      return { kind: "not_found", requestedRunId: runId };
    }

    return {
      kind: "scoped",
      subjectKind: "recon_job",
      requestedRunId: runId,
      runIds: await resolveRunIdsForJob(prisma, tenantId, runId),
    };
  }

  const resolution = await resolveReconciliationRunForTenant(prisma, tenantId, runId);
  if (resolution.kind === "ambiguous_uuid_collision") {
    return {
      kind: "ambiguous_uuid_collision",
      requestedRunId: runId,
      jobId: resolution.jobId,
      ingestionRunId: resolution.ingestionRunId,
    };
  }

  if (resolution.kind === "not_found") {
    return { kind: "not_found", requestedRunId: runId };
  }

  if (resolution.kind === "ingestion_run") {
    return {
      kind: "scoped",
      subjectKind: "ingestion_run",
      requestedRunId: runId,
      runIds: [resolution.detail.id],
    };
  }

  return {
    kind: "scoped",
    subjectKind: "recon_job",
    requestedRunId: runId,
    runIds: await resolveRunIdsForJob(prisma, tenantId, runId),
  };
}

type CountOptions = {
  prisma: PrismaClient;
  tenantId: string;
  runId?: string | null;
  runKind?: "recon_job" | "ingestion_run" | null;
};

export async function countReconciliationExceptionsForScope({
  prisma,
  tenantId,
  runId,
  runKind,
}: CountOptions): Promise<
  | { kind: "ok"; counts: CanonicalExceptionCounts; scope: ExceptionScopeResolution }
  | Exclude<ExceptionScopeResolution, { kind: "all" } | { kind: "scoped" }>
> {
  const scope = await resolveReconciliationExceptionScope({ prisma, tenantId, runId, runKind });
  if (scope.kind === "not_found" || scope.kind === "ambiguous_uuid_collision") {
    return scope;
  }

  const where: Record<string, unknown> = {
    tenantId,
    matchType: { in: [...EXCEPTION_MATCH_TYPES] },
  };

  if (scope.kind === "scoped") {
    if (scope.runIds.length === 0) {
      return {
        kind: "ok",
        scope,
        counts: {
          total: 0,
          pending: 0,
          investigating: 0,
          resolved: 0,
          ignored: 0,
          reviewRequired: 0,
        },
      };
    }
    where["runId"] = { in: scope.runIds };
  }

  const [total, pending, investigating, resolved, ignored] = await Promise.all([
    prisma.reconciliationMatch.count({ where: where as any }),
    prisma.reconciliationMatch.count({
      where: { ...(where as any), status: "open" },
    }),
    prisma.reconciliationMatch.count({
      where: { ...(where as any), status: "in_progress" },
    }),
    prisma.reconciliationMatch.count({
      where: { ...(where as any), status: "resolved" },
    }),
    prisma.reconciliationMatch.count({
      where: { ...(where as any), status: "dismissed" },
    }),
  ]);

  return {
    kind: "ok",
    scope,
    counts: {
      total,
      pending,
      investigating,
      resolved,
      ignored,
      reviewRequired: pending + investigating,
    },
  };
}
