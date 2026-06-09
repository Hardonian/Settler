import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import {
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { prisma } from "@/shared/db/prismaClient";
import {
  buildRunInstitutionalMemorySummary,
  canonicalMissingProofpackReasonForRunKind,
  resolveOperatorRunDetailForTenants,
  resolveRunCompactProofSummary,
  unavailableRunProofpackIndex,
} from "@settler/reconciliation-core";

export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const { tenantIds } = await resolveTenantMembershipScope();
      const outcome = await resolveOperatorRunDetailForTenants(prisma, tenantIds, params.id);

      if (outcome.kind === "ambiguous_uuid_collision") {
        return NextResponse.json(
          { error: "Ambiguous run identifier", code: "RUN_ID_COLLISION" },
          { status: 409 }
        );
      }
      if (outcome.kind === "not_found") {
        return NextResponse.json({ error: "Run not found" }, { status: 404 });
      }
      if (outcome.kind === "recon_enrichment_failed") {
        return NextResponse.json(
          { error: "Failed to build run proofpack artifact" },
          { status: 500 }
        );
      }

      // Try to load immutable proofpack
      const storedProofpackLookup = prisma.reconResult?.findUnique;
      if (typeof storedProofpackLookup === "function") {
        try {
          const stored = await storedProofpackLookup({
            where: { id: params.id },
            select: { proofpackPayload: true },
          });
          if (stored?.proofpackPayload) {
            return NextResponse.json({ artifact: stored.proofpackPayload });
          }
        } catch {
          // Immutable proofpack lookup is additive; if unavailable, fall back to
          // the deterministic artifact built from the resolved run detail.
        }
      }

      // Fallback for legacy runs
      const detail = outcome.detail;
      const detailConfig = detail.config as Partial<typeof detail.config> | undefined;
      const proofpackIndex =
        detail.proofpackIndex ??
        unavailableRunProofpackIndex(canonicalMissingProofpackReasonForRunKind(detail.runKind));
      const compactProofSummaryResolution = resolveRunCompactProofSummary({
        runKind: detail.runKind,
        compactProofSummary: detail.compactProofSummary,
        proofpackIndex,
      });
      const artifact = {
        schemaVersion: "proofpack.run.v2" as const,
        generatedAt: new Date().toISOString(),
        run: {
          id: detail.id,
          runKind: detail.runKind,
          status: detail.status,
          startedAt: detail.startedAt,
          completedAt: detail.completedAt,
          detailHref: detail.detailHref,
        },
        proofpackIndex,
        compactProofSummary: compactProofSummaryResolution.compactProofSummary,
        institutionalMemory: buildRunInstitutionalMemorySummary({
          runKind: detail.runKind,
          summaryResolution: compactProofSummaryResolution,
        }),
        inputs: {
          summary: detail.summary,
          summarySemantics: detail.summarySemantics,
          configDrift: detail.configDrift,
          config: {
            snapshotId: detailConfig?.snapshotId ?? null,
            inputHash: detailConfig?.inputHash ?? null,
            sourceAdapter: detailConfig?.sourceAdapter ?? null,
            targetAdapter: detailConfig?.targetAdapter ?? null,
            reconStrategy: detailConfig?.reconStrategy ?? null,
            templateId: detailConfig?.templateId ?? null,
          },
        },
        outputs: {
          summaryState: detail.summaryState,
          exceptions: detail.exceptions,
          resultContext: detail.resultContext,
        },
        deltas: {
          runDelta: detail.runDelta ?? null,
        },
        operatorSummary: compactProofSummaryResolution.compactProofSummary.operatorSummary,
        provenance: detail.provenance,
        supportability: {
          shareable:
            proofpackIndex.proofPackages.state === "ready" &&
            proofpackIndex.comparison.state === "available",
          notes:
            compactProofSummaryResolution.compactProofSummary.operatorSummary.primaryReasonCodes,
        },
      };

      return NextResponse.json({ artifact });
    } catch (error) {
      if (error instanceof TenantMembershipError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.status }
        );
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

// try catch
