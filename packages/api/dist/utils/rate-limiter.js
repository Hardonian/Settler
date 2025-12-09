"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
exports.rateLimitMiddleware = rateLimitMiddleware;
const db_1 = require("../db");
const config_1 = require("../config");
const rateLimitStore = new Map();
function getRateLimitKey(req) {
    if (req.apiKeyId) {
        return `apikey:${req.apiKeyId}`;
    }
    return `ip:${req.ip}`;
}
async function checkRateLimit(req) {
    const key = getRateLimitKey(req);
    const now = Date.now();
    const windowMs = config_1.config.rateLimiting.windowMs;
    // Get rate limit from API key if available
    let limit = config_1.config.rateLimiting.defaultLimit;
    if (req.apiKeyId) {
        const keys = await (0, db_1.query)('SELECT rate_limit FROM api_keys WHERE id = $1', [req.apiKeyId]);
        if (keys.length > 0 && keys[0]) {
            limit = keys[0].rate_limit;
        }
    }
    const entry = rateLimitStore.get(key);
    if (!entry || entry.resetAt < now) {
        // Reset or create new entry
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        // Cleanup old entries periodically
        if (rateLimitStore.size > 10000) {
            for (const [k, v] of rateLimitStore.entries()) {
                if (v.resetAt < now) {
                    rateLimitStore.delete(k);
                }
            }
        }
        return {
            allowed: true,
            remaining: limit - 1,
            resetAt: now + windowMs,
        };
    }
    if (entry.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }
    entry.count++;
    return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
    };
}
function rateLimitMiddleware() {
    return async (req, res, next) => {
        const result = await checkRateLimit(req);
        res.setHeader('X-RateLimit-Limit', config_1.config.rateLimiting.defaultLimit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
        if (!result.allowed) {
            res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded',
                retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=rate-limiter.js.map