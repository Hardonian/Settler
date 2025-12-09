/**
 * Billing Feature Gating Middleware
 *
 * Enforces plan limits, add-on purchases, and usage thresholds.
 * Blocks access to premium features if requirements not met.
 */
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
/**
 * Feature gating middleware factory
 */
export declare function featureGate(featureName: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Check usage quota for a specific event type
 * This is a helper function, not middleware
 * Use the checkUsageQuota middleware from usage-quota.ts for route-level checks
 */
export declare function checkUsageQuotaForEvent(userId: string, eventType: string, quantity?: number): Promise<{
    allowed: boolean;
    currentUsage?: number;
    limit?: number;
    reason?: string;
}>;
/**
 * Middleware to check integration access
 */
export declare function checkIntegrationAccess(integrationId: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=billing-gating.d.ts.map