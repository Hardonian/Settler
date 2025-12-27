import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicRoute } from '@/middleware/billing-gate-universal';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const GET = publicRoute(async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    
    // Mock health data (in production, fetch from monitoring system)
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

      // Mock metrics (in production, fetch from actual monitoring)
      const successRate = status === "healthy" ? 99.5 : status === "degraded" ? 95.0 : 0;
      const avgResponseTime = status === "healthy" ? 150 : status === "degraded" ? 500 : 0;
      const errorCount = status === "healthy" ? 0 : status === "degraded" ? 5 : 10;

      return {
        integrationId: integration.integration_id,
        name:
          (integration.integration_id || '').charAt(0).toUpperCase() + (integration.integration_id || '').slice(1),
        status,
        lastSync: integration.last_sync_at || new Date().toISOString(),
        successRate,
        avgResponseTime,
        errorCount,
        warnings:
          status === "degraded"
            ? ["Response times higher than normal", "Some syncs failing"]
            : status === "down"
              ? ["Integration not responding", "Last sync over 24 hours ago"]
              : [],
      };
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Error in integrations/health GET:", error);
    // Return empty array instead of 500 - graceful degradation
    return NextResponse.json({ 
      integrations: [],
      error: error instanceof Error ? error.message : "Failed to fetch integrations",
      degraded: true,
    }, { status: 200 });
  }
});
