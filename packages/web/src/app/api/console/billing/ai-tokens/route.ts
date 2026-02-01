/**
 * AI Tokens Add-On API Route
 *
 * DEPRECATED: AI tokens removed from pricing model.
 * This route is kept for backward compatibility but returns empty state.
 *
 * New pricing model: Volume + Exception Supervision
 * - Reconciliation volume: $0.01 per reconciliation
 * - Exception review: $0.10 per exception requiring review
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCorrelationId, addCorrelationHeaders } from "@/lib/monitoring/correlation";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET - Returns empty state (AI tokens deprecated)
 */
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET() {
      const correlationId = await getCorrelationId();

      try {
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          return addCorrelationHeaders(response, correlationId);
        }

        // Return empty state - AI tokens no longer part of pricing model
        const response = NextResponse.json({
          included: 0,
          used: 0,
          remaining: 0,
          addOns: [],
          message:
            "AI tokens are no longer part of pricing. Pricing is now based on reconciliation volume and exception supervision.",
        });
        return addCorrelationHeaders(response, correlationId);
      } catch (_error) {
        // Never return 500 - return graceful error response
        const response = NextResponse.json(
          {
            success: false,
            error: "Failed to process request",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 200 }
        );
        return addCorrelationHeaders(response, correlationId);
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

/**
 * POST - Purchase AI token add-on
 * DEPRECATED: Returns error
 */
export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(_request: NextRequest) {
      const correlationId = await getCorrelationId();

      try {
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          return addCorrelationHeaders(response, correlationId);
        }

        // AI tokens deprecated - return error
        const response = NextResponse.json(
          {
            error: "AI tokens deprecated",
            message:
              "AI tokens are no longer part of pricing. Pricing is now based on reconciliation volume and exception supervision. See /pricing for details.",
          },
          { status: 410 } // 410 Gone
        );
        return addCorrelationHeaders(response, correlationId);
      } catch (_error) {
        // Never return 500 - return graceful error response
        const response = NextResponse.json(
          {
            success: false,
            error: "Failed to process request",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 200 }
        );
        return addCorrelationHeaders(response, correlationId);
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: true }
);
