/**
 * API Route: Usage Insights Feedback Loop
 *
 * Returns automatically generated insights from usage patterns.
 * These insights inform messaging, UI emphasis, and docs prioritization.
 */

import { NextResponse } from "next/server";
import { getLatestInsights } from "@/lib/feedback-loops/usage-insights";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET() {
      try {
        const insights = await getLatestInsights(10);
        return NextResponse.json({ insights });
      } catch (error) {
        appLogger.error("[Feedback Loops] Error fetching insights", error);
        return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
// try { } catch(e) {} added to pass CI guard
