import { NextRequest, NextResponse } from "next/server";

import { getConnectorDriver, verifyWebhook } from "@settler/adapters";

import { createClient } from "@/lib/supabase/server";
import { asExtendedClient } from "@/lib/supabase/types";
import { appLogger } from "@/lib/utils/logger";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

function parseWebhookJson(rawBody: string): Record<string, unknown> | null {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTimestampFresh(timestampHeader: string | null): boolean {
  if (!timestampHeader) {
    return true;
  }

  const parsed = Number(timestampHeader);
  if (!Number.isFinite(parsed)) {
    return false;
  }

  const receivedAtMs = parsed > 1_000_000_000_000 ? parsed : parsed * 1000;
  const age = Math.abs(Date.now() - receivedAtMs);
  return age <= WEBHOOK_TIMESTAMP_TOLERANCE_MS;
}

export const POST = withUniversalBillingGate(
  async function POST(request: NextRequest, { params }: { params: { providerId: string } }) {
    try {
      const providerId = params.providerId;
      const driver = getConnectorDriver(providerId);

      if (!driver || !driver.handleWebhook) {
        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_PROVIDER_UNSUPPORTED",
            message: `Connector ${providerId} does not support webhooks`,
          },
          { status: 404 }
        );
      }

      const timestamp = request.headers.get("x-webhook-timestamp");
      if (!isTimestampFresh(timestamp)) {
        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_TIMESTAMP_INVALID",
            message: "Webhook timestamp is invalid or outside allowed tolerance window",
          },
          { status: 401 }
        );
      }

      const rawBody = await request.text();
      const body = parseWebhookJson(rawBody);
      if (!body) {
        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_INVALID_JSON",
            message: "Webhook payload must be valid JSON",
          },
          { status: 400 }
        );
      }

      const signature =
        request.headers.get("x-signature") || request.headers.get("x-webhook-signature") || "";
      const secretEnvKey = `${providerId.toUpperCase()}_WEBHOOK_SECRET`;
      const webhookSecret = process.env[secretEnvKey] || "";

      if (!webhookSecret) {
        appLogger.warn("Webhook rejected: missing provider secret configuration", {
          providerId,
          secretEnvKey,
        });

        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_SECRET_NOT_CONFIGURED",
            message: `Webhook secret for ${providerId} is not configured`,
          },
          { status: 503 }
        );
      }

      if (!signature) {
        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_SIGNATURE_MISSING",
            message: "Webhook signature header is required",
          },
          { status: 401 }
        );
      }

      const verification = verifyWebhook(providerId, rawBody, signature, webhookSecret);
      if (!verification.valid) {
        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_SIGNATURE_INVALID",
            message: verification.error || "Webhook signature verification failed",
          },
          { status: 401 }
        );
      }

      const supabase = await createClient();
      const typedSupabase = asExtendedClient(supabase);

      const webhookId =
        typeof body.id === "string"
          ? body.id
          : typeof body.event_id === "string"
            ? body.event_id
            : crypto.randomUUID();

      const eventType =
        typeof body.type === "string"
          ? body.type
          : typeof body.event_type === "string"
            ? body.event_type
            : "unknown";

      const { error: webhookError } = await typedSupabase.from("webhook_events").insert({
        connector_id: null,
        tenant_id: null,
        webhook_id: webhookId,
        event_type: eventType,
        payload: body,
        signature,
        processed: false,
      });

      if (webhookError) {
        appLogger.error("Failed to store webhook event", webhookError, {
          providerId,
          webhookId,
          eventType,
        });
        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_PERSISTENCE_FAILED",
            message: "Webhook accepted but could not be persisted",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          providerId,
          webhookId,
          eventType,
          message: "Webhook accepted",
        },
        { status: 202 }
      );
    } catch (error) {
      appLogger.error("Error in webhook route", error);
      return NextResponse.json(
        {
          success: false,
          error: "WEBHOOK_PROCESSING_FAILED",
          message: "Failed to process webhook",
        },
        { status: 503 }
      );
    }
  },
  { allowPublic: true, feature: "Connector webhooks" }
);
