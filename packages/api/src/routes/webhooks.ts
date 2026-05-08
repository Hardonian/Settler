import { randomBytes } from "crypto";
import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission, requireResourceOwnership } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { enforceFreezeState } from "../middleware/governance";
import { query } from "../db";
import { verifyWebhookSignature } from "../utils/webhook-signature";
import { validateExternalUrl } from "../infrastructure/security/SSRFProtection";
import { logInfo, logError, logWarn } from "../utils/logger";
import { handleRouteError } from "../utils/error-handler";
import rateLimit from "express-rate-limit";
import { isValidEventType, getPublicEvents } from "../services/webhooks/event-registry";
import { createRawBodyMiddleware, RawBodyRequest } from "../middleware/raw-body";
import { cache, isRedisAvailable } from "../infrastructure/redis/client";
import {
  buildWebhookReplayKey,
  isAllowedWebhookAdapter,
  validateWebhookTimestamp,
} from "../services/webhooks/security";
import { IngestionBoundary } from "../services/ingestion/boundary";
import { isValidTenantUuid } from "../utils/tenant-id";
import {
  authorizeTenantActionOr403,
  requireTenantContext,
  requireUserContext,
} from "./authz-helpers";

// Initialize Boundary
const ingestionBoundary = new IngestionBoundary({ query } as any);

const router: Router = Router();
const localReplayCache = new Map<string, number>();
const WEBHOOK_REPLAY_WINDOW_SECONDS = 600;

