import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/db/prismaClient";
import {
  resolveTenantForMutation,
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { getReconciliationWorkbenchExceptionDetail } from "@/lib/server/exceptions/reconciliation-workbench";

export const runtime = "nodejs";

const paramsSchema = z.object({
  exceptionId: z.string().uuid("Invalid exception ID format"),
});

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(
      request: NextRequest,
      { params }: { params: Promise<{ exceptionId: string }> }
    ) {
      try {
        const parsed = paramsSchema.safeParse(await params);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid exception ID", details: parsed.error.issues },
            { status: 400 }
          );
        }

        const { tenantIds } = await resolveTenantMembershipScope();
        const requestedTenantId =
          request.nextUrl.searchParams.get("workspace_id")?.trim() ||
          request.nextUrl.searchParams.get("tenant_id")?.trim() ||
          null;
        const tenantId = resolveTenantForMutation(tenantIds, requestedTenantId);

        const detail = await getReconciliationWorkbenchExceptionDetail(
          prisma,
          tenantId,
          parsed.data.exceptionId
        );

        if (!detail) {
          return NextResponse.json({ error: "Exception not found" }, { status: 404 });
        }

        const missingEvidence = detail.proofSummary.items.flatMap((item) => item.missingEvidence);
        const degradedEvidenceReasons = detail.evidenceSummary.items
          .filter((item) => item.degraded)
          .flatMap((item) => item.degradedReasons);

        const runComparison = detail.runComparison;
        const changeComparison = runComparison
          ? {
              available: runComparison.available,
              state: runComparison.state,
              certainty: runComparison.certainty,
              reasonCodes: runComparison.reasonCodes,
              summary: runComparison.summary,
              baseline: runComparison.baseline,
              deltas: runComparison.deltas,
              changedSincePreviousRun: runComparison.changedSincePreviousRun,
              history: runComparison.history,
            }
          : {
              available: false as const,
              state: "unavailable" as const,
              certainty: "low" as const,
              reasonCodes: ["proofpack_index_unavailable"] as const,
              summary:
                "Prior-run comparison could not be resolved for this exception's run identifier.",
              baseline: { priorResultId: null, priorResultStartedAt: null },
              deltas: {
                matched: null,
                unmatched: null,
                conflicts: null,
                proofCompleteness: "unavailable" as const,
                recurringFamilyConcentration: "unavailable" as const,
              },
              changedSincePreviousRun: "unavailable" as const,
              history: {
                lookbackWindow: 0,
                comparableWindowCount: 0,
                certainty: "low" as const,
                trend: "unavailable" as const,
                pattern: "unavailable" as const,
                reasonCodes: ["history_missing"] as const,
                summary: "History window is unavailable.",
              },
            };

        const artifact = {
          schemaVersion: "proofpack.exception.v3",
          generatedAt: new Date().toISOString(),
          tenantScoped: true,
          exception: {
            id: detail.id,
            runId: detail.runId,
            type: detail.type,
            status: detail.status,
            severity: detail.severity,
            description: detail.description,
          },
          completeness: {
            proofPackageCount: detail.proofSummary.total,
            finalizedProofPackageCount: detail.proofSummary.finalized,
            bestCompletenessScore: detail.operatorSummary.bestCompletenessScore,
            missingEvidenceCount: detail.operatorSummary.missingEvidenceCount,
            missingEvidence,
            degradedEvidenceCount: detail.evidenceSummary.degraded,
            degradedEvidenceReasons,
            isExportReady:
              detail.operatorSummary.proofState === "ready" &&
              detail.operatorSummary.evidenceState === "ready",
          },
          lineage: {
            ...detail.proofLineage,
            latestEvidenceCapturedAt: detail.evidenceSummary.latestCapturedAt,
            latestProofCreatedAt: detail.proofSummary.latestCreatedAt,
            latestDecisionAt: detail.operatorSummary.latestResolution?.completedAt ?? null,
          },
          exceptionIntelligence: detail.exceptionIntelligence,
          confidence: {
            exceptionConfidence: detail.confidenceScore,
            bestProofCompleteness: detail.operatorSummary.bestCompletenessScore,
            boundedCertainty:
              detail.operatorSummary.proofState === "ready"
                ? "high"
                : detail.operatorSummary.proofState === "degraded"
                  ? "bounded"
                  : "low",
          },
          familySummary: detail.familySummary,
          changeSincePreviousRun: changeComparison,
          recurringContext: {
            memoryCount: detail.operatorSummary.memoryCount,
            recurringResolutionReason: detail.operatorSummary.recurringResolutionReason,
            familySummary: detail.familySummary,
          },
          operatorAction: {
            nextStep: detail.operatorSummary.nextStep,
            supportabilityCaveats: [
              ...new Set([
                ...detail.suggestedActions,
                changeComparison.summary,
                ...(runComparison && !runComparison.available
                  ? runComparison.reasonCodes.map((code) => `comparison:${code}`)
                  : []),
                ...(detail.operatorSummary.proofState !== "ready"
                  ? ["Proof package is not yet fully complete or finalized."]
                  : []),
              ]),
            ],
          },
          humanSummary: {
            title: `Exception proofpack: ${detail.type.replaceAll("_", " ")}`,
            summary: detail.operatorSummary.whatHappened,
            whyItMatters: detail.operatorSummary.whyItMatters,
            nextStep: detail.operatorSummary.nextStep,
          },
        };

        return NextResponse.json({ data: artifact, artifact });
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status }
          );
        }

        return NextResponse.json({ error: "Failed to build proofpack artifact" }, { status: 500 });
      }
    },
    { feature: "GET Exception Proofpack" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 60 }, requireAuth: true }
);
