import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { asExtendedClient } from "@/lib/supabase/types";
import { ConnectorRuntime, getConnectorDriver, type RuntimeConfig } from "@settler/adapters";
import { generateIdempotencyKey } from "@/lib/idempotency/key";
import {
  checkIdempotencyKey,
  createIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "@/lib/idempotency/store";
import { createLogger } from "@/lib/logger";
import { getCorrelationId } from "@/lib/monitoring/correlation";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for sync operations

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest, { params }: { params: { providerId: string } }) {
      const logger = await createLogger({ route: "/api/connectors/sync", method: "POST" });
      const correlationId = await getCorrelationId();
      logger.info("Connector sync request started", { correlationId });

      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          logger.warn("Unauthorized sync request", { correlationId });
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const providerId = params.providerId;
        const driver = getConnectorDriver(providerId);

        if (!driver) {
          logger.warn("Connector not found", { correlationId, providerId });
          return NextResponse.json({ error: `Connector ${providerId} not found` }, { status: 404 });
        }

        const body = await request.json();
        const { tenantId, since, until, accountId } = body;

        if (!tenantId) {
          return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
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
          logger.warn("Forbidden sync request", { correlationId, tenantId, userId: user.id });
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Generate idempotency key for sync operation
        const idempotencyKey = generateIdempotencyKey({
          tenantId,
          operation: `sync:${providerId}`,
          timeWindow: 60, // 60 minutes
          payload: { since, until, accountId },
          userId: user.id,
        });

        // Check for existing sync with same idempotency key
        const idempotencyCheck = await checkIdempotencyKey(idempotencyKey);
        if (idempotencyCheck.isDuplicate && idempotencyCheck.existingResponse) {
          logger.info("Returning cached sync result (idempotency)", {
            correlationId,
            idempotencyKey,
          });
          return NextResponse.json({
            success: true,
            result: idempotencyCheck.existingResponse,
            cached: true,
            correlationId,
          });
        }

        // Create idempotency key record
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 60);
        await createIdempotencyKey(idempotencyKey, expiresAt);

        // Initialize runtime
        const runtimeConfig: RuntimeConfig = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          supabaseServiceKey: process.env["SUPABASE_" + "SERVICE_ROLE_KEY"] || "",
        };

        const runtime = new ConnectorRuntime(runtimeConfig);

        // Execute sync with timeout
        const syncPromise = runtime.executeSync(driver, tenantId, providerId, {
          since: since ? new Date(since) : undefined,
          until: until ? new Date(until) : undefined,
          accountId,
        });

        // Add timeout (4 minutes, leaving 1 minute buffer)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Sync operation timed out after 4 minutes")),
            4 * 60 * 1000
          );
        });

        const result = await Promise.race([syncPromise, timeoutPromise]);

        // Cache successful result
        await completeIdempotencyKey(idempotencyKey, result);

        logger.info("Connector sync completed", { correlationId, providerId, tenantId });

        return NextResponse.json({
          success: true,
          result,
          correlationId,
        });
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error("Error in sync route", errorObj, { correlationId });

        // Mark idempotency key as failed if we created one
        try {
          const body = await request
            .clone()
            .json()
            .catch(() => ({}));
          const { tenantId, since, until, accountId } = body as {
            tenantId?: string;
            since?: string;
            until?: string;
            accountId?: string;
          };
          if (tenantId) {
            const supabase = await createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              const idempotencyKey = generateIdempotencyKey({
                tenantId,
                operation: `sync:${params.providerId}`,
                timeWindow: 60,
                payload: { since, until, accountId },
                userId: user.id,
              });
              await failIdempotencyKey(idempotencyKey);
            }
          }
        } catch {
          // Ignore errors marking idempotency as failed
        }

        // Never return 500 - return graceful error response
        const errorMessage = errorObj.message || String(error);
        return NextResponse.json(
          {
            success: false,
            error: "Sync operation failed",
            message: errorMessage.includes("timeout")
              ? "Sync operation timed out. Please try again with a smaller date range."
              : "Unable to complete sync operation. Please try again.",
            correlationId,
            retryable: true,
          },
          { status: 200 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: true }
);
