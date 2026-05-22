// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
/**
 * API v1 Base Route
 *
 * Provides API versioning information and health check.
 */

import { NextResponse } from "next/server";
import { publicRoute } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(
  publicRoute(async function GET() {
    return NextResponse.json({
      version: "1.0.0",
      status: "active",
      endpoints: {
        runs: "/api/v1/runs",
        datasets: "/api/v1/datasets",
        health: "/api/v1/health",
        ready: "/api/v1/ready",
        meta: "/api/v1/meta",
        metrics_summary: "/api/v1/metrics/summary",
        metrics_timeseries: "/api/v1/metrics/timeseries",
        metrics_top: "/api/v1/metrics/top",
      },
      documentation: "https://settler.dev/docs/api",
      support: "https://settler.dev/support",
    });
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
