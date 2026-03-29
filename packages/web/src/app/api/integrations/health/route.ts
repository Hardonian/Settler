import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicRoute } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  getExternalPlatformStatuses,
  summarizePlatformStatus,
} from "@/lib/integrations/platform-stack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  publicRoute(async function GET() {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const platformServices = await getExternalPlatformStatuses();

      // Get user's integrations
      const { data: userIntegrations } = await supabase
        .from("integration_credentials")
        .select("integration_id, last_sync_at, status")
        .eq("user_id", user.id)
        .eq("is_connected", true);

      type IntegrationRow = {
        integration_id: string;
        last_sync_at?: string | null;
        status?: string;
      };

      const integrations = (userIntegrations || []).map((integration: IntegrationRow) => {
        // Determine status based on last sync and error rates
        const lastSync = integration.last_sync_at ? new Date(integration.last_sync_at) : null;
        const hoursSinceSync = lastSync
          ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
          : Infinity;

        let status: "healthy" | "degraded" | "down" | "unknown" = "unknown";
        if (hoursSinceSync < 1) {
          status = "healthy";
        } else if (hoursSinceSync < 24) {
          status = "degraded";
        } else if (hoursSinceSync >= 24) {
          status = "down";
        }

        return {
          integrationId: integration.integration_id,
          name:
            (integration.integration_id || "").charAt(0).toUpperCase() +
            (integration.integration_id || "").slice(1),
          status,
          lastSync: integration.last_sync_at || null,
          hoursSinceSync: Number.isFinite(hoursSinceSync) ? Math.round(hoursSinceSync) : null,
          warnings:
            status === "degraded"
              ? ["Last sync was more than 1 hour ago"]
              : status === "down"
                ? ["Last sync was more than 24 hours ago"]
                : status === "unknown"
                  ? ["No sync history available"]
                  : [],
        };
      });

      return NextResponse.json({
        integrations,
        platform: {
          status: summarizePlatformStatus(platformServices),
          services: platformServices,
        },
      });
    } catch (error) {
      appLogger.error("Error in integrations/health GET", error);
      return NextResponse.json(
        {
          integrations: [],
          platform: {
            status: "degraded",
            services: await getExternalPlatformStatuses(),
          },
          error: error instanceof Error ? error.message : "Failed to fetch integrations",
          degraded: true,
        },
        { status: 503 }
      );
    }
  }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
