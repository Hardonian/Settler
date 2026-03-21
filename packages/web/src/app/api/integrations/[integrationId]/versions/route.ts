import { NextRequest, NextResponse } from "next/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest, { params }: { params: { integrationId: string } }) {
      try {
        const { integrationId } = params;

        // Version registry is not yet implemented.
        // Return an honest response indicating the feature is unavailable.
        return NextResponse.json({
          integrationId,
          available: false,
          message:
            "Integration version tracking is not yet available. Adapter versions are managed through deployment configuration.",
        });
      } catch (error) {
        appLogger.error("Error in versions GET", error);
        return NextResponse.json(
          {
            success: false,
            error: "An error occurred",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 500 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
