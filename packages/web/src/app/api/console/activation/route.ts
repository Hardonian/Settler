import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { getConsoleActivationOverview } from "@/lib/server/console/activation-overview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET() {
      const overview = await getConsoleActivationOverview();

      if (overview.authState === "unauthenticated") {
        return NextResponse.json({ error: "Unauthorized", overview }, { status: 401 });
      }

      return NextResponse.json({
        data: overview,
        overview,
      });
    },
    { feature: "GET Console Activation" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 60 }, requireAuth: true }
);
