import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type") || "all";

        if (!["all", "jobs", "integrations", "settings"].includes(type)) {
          return NextResponse.json(
            {
              error: "Invalid export type",
            },
            { status: 400 }
          );
        }

        const exportData: Record<string, unknown> = {
          exportedAt: new Date().toISOString(),
          userId: user.id,
        };

        if (type === "all" || type === "jobs") {
          const { data: jobs } = await supabase
            .from("reconciliation_jobs")
            .select("*")
            .eq("user_id", user.id);
          exportData.jobs = jobs || [];
        }

        if (type === "all" || type === "integrations") {
          const { data: integrations } = await supabase
            .from("integration_credentials")
            .select("integration_id, is_connected, created_at")
            .eq("user_id", user.id);
          exportData.integrations = integrations || [];
        }

        if (type === "all" || type === "settings") {
          const { data: userData } = await supabase
            .from("users")
            .select("email, plan_type")
            .eq("id", user.id)
            .single();
          exportData.settings = userData || {};
        }

        return new NextResponse(JSON.stringify(exportData, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="settler-export-${type}-${new Date().toISOString().split("T")[0]}.json"`,
            "Cache-Control": "private, no-store, max-age=0",
          },
        });
      } catch (error) {
        appLogger.error("Error in export GET", error);
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
  { rateLimit: { windowMs: 60_000, maxRequests: 15 }, requireAuth: true }
);
