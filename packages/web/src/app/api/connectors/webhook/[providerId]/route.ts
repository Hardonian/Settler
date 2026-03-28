import { NextRequest, NextResponse } from "next/server";

import { getConnectorDriver, verifyWebhook } from "@settler/adapters";

import { createAdminClient } from "@/lib/supabase/server";
import { asExtendedClient } from "@/lib/supabase/types";
import { appLogger } from "@/lib/utils/logger";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { resolveConnectorWebhookContext } from "@/lib/server/resolve-connector-webhook-context";
import { assertWebhookConfigsTenantScoping } from "@/lib/server/migration-truth";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;
const WEBHOOK_RL_WINDOW_MS = 60_000;
const WEBHOOK_RL_MAX = 200;

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

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const POST = withUniversalBillingGate(
  async function POST(request: NextRequest, { params }: { params: { providerId: string } }) {
    try {
      const providerId = params.providerId;
      const ip = clientIp(request);
      const rl = checkRateLimit(`connector-webhook:${providerId}:${ip}`, {
        windowMs: WEBHOOK_RL_WINDOW_MS,
        maxRequests: WEBHOOK_RL_MAX,
      });
      if (!rl.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: "RATE_LIMITED",
            message: "Too many webhook requests; retry later",
            retryAfter: rl.retryAfter,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rl.retryAfter ?? 60),
              "X-RateLimit-Limit": String(WEBHOOK_RL_MAX),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }

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

      const migrationTruth = await assertWebhookConfigsTenantScoping(prisma);
      if (!migrationTruth.ok) {
        appLogger.error(
          "Webhook rejected: webhook_configs tenant migration not satisfied",
          undefined,
          {
            providerId,
            code: migrationTruth.code,
          }
        );
        return NextResponse.json(
          {
            success: false,
            error: migrationTruth.code,
            message: migrationTruth.message,
          },
          { status: 503 }
        );
      }

      const admin = await createAdminClient();
      if (!admin || typeof admin.from !== "function") {
        appLogger.error(
          "Webhook persistence skipped: admin Supabase client unavailable",
          undefined,
          {
            providerId,
            reason: "SUPABASE_SERVICE_ROLE_KEY_missing_or_client_init_failed",
          }
        );
        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_PERSISTENCE_UNAVAILABLE",
            message:
              "Verified webhook cannot be persisted: set SUPABASE_SERVICE_ROLE_KEY (service role) for this deployment",
          },
          { status: 503 }
        );
      }

      const resolved = await resolveConnectorWebhookContext(admin, providerId, request);
      if (!resolved.ok) {
        return NextResponse.json(
          {
            success: false,
            error: resolved.code,
            message: resolved.message,
          },
          { status: resolved.status }
        );
      }

      const typedSupabase = asExtendedClient(admin);

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
        connector_id: resolved.connectorId,
        tenant_id: resolved.tenantId,
        webhook_id: webhookId,
        event_type: eventType,
        payload: body,
        signature,
        processed: false,
      });

      if (webhookError) {
        const errObj =
          webhookError && typeof webhookError === "object"
            ? (webhookError as { code?: string; message?: string })
            : null;
        const pgCode = errObj?.code ? String(errObj.code) : "";
        const errMsg = typeof errObj?.message === "string" ? errObj.message : "";
        const isDuplicate = pgCode === "23505" || /duplicate key|unique constraint/i.test(errMsg);

        if (isDuplicate) {
          appLogger.info("Webhook duplicate delivery ignored (idempotent)", {
            providerId,
            webhookId,
            tenantId: resolved.tenantId,
          });
          return NextResponse.json(
            {
              success: true,
              duplicate: true,
              providerId,
              webhookId,
              eventType,
              tenantId: resolved.tenantId,
              message: "Webhook already recorded (duplicate delivery)",
            },
            {
              status: 200,
              headers: {
                "X-RateLimit-Limit": String(WEBHOOK_RL_MAX),
                "X-RateLimit-Remaining": String(rl.remaining),
              },
            }
          );
        }

        appLogger.error("Failed to store webhook event", webhookError, {
          providerId,
          webhookId,
          eventType,
          tenantId: resolved.tenantId,
        });
        return NextResponse.json(
          {
            success: false,
            error: "WEBHOOK_PERSISTENCE_FAILED",
            message: "Webhook verified and tenant-resolved but persistence failed",
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
          tenantId: resolved.tenantId,
          message: "Webhook accepted and persisted",
        },
        {
          status: 202,
          headers: {
            "X-RateLimit-Limit": String(WEBHOOK_RL_MAX),
            "X-RateLimit-Remaining": String(rl.remaining),
          },
        }
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
