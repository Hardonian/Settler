import { NextResponse } from "next/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { requireAdmin } from "@/lib/api/auth-gate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CapabilityStatus = "configured" | "setup_required";

function getStripeCapability() {
  const hasSecret = Boolean(process.env.STRIPE_SECRET_KEY);
  const requiredPriceEnv = [
    process.env.STRIPE_PRICE_STARTER,
    process.env.STRIPE_PRICE_GROWTH,
    process.env.STRIPE_PRICE_SCALE,
  ];
  const missingPriceVars = requiredPriceEnv.filter((value) => !value).length;
  const configured = hasSecret && missingPriceVars === 0;

  return {
    status: (configured ? "configured" : "setup_required") as CapabilityStatus,
    configured,
    missing: {
      STRIPE_SECRET_KEY: !hasSecret,
      STRIPE_PRICE_IDS: missingPriceVars > 0,
    },
    setupSteps: configured
      ? []
      : [
          "Set STRIPE_SECRET_KEY.",
          "Set STRIPE_PRICE_STARTER, STRIPE_PRICE_GROWTH, and STRIPE_PRICE_SCALE.",
          "Configure STRIPE_WEBHOOK_SECRET for subscription sync.",
        ],
  };
}

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: Request) {
      const adminCheck = await requireAdmin(request as any);
      if (!adminCheck.isAdmin) {
        return adminCheck.error!;
      }

      const stripe = getStripeCapability();

      return NextResponse.json({
        integrations: {
          stripe,
        },
        generatedAt: new Date().toISOString(),
      });
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 60 }, requireAuth: true }
);
