"use strict";
/**
 * Cost Control Middleware
 *
 * Enforces cost limits before processing requests
 * Implements backpressure and degradation paths
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceCostControl = enforceCostControl;
exports.checkAbuse = checkAbuse;
const cost_control_1 = require("../services/cost-control");
const logger_1 = require("../utils/logger");
/**
 * Middleware to enforce cost limits
 */
function enforceCostControl(options) {
    return async (req, res, next) => {
        try {
            if (!req.tenantId) {
                res.status(403).json({ error: 'TenantNotFound', message: 'Tenant context required' });
                return;
            }
            // Get billing account ID from request or tenant
            const billingAccountId = req.billingAccountId || req.tenantId;
            // Check cost limit
            const result = await cost_control_1.costControlService.checkCostLimit(req.tenantId, billingAccountId, options.costDriverId, options.quantity || 1);
            if (!result.allowed) {
                if (options.failOpen) {
                    (0, logger_1.logWarn)('Cost limit exceeded but failing open', {
                        tenantId: req.tenantId,
                        costDriverId: options.costDriverId,
                        reason: result.reason,
                    });
                    // Continue but mark as degraded
                    req.costControlStatus = 'degraded';
                    req.costControlReason = result.reason;
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
            await cost_control_1.costControlService.recordCostUsage(req.tenantId, billingAccountId, options.costDriverId, options.quantity || 1);
            // Attach cost control status to request
            req.costControlStatus = 'allowed';
            req.costControlResult = result;
            next();
        }
        catch (error) {
            (0, logger_1.logWarn)('Error in cost control middleware', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
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
function checkAbuse() {
    return async (req, _res, next) => {
        try {
            if (!req.tenantId) {
                return next();
            }
            const billingAccountId = req.billingAccountId || req.tenantId;
            const abuseCheck = await cost_control_1.costControlService.detectAbuse(req.tenantId, billingAccountId);
            if (abuseCheck.isAbuse) {
                (0, logger_1.logWarn)('Abuse detected', {
                    tenantId: req.tenantId,
                    reason: abuseCheck.reason,
                    actions: abuseCheck.actions,
                });
                // Attach abuse info to request
                req.abuseDetected = true;
                req.abuseReason = abuseCheck.reason;
                req.abuseActions = abuseCheck.actions;
                // If abuse actions include throttle, enforce stricter limits
                if (abuseCheck.actions.includes('throttle')) {
                    // Add delay to slow down requests
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
            next();
        }
        catch (error) {
            (0, logger_1.logWarn)('Error checking abuse', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            // Fail open - don't block requests on abuse check failure
            next();
        }
    };
}
//# sourceMappingURL=cost-control.js.map