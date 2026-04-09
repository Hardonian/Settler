import { NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/get-subscription-status";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Get current user's subscription status
 *
 * CRITICAL: Never returns 500 - always returns 200 with fallback status
 * This prevents client-side errors from breaking the console UI
 */
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET() {
      try {
        const status = await getSubscriptionStatus();
        return NextResponse.json(status);
      } catch (error: unknown) {
        // Log error for debugging
        appLogger.error("[subscription-status] Error getting subscription status", error, {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });

        // CRITICAL: Always return 200 with fallback status
        // Never return 500 - this breaks the console UI
        return NextResponse.json({
          tier: "unsubscribed",
          hasSubscription: false,
          isPaid: false,
          isEnterprise: false,
          // Include error message in development only
          ...(process.env.NODE_ENV === "development" && error instanceof Error && error.message
            ? { error: error.message }
            : {}),
        });
      }
    },
    { feature: "Subscription Status", allowFree: true }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
