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

        const limitRaw = parseInt(request.nextUrl.searchParams.get("limit") || "100", 10);
        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;
        const offsetRaw = parseInt(request.nextUrl.searchParams.get("offset") || "0", 10);
        const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

        const [transactions, total] = await Promise.all([
          prisma.normalizedTransaction.findMany({
            where: { ingestionId, tenantId },
            orderBy: { date: "desc" },
            take: limit,
            skip: offset,
          }),
          prisma.normalizedTransaction.count({ where: { ingestionId, tenantId } }),
        ]);

        return NextResponse.json({
          transactions: transactions.map((t: (typeof transactions)[number]) => ({
            id: t.id,
            externalId: t.externalId,
            amount: Number(t.amount),
            currency: t.currency,
            date: t.date,
            description: t.description,
            category: t.category,
            paymentMethod: t.paymentMethod,
            reference: t.reference,
            metadata: t.metadata,
            createdAt: t.createdAt,
          })),
          pagination: { limit, offset, total },
        });
      } catch (err) {
        if (err instanceof TenantMembershipError) {
          return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
        }
        appLogger.error("Console ingestion transactions failed", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 120 }, requireAuth: true }
);
