/**
 * Stripe Customer Portal API Route
 *
 * Creates a Stripe Customer Portal session for managing billing.
 * Includes input validation and security checks.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/shared/db/prismaClient";
import {
  createCustomerPortalSession,
  StripeConfigurationError,
} from "@/domain/billing/stripeService";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Prisma binary engine

/**
 * Validate URL format and origin
 */
function isValidOriginUrl(url: unknown): boolean {
  if (typeof url !== "string") {
    return false;
  }
  try {
    const parsed = new URL(url);
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && url.startsWith(origin);
  } catch {
    return false;
  }
}

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const billingAccount = await prisma.billingAccount.findFirst({
          where: { userId: user.id },
          select: { id: true },
        });

        if (!billingAccount) {
          return NextResponse.json({ error: "No billing account found" }, { status: 404 });
        }

        const body = await request.json();
        const { returnUrl } = body;

        if (!isValidOriginUrl(returnUrl)) {
          return NextResponse.json(
            { error: "Invalid URL format or origin for returnUrl" },
            { status: 400 }
          );
        }

        const session = await createCustomerPortalSession(billingAccount.id, returnUrl);

        if (!session.url) {
          // Never return 500 - return actionable error message
          return NextResponse.json(
            {
              error: "Unable to access billing portal",
              message:
                "We were unable to create a billing portal session. Please try again or contact support at billing@settler.dev for assistance.",
              retryable: true,
            },
            { status: 200 }
          );
        }

        return NextResponse.json({ url: session.url });
      } catch (error) {
        if (error instanceof StripeConfigurationError) {
          return NextResponse.json(
            {
              error: "Billing portal unavailable",
              message:
                "Stripe is not configured for this environment yet. Add STRIPE_SECRET_KEY to enable billing management.",
              setupRequired: true,
              retryable: false,
            },
            { status: 503 }
          );
        }

        appLogger.error("[Stripe Portal] Error creating customer portal session", error, {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Never return 500 - return actionable error message
        return NextResponse.json(
          {
            error: "Unable to access billing portal",
            message:
              "We encountered an issue accessing your billing portal. Please try again in a moment or contact support at billing@settler.dev.",
            retryable: true,
          },
          { status: 200 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: true }
);
