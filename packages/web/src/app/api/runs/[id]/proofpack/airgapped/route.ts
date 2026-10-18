import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import {
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { prisma } from "@/shared/db/prismaClient";
import { resolveOperatorRunDetailForTenants } from "@settler/reconciliation-core";
import { buildAirGappedProofpackTarball } from "@/lib/airgapped-tarball";

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

      // Look up associated evidence artifacts
      let artifacts: Array<{ id: string; artifactType: string; payloadHash: string }> = [];
      const evidenceLookup = prisma.evidenceArtifact?.findMany;
      if (typeof evidenceLookup === "function") {
        try {
          artifacts = await evidenceLookup({
            where: { runId: params.id, tenantId: { in: tenantIds } },
            select: { id: true, artifactType: true, payloadHash: true },
          });
        } catch {
          // Non-blocking fallback
        }
      }

      const { tarball, rootHash } = buildAirGappedProofpackTarball({
        executionId: params.id,
        tenantId: tenantIds[0] || "default",
        timestamp: detail.completedAt || detail.startedAt || new Date().toISOString(),
        inputHash: (detail.config as Record<string, unknown> | undefined)?.["inputHash"] as
          string | undefined,
        evidenceArtifacts: artifacts,
        metadata: {
          status: detail.status,
          runKind: detail.runKind,
          jobName: detail.name,
        },
      });

      return new NextResponse(new Uint8Array(tarball), {
        status: 200,
        headers: {
          "Content-Type": "application/gzip",
          "Content-Disposition": `attachment; filename="proofpack-${params.id}.tar.gz"`,
          "X-Settler-Merkle-Root": rootHash,
        },
      });
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
