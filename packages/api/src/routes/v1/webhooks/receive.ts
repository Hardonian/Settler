/**
 * Webhook Receive Routes
 *
 * Endpoints for receiving webhooks from payment providers
 */

import { Router, Request, Response, NextFunction } from "express";
import { WebhookIngestionService } from "../../../application/webhooks/WebhookIngestionService";
import { sendSuccess, sendError } from "../../../utils/api-response";
import { handleRouteError } from "../../../utils/error-handler";
import { enforceFreezeState } from "../../../middleware/governance";
import { AuthRequest } from "../../../middleware/auth";
import {
  consumeWebhookReplayKey,
  logWebhookReplayRejected,
} from "../../../services/distributed-guards";
import { getWebhookSecretForTenant } from "../../../utils/webhook-secret";
import { isValidTenantUuid } from "../../../utils/tenant-id";

const router: Router = Router();
const webhookService = new WebhookIngestionService();

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

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

/**
 * POST /api/v1/webhooks/receive/:adapter
 * Receive webhook from payment provider
 */
router.post(
  "/:adapter",
  // Middleware to load tenantId for governance check on this unauthenticated route
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const rawTenant =
      (req.headers["x-tenant-id"] as string | undefined)?.trim() || req.body?.tenant_id;
    if (!isValidTenantUuid(rawTenant)) {
      return sendError(
        res,
        400,
        "BAD_REQUEST",
        "Valid tenant UUID required (header x-tenant-id or body.tenant_id)"
      );
    }
    req.tenantId = rawTenant;
    next();
  },
  enforceFreezeState(), // CRITICAL: Enforce freeze state for all incoming webhooks
  async (req: Request, res: Response) => {
    try {
      const adapterParam = req.params["adapter"];
      const adapter = Array.isArray(adapterParam) ? (adapterParam[0] ?? "") : (adapterParam ?? "");
      // We can safely use req.tenantId here because the middleware above guarantees it
      const tenantId = (req as AuthRequest).tenantId!;

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
        return sendError(
          res,
          400,
          "WEBHOOK_TIMESTAMP_EXPIRED",
          "Webhook timestamp outside accepted window"
        );
      }

      const replay = await consumeWebhookReplayKey({
        adapter,
        tenantId,
        payload: req.body,
        signature: String(signature),
      });

      res.setHeader("X-Webhook-Replay-Guarantee", replay.guarantee);

      if (replay.duplicate) {
        logWebhookReplayRejected(replay.guarantee, adapter);
        return sendSuccess(
          res,
          { processed: true, deduplicated: true, events: 0, guarantee: replay.guarantee },
          "Duplicate webhook ignored"
        );
      }

      const secretRow = await getWebhookSecretForTenant(adapter, tenantId);

      if (!secretRow) {
        return sendError(res, 401, "UNAUTHORIZED", "Webhook secret not configured");
      }

      const result = await webhookService.processWebhook(
        adapter,
        req.body,
        signature as string,
        secretRow.secret,
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
        guarantee: replay.guarantee,
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to process webhook", 500);
      return;
    }
  }
);

export default router;
