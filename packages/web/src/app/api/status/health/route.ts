/**
 * Public connectivity health — current reachability of core dependencies only.
 *
 * Does not report KPIs, engagement, historical uptime, or SLA posture.
 * On failure, returns HTTP 200 with degraded envelope (no silent 500s for probes).
 */

import { NextResponse } from "next/server";
import { publicRoute } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  connectivityHealthProbeFailed,
  probeRuntimeConnectivityHealth,
} from "@/lib/status/runtime-connectivity-health";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const GET = withSecurity(
  publicRoute(async function GET() {
    try {
      const health = await probeRuntimeConnectivityHealth();

      return NextResponse.json(
        {
          kind: "settler.runtime_connectivity",
          status: health.overall,
          healthy: health.overall === "healthy",
          checks: health.checks,
          degraded_reasons: health.degraded_reasons,
          timestamp: health.timestamp,
          scope_note:
            "Point-in-time connectivity only. No uptime percent, RPO/RTO, or incident history is implied.",
        },
        { status: 200 }
      );
    } catch (error) {
      appLogger.error("Runtime connectivity health check error", error);
      const ts = new Date().toISOString();
      const failed = connectivityHealthProbeFailed(ts);
      return NextResponse.json(
        {
          kind: "settler.runtime_connectivity",
          status: "degraded",
          healthy: false,
          checks: failed.checks,
          degraded_reasons: failed.degraded_reasons,
          error: "Unable to complete health probe",
          message: "Connectivity state unknown; treat as degraded.",
          timestamp: ts,
          scope_note:
            "Point-in-time connectivity only. No uptime percent, RPO/RTO, or incident history is implied.",
        },
        { status: 200 }
      );
    }
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
