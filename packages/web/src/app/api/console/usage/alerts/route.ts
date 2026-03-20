/**
 * Usage Alerts API Route
 *
 * Returns usage limit alerts for the authenticated user.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserUsageAlerts } from "@/lib/alerts/usage-alerts";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  estimateJsonPayloadBytes,
  recordUsageEndpointMetrics,
} from "@/lib/console/usage-observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET() {
      const startedAt = Date.now();
      let statusCode = 500;
      let payloadBytes = 0;
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          const unauthorizedPayload = { error: "Unauthorized" };
          statusCode = 401;
          payloadBytes = estimateJsonPayloadBytes(unauthorizedPayload);
          return NextResponse.json(unauthorizedPayload, { status: 401 });
        }

        const alerts = await getCurrentUserUsageAlerts();
        const payload = { alerts };
        statusCode = 200;
        payloadBytes = estimateJsonPayloadBytes(payload);
        return NextResponse.json(payload);
      } catch (error) {
        appLogger.error("[Usage Alerts API] Error", error);
        const fallbackPayload = { alerts: [] };
        statusCode = 200;
        payloadBytes = estimateJsonPayloadBytes(fallbackPayload);
        return NextResponse.json(fallbackPayload);
      } finally {
        await recordUsageEndpointMetrics({
          endpoint: "/api/console/usage/alerts",
          method: "GET",
          statusCode,
          latencyMs: Date.now() - startedAt,
          payloadBytes,
          mode: "sync",
        });
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
