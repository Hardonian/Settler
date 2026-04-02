/**
 * Webhooks API Route
 *
 * GET - List webhooks
 * POST - Create webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { createWebhook, listWebhooks, CreateWebhookInput } from "@/lib/webhooks/manager";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      try {
        const tenantContext = await requireTenantRequestContext(request);
        const webhooks = await listWebhooks(tenantContext.userId, tenantContext.tenantId);

        // Don't expose secrets in list
        const safeWebhooks = webhooks.map((w) => ({
          ...w,
          secret: w.secret.substring(0, 12) + "...", // Show only prefix
        }));

        return NextResponse.json({
          webhooks: safeWebhooks,
          capability: {
            state: "available",
          },
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }
        appLogger.error("[Webhooks API] Error", error);
        return NextResponse.json(
          {
            error: "Webhook list is currently unavailable",
            webhooks: [],
            capability: {
              state: "degraded",
              reason: "webhook_list_unavailable",
            },
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
    async function POST(request: NextRequest) {
      try {
        const tenantContext = await requireTenantRequestContext(request);

        const body = await request.json().catch(() => ({}));

        // Validate inputs
        if (!body.url || typeof body.url !== "string") {
          return NextResponse.json(
            { error: "URL is required and must be a string" },
            { status: 400 }
          );
        }

        if (!body.events || !Array.isArray(body.events)) {
          return NextResponse.json({ error: "Events must be an array" }, { status: 400 });
        }

        const input: CreateWebhookInput = {
          url: body.url,
          events: body.events,
          secret: body.secret,
        };

        const webhook = await createWebhook(tenantContext.userId, tenantContext.tenantId, input);

        // Return full secret only on creation
        return NextResponse.json({ webhook, capability: { state: "available" } }, { status: 201 });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }
        const errorMessage = error instanceof Error ? error.message : "Failed to create webhook";
        const status = error instanceof Error && errorMessage.startsWith("Invalid") ? 400 : 503;
        return NextResponse.json(
          {
            error: errorMessage,
            capability: {
              state: status === 400 ? "unavailable" : "degraded",
              reason: status === 400 ? "validation_failed" : "webhook_create_unavailable",
            },
          },
          { status }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);
