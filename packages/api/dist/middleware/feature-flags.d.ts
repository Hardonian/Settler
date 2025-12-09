/**
 * Feature Flags Middleware
 *
 * Implements feature flag system for gradual rollouts, A/B testing, and feature toggles
 * Supports:
 * - Per-tenant feature flags
 * - Percentage-based rollouts
 * - A/B testing variants
 * - Environment-based flags
 * - Time-based flags (scheduled releases)
 */
import { Request, Response, NextFunction } from 'express';
export interface FeatureFlag {
    key: string;
    enabled: boolean;
    rolloutPercentage?: number;
    variants?: Record<string, number>;
    environments?: string[];
    tenants?: string[];
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
}
export interface FeatureFlagContext {
    tenantId?: string;
    userId?: string;
    environment?: string;
    [key: string]: unknown;
}
export interface FeatureFlagRequest extends Request {
    featureFlags?: {
        [key: string]: boolean | string;
    };
    featureFlagContext?: FeatureFlagContext;
}
/**
 * Feature flag service interface
 */
export interface FeatureFlagService {
    getFlag(key: string, context: FeatureFlagContext): Promise<boolean | string | null>;
    getFlags(context: FeatureFlagContext): Promise<Record<string, boolean | string>>;
}
/**
 * Set feature flag service (for dependency injection)
 */
export declare function setFeatureFlagService(service: FeatureFlagService): void;
/**
 * Get feature flag service
 */
export declare function getFeatureFlagService(): FeatureFlagService;
/**
 * Feature flag middleware
 */
export declare function featureFlagsMiddleware(): (req: FeatureFlagRequest, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Check if feature is enabled
 */
export declare function isFeatureEnabled(req: FeatureFlagRequest, key: string): boolean;
/**
 * Get feature variant (for A/B testing)
 */
export declare function getFeatureVariant(req: FeatureFlagRequest, key: string): string | null;
/**
 * Require feature flag middleware (fails request if flag not enabled)
 */
export declare function requireFeatureFlag(key: string): (req: FeatureFlagRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=feature-flags.d.ts.map