import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import {
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { prisma } from "@/shared/db/prismaClient";
import {
  resolveOperatorRunDetailForTenants,
  toRunCompactProofSummary,
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

      const detail = outcome.detail;
      const proofpackIndex = detail.proofpackIndex ?? unavailableRunProofpackIndex();
      const compactProofSummary = detail.compactProofSummary ?? toRunCompactProofSummary(proofpackIndex);
      const artifact = {
        schemaVersion: "proofpack.run.v1",
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
        compactProofSummary,
        supportability: {
          shareable: Boolean(
            proofpackIndex.proofPackages.state === "ready" &&
            proofpackIndex.comparison.state === "available"
          ),
          notes: compactProofSummary.operatorSummary.primaryReasonCodes,
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