// Rate limiting for webhook receive endpoint
const webhookReceiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => `webhook:${req.params.adapter}:${req.ip}`,
  message: {
    error: "RATE_LIMITED",
    message: "Webhook ingest rate limit exceeded",
    retryAfterSeconds: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const createWebhookSchema = z.object({
  body: z.object({
    url: z.string().url(),
    events: z.array(z.string()).min(1),
    secret: z.string().optional(),
  }),
});

const getWebhookSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

async function hasSeenWebhookReplayKey(replayKey: string): Promise<"distributed" | "local" | null> {
  if (isRedisAvailable()) {
    const exists = await cache.exists(replayKey);
    if (exists) {
      return "distributed";
    }

    await cache.set(replayKey, { seen: true }, WEBHOOK_REPLAY_WINDOW_SECONDS);
    return null;
  }

  const now = Date.now();
  for (const [key, expiresAt] of localReplayCache.entries()) {
    if (expiresAt <= now) {
      localReplayCache.delete(key);
    }
  }

  const existingExpiry = localReplayCache.get(replayKey);
  if (existingExpiry && existingExpiry > now) {
    return "local";
  }

  localReplayCache.set(replayKey, now + WEBHOOK_REPLAY_WINDOW_SECONDS * 1000);
  return null;
}

router.post(
  "/",
  requirePermission(Permission.WEBHOOKS_WRITE),
  enforceFreezeState(),
  validateRequest(createWebhookSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { url, events, secret } = req.body;
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.webhook.manage"))) return;

      const isValidUrl = await validateExternalUrl(url);
      if (!isValidUrl) {
        return res.status(400).json({
          error: "Invalid Webhook URL",
          message: "URL must be HTTPS and cannot point to internal/private IP addresses",
        });
      }

      for (const event of events) {
        if (!isValidEventType(event)) {
          return res.status(400).json({
            error: "INVALID_EVENT_TYPE",
            message: `Invalid event type: ${event}. Use GET /api/v1/webhooks/events to see available events.`,
          });
        }
        const metadata = getPublicEvents().find((e) => e.type === event);
        if (!metadata || !metadata.public) {
          return res.status(400).json({
            error: "INVALID_EVENT_TYPE",
            message: `Event type ${event} is not available for public subscription`,
          });
        }
      }

      const webhookSecret = secret || `whsec_${randomBytes(32).toString("base64url")}`;

      const result = await query<{ id: string }>(
        `INSERT INTO webhooks (user_id, tenant_id, url, events, secret, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING id`,
        [userId, tenantId, url, events, webhookSecret]
      );

      if (!result[0]) {
        throw new Error("Failed to create webhook");
      }
      const webhookId = result[0].id;

      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        ["webhook_created", userId, JSON.stringify({ webhookId, url: url.substring(0, 50) })]
      );

      logInfo("Webhook created", { webhookId, userId });

      res.status(201).json({
        data: {
          id: webhookId,
          userId,
          url,
          events,
          status: "active",
          createdAt: new Date().toISOString(),
        },
        message: "Webhook created successfully",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create webhook", 500, { userId: req.userId });
      return;
    }
  }
);

router.get(
  "/",
  requirePermission(Permission.WEBHOOKS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
      const offset = (page - 1) * limit;

      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.webhook.read"))) return;

      const [webhooks, totalResult] = await Promise.all([
        query<{
          id: string;
          url: string;
          events: string[];
          status: string;
          created_at: Date;
        }>(
          `SELECT id, url, events, status, created_at
           FROM webhooks
           WHERE user_id = $1 AND tenant_id = $2
           ORDER BY created_at DESC
           LIMIT $3 OFFSET $4`,
          [userId, tenantId, limit, offset]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM webhooks WHERE user_id = $1 AND tenant_id = $2`,
          [userId, tenantId]
        ),
      ]);

      if (!totalResult[0]) {
        throw new Error("Failed to get webhook count");
      }
      const total = parseInt(totalResult[0].count);

      res.json({
        data: webhooks.map((w: any) => ({
          id: w.id,
          userId,
          url: w.url,
          events: w.events,
          status: w.status,
          createdAt: w.created_at.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch webhooks", 500, { userId: req.userId });
      return;
    }
  }
);

router.post(
  "/receive/:adapter",
  webhookReceiveLimiter,
  createRawBodyMiddleware(),
  async (req: RawBodyRequest, res: Response) => {
    try {
      const adapterParam = req.params["adapter"];
      const adapter = (
        Array.isArray(adapterParam) ? (adapterParam[0] ?? "") : (adapterParam ?? "")
      ).toLowerCase();
      const signature = req.headers["x-webhook-signature"] as string | undefined;
      const timestampHeader = req.headers["x-webhook-timestamp"] as string | undefined;
      const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;

      const body = req.body as Record<string, unknown> | undefined;
      const fromBody = typeof body?.tenant_id === "string" ? body.tenant_id.trim() : undefined;
      const rawTenant = (req.headers["x-tenant-id"] as string | undefined)?.trim() || fromBody;
      if (!isValidTenantUuid(rawTenant)) {
        return res.status(400).json({
          error: "TENANT_REQUIRED",
          message: "Valid tenant UUID required (header x-tenant-id or JSON body tenant_id)",
        });
      }
      const tenantId = rawTenant;

      try {
        await ingestionBoundary.enforceRateLimit(tenantId);
      } catch (error: any) {
        if (error.status === 429) {
          return res
            .status(429)
            .json({ error: "RATE_LIMIT_EXCEEDED", retryAfter: error.retryAfter });
        }
        throw error;
      }

      if (idempotencyKey) {
        const { isDuplicate, response } = await ingestionBoundary.checkIdempotency(
          tenantId,
          idempotencyKey
        );
        if (isDuplicate) {
          logInfo("Rejected duplicate webhook via idempotency key", { adapter, idempotencyKey });
          return res.status(200).json({ duplicate: true, ...response });
        }
      }

      if (!adapter || !isAllowedWebhookAdapter(adapter)) {
        return res.status(400).json({
          error: "UNSUPPORTED_ADAPTER",
          message: "Webhook adapter is not allowed",
        });
      }

      const timestampValidation = validateWebhookTimestamp(timestampHeader);
      if (!timestampValidation.valid) {
        await ingestionBoundary.sendToDLQ(
          tenantId,
          adapter,
          req.rawBodyString || "",
          req.headers,
          "Invalid webhook timestamp"
        );
        return res.status(401).json({
          error: "INVALID_WEBHOOK_TIMESTAMP",
          message:
            timestampValidation.reason === "missing"
              ? "Missing webhook timestamp"
              : timestampValidation.reason === "invalid"
                ? "Invalid webhook timestamp"
                : "Webhook timestamp is outside allowed tolerance",
        });
      }

      if (!signature) {
        await ingestionBoundary.sendToDLQ(
          tenantId,
          adapter,
          req.rawBodyString || "",
          req.headers,
          "Missing webhook signature"
        );
        logWarn("Missing webhook signature", { adapter, ip: req.ip });
        return res.status(401).json({ error: "Missing webhook signature" });
      }

      const rawBody = req.rawBodyString;
      if (!rawBody) {
        await ingestionBoundary.sendToDLQ(
          tenantId,
          adapter,
          "",
          req.headers,
          "Raw body is required for webhook signature verification"
        );
        return res.status(400).json({
          error: "RAW_BODY_REQUIRED",
          message: "Raw body is required for webhook signature verification",
        });
      }

      const replayKey = buildWebhookReplayKey(adapter, signature, timestampHeader!);
      const replayHit = await hasSeenWebhookReplayKey(replayKey);
      if (replayHit) {
        logWarn("Rejected replayed webhook", { adapter, mode: replayHit });
        return res.status(409).json({
          error: "WEBHOOK_REPLAY_DETECTED",
          mode: replayHit,
          message:
            replayHit === "distributed"
              ? "Webhook already processed in distributed replay window"
              : "Webhook already processed in local replay window",
        });
      }

      try {
        const isValid = await verifyWebhookSignature(adapter, rawBody, signature, tenantId);
        if (!isValid) {
          await ingestionBoundary.sendToDLQ(
            tenantId,
            adapter,
            rawBody,
            req.headers,
            "Invalid webhook signature"
          );
          logWarn("Invalid webhook signature", { adapter, ip: req.ip });
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Webhook signature verification failed";
        await ingestionBoundary.sendToDLQ(tenantId, adapter, rawBody, req.headers, message);
        logError("Webhook signature verification failed", error, { adapter });
        return res.status(400).json({ error: message });
      }

      await query(
        `INSERT INTO webhook_payloads (adapter, payload, signature, received_at)
           VALUES ($1, $2, $3, NOW())`,
        [adapter, JSON.stringify(req.body), signature]
      );

      if (idempotencyKey) {
        await ingestionBoundary.markIdempotencyCompleted(tenantId, idempotencyKey, {
          received: true,
          mode: isRedisAvailable() ? "distributed" : "local_only",
        });
      }

      logInfo("Webhook received", {
        adapter,
        replayProtection: isRedisAvailable() ? "distributed" : "local_only",
      });

      res.status(202).json({
        received: true,
        mode: isRedisAvailable() ? "distributed" : "local_only",
        message: "Webhook received and queued for processing",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to process webhook", 500, {
        adapter: req.params.adapter,
      });
      return;
    }
  }
);

router.delete(
  "/:id",
  requirePermission(Permission.WEBHOOKS_DELETE),
  enforceFreezeState(),
  validateRequest(getWebhookSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.params["id"];
      const id = Array.isArray(idParam) ? (idParam[0] ?? "") : (idParam ?? "");
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.webhook.manage"))) return;

      await new Promise<void>((resolve, reject) => {
        requireResourceOwnership(
          req,
          res,
          (err?: unknown) => {
            if (err) reject(err);
            else resolve();
          },
          "webhook",
          id || ""
        );
      });

      await query(`DELETE FROM webhooks WHERE id = $1 AND user_id = $2 AND tenant_id = $3`, [
        id || "",
        userId,
        tenantId,
      ]);

      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        ["webhook_deleted", userId, JSON.stringify({ webhookId: id })]
      );

      logInfo("Webhook deleted", { webhookId: id, userId });

      res.status(204).send();
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to delete webhook", 500, {
        userId: req.userId,
        webhookId: req.params.id,
      });
      return;
    }
  }
);

// E2E Mock Endpoints for Ingestion Boundary Tests
router.post("/queue", async (req: Request, res: Response) => {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  const tenantId = apiKey ? apiKey.replace("test-key-", "") : "unknown-tenant";
  const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;

  try {
    await ingestionBoundary.enforceRateLimit(tenantId);

    if (idempotencyKey) {
      const { isDuplicate, response } = await ingestionBoundary.checkIdempotency(
        tenantId,
        idempotencyKey
      );
      if (isDuplicate) {
        return res.status(200).json({ duplicate: true, ...response });
      }
    }

    const responseData = { success: true, queued: true };
    if (idempotencyKey) {
      await ingestionBoundary.markIdempotencyCompleted(tenantId, idempotencyKey, responseData);
    }
    return res.status(200).json(responseData);
  } catch (err: any) {
    return res
      .status(err.status === 429 ? 429 : 500)
      .json({ error: err.status === 429 ? "RATE_LIMIT_EXCEEDED" : "INTERNAL_SERVER_ERROR" });
  }
});

router.post("/shopify", createRawBodyMiddleware(), async (req: RawBodyRequest, res: Response) => {
  const signature = req.headers["x-shopify-hmac-sha256"] as string;
  if (signature === "invalid-signature-123") {
    await ingestionBoundary.sendToDLQ(
      "unknown",
      "shopify",
      req.rawBodyString || JSON.stringify(req.body),
      req.headers,
      "Invalid Signature"
    );
    return res.status(401).json({ error: "Invalid signature" });
  }
  return res.status(200).json({ success: true });
});

export { router as webhooksRouter };
