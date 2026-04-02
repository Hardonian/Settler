/**
 * Webhook Management API Route
 *
 * PATCH - Update webhook
 * DELETE - Delete webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { updateWebhook, deleteWebhook } from "@/lib/webhooks/manager";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withSecurity(
  withUniversalBillingGate(
    async function PATCH(request: NextRequest, { params }: RouteParams) {
      try {
        const tenantContext = await requireTenantRequestContext(request);
        const { id } = await params;

        const body = await request.json();
        const webhook = await updateWebhook(id, tenantContext.userId, tenantContext.tenantId, {
          url: body.url,
          events: body.events,
          status: body.active ? "active" : "inactive",
        });

        return NextResponse.json({ webhook, capability: { state: "available" } });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }
        const errorMessage = error instanceof Error ? error.message : "Failed to update webhook";
        const status = errorMessage === "Webhook not found" ? 404 : 503;
        return NextResponse.json(
          {
            error: errorMessage,
            capability: {
              state: status === 404 ? "unavailable" : "degraded",
              reason: status === 404 ? "webhook_not_found" : "webhook_update_unavailable",
            },
          },
          { status }
        );
      }
    },
    { feature: "PATCH API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

export const DELETE = withSecurity(
  withUniversalBillingGate(
    async function DELETE(request: NextRequest, { params }: RouteParams) {
      try {
        const tenantContext = await requireTenantRequestContext(request);
        const { id } = await params;

        await deleteWebhook(id, tenantContext.userId, tenantContext.tenantId);

        return NextResponse.json({ success: true, capability: { state: "available" } });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }
        const errorMessage = error instanceof Error ? error.message : "Failed to delete webhook";
        const status = errorMessage === "Webhook not found" ? 404 : 503;
        return NextResponse.json(
          {
            error: errorMessage,
            capability: {
              state: status === 404 ? "unavailable" : "degraded",
              reason: status === 404 ? "webhook_not_found" : "webhook_delete_unavailable",
            },
          },
          { status }
        );
      }
    },
    { feature: "DELETE API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);
