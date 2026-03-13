"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredDistributedGuardRecords = cleanupExpiredDistributedGuardRecords;
exports.getDistributedGuarantees = getDistributedGuarantees;
exports.consumeRateLimitShared = consumeRateLimitShared;
exports.consumeWebhookReplayKey = consumeWebhookReplayKey;
exports.logRateLimitTriggered = logRateLimitTriggered;
exports.logWebhookReplayRejected = logWebhookReplayRejected;
exports.logDistributedGuardStartupSummary = logDistributedGuardStartupSummary;
const crypto_1 = require("crypto");
const prom_client_1 = require("prom-client");
const config_1 = require("../config");
const db_1 = require("../db");
const cache_1 = require("../utils/cache");
const logger_1 = require("../utils/logger");
const memoryRateStore = new Map();
const memoryReplayStore = new Map();
const DEFAULT_WEBHOOK_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_DB_WINDOW_MS = 60 * 1000;
const rateLimitDbWindowMs = Number(process.env.RATE_LIMIT_DB_WINDOW_MS || DEFAULT_RATE_LIMIT_DB_WINDOW_MS);
let cachedRedisHealth = null;
const guaranteeStateGauge = new prom_client_1.Gauge({
    name: "distributed_guard_guarantee_state",
    help: "Current distributed guard guarantee state (1=current)",
    labelNames: ["guard", "guarantee"],
});
const guaranteeTransitionCounter = new prom_client_1.Counter({
    name: "distributed_guard_guarantee_transitions_total",
    help: "Total guarantee transitions observed for distributed guards",
    labelNames: ["guard", "from", "to"],
});
const replayRejectedCounter = new prom_client_1.Counter({
    name: "webhook_replay_rejected_total",
    help: "Total duplicate webhook replay rejections",
    labelNames: ["guarantee", "provider"],
});
let lastGuaranteeByGuard = {};
function deploymentIsLocal() {
    return (config_1.config.deployment.env === "local" ||
        config_1.config.nodeEnv === "development" ||
        config_1.config.nodeEnv === "test");
}
function parseProviderReplayWindows() {
    const configured = process.env.WEBHOOK_REPLAY_WINDOW_MS_BY_PROVIDER;
    if (!configured) {
        return {};
    }
    const windows = {};
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
function replayWindowMs(provider) {
    const providerWindow = providerReplayWindowsMs[provider.toLowerCase()];
    if (providerWindow && providerWindow > 0) {
        return providerWindow;
    }
    return Number(process.env.WEBHOOK_REPLAY_WINDOW_MS || DEFAULT_WEBHOOK_DEDUP_WINDOW_MS);
}
function observeGuarantee(guard, guarantee) {
    const previous = lastGuaranteeByGuard[guard];
    if (previous && previous !== guarantee) {
        guaranteeTransitionCounter.inc({ guard, from: previous, to: guarantee });
        (0, logger_1.logWarn)("distributed_guard_transition", { guard, from: previous, to: guarantee });
    }
    lastGuaranteeByGuard[guard] = guarantee;
    guaranteeStateGauge.set({ guard, guarantee: "distributed_shared" }, guarantee === "distributed_shared" ? 1 : 0);
    guaranteeStateGauge.set({ guard, guarantee: "local_only" }, guarantee === "local_only" ? 1 : 0);
    guaranteeStateGauge.set({ guard, guarantee: "degraded" }, guarantee === "degraded" ? 1 : 0);
    guaranteeStateGauge.set({ guard, guarantee: "unavailable" }, guarantee === "unavailable" ? 1 : 0);
}
async function isRedisHealthy() {
    const now = Date.now();
    if (cachedRedisHealth && now - cachedRedisHealth.checkedAt < 30_000) {
        return cachedRedisHealth.ok;
    }
    const redis = (0, cache_1.getRedisClient)();
    if (!redis) {
        cachedRedisHealth = { ok: false, checkedAt: now };
        return false;
    }
    try {
        await redis.ping();
        cachedRedisHealth = { ok: true, checkedAt: now };
        return true;
    }
    catch (error) {
        cachedRedisHealth = { ok: false, checkedAt: now };
        (0, logger_1.logWarn)("distributed_guard_degraded", {
            guard: "redis",
            reason: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}
function consumeMemory(key, limit, windowMs) {
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
async function consumeRedis(key, limit, windowMs) {
    const redis = (0, cache_1.getRedisClient)();
    if (!redis) {
        throw new Error("Redis unavailable");
    }
    const script = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
      redis.call('PEXPIRE', KEYS[1], ARGV[1])
    end
    local ttl = redis.call('PTTL', KEYS[1])
    return {current, ttl}
  `;
    const [currentRaw, ttlRaw] = (await redis.eval(script, 1, key, String(windowMs)));
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
async function consumeRateLimitDb(scopeKey, limit) {
    const now = Date.now();
    const bucketStart = Math.floor(now / rateLimitDbWindowMs) * rateLimitDbWindowMs;
    const bucketStartIso = new Date(bucketStart).toISOString();
    const rows = await (0, db_1.query)(`INSERT INTO rate_limit_counters (scope_key, bucket_start, count, expires_at)
     VALUES ($1, $2::timestamptz, 1, $2::timestamptz + make_interval(secs => $3::int))
     ON CONFLICT (scope_key, bucket_start)
     DO UPDATE SET count = rate_limit_counters.count + 1
     RETURNING count`, [scopeKey, bucketStartIso, Math.ceil(rateLimitDbWindowMs / 1000)]);
    const current = rows[0]?.count ?? 1;
    const resetAt = bucketStart + rateLimitDbWindowMs;
    return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetAt,
        current,
    };
}
function cleanupReplayMemory(now, windowMs) {
    if (memoryReplayStore.size < 5000) {
        return;
    }
    for (const [key, createdAt] of memoryReplayStore.entries()) {
        if (now - createdAt > windowMs) {
            memoryReplayStore.delete(key);
        }
    }
}
function replayKey(adapter, tenantId, payload, signature) {
    const fingerprint = (0, crypto_1.createHash)("sha256")
        .update(JSON.stringify(payload))
        .update(signature)
        .digest("hex");
    return `${adapter}:${tenantId}:${fingerprint}`;
}
function replayKeyHash(replayScopeKey) {
    return (0, crypto_1.createHash)("sha256").update(replayScopeKey).digest("hex");
}
async function consumeReplayRedis(key, windowMs) {
    const redis = (0, cache_1.getRedisClient)();
    if (!redis) {
        throw new Error("Redis unavailable");
    }
    const result = await redis.set(`webhook:replay:${key}`, "1", "PX", windowMs, "NX");
    return result !== null;
}
async function consumeReplayDb(scopeKey, windowMs) {
    const keyHash = replayKeyHash(scopeKey);
    const rows = await (0, db_1.query)(`INSERT INTO webhook_replay_keys (scope_key_hash, scope_key, expires_at)
     VALUES ($1, $2, NOW() + make_interval(secs => $3::int))
     ON CONFLICT (scope_key_hash) DO NOTHING
     RETURNING TRUE as inserted`, [keyHash, scopeKey, Math.ceil(windowMs / 1000)]);
    return rows.length > 0 && rows[0]?.inserted === true;
}
async function cleanupExpiredDistributedGuardRecords() {
    await (0, db_1.query)(`DELETE FROM webhook_replay_keys WHERE expires_at <= NOW()`);
    await (0, db_1.query)(`DELETE FROM rate_limit_counters WHERE expires_at <= NOW()`);
}
async function getDistributedGuarantees() {
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
async function consumeRateLimitShared(params) {
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
    }
    catch (error) {
        (0, logger_1.logWarn)("distributed_guard_degraded", {
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
async function consumeWebhookReplayKey(params) {
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
    }
    catch (error) {
        const now = Date.now();
        const existing = memoryReplayStore.get(key);
        if (existing && now - existing <= windowMs) {
            const guarantee = deploymentIsLocal() ? "local_only" : "degraded";
            observeGuarantee("webhook_replay", guarantee);
            return { duplicate: true, guarantee };
        }
        memoryReplayStore.set(key, now);
        cleanupReplayMemory(now, windowMs);
        (0, logger_1.logWarn)("distributed_guard_degraded", {
            guard: "webhook_replay",
            reason: error instanceof Error ? error.message : String(error),
        });
        const guarantee = deploymentIsLocal() ? "local_only" : "degraded";
        observeGuarantee("webhook_replay", guarantee);
        return { duplicate: false, guarantee };
    }
}
function logRateLimitTriggered(scope, guarantee) {
    (0, logger_1.logInfo)("rate_limit_triggered", { scope, guarantee });
}
function logWebhookReplayRejected(guarantee, provider) {
    replayRejectedCounter.inc({ guarantee, provider: provider.toLowerCase() });
    (0, logger_1.logInfo)("webhook_replay_rejected", { guarantee, provider });
}
async function logDistributedGuardStartupSummary() {
    const guarantees = await getDistributedGuarantees();
    (0, logger_1.logInfo)("distributed_guard_startup_summary", {
        deploymentEnv: config_1.config.deployment.env,
        nodeEnv: config_1.config.nodeEnv,
        rateLimitingGuarantee: guarantees.rateLimiting,
        webhookReplayGuarantee: guarantees.webhookReplayDedup,
        replayDefaultWindowMs: Number(process.env.WEBHOOK_REPLAY_WINDOW_MS || DEFAULT_WEBHOOK_DEDUP_WINDOW_MS),
        replayProviderWindows: providerReplayWindowsMs,
        rateLimitDbWindowMs,
    });
}
//# sourceMappingURL=distributed-guards.js.map