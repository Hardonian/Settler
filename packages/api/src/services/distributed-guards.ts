import { createHash } from "crypto";
import { Counter, Gauge } from "prom-client";
import { config } from "../config";
import { query } from "../db";
import { getRedisClient } from "../utils/cache";
import { logInfo, logWarn } from "../utils/logger";

export type GuaranteeLevel = "distributed_shared" | "local_only" | "degraded" | "unavailable";

interface ConsumeResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  current: number;
}

interface ReplayResult {
  duplicate: boolean;
  guarantee: GuaranteeLevel;
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryRateStore = new Map<string, MemoryEntry>();
const memoryReplayStore = new Map<string, number>();

const DEFAULT_WEBHOOK_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_DB_WINDOW_MS = 60 * 1000;
const rateLimitDbWindowMs = Number(
  process.env.RATE_LIMIT_DB_WINDOW_MS || DEFAULT_RATE_LIMIT_DB_WINDOW_MS
);

let cachedRedisHealth: { ok: boolean; checkedAt: number } | null = null;

const guaranteeStateGauge = new Gauge({
  name: "distributed_guard_guarantee_state",
  help: "Current distributed guard guarantee state (1=current)",
  labelNames: ["guard", "guarantee"],
});

const guaranteeTransitionCounter = new Counter({
  name: "distributed_guard_guarantee_transitions_total",
  help: "Total guarantee transitions observed for distributed guards",
  labelNames: ["guard", "from", "to"],
});

const replayRejectedCounter = new Counter({
  name: "webhook_replay_rejected_total",
  help: "Total duplicate webhook replay rejections",
  labelNames: ["guarantee", "provider"],
});

let lastGuaranteeByGuard: Partial<Record<"rate_limiting" | "webhook_replay", GuaranteeLevel>> = {};

function deploymentIsLocal(): boolean {
  return (
    config.deployment.env === "local" ||
    config.nodeEnv === "development" ||
    config.nodeEnv === "test"
  );
}

function parseProviderReplayWindows(): Record<string, number> {
  const configured = process.env.WEBHOOK_REPLAY_WINDOW_MS_BY_PROVIDER;
  if (!configured) {
    return {};
  }

  const windows: Record<string, number> = {};
  for (const part of configured.split(",")) {
    const [providerRaw, ttlRaw] = part.split("=");
    const provider = providerRaw?.trim().toLowerCase();
    const ttl = Number(ttlRaw?.trim());
    if (!provider || !Number.isFinite(ttl) || ttl <= 0) {
      continue;
    }
    windows[provider] = ttl;
  }

  return windows;
}

const providerReplayWindowsMs = parseProviderReplayWindows();

function replayWindowMs(provider: string): number {
  const providerWindow = providerReplayWindowsMs[provider.toLowerCase()];
  if (providerWindow && providerWindow > 0) {
    return providerWindow;
  }
  return Number(process.env.WEBHOOK_REPLAY_WINDOW_MS || DEFAULT_WEBHOOK_DEDUP_WINDOW_MS);
}

function observeGuarantee(
  guard: "rate_limiting" | "webhook_replay",
  guarantee: GuaranteeLevel
): void {
  const previous = lastGuaranteeByGuard[guard];
  if (previous && previous !== guarantee) {
    guaranteeTransitionCounter.inc({ guard, from: previous, to: guarantee });
    logWarn("distributed_guard_transition", { guard, from: previous, to: guarantee });
  }

  lastGuaranteeByGuard[guard] = guarantee;
  guaranteeStateGauge.set(
    { guard, guarantee: "distributed_shared" },
    guarantee === "distributed_shared" ? 1 : 0
  );
  guaranteeStateGauge.set({ guard, guarantee: "local_only" }, guarantee === "local_only" ? 1 : 0);
  guaranteeStateGauge.set({ guard, guarantee: "degraded" }, guarantee === "degraded" ? 1 : 0);
  guaranteeStateGauge.set({ guard, guarantee: "unavailable" }, guarantee === "unavailable" ? 1 : 0);
}

async function isRedisHealthy(): Promise<boolean> {
  const now = Date.now();
  if (cachedRedisHealth && now - cachedRedisHealth.checkedAt < 30_000) {
    return cachedRedisHealth.ok;
  }

  const redis = getRedisClient();
  if (!redis) {
    cachedRedisHealth = { ok: false, checkedAt: now };
    return false;
  }

  try {
    await redis.ping();
    cachedRedisHealth = { ok: true, checkedAt: now };
    return true;
  } catch (error) {
    cachedRedisHealth = { ok: false, checkedAt: now };
    logWarn("distributed_guard_degraded", {
      guard: "redis",
      reason: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

function consumeMemory(key: string, limit: number, windowMs: number): ConsumeResult {
  const now = Date.now();
  const existing = memoryRateStore.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryRateStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt, current: 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, current: existing.count };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    current: existing.count,
  };
}

async function consumeRedis(key: string, limit: number, windowMs: number): Promise<ConsumeResult> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error("Redis unavailable");
  }

  // Validate inputs
  if (!Number.isFinite(limit) || limit < 0 || !Number.isFinite(windowMs) || windowMs < 0) {
    logWarn("invalid_redis_consume_params", { key, limit, windowMs });
    return { allowed: false, remaining: 0, resetAt: Date.now() + windowMs, current: limit + 1 };
  }

  const script = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
      redis.call('PEXPIRE', KEYS[1], ARGV[1])
    end
    local ttl = redis.call('PTTL', KEYS[1])
    return {current, ttl}
  `;

  let currentRaw, ttlRaw;

  if (typeof redis.defineCommand === "function") {
    if (!redis.consumeRateLimit) {
      redis.defineCommand("consumeRateLimit", {
        numberOfKeys: 1,
        lua: script,
      });
    }
    [currentRaw, ttlRaw] = (await redis.consumeRateLimit(key, String(windowMs))) as [
      number,
      number,
    ];
  } else {
    // Upstash Redis client fallback
    [currentRaw, ttlRaw] = (await redis.eval(script, [key], [String(windowMs)])) as [
      number,
      number,
    ];
  }
  const current = Number(currentRaw);
  const ttl = Math.max(0, Number(ttlRaw));
  const resetAt = Date.now() + ttl;

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetAt,
    current,
  };
}

async function consumeRateLimitDb(scopeKey: string, limit: number): Promise<ConsumeResult> {
  const now = Date.now();
  const bucketStart = Math.floor(now / rateLimitDbWindowMs) * rateLimitDbWindowMs;
  const bucketStartIso = new Date(bucketStart).toISOString();

  const rows = await query<{ count: number }>(
    `INSERT INTO rate_limit_counters (scope_key, bucket_start, count, expires_at)
     VALUES ($1, $2::timestamptz, 1, $2::timestamptz + make_interval(secs => $3::int))
     ON CONFLICT (scope_key, bucket_start)
     DO UPDATE SET count = rate_limit_counters.count + 1
     RETURNING count`,
    [scopeKey, bucketStartIso, Math.ceil(rateLimitDbWindowMs / 1000)]
  );

  const current = rows[0]?.count ?? 1;
  const resetAt = bucketStart + rateLimitDbWindowMs;

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetAt,
    current,
  };
}

function cleanupReplayMemory(now: number, windowMs: number): void {
  if (memoryReplayStore.size < 5000) {
    return;
  }
  for (const [key, createdAt] of memoryReplayStore.entries()) {
    if (now - createdAt > windowMs) {
      memoryReplayStore.delete(key);
    }
  }
}

function replayKey(adapter: string, tenantId: string, payload: unknown, signature: string): string {
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(payload))
    .update(signature)
    .digest("hex");
  return `${adapter}:${tenantId}:${fingerprint}`;
}

function replayKeyHash(replayScopeKey: string): string {
  return createHash("sha256").update(replayScopeKey).digest("hex");
}

async function consumeReplayRedis(key: string, windowMs: number): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error("Redis unavailable");
  }

  const result = await redis.set(`webhook:replay:${key}`, "1", "PX", windowMs, "NX");
  return result !== null;
}

async function consumeReplayDb(scopeKey: string, windowMs: number): Promise<boolean> {
  const keyHash = replayKeyHash(scopeKey);
  const rows = await query<{ inserted: boolean }>(
    `INSERT INTO webhook_replay_keys (scope_key_hash, scope_key, expires_at)
     VALUES ($1, $2, NOW() + make_interval(secs => $3::int))
     ON CONFLICT (scope_key_hash) DO NOTHING
     RETURNING TRUE as inserted`,
    [keyHash, scopeKey, Math.ceil(windowMs / 1000)]
  );

  return rows.length > 0 && rows[0]?.inserted === true;
}

export async function cleanupExpiredDistributedGuardRecords(): Promise<void> {
  await query(`DELETE FROM webhook_replay_keys WHERE expires_at <= NOW()`);
  await query(`DELETE FROM rate_limit_counters WHERE expires_at <= NOW()`);
}

export async function getDistributedGuarantees(): Promise<{
  rateLimiting: GuaranteeLevel;
  webhookReplayDedup: GuaranteeLevel;
}> {
  const redisHealthy = await isRedisHealthy();
  if (redisHealthy) {
    observeGuarantee("rate_limiting", "distributed_shared");
    observeGuarantee("webhook_replay", "distributed_shared");
    return {
      rateLimiting: "distributed_shared",
      webhookReplayDedup: "distributed_shared",
    };
  }

  if (deploymentIsLocal()) {
    observeGuarantee("rate_limiting", "degraded");
    observeGuarantee("webhook_replay", "degraded");
    return {
      rateLimiting: "degraded",
      webhookReplayDedup: "degraded",
    };
  }

  observeGuarantee("rate_limiting", "degraded");
  observeGuarantee("webhook_replay", "degraded");
  return {
    rateLimiting: "degraded",
    webhookReplayDedup: "degraded",
  };
}

export async function consumeRateLimitShared(params: {
  tenantScope: string;
  routeScope: string;
  limit: number;
  windowMs: number;
}): Promise<ConsumeResult & { guarantee: GuaranteeLevel }> {
  const key = `ratelimit:tenant:${params.tenantScope}:route:${params.routeScope}`;
  const redisHealthy = await isRedisHealthy();

  if (redisHealthy) {
    const result = await consumeRedis(key, params.limit, params.windowMs);
    observeGuarantee("rate_limiting", "distributed_shared");
    return { ...result, guarantee: "distributed_shared" };
  }

  try {
    const db = await consumeRateLimitDb(key, params.limit);
    observeGuarantee("rate_limiting", "degraded");
    return {
      ...db,
      guarantee: "degraded",
    };
  } catch (error) {
    logWarn("distributed_guard_degraded", {
      guard: "rate_limiting",
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  const memory = consumeMemory(key, params.limit, params.windowMs);
  const guarantee = deploymentIsLocal() ? "local_only" : "degraded";
  observeGuarantee("rate_limiting", guarantee);
  return {
    ...memory,
    guarantee,
  };
}

export async function consumeWebhookReplayKey(params: {
  adapter: string;
  tenantId: string;
  payload: unknown;
  signature: string;
}): Promise<ReplayResult> {
  const key = replayKey(params.adapter, params.tenantId, params.payload, params.signature);
  const windowMs = replayWindowMs(params.adapter);
  const redisHealthy = await isRedisHealthy();

  if (redisHealthy) {
    const inserted = await consumeReplayRedis(key, windowMs);
    observeGuarantee("webhook_replay", "distributed_shared");
    return { duplicate: !inserted, guarantee: "distributed_shared" };
  }

  try {
    const inserted = await consumeReplayDb(key, windowMs);
    observeGuarantee("webhook_replay", "degraded");
    return { duplicate: !inserted, guarantee: "degraded" };
  } catch (error) {
    const now = Date.now();
    const existing = memoryReplayStore.get(key);
    if (existing && now - existing <= windowMs) {
      const guarantee = deploymentIsLocal() ? "local_only" : "degraded";
      observeGuarantee("webhook_replay", guarantee);
      return { duplicate: true, guarantee };
    }

    memoryReplayStore.set(key, now);
    cleanupReplayMemory(now, windowMs);
    logWarn("distributed_guard_degraded", {
      guard: "webhook_replay",
      reason: error instanceof Error ? error.message : String(error),
    });
    const guarantee = deploymentIsLocal() ? "local_only" : "degraded";
    observeGuarantee("webhook_replay", guarantee);
    return { duplicate: false, guarantee };
  }
}

export function logRateLimitTriggered(scope: string, guarantee: GuaranteeLevel): void {
  logInfo("rate_limit_triggered", { scope, guarantee });
}

export function logWebhookReplayRejected(guarantee: GuaranteeLevel, provider: string): void {
  replayRejectedCounter.inc({ guarantee, provider: provider.toLowerCase() });
  logInfo("webhook_replay_rejected", { guarantee, provider });
}

export async function logDistributedGuardStartupSummary(): Promise<void> {
  const guarantees = await getDistributedGuarantees();
  logInfo("distributed_guard_startup_summary", {
    deploymentEnv: config.deployment.env,
    nodeEnv: config.nodeEnv,
    rateLimitingGuarantee: guarantees.rateLimiting,
    webhookReplayGuarantee: guarantees.webhookReplayDedup,
    replayDefaultWindowMs: Number(
      process.env.WEBHOOK_REPLAY_WINDOW_MS || DEFAULT_WEBHOOK_DEDUP_WINDOW_MS
    ),
    replayProviderWindows: providerReplayWindowsMs,
    rateLimitDbWindowMs,
  });
}
