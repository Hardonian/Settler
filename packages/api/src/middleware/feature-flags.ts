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
import { logInfo } from '../utils/logger';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  variants?: Record<string, number>; // variant -> percentage
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
 * In-memory feature flag service (for development/testing)
 */
class InMemoryFeatureFlagService implements FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();

  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  async getFlag(key: string, context: FeatureFlagContext): Promise<boolean | string | null> {
    const flag = this.flags.get(key);
    if (!flag) {
      return null;
    }

    // Check expiration
    if (flag.expiresAt && flag.expiresAt < new Date()) {
      return false;
    }

    // Check environment
    if (flag.environments && context.environment) {
      if (!flag.environments.includes(context.environment)) {
        return false;
      }
    }

    // Check tenant whitelist
    if (flag.tenants && context.tenantId) {
      if (!flag.tenants.includes(context.tenantId)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const hash = this.hashContext(key, context);
      const percentage = (hash % 100);
      if (percentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    // Check variants (A/B testing)
    if (flag.variants && Object.keys(flag.variants).length > 0) {
      const hash = this.hashContext(key, context);
      const percentage = hash % 100;
      let cumulative = 0;
      
      for (const [variant, variantPercentage] of Object.entries(flag.variants)) {
        cumulative += variantPercentage;
        if (percentage < cumulative) {
          return variant;
        }
      }
    }

    return flag.enabled;
  }

  async getFlags(context: FeatureFlagContext): Promise<Record<string, boolean | string>> {
    const result: Record<string, boolean | string> = {};
    
    for (const [key] of this.flags) {
      const value = await this.getFlag(key, context);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result;
  }

  private hashContext(key: string, context: FeatureFlagContext): number {
    const str = `${key}:${context.tenantId || ''}:${context.userId || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Default service instance
let featureFlagService: FeatureFlagService = new InMemoryFeatureFlagService();

/**
 * Set feature flag service (for dependency injection)
 */
export function setFeatureFlagService(service: FeatureFlagService): void {
  featureFlagService = service;
}

/**
 * Get feature flag service
 */
export function getFeatureFlagService(): FeatureFlagService {
  return featureFlagService;
}

/**
 * Feature flag middleware
 */
export function featureFlagsMiddleware() {
  return async (req: FeatureFlagRequest, res: Response, next: NextFunction) => {
    try {
      const context: FeatureFlagContext = {
        tenantId: (req as any).tenantId || (req as any).user?.tenantId,
        userId: (req as any).userId || (req as any).user?.id,
        environment: process.env.NODE_ENV || 'development',
      };

      req.featureFlagContext = context;
      req.featureFlags = await featureFlagService.getFlags(context);

      // Log feature flag access for analytics
      logInfo('Feature flags loaded', {
        tenantId: context.tenantId,
        flagsCount: Object.keys(req.featureFlags).length,
      });

      next();
    } catch (error) {
      // Don't fail request if feature flags fail
      logInfo('Feature flags error (non-blocking)', { error });
      req.featureFlags = {};
      next();
    }
  };
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(req: FeatureFlagRequest, key: string): boolean {
  const value = req.featureFlags?.[key];
  return value === true || value === 'enabled';
}

/**
 * Get feature variant (for A/B testing)
 */
export function getFeatureVariant(req: FeatureFlagRequest, key: string): string | null {
  const value = req.featureFlags?.[key];
  if (typeof value === 'string' && value !== 'enabled' && value !== 'disabled') {
    return value;
  }
  return null;
}

/**
 * Require feature flag middleware (fails request if flag not enabled)
 */
export function requireFeatureFlag(key: string) {
  return (req: FeatureFlagRequest, res: Response, next: NextFunction) => {
    if (!isFeatureEnabled(req, key)) {
      return res.status(403).json({
        error: 'Feature Not Available',
        message: `Feature flag '${key}' is not enabled for your account`,
      });
    }
    next();
  };
}
