# Rate Limiting in Production (Redis vs Process-Local)

## Current behavior

Settler rate-limiting paths support two execution modes:

1. **Redis-backed distributed mode** (recommended for multi-instance production)
2. **Process-local in-memory fallback** (acceptable for local dev / single instance)

## Why process-local drift happens

In-memory fallback stores counters per process. In horizontally scaled deployments:

- each instance tracks limits independently,
- a client can exceed intended global limits by spreading requests across instances,
- enforcement becomes probabilistic rather than global.

## Redis-backed enforcement requirements

Set both env vars in production:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

With these set, limiter checks are shared and consistent across instances.

## Fallback behavior and warning semantics

If Redis is unavailable, limiter code falls back to process-local counters to avoid hard failures.

In production mode, fallback now emits a warning:

- `[RateLimit] Redis limiter unavailable in production; using process-local fallback (risk: cross-instance drift).`

This preserves availability while making risk explicit.

## Verification and policy enforcement

- `pnpm run verify:security` reports limiter backend guardrail status.
- In production verification environments:
  - set `REQUIRE_REDIS_RATE_LIMIT=1` to fail verification when Redis env vars are missing.

This allows strict enforcement for managed production while remaining usable for small/self-hosted setups.

## What this is not

This guidance does not replace full traffic-layer controls (WAF/CDN rate controls) and does not replace runtime abuse monitoring.
