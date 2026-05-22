import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function legacyTriageDeprecated() {
  return NextResponse.json(
    {
      code: "LEGACY_SUPPORT_TRIAGE_DEPRECATED",
      message:
        "Legacy support triage endpoint is deprecated. Use /api/console/support/tickets for canonical intake queue reads.",
      canonicalOperatorRoute: "/api/console/support/tickets",
      trustState: "unavailable",
      degradedReasonCode: "legacy_support_triage_route_removed",
      status: "deprecated",
    },
    { status: 410 }
  );
}

export const GET = withSecurity(async function GET() {
  return legacyTriageDeprecated();
});

export const POST = withSecurity(async function POST() {
  return legacyTriageDeprecated();
});
