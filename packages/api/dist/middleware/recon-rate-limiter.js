"use strict";
/**
 * Recon Rate Limiter
 *
 * Tier-based rate limiting for reconciliation operations
 * Part of Phase II: API & Billing Expansion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconRateLimiter = void 0;
const TIER_LIMITS = {
    free: {
        rpm: 100,
        concurrentJobs: 1,
        monthlyRecons: 100,
    },
    starter: {
        rpm: 1000,
        concurrentJobs: 5,
        monthlyRecons: 10000,
    },
    pro: {
        rpm: 10000,
        concurrentJobs: 20,
        monthlyRecons: 100000,
    },
    business: {
        rpm: 50000,
        concurrentJobs: 100,
        monthlyRecons: 1000000,
    },
    enterprise: {
        rpm: 1000000,
        concurrentJobs: 1000,
        monthlyRecons: -1, // Unlimited
    },
};
function getTierLimits(tier) {
    const limits = TIER_LIMITS[tier];
    if (limits) {
        return limits;
    }
    return TIER_LIMITS.free;
}
class ReconRateLimiter {
    prisma;
    tokenBuckets = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Token bucket rate limiter
     */
    getTokenBucket(key, capacity, refillRate) {
        const now = Date.now();
        const bucket = this.tokenBuckets.get(key) || { tokens: capacity, lastRefill: now };
        // Refill tokens based on time elapsed
        const timeElapsed = (now - bucket.lastRefill) / 1000; // seconds
        const tokensToAdd = timeElapsed * (refillRate / 60); // tokens per second
        bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
        // Check if we have enough tokens
        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            this.tokenBuckets.set(key, bucket);
            return true;
        }
        this.tokenBuckets.set(key, bucket);
        return false;
    }
    /**
     * Get tenant tier
     */
    async getTenantTier(tenantId) {
        try {
            const result = await this.prisma.$queryRaw `
        SELECT tier FROM tenants WHERE id = ${tenantId}::uuid
      `;
            return result[0]?.tier || 'free';
        }
        catch {
            return 'free';
        }
    }
    /**
     * Check concurrent jobs limit
     */
    async checkConcurrentJobs(tenantId, limit) {
        const runningJobs = await this.prisma.reconResult.count({
            where: {
                tenantId,
                status: 'running',
            },
        });
        return runningJobs < limit;
    }
    /**
     * Check monthly reconciliation limit
     */
    async checkMonthlyRecons(tenantId, limit) {
        if (limit === -1)
            return true; // Unlimited
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlyRecons = await this.prisma.reconResult.count({
            where: {
                tenantId,
                startedAt: {
                    gte: startOfMonth,
                },
            },
        });
        return monthlyRecons < limit;
    }
    /**
     * Middleware for rate limiting
     */
    middleware() {
        return async (req, res, next) => {
            const tenantId = req.tenantId;
            if (!tenantId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            try {
                const tier = await this.getTenantTier(tenantId);
                const limits = getTierLimits(tier);
                // Check RPM limit (token bucket)
                const rpmKey = `rpm:${tenantId}`;
                const hasRpmCapacity = this.getTokenBucket(rpmKey, limits.rpm, limits.rpm);
                if (!hasRpmCapacity) {
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: `Rate limit of ${limits.rpm} requests per minute exceeded`,
                        retryAfter: 60,
                    });
                }
                // Check concurrent jobs limit (for job execution endpoints)
                if (req.path.includes('/execute')) {
                    const hasConcurrentCapacity = await this.checkConcurrentJobs(tenantId, limits.concurrentJobs);
                    if (!hasConcurrentCapacity) {
                        return res.status(429).json({
                            error: 'Concurrent job limit exceeded',
                            message: `Maximum ${limits.concurrentJobs} concurrent jobs allowed`,
                        });
                    }
                }
                // Check monthly reconciliation limit (for job execution endpoints)
                if (req.path.includes('/execute')) {
                    const hasMonthlyCapacity = await this.checkMonthlyRecons(tenantId, limits.monthlyRecons);
                    if (!hasMonthlyCapacity) {
                        return res.status(429).json({
                            error: 'Monthly reconciliation limit exceeded',
                            message: `Monthly limit of ${limits.monthlyRecons} reconciliations exceeded`,
                        });
                    }
                }
                return next();
            }
            catch (error) {
                console.error('Rate limiter error:', error);
                // On error, allow the request (fail open)
                return next();
            }
        };
    }
}
exports.ReconRateLimiter = ReconRateLimiter;
//# sourceMappingURL=recon-rate-limiter.js.map