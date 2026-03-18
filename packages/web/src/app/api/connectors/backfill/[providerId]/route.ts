import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { asExtendedClient } from "@/lib/supabase/types";
import { ConnectorRuntime, getConnectorDriver, type RuntimeConfig } from "@settler/adapters";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withUniversalBillingGate(
  async function POST(request: NextRequest, { params }: { params: { providerId: string } }) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const providerId = params.providerId;
      const driver = getConnectorDriver(providerId);

      if (!driver) {
        return NextResponse.json({ error: `Connector ${providerId} not found` }, { status: 404 });
      }

      const body = await request.json();
      const { tenantId, since, until, accountId } = body;

      if (!tenantId) {
        return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
      }

      if (!since) {
        return NextResponse.json({ error: "since date is required" }, { status: 400 });
      }

      const typedSupabase = asExtendedClient(supabase);

      // Verify tenant access
      const { data: membership } = await typedSupabase
        .from("app_private.memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Initialize runtime
      const runtimeConfig: RuntimeConfig = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        supabaseServiceKey: process.env["SUPABASE_SERVICE_ROLE_KEY"] || "",
      };

      const runtime = new ConnectorRuntime(runtimeConfig);

      // Execute backfill sync
      const result = await runtime.executeSync(driver, tenantId, providerId, {
        since: new Date(since),
        until: until ? new Date(until) : new Date(),
        accountId,
      });

      return NextResponse.json({
        success: true,
        result,
        message: `Backfilled data from ${since} to ${until || "now"}`,
      });
    } catch (error) {
      appLogger.error("Error in backfill route", error);
      // Never return 500 - return graceful error response
      return NextResponse.json(
        {
          success: false,
          error: "Failed to execute backfill",
          message: error instanceof Error ? error.message : String(error),
          result: null,
        },
        { status: 200 }
      );
    }
  },
  { feature: "POST API" }
);
