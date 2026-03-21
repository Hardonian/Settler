/**
 * Activation Funnel API Route
 *
 * Provides activation funnel metrics for admin dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { safeLogger } from "@/lib/observability/safe-logger";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { prisma } from "@/shared/db/prismaClient";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check admin access
      const isAdmin = await isSuperAdmin();
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const tenantId = searchParams.get("tenantId") || undefined;

      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: "startDate and endDate query parameters are required" },
          { status: 400 }
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format. Use ISO 8601 format." },
          { status: 400 }
        );
      }

      const where: any = {
        timestamp: {
          gte: start,
          lt: end,
        },
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      const [
        signups,
        tenantsCreated,
        providersConnected,
        firstRecons,
        exceptionsCreated,
        exceptionsResolved,
        checkoutsStarted,
        checkoutsCompleted,
        paymentsFailed,
        subscriptionsCanceled,
      ] = await Promise.all([
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "user.signed_up",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "tenant.created",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "provider.connected",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "recon.first_run",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "recon.exception_created",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "recon.exception_resolved",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "billing.checkout_started",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "billing.checkout_completed",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "billing.payment_failed",
          },
        }),
        prisma.usageEvent.count({
          where: {
            ...where,
            eventType: "billing.subscription_canceled",
          },
        }),
      ]);

      const conversionRates = {
        signupToConnect: signups > 0 ? (providersConnected / signups) * 100 : 0,
        connectToRecon: providersConnected > 0 ? (firstRecons / providersConnected) * 100 : 0,
        reconToResolved: exceptionsCreated > 0 ? (exceptionsResolved / exceptionsCreated) * 100 : 0,
        checkoutToCompleted:
          checkoutsStarted > 0 ? (checkoutsCompleted / checkoutsStarted) * 100 : 0,
      };

      return NextResponse.json({
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        metrics: {
          signups,
          tenantsCreated,
          providersConnected,
          firstRecons,
          exceptionsCreated,
          exceptionsResolved,
          checkoutsStarted,
          checkoutsCompleted,
          paymentsFailed,
          subscriptionsCanceled,
          conversionRates,
        },
      });
    } catch (error) {
      await safeLogger.error("[Activation Funnel] Failed to get metrics", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        { error: "Failed to retrieve activation funnel metrics" },
        { status: 500 }
      );
    }
    // Note: Using shared Prisma singleton - don't disconnect (handles connection pooling)
  },
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
