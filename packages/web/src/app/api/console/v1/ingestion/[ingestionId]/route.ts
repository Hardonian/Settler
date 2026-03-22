import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { requireConsoleTenantContext } from "@/lib/server/console-tenant";
import { TenantMembershipError } from "@/lib/supabase/tenant-membership";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(
      request: NextRequest,
      context: { params: Promise<{ ingestionId: string }> }
    ) {
      try {
        const { tenantId } = await requireConsoleTenantContext(request);
        const { ingestionId } = await context.params;

        const ingestion = await prisma.ingestion.findFirst({
          where: { id: ingestionId, tenantId },
        });

        if (!ingestion) {
          return NextResponse.json(
            { error: "Not Found", message: "Ingestion not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          id: ingestion.id,
          sourceId: ingestion.sourceId,
          status: ingestion.status,
          rawRecordCount: ingestion.rawRecordCount,
          normalizedCount: ingestion.normalizedCount,
          failedCount: ingestion.failedCount,
          retryCount: ingestion.retryCount,
          traceId: ingestion.traceId,
          startedAt: ingestion.startedAt,
          completedAt: ingestion.completedAt,
          errorMessage: ingestion.errorMessage,
          metadata: ingestion.metadata,
        });
      } catch (err) {
        if (err instanceof TenantMembershipError) {
          return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
        }
        appLogger.error("Console ingestion detail failed", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 120 }, requireAuth: true }
);
