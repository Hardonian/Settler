/**
 * Cost Control Middleware
 * 
 * Enforces cost limits before processing requests
 * Implements backpressure and degradation paths
 */

import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenant';
import { costControlService, CostControlResult } from '../services/cost-control';
import { logWarn, logInfo } from '../utils/logger';

export interface CostControlOptions {
  costDriverId: string;
  quantity?: number;
  failOpen?: boolean; // If true, allow request even if cost check fails (for critical paths)
  degradedMode?: boolean; // If true, allow request but mark as degraded
}

/**
 * Middleware to enforce cost limits
 */
export function enforceCostControl(options: CostControlOptions) {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        res.status(403).json({ error: 'TenantNotFound', message: 'Tenant context required' });
        return;
      }

      // Get billing account ID from request or tenant
      const billingAccountId = (req as any).billingAccountId || req.tenantId;

      // Check cost limit
      const result: CostControlResult = await costControlService.checkCostLimit(
        req.tenantId,
        billingAccountId,
        options.costDriverId,
        options.quantity || 1
      );

      if (!result.allowed) {
        if (options.failOpen) {
          logWarn('Cost limit exceeded but failing open', {
            tenantId: req.tenantId,
            costDriverId: options.costDriverId,
            reason: result.reason,
          });
          // Continue but mark as degraded
          (req as any).costControlStatus = 'degraded';
          (req as any).costControlReason = result.reason;
          return next();
        }

        // Fail closed
        res.status(429).json({
          error: 'CostLimitExceeded',
          message: result.reason || 'Cost limit exceeded',
          costDriverId: options.costDriverId,
          currentUsage: result.currentUsage,
          limit: result.limit,
          retryAfter: result.retryAfter,
          degradedMode: result.degradedMode,
        });
        return;
      }

      // Record cost usage
      await costControlService.recordCostUsage(
        req.tenantId,
        billingAccountId,
        options.costDriverId,
        options.quantity || 1
      );

      // Attach cost control status to request
      (req as any).costControlStatus = 'allowed';
      (req as any).costControlResult = result;

      next();
    } catch (error) {
      logWarn('Error in cost control middleware', error);
      // Fail closed for cost control
      if (!options.failOpen) {
        res.status(500).json({
          error: 'CostControlError',
          message: 'Failed to check cost limits',
        });
        return;
      }
      // Fail open if configured
      next();
    }
  };
}

/**
 * Middleware to check for abuse scenarios
 */
export function checkAbuse() {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        return next();
      }

      const billingAccountId = (req as any).billingAccountId || req.tenantId;
      const abuseCheck = await costControlService.detectAbuse(req.tenantId, billingAccountId);

      if (abuseCheck.isAbuse) {
        logWarn('Abuse detected', {
          tenantId: req.tenantId,
          reason: abuseCheck.reason,
          actions: abuseCheck.actions,
        });

        // Attach abuse info to request
        (req as any).abuseDetected = true;
        (req as any).abuseReason = abuseCheck.reason;
        (req as any).abuseActions = abuseCheck.actions;

        // If abuse actions include throttle, enforce stricter limits
        if (abuseCheck.actions.includes('throttle')) {
          // Add delay to slow down requests
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      next();
    } catch (error) {
      logWarn('Error checking abuse', error);
      // Fail open - don't block requests on abuse check failure
      next();
    }
  };
}
