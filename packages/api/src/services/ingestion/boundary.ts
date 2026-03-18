import { Redis } from "@upstash/redis";
import { Pool } from "pg";

/**
 * Core Ingestion Boundary Defense.
 * Enforces Idempotency, Rate Limiting, and DLQ routing.
 */
export class IngestionBoundary {
  private redis: Redis | null;

  constructor(private db: Pool) {
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
    const query = `
      INSERT INTO public.idempotency_keys (key, tenant_id, status, expires_at)
      VALUES ($1, $2, 'pending', NOW() + INTERVAL '24 hours')
      ON CONFLICT (key) DO NOTHING
      RETURNING *;
    `;
    const result = await this.db.query(query, [key, tenantId]);

    if (result.rows.length === 0) {
      // Row already existed -> duplicate detected
      const existing = await this.db.query(
        `SELECT status, response FROM public.idempotency_keys WHERE key = $1`,
        [key]
      );
      return { isDuplicate: true, response: existing.rows[0]?.response };
    }
    return { isDuplicate: false };
  }

  async markIdempotencyCompleted(key: string, response: any): Promise<void> {
    await this.db.query(
      `UPDATE public.idempotency_keys SET status = 'completed', response = $2 WHERE key = $1`,
      [key, JSON.stringify(response)]
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
      `INSERT INTO public.ingestion_dlq (tenant_id, source, payload, headers, error_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, source, payload, JSON.stringify(headers), errorReason]
    );
  }
}
