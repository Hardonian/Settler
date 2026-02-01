import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { asExtendedClient } from "@/lib/supabase/types";
import { getConnectorDriver } from "@settler/adapters";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { emitLifecycleEventSafe, LifecycleEventType } from "@/lib/ops/lifecycle-events";
import { prisma } from "@/shared/db/prismaClient";
import { appLogger } from "@/lib/utils/logger";
import { encrypt } from "@/lib/security/encryption";
import { sanitizeString } from "@/lib/security/input-sanitization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withUniversalBillingGate(
  async function GET(request: NextRequest, { params }: { params: { providerId: string } }) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }

      const providerId = params.providerId;
      const driver = getConnectorDriver(providerId);

      if (!driver || !driver.handleCallback) {
        return NextResponse.json(
          { error: `Connector ${providerId} does not support OAuth callback` },
          { status: 400 }
        );
      }

      const searchParams = request.nextUrl.searchParams;
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        // Sanitize error message to prevent XSS
        const sanitizedError = sanitizeString(error);
        return NextResponse.redirect(
          new URL(
            `/dashboard/integrations?error=${encodeURIComponent(sanitizedError)}`,
            request.url
          )
        );
      }

      if (!code) {
        return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
      }

      const typedSupabase = asExtendedClient(supabase);

      // Get connector config
      const { data: connectors } = await typedSupabase
        .from("connectors")
        .select("id, tenant_id, config")
        .eq("provider_id", providerId)
        .eq("status", "connecting")
        .limit(1);

      if (!connectors || connectors.length === 0) {
        return NextResponse.json({ error: "Connector not found" }, { status: 404 });
      }

      const connector = connectors[0];
      if (!connector) {
        return NextResponse.json({ error: "Connector not found" }, { status: 404 });
      }

      // Verify tenant access
      const { data: membership } = await typedSupabase
        .from("app_private.memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("tenant_id", connector.tenant_id)
        .eq("status", "active")
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Handle callback
      const redirectUri = `${request.nextUrl.origin}/api/connectors/callback/${providerId}`;
      const tenantId = typeof connector.tenant_id === "string" ? connector.tenant_id : "";
      if (!tenantId) {
        return NextResponse.json({ error: "Invalid connector tenant_id" }, { status: 400 });
      }
      const authResult = await driver.handleCallback(code, state || "", {
        tenantId,
        redirectUri,
      });

      // Store credentials (encrypted with AES-256-GCM)
      const { error: credError } = await typedSupabase.from("connector_credentials").upsert(
        {
          connector_id: typeof connector.id === "string" ? connector.id : "",
          tenant_id: tenantId,
          encrypted_credentials: authResult.metadata
            ? encrypt(JSON.stringify(authResult.metadata))
            : "{}",
          access_token_encrypted: authResult.accessToken ? encrypt(authResult.accessToken) : null,
          refresh_token_encrypted: authResult.refreshToken
            ? encrypt(authResult.refreshToken)
            : null,
          ...(authResult.expiresIn
            ? {
                token_expires_at: new Date(Date.now() + authResult.expiresIn * 1000).toISOString(),
              }
            : {}),
        },
        {
          onConflict: "connector_id",
        }
      );

      if (credError) {
        appLogger.error("Failed to store credentials", credError);
        // Safe redirect with static error message
        return NextResponse.redirect(
          new URL("/dashboard/integrations?error=credential_storage_failed", request.url)
        );
      }

      // Update connector status
      await typedSupabase
        .from("connectors")
        .update({
          status: "connected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", typeof connector.id === "string" ? connector.id : String(connector.id));

      // Emit lifecycle event: provider connected
      try {
        // Check if this is the first provider connection for this tenant
        const connectorIdStr =
          typeof connector.id === "string" ? connector.id : String(connector.id);
        const { data: otherConnectorsData } = await typedSupabase
          .from("connectors")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("status", "connected")
          .limit(10);

        // Filter out current connector manually since neq might not be available
        const otherConnectors = Array.isArray(otherConnectorsData)
          ? otherConnectorsData.filter((c: Record<string, unknown>) => {
              const cId = typeof c.id === "string" ? c.id : String(c.id);
              return cId !== connectorIdStr;
            })
          : [];

        const isFirstConnection = otherConnectors.length === 0;

        // Get billing account for tenant
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { billingAccountId: true },
        });

        await emitLifecycleEventSafe(LifecycleEventType.PROVIDER_CONNECTED!, {
          userId: user.id,
          tenantId,
          ...(tenant?.billingAccountId ? { billingAccountId: tenant.billingAccountId } : {}),
          properties: {
            provider_id: providerId,
            is_first_connection: isFirstConnection,
          },
        } as {
          userId: string;
          tenantId: string;
          billingAccountId?: string;
          properties: Record<string, unknown>;
        });
      } catch (eventError) {
        // Don't fail the connection if event emission fails
        appLogger.error("Failed to emit provider connected event", eventError);
      }

      // Safe redirect with static success message
      return NextResponse.redirect(
        new URL("/dashboard/integrations?success=provider_connected", request.url)
      );
    } catch (error) {
      appLogger.error("Error in callback route", error);
      // Sanitize error message before redirecting
      const errorMessage =
        error instanceof Error ? sanitizeString(error.message) : "callback_failed";
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }
  },
  { feature: "GET API" }
);
