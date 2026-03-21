/**
 * Executive Metrics API Route
 *
 * GET /api/console/metrics - Get executive dashboard metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExecutiveMetrics, getBillingAccountMetrics } from "@/lib/metrics/service";
import {
  getCorrelationId,
  addCorrelationHeaders,
  createLogger,
} from "@/lib/monitoring/correlation";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/console/metrics
 */
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      const correlationId = await getCorrelationId();
      const logger = await createLogger({ route: "/api/console/metrics", method: "GET" });

      try {
        logger.info("Console metrics request started", { correlationId });
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check admin via database-backed role (not user_metadata which is user-controllable).
        const { getUserRole, UserRole } = await import("@/shared/auth/roles");
        const userRole = await getUserRole(user.id);
        const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.TENANT_ADMIN;
        const billingAccountId = request.nextUrl.searchParams.get("billingAccountId");

        if (billingAccountId) {
          // Get metrics for specific billing account
          const metrics = await getBillingAccountMetrics(billingAccountId);

          if (!metrics) {
            return NextResponse.json({ error: "Billing account not found" }, { status: 404 });
          }

          return NextResponse.json(metrics);
        }

        // Get global metrics (admin only)
        if (!isAdmin) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const metrics = await getExecutiveMetrics();

        logger.info("Metrics fetched successfully", { correlationId });
        const response = NextResponse.json(metrics);
        return addCorrelationHeaders(response, correlationId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("Error fetching metrics", {
          correlationId,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
        const response = NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
        return addCorrelationHeaders(response, correlationId);
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
