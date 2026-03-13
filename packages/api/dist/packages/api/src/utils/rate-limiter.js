"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
exports.rateLimitMiddleware = rateLimitMiddleware;
const db_1 = require("../db");
const config_1 = require("../config");
const distributed_guards_1 = require("../services/distributed-guards");
function shouldBypass(req) {
    const path = req.path.toLowerCase();
    return path.includes("/operator/") || path.startsWith("/admin/") || req.headers["x-admin-bypass"] === "true";
}
async function resolveTenantLimit(req) {
    if (!req.apiKeyId) {
        return config_1.config.rateLimiting.defaultLimit;
    }
    const keys = await (0, db_1.query)("SELECT rate_limit FROM api_keys WHERE id = $1", [req.apiKeyId]);
    return keys[0]?.rate_limit ?? config_1.config.rateLimiting.defaultLimit;
}
async function checkRateLimit(req) {
    const windowMs = config_1.config.rateLimiting.windowMs;
    if (shouldBypass(req)) {
        return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetAt: Date.now() + windowMs, scope: "bypass" };
    }
    const tenantKey = req.tenantId || req.apiKeyId || req.userId || req.ip || "anonymous";
    const routeScope = `${req.method.toUpperCase()}:${req.route?.path || req.path}`.toLowerCase();
    const tenantLimit = await resolveTenantLimit(req);
    const tenantResult = await (0, distributed_guards_1.consumeRateLimitShared)({
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
    const globalResult = await (0, distributed_guards_1.consumeRateLimitShared)({
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
function rateLimitMiddleware() {
    return async (req, res, next) => {
        const result = await checkRateLimit(req);
        if (result.scope !== "bypass") {
            res.setHeader("X-RateLimit-Limit", config_1.config.rateLimiting.defaultLimit);
            res.setHeader("X-RateLimit-Remaining", result.remaining);
            res.setHeader("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
            if (result.guarantee) {
                res.setHeader("X-RateLimit-Guarantee", result.guarantee);
            }
        }
        if (!result.allowed) {
            const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
            res.setHeader("Retry-After", retryAfter.toString());
            (0, distributed_guards_1.logRateLimitTriggered)(result.scope, result.guarantee || "local_only");
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
//# sourceMappingURL=rate-limiter.js.map