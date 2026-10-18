import { Redis } from "@upstash/redis";
import { AlertNotifier } from "../alerts/notifier";

type TenantQuery = <T = Record<string, unknown>>(
  tenantId: string,
  text: string,
  params?: unknown[]
) => Promise<T[]>;

/**
 * Core Ingestion Boundary Defense.
 * Enforces Idempotency, Rate Limiting, and DLQ routing.
 */
export class IngestionBoundary {
  private redis: Redis | null;

  constructor(private db: { query: TenantQuery }) {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
  }

  /**
   * Rejects requests with HTTP 429 if the tenant exceeds their quota.
   * Defaults to 100 requests per minute as specified in WEBHOOKS.md.
   */
  async enforceRateLimit(tenantId: string, limit = 100, windowSec = 60): Promise<void> {
    if (!this.redis) {
      console.warn("Redis not configured, skipping strict rate limit enforcement.");
      return;
    }

    const key = `ratelimit:${tenantId}:webhooks`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, windowSec);
    }

    if (count > limit) {
      const ttl = await this.redis.ttl(key);
      const error = new Error("RATE_LIMIT_EXCEEDED");
      (error as any).retryAfter = ttl;
      (error as any).status = 429;

      await AlertNotifier.dispatch({
        severity: "WARNING",
        category: "RATE_LIMIT_BREACH",
        message: `Tenant ${tenantId} exceeded strict webhook rate limits.`,
      });

      throw error;
    }
  }

  /**
   * Atomic idempotency check.
   * Returns true if duplicate, preventing duplicate background job execution.
   */
  async checkIdempotency(
    tenantId: string,
    key: string
  ): Promise<{ isDuplicate: boolean; response?: any }> {
    const statement = `
      INSERT INTO public.idempotency_keys (key, tenant_id, status, expires_at)
      VALUES ($1, $2, 'pending', NOW() + INTERVAL '24 hours')
      ON CONFLICT (tenant_id, key) DO UPDATE
        SET status = 'pending', response = NULL, created_at = NOW(),
            completed_at = NULL, expires_at = EXCLUDED.expires_at
        WHERE public.idempotency_keys.status = 'failed'
           OR public.idempotency_keys.expires_at <= NOW()
           OR (
             public.idempotency_keys.status = 'pending'
             AND public.idempotency_keys.created_at <= NOW() - INTERVAL '5 minutes'
           )
      RETURNING status;
    `;
    const claimed = await this.db.query<{ status: string }>(tenantId, statement, [key, tenantId]);

    if (claimed.length === 0) {
      // Row already existed -> duplicate detected
      const existing = await this.db.query<{ status: string; response: unknown }>(
        tenantId,
        `SELECT status, response FROM public.idempotency_keys WHERE tenant_id = $1 AND key = $2`,
        [tenantId, key]
      );
      return { isDuplicate: true, response: existing[0]?.response };
    }
    return { isDuplicate: false };
  }

  async markIdempotencyCompleted(tenantId: string, key: string, response: any): Promise<void> {
    await this.db.query(
      tenantId,
      `UPDATE public.idempotency_keys SET status = 'completed', response = $3 WHERE tenant_id = $1 AND key = $2`,
      [tenantId, key, JSON.stringify(response)]
    );
  }

  async markIdempotencyFailed(tenantId: string, key: string): Promise<void> {
    await this.db.query(
      tenantId,
      `UPDATE public.idempotency_keys SET status = 'failed' WHERE tenant_id = $1 AND key = $2 AND status = 'pending'`,
      [tenantId, key]
    );
  }

  async sendToDLQ(
    tenantId: string | null,
    source: string,
    payload: string,
    headers: any,
    errorReason: string
  ): Promise<void> {
    await this.db.query(
      tenantId ?? "00000000-0000-4000-8000-000000000000",
      `INSERT INTO public.ingestion_dlq (tenant_id, source, payload, headers, error_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, source, payload, JSON.stringify(headers), errorReason]
    );

    await AlertNotifier.dispatch({
      severity: "CRITICAL",
      category: "INGESTION_DLQ",
      message: `Webhook from source '${source}' routed to Dead Letter Queue.`,
      context: { tenantId, errorReason, headersSnippet: headers },
    });
  }
}
