import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET() {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // IP allowlist requires Enterprise tier and persistent storage integration.
        // Return an honest empty state until the ip_allowlists table is wired.
        return NextResponse.json({
          allowlist: [],
          configured: false,
          message:
            "IP allowlist management requires Enterprise plan configuration. Contact support to enable.",
        });
      } catch (error) {
        appLogger.error("Error in ip-allowlist GET", error);
        return NextResponse.json(
          {
            success: false,
            error: "An error occurred",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 503 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(_request: NextRequest) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // IP allowlist persistence is not yet wired to a backing store.
        // Return 501 to prevent the client from thinking the write succeeded.
        return NextResponse.json(
          {
            error: "Not implemented",
            message:
              "IP allowlist management is not yet available. Contact support to enable for your account.",
          },
          { status: 501 }
        );
      } catch (error) {
        appLogger.error("Error in ip-allowlist POST", error);
        return NextResponse.json(
          {
            success: false,
            error: "An error occurred",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 503 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);
