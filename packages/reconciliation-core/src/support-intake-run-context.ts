/**
 * Run/evidence context attached to support intake (tenant-scoped operator run detail).
 */

import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";
import { resolveOperatorRunDetailForTenants } from "./operator-run-detail-resolve.js";
import { resolveRunCompactProofSummary } from "./run-proofpack-index.js";

export async function buildSupportIntakeRunContext(
  prisma: ReconciliationCorePrismaClient,
  tenantId: string,
  runId: string
): Promise<Record<string, unknown>> {
  try {
    const outcome = await resolveOperatorRunDetailForTenants(prisma, [tenantId], runId);
    if (outcome.kind !== "ok") {
      return {
        state: "unavailable",
        reason: outcome.kind,
        runId,
        compactProofSummary: resolveRunCompactProofSummary({
          runKind: "recon_job",
          fallbackReasonCode: "support_run_detail_unavailable",
        }).compactProofSummary,
      };
    }

    const summaryResolution = resolveRunCompactProofSummary({
      runKind: outcome.detail.runKind,
      compactProofSummary: outcome.detail.compactProofSummary,
      proofpackIndex: outcome.detail.proofpackIndex,
    });

    return {
      state: "ok",
      runId: outcome.detail.id,
      runKind: outcome.detail.runKind,
      status: outcome.detail.status,
      compactProofSummary: summaryResolution.compactProofSummary,
      fallbackReason: summaryResolution.fallbackReasonCode,
    };
  } catch {
    return {
      state: "degraded",
      reason: "support_run_context_error",
      runId,
      compactProofSummary: resolveRunCompactProofSummary({
        runKind: "recon_job",
        fallbackReasonCode: "support_run_context_error",
      }).compactProofSummary,
    };
  }
}
