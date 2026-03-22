import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { requireConsoleTenantContext } from "@/lib/server/console-tenant";
import { TenantMembershipError } from "@/lib/supabase/tenant-membership";
import {
  resolveReconciliationRunForTenant,
  serializeV1ReconciliationRunDetail,
} from "@settler/reconciliation-core";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest, context: { params: Promise<{ runId: string }> }) {
      try {
        const { tenantId } = await requireConsoleTenantContext(request);
        const { runId } = await context.params;

        const resolution = await resolveReconciliationRunForTenant(prisma, tenantId, runId);

        if (resolution.kind === "ambiguous_uuid_collision") {
          return NextResponse.json(
            {
              type: "https://docs.settler.dev/problems/reconciliation_uuid_collision",
              title: "UUID collision",
              status: 409,
              detail:
                "The same UUID exists as both a recon job and an ingestion-scoped reconciliation run. This is a data anomaly; do not treat either row as authoritative until resolved.",
              code: "RECONCILIATION_UUID_COLLISION",
            },
            { status: 409, headers: { "Content-Type": "application/problem+json" } }
          );
        }

        if (resolution.kind === "not_found") {
          return NextResponse.json(
            { error: "Not Found", message: "Reconciliation run not found" },
            { status: 404 }
          );
        }

        const body = serializeV1ReconciliationRunDetail(resolution.detail);
        return NextResponse.json(body);
      } catch (err) {
        if (err instanceof TenantMembershipError) {
          return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
        }
        appLogger.error("Console reconciliation run detail failed", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 120 }, requireAuth: true }
);
