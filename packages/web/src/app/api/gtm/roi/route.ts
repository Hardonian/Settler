/**
 * ROI Calculation API Route
 *
 * Calculates ROI metrics from value events for a billing account.
 */

import { NextResponse } from "next/server";
import { calculateROI } from "@/lib/gtm/value-events";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: Request) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const billingAccountId = searchParams.get("billingAccountId");
        const startDateStr = searchParams.get("startDate");
        const endDateStr = searchParams.get("endDate");

        if (!billingAccountId || !startDateStr || !endDateStr) {
          return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const roi = await calculateROI(billingAccountId, startDate, endDate);

        return NextResponse.json(roi);
      } catch (error) {
        appLogger.error("[ROI API] Error", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to calculate ROI",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 200 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
