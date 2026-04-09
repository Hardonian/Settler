"use strict";
/**
 * Rate Limiting
 *
 * Tracks and enforces rate limits per provider
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
exports.recordApiCall = recordApiCall;
const supabase_js_1 = require("@supabase/supabase-js");
const DEFAULT_RATE_LIMITS = {
    plaid: { requestsPerMinute: 100, requestsPerHour: 2000, requestsPerDay: 10000 },
    truelayer: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 5000 },
    stripe: { requestsPerMinute: 100, requestsPerHour: 5000, requestsPerDay: 50000 },
    "stripe-connect": { requestsPerMinute: 100, requestsPerHour: 5000, requestsPerDay: 50000 },
    freshbooks: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 5000 },
    wave: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 5000 },
    chargebee: { requestsPerMinute: 100, requestsPerHour: 2000, requestsPerDay: 10000 },
    recurly: { requestsPerMinute: 100, requestsPerHour: 2000, requestsPerDay: 10000 },
    etsy: { requestsPerMinute: 10, requestsPerHour: 100, requestsPerDay: 1000 },
    ebay: { requestsPerMinute: 5000, requestsPerHour: 500000, requestsPerDay: 5000000 },
    netsuite: { requestsPerMinute: 100, requestsPerHour: 5000, requestsPerDay: 50000 },
    sap: { requestsPerMinute: 100, requestsPerHour: 5000, requestsPerDay: 50000 },
    avalara: { requestsPerMinute: 100, requestsPerHour: 2000, requestsPerDay: 10000 },
    taxjar: { requestsPerMinute: 100, requestsPerHour: 2000, requestsPerDay: 10000 },
};
/**
 * Check if request is within rate limits
 */
async function checkRateLimit(providerId, tenantId, supabaseUrl, supabaseServiceKey) {
    const limits = DEFAULT_RATE_LIMITS[providerId.toLowerCase()] || {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 5000,
    };
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // Count requests in time windows
    const { data: recentRequests } = await supabase
        .from("sync_runs")
        .select("started_at")
        .eq("provider_id", providerId)
        .eq("tenant_id", tenantId)
        .gte("started_at", oneDayAgo.toISOString());
    const requests = recentRequests || [];
    let requestsLastMinute = 0;
    let requestsLastHour = 0;
    let requestsLastDay = 0;
    for (const r of requests) {
        const t = new Date(r.started_at).getTime();
        if (t >= oneDayAgo.getTime()) {
            requestsLastDay += 1;
        }
        if (t >= oneHourAgo.getTime()) {
            requestsLastHour += 1;
        }
        if (t >= oneMinuteAgo.getTime()) {
            requestsLastMinute += 1;
        }
    }
    // Check limits
    if (requestsLastMinute >= limits.requestsPerMinute) {
        return {
            allowed: false,
            retryAfter: 60,
            remaining: 0,
        };
    }
    if (requestsLastHour >= limits.requestsPerHour) {
        return {
            allowed: false,
            retryAfter: 3600,
            remaining: 0,
        };
    }
    if (requestsLastDay >= limits.requestsPerDay) {
        return {
            allowed: false,
            retryAfter: 86400,
            remaining: 0,
        };
    }
    return {
        allowed: true,
        remaining: Math.min(limits.requestsPerMinute - requestsLastMinute, limits.requestsPerHour - requestsLastHour, limits.requestsPerDay - requestsLastDay),
    };
}
/**
 * Record API call for rate limiting
 */
async function recordApiCall(_providerId, _tenantId, _supabaseUrl, _supabaseServiceKey) {
    // Rate limiting is tracked via sync_runs table
    // This function is a placeholder for future dedicated rate limit tracking
}
//# sourceMappingURL=rate-limiting.js.map