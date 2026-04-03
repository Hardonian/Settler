/**
 * GET /api/console/intelligence
 *
 * Returns the CrossRunIntelligenceSummary for the authenticated tenant.
 * This endpoint powers the Reconciliation Intelligence Timeline surface.
 *
 * Security model:
 * - Authentication required via withSecurity
 * - Tenant scope resolved from session membership — never from caller input
 * - All Prisma queries are scoped to the resolved tenantIds
 * - Rate-limited to 30 requests per 60 seconds (not a hot-path surface)
 * - Fail-closed: any scope resolution failure returns 401 or 503, never leaks
 */

import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { requireActiveSubscription } from "@/lib/security/billing-enforcement";
import { resolveTenantMembershipScope } from "@/lib/supabase/tenant-membership";
import { prisma } from "@/shared/db/prismaClient";
import { buildCrossRunIntelligenceSummary } from "@settler/reconciliation-core";

export const dynamic = "force-dynamic";

export const GET = withSecurity(
  async function GET(request: NextRequest): Promise<NextResponse> {
    // Billing gate
    const billing = await requireActiveSubscription(request);
    if (!billing.allowed) {
      return (
        billing.error ??
        NextResponse.json(
          {
            error: "Subscription required",
            code: "SUBSCRIPTION_REQUIRED",
          },
          { status: 403 }
        )
      );
    }

    // Tenant scope — fail-closed
    let tenantIds: string[];
    try {
      const scope = await resolveTenantMembershipScope();
      tenantIds = scope.tenantIds;
    } catch {
      return NextResponse.json(
        {
          error: "Tenant scope is unavailable.",
          code: "TENANT_SCOPE_UNAVAILABLE",
          capability: { state: "degraded", reason: "tenant_scope_unavailable" },
        },
        { status: 503 }
      );
    }

    if (tenantIds.length === 0) {
      return NextResponse.json(
        {
          error: "No tenant membership found.",
          code: "TENANT_REQUIRED",
          capability: { state: "setup_required", reason: "no_tenant_membership" },
        },
        { status: 409 }
      );
    }

    // Build intelligence summary — always returns a valid object, never throws
    const summary = await buildCrossRunIntelligenceSummary(prisma, tenantIds);

    return NextResponse.json(summary, {
      headers: {
        // Intelligence surface is tenant-specific; never share across users
        "Cache-Control": "private, no-store",
      },
    });
  },
  {
    rateLimit: { windowMs: 60_000, maxRequests: 30 },
    requireAuth: true,
  }
);
