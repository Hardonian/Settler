/**
 * Load aggregated adjudication policy hints for a recon job (tenant-scoped).
 * Used by API reconciliation execution to merge deterministic tolerance adjustments.
 */

import { resolveReconciliationExceptionScope } from "./exception-workbench.js";
import { aggregateAdjudicationLearning } from "./run-operator-intelligence.js";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";

export type PolicyHintsLoadResult = {
  policyWeightHints: Record<string, number>;
  sampleCount: number;
  state: "available" | "degraded" | "unavailable";
  reasonCodes: string[];
};

/**
 * Fetch adjudication-derived policy weight hints for exceptions linked to this recon job.
 */
export async function fetchPolicyWeightHintsForReconJob(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  jobId: string
): Promise<PolicyHintsLoadResult> {
  const scope = await resolveReconciliationExceptionScope({
    prisma,
    tenantId,
    runId: jobId,
    runKind: "recon_job",
  });

  if (scope.kind === "not_found" || scope.kind === "ambiguous_uuid_collision") {
    return {
      policyWeightHints: {},
      sampleCount: 0,
      state: "unavailable",
      reasonCodes:
        scope.kind === "ambiguous_uuid_collision"
          ? ["POLICY_HINTS_SCOPE_AMBIGUOUS"]
          : ["POLICY_HINTS_SCOPE_NOT_FOUND"],
    };
  }

  if (scope.kind === "all" || scope.runIds.length === 0) {
    return {
      policyWeightHints: {},
      sampleCount: 0,
      state: "unavailable",
      reasonCodes: ["POLICY_HINTS_NO_LINKED_RUNS"],
    };
  }

  try {
    const memories = await prisma.exceptionAdjudicationMemory.findMany({
      where: {
        tenantId,
        exception: { runId: { in: scope.runIds } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        resolutionReason: true,
        adjudicationType: true,
        exception: { select: { matchType: true } },
      },
    });

    const rows = memories.map(
      (m: {
        resolutionReason: string | null;
        adjudicationType: string;
        exception: { matchType: string } | null;
      }) => ({
        resolutionReason: m.resolutionReason,
        adjudicationType: m.adjudicationType,
        matchType: m.exception?.matchType ?? null,
      })
    );

    const learning = aggregateAdjudicationLearning(rows);
    return {
      policyWeightHints: learning.policyWeightHints,
      sampleCount: learning.sampleCount,
      state: learning.sampleCount > 0 ? "available" : "unavailable",
      reasonCodes: learning.sampleCount > 0 ? [] : ["POLICY_HINTS_NO_ADJUDICATION_SAMPLES"],
    };
  } catch {
    return {
      policyWeightHints: {},
      sampleCount: 0,
      state: "degraded",
      reasonCodes: ["POLICY_HINTS_QUERY_FAILED"],
    };
  }
}
