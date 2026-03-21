import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Probe real database connectivity
        const dbStart = Date.now();
        let dbStatus: "healthy" | "degraded" | "down" = "down";
        let dbLatency = 0;
        try {
          const { error } = await supabase.from("billing_accounts").select("id").limit(1);
          dbLatency = Date.now() - dbStart;
          dbStatus = error ? "degraded" : dbLatency > 2000 ? "degraded" : "healthy";
        } catch {
          dbLatency = Date.now() - dbStart;
          dbStatus = "down";
        }

        const health = [
          {
            component: "API Server",
            status: "healthy" as const,
            metrics: {
              uptime: Math.round(process.uptime()),
              memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            },
          },
          {
            component: "Database",
            status: dbStatus,
            metrics: {
              latencyMs: dbLatency,
            },
          },
        ];

        return NextResponse.json({ health });
      } catch (error) {
        appLogger.error("Error in system-health GET", error);
        return NextResponse.json(
          {
            success: false,
            error: "An error occurred",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 503 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
