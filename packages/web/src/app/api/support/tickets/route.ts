/**
 * Legacy support tickets API (non-canonical).
 *
 * Canonical operator surface is /api/console/support/tickets over support intake records.
 */

import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function deprecated() {
  return NextResponse.json(
    {
      code: "LEGACY_SUPPORT_TICKETS_DEPRECATED",
      message:
        "Legacy support ticket endpoints are deprecated. Use /api/v1/support/intake for submission and /api/console/support/tickets for operator triage.",
      canonicalSubmissionRoute: "/api/v1/support/intake",
      canonicalOperatorRoute: "/api/console/support/tickets",
      trustState: "unavailable",
      degradedReasonCode: "legacy_support_tickets_route_removed",
      status: "deprecated",
    },
    { status: 410 }
  );
}

export const GET = withSecurity(async function GET() {
  return deprecated();
});

export const POST = withSecurity(async function POST() {
  return deprecated();
});
