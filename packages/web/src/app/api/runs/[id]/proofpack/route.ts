import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import {
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { prisma } from "@/shared/db/prismaClient";
import {
  buildDeterministicRunProofpackArtifact,
  resolveOperatorRunDetailForTenants,
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
      const artifact = buildDeterministicRunProofpackArtifact({
        detail,
        generatedAtIso: new Date().toISOString(),
      });

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
