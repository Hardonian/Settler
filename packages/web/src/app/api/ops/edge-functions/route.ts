import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(): Promise<NextResponse> {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Edge function monitoring requires Supabase Management API integration,
        // which is not yet wired. Return an honest unavailable state.
        return NextResponse.json({
          functions: [],
          available: false,
          message:
            "Edge function monitoring requires Supabase Management API integration. Configure SUPABASE_MANAGEMENT_API_KEY to enable.",
        });
      } catch (error) {
        appLogger.error("Error in edge-functions GET", error);
        return NextResponse.json(
          {
            functions: [],
            error: "Failed to retrieve edge function status",
          },
          { status: 503 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
