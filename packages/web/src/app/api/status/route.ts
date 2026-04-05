import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders, handleCors } from "@/lib/api/cors";
import { publicRoute } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import { probeRuntimeConnectivityHealth } from "@/lib/status/runtime-connectivity-health";

// Cache status for 30 seconds to reduce load while keeping it fresh
export const revalidate = 30;
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Prisma and Supabase
export const maxDuration = 10; // 10 seconds max for health checks

export const GET = withSecurity(
  publicRoute(async function GET(request: NextRequest): Promise<NextResponse> {
    // Handle CORS preflight
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    try {
      const connectivity = await probeRuntimeConnectivityHealth();

      // Uptime values are not measured historically — report only current connectivity status.
      // Do not display fabricated uptime percentages.
      const apiOk = connectivity.checks.runtime_env.ok;
      const dbOk = connectivity.checks.database.ok;

      const systems = [
        {
          name: "Reconciliation Engine",
          status: apiOk ? ("operational" as const) : ("degraded" as const),
        },
        {
          name: "Receipts Processing",
          status: apiOk ? ("operational" as const) : ("degraded" as const),
        },
        {
          name: "Convert Service",
          status: apiOk ? ("operational" as const) : ("degraded" as const),
        },
        {
          name: "Feature Flags",
          status: apiOk ? ("operational" as const) : ("degraded" as const),
        },
        {
          name: "Database",
          status: dbOk ? ("operational" as const) : ("degraded" as const),
        },
      ];

      const hasDegraded = systems.some((s) => s.status === "degraded");
      const overallStatus = hasDegraded ? "degraded" : "operational";

      const response = NextResponse.json({
        systems,
        overallStatus,
        connectivity: {
          checks: connectivity.checks,
          degraded_reasons: connectivity.degraded_reasons,
          timestamp: connectivity.timestamp,
        },
      });

      // Add caching headers for better performance
      response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

      // Add CORS headers
      return addCorsHeaders(response, request);
    } catch (error) {
      appLogger.error("Error in status GET", error);
      // Never return 500 - return degraded status with graceful error message
      const errorResponse = NextResponse.json(
        {
          systems: [],
          overallStatus: "degraded",
          error: "Unable to fetch system status",
          message: "Please try again later",
        },
        { status: 200 }
      );
      // Don't cache errors
      errorResponse.headers.set("Cache-Control", "no-store");
      return addCorsHeaders(errorResponse, request);
    }
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
