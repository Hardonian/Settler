import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { query } from "../db";
import { config } from "../config";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const tenantStore = new Map<string, RateLimitEntry>();
const globalStore = new Map<string, RateLimitEntry>();

function consume(store: Map<string, RateLimitEntry>, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: next.resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
}

function cleanupExpired(store: Map<string, RateLimitEntry>) {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

function shouldBypass(req: AuthRequest): boolean {
  const path = req.path.toLowerCase();
  return path.includes("/operator/") || path.startsWith("/admin/") || req.headers["x-admin-bypass"] === "true";
}

async function resolveTenantLimit(req: AuthRequest): Promise<number> {
  if (!req.apiKeyId) {
    return config.rateLimiting.defaultLimit;
  }

  const keys = await query<{ rate_limit: number }>("SELECT rate_limit FROM api_keys WHERE id = $1", [req.apiKeyId]);
  return keys[0]?.rate_limit ?? config.rateLimiting.defaultLimit;
}

export async function checkRateLimit(req: AuthRequest): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  scope: "tenant" | "global" | "bypass";
}> {
  const windowMs = config.rateLimiting.windowMs;

  if (shouldBypass(req)) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetAt: Date.now() + windowMs, scope: "bypass" };
  }

  const tenantKey = req.tenantId || req.apiKeyId || req.userId || req.ip || "anonymous";
  const tenantLimit = await resolveTenantLimit(req);
  const tenantResult = consume(tenantStore, tenantKey, tenantLimit, windowMs);
  if (!tenantResult.allowed) {
    return { ...tenantResult, scope: "tenant" };
  }

  const globalKey = req.ip || "global";
  const globalLimit = Math.max(tenantLimit * 5, 500);
  const globalResult = consume(globalStore, globalKey, globalLimit, windowMs);
  if (!globalResult.allowed) {
    return { ...globalResult, scope: "global" };
  }

  if (tenantStore.size > 20000) cleanupExpired(tenantStore);
  if (globalStore.size > 20000) cleanupExpired(globalStore);

  return { ...tenantResult, scope: "tenant" };
}

export function rateLimitMiddleware() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const result = await checkRateLimit(req);

    if (result.scope !== "bypass") {
      res.setHeader("X-RateLimit-Limit", config.rateLimiting.defaultLimit);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
    }

    if (!result.allowed) {
      const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      res.setHeader("Retry-After", retryAfter.toString());
      res.status(429).json({
        error: "RATE_LIMITED",
        message: "Rate limit exceeded",
        scope: result.scope,
        retryAfter,
      });
      return;
    }

    next();
  };
}
