/**
 * Ops Customers API
 */

// ROUTE_CLASS: admin-internal
// AUTH: session + adminRole — returns all billing accounts

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth-gate";
import { prisma } from "@/shared/db/prismaClient";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: Request) {
      const adminCheck = await requireAdmin(request as any);
      if (!adminCheck.isAdmin) {
        return adminCheck.error!;
      }

      try {
        const billingAccounts = await prisma.billingAccount.findMany({
          take: 100,
          orderBy: { createdAt: "desc" },
        });

        const customers = billingAccounts.map((account: (typeof billingAccounts)[number]) => ({
          id: account.id,
          email: account.email || "Unknown",
          status: account.status,
          createdAt: account.createdAt.toISOString(),
          usage: 0, // TODO: Calculate from ops_usage_aggregates
        }));

        return NextResponse.json({ customers });
      } catch (error) {
        appLogger.error("Failed to fetch customers", error);
        return NextResponse.json(
          { error: "Failed to fetch customers" },
          { status: 500 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
