/**
 * Billing Feature Gating Middleware
 *
 * Enforces plan limits, add-on purchases, and usage thresholds.
 * Blocks access to premium features if requirements not met.
 */
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
/**
 * Subscription type for pilot checking
 */
interface SubscriptionForPilot {
    status?: string;
    trial_end?: string | Date | null;
}
/**
 * Check if subscription is in pilot/trial period
 */
declare function isPilotSubscription(subscription: SubscriptionForPilot | null): boolean;
/**
 * Check if pilot/trial has expired
 */
declare function isPilotExpired(subscription: SubscriptionForPilot | null): boolean;
/**
 * Get days remaining in pilot/trial
 */
declare function getPilotDaysRemaining(subscription: SubscriptionForPilot | null): number | null;
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
    pilot_expired?: boolean;
    is_pilot?: boolean;
}>;
/**
 * Middleware to check integration access
 * Supports dynamic integration ID from route params
 */
export declare function checkIntegrationAccess(integrationIdOrParam: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to check pilot status and expiration
 * Use this to add pilot warnings/errors to responses
 */
export declare function checkPilotStatus(): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Export pilot helper functions for use in other modules
 */
export { isPilotSubscription, isPilotExpired, getPilotDaysRemaining };
//# sourceMappingURL=billing-gating.d.ts.map