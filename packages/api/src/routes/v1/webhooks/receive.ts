/**
 * Webhook Receive Routes
 *
 * Endpoints for receiving webhooks from payment providers
 */

import { Router, Request, Response } from "express";
import { createHash } from "crypto";
import { WebhookIngestionService } from "../../../application/webhooks/WebhookIngestionService";
import { sendSuccess, sendError } from "../../../utils/api-response";
import { handleRouteError } from "../../../utils/error-handler";

const router: Router = Router();
const webhookService = new WebhookIngestionService();
const processedWebhookKeys = new Map<string, number>();

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;
const WEBHOOK_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

function parseWebhookTimestamp(req: Request): number | null {
  const header = req.headers["x-webhook-timestamp"] || req.headers["x-timestamp"];
  if (!header) {
    return null;
  }

  const value = Array.isArray(header) ? header[0] : header;
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) {
    return null;
  }

  return asNumber > 9999999999 ? asNumber : asNumber * 1000;
}

function getReplayKey(adapter: string, tenantId: string, payload: unknown, signature: string): string {
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(payload))
    .update(signature)
    .digest("hex");

  return `${adapter}:${tenantId}:${fingerprint}`;
}

function isReplay(key: string): boolean {
  const now = Date.now();
  const existing = processedWebhookKeys.get(key);

  if (existing && now - existing <= WEBHOOK_DEDUP_WINDOW_MS) {
    return true;
  }

  processedWebhookKeys.set(key, now);

  if (processedWebhookKeys.size > 5000) {
    for (const [entryKey, createdAt] of processedWebhookKeys.entries()) {
      if (now - createdAt > WEBHOOK_DEDUP_WINDOW_MS) {
        processedWebhookKeys.delete(entryKey);
      }
    }
  }

  return false;
}

/**
 * POST /api/v1/webhooks/receive/:adapter
 * Receive webhook from payment provider
 */
router.post("/:adapter", async (req: Request, res: Response) => {
  try {
    const { adapter } = req.params;
    const tenantId = (req.headers["x-tenant-id"] as string) || req.body.tenant_id;

    if (!tenantId) {
      return sendError(res, 400, "BAD_REQUEST", "Tenant ID required");
    }

    const signature =
      req.headers["x-signature"] ||
      req.headers["stripe-signature"] ||
      req.headers["paypal-transmission-sig"] ||
      req.headers["x-square-signature"] ||
      req.headers["x-square-hmacsha256-signature"] ||
      "";

    if (!adapter || !signature) {
      return sendError(res, 400, "BAD_REQUEST", "Adapter and webhook signature are required");
    }

    const webhookTimestamp = parseWebhookTimestamp(req);
    if (webhookTimestamp && Math.abs(Date.now() - webhookTimestamp) > MAX_TIMESTAMP_SKEW_MS) {
      return sendError(res, 400, "WEBHOOK_TIMESTAMP_EXPIRED", "Webhook timestamp outside accepted window");
    }

    const replayKey = getReplayKey(adapter, tenantId, req.body, String(signature));
    if (isReplay(replayKey)) {
      return sendSuccess(res, { processed: true, deduplicated: true, events: 0 }, "Duplicate webhook ignored");
    }

    const secret = await getWebhookSecret(adapter, tenantId);

    if (!secret) {
      return sendError(res, 401, "UNAUTHORIZED", "Webhook secret not configured");
    }

    const result = await webhookService.processWebhook(
      adapter,
      req.body,
      signature as string,
      secret,
      tenantId
    );

    if (!result.success) {
      return sendError(
        res,
        400,
        "PROCESSING_FAILED",
        result.errors?.join(", ") || "Failed to process webhook"
      );
    }

    sendSuccess(res, {
      processed: true,
      deduplicated: false,
      events: result.events.length,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to process webhook", 500);
    return;
  }
});

async function getWebhookSecret(adapter: string, _tenantId: string): Promise<string | null> {
  const { query } = await import("../../../db");
  const result = await query<{ secret: string }>(
    `SELECT secret FROM webhook_configs WHERE adapter = $1 LIMIT 1`,
    [adapter]
  );
  return result.length > 0 && result[0] ? result[0].secret : null;
}

export default router;
