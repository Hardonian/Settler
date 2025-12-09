/**
 * Recon Rate Limiter
 *
 * Tier-based rate limiting for reconciliation operations
 * Part of Phase II: API & Billing Expansion
 */
import { Response, NextFunction } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { TenantRequest } from './tenant';
export declare class ReconRateLimiter {
    private prisma;
    private tokenBuckets;
    constructor(prisma: PrismaClient);
    /**
     * Token bucket rate limiter
     */
    private getTokenBucket;
    /**
     * Get tenant tier
     */
    private getTenantTier;
    /**
     * Check concurrent jobs limit
     */
    private checkConcurrentJobs;
    /**
     * Check monthly reconciliation limit
     */
    private checkMonthlyRecons;
    /**
     * Middleware for rate limiting
     */
    middleware(): (req: TenantRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
}
//# sourceMappingURL=recon-rate-limiter.d.ts.map