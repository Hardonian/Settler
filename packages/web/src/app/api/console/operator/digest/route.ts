import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { getOperatorDigest } from "@/lib/server/console/operator-digest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET() {
      const digest = await getOperatorDigest();
      return NextResponse.json({ data: digest });
    },
    { feature: "GET Operator Digest" }
  ),
  { rateLimit: { windowMs: 60_000, maxRequests: 60 }, requireAuth: true }
);
