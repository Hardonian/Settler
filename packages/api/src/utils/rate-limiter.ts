import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { query } from "../db";
import { config } from "../config";
import { consumeRateLimitShared, logRateLimitTriggered } from "../services/distributed-guards";

function shouldBypass(req: AuthRequest): boolean {
  const path = req.path.toLowerCase();
  return path.includes("/operator/") || path.startsWith("/admin/") || req.headers["x-admin-bypass"] === "true";
}

async function resolveTenantLimit(req: AuthRequest): Promise<number> {
  if (!req.apiKeyId) {
    return config.rateLimiting.defaultLimit;
  }

  if (!req.tenantId) {
    return config.rateLimiting.defaultLimit;
  }

  const keys = await query<{ rate_limit: number }>(
    "SELECT rate_limit FROM api_keys WHERE id = $1 AND tenant_id = $2",
    [req.apiKeyId, req.tenantId]
  );
  return keys[0]?.rate_limit ?? config.rateLimiting.defaultLimit;
}

export async function checkRateLimit(req: AuthRequest): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  scope: "tenant" | "global" | "bypass";
  guarantee?: "distributed_shared" | "local_only" | "degraded" | "unavailable";
}> {
  const windowMs = config.rateLimiting.windowMs;

  if (shouldBypass(req)) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetAt: Date.now() + windowMs, scope: "bypass" };
  }

  const tenantKey = req.tenantId || req.apiKeyId || req.userId || req.ip || "anonymous";
  const routeScope = `${req.method.toUpperCase()}:${req.route?.path || req.path}`.toLowerCase();
  const tenantLimit = await resolveTenantLimit(req);
  const tenantResult = await consumeRateLimitShared({
    tenantScope: tenantKey,
    routeScope,
    limit: tenantLimit,
    windowMs,
  });
  if (!tenantResult.allowed) {
    return { ...tenantResult, scope: "tenant" };
  }

  const globalKey = req.ip || "global";
  const globalLimit = Math.max(tenantLimit * 5, 500);
  const globalResult = await consumeRateLimitShared({
    tenantScope: globalKey,
    routeScope: "global",
    limit: globalLimit,
    windowMs,
  });
  if (!globalResult.allowed) {
    return { ...globalResult, scope: "global" };
  }

  return { ...tenantResult, scope: "tenant" };
}

export function rateLimitMiddleware() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const result = await checkRateLimit(req);

    if (result.scope !== "bypass") {
      res.setHeader("X-RateLimit-Limit", config.rateLimiting.defaultLimit);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
      if (result.guarantee) {
        res.setHeader("X-RateLimit-Guarantee", result.guarantee);
      }
      const mode = result.guarantee === "distributed_shared" ? "distributed" : "local-fallback";
      res.setHeader("X-Rate-Limit-Mode", mode);
    }

    if (!result.allowed) {
      const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      res.setHeader("Retry-After", retryAfter.toString());
      logRateLimitTriggered(result.scope, result.guarantee || "local_only");
      res.status(429).json({
        error: "RATE_LIMITED",
        message: "Rate limit exceeded",
        scope: result.scope,
        retryAfter,
        guarantee: result.guarantee || "local_only",
      });
      return;
    }

    next();
  };
}
