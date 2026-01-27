"use strict";
/**
 * Quota Enforcement Middleware
 * Enforces quotas before processing requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotaMiddleware = quotaMiddleware;
const Container_1 = require("../infrastructure/di/Container");
function quotaMiddleware(quotaType, requestedValue = 1) {
    return async (req, res, next) => {
        try {
            if (!req.tenantId) {
                res.status(403).json({ error: 'TenantNotFound', message: 'Tenant context required' });
                return;
            }
            const container = Container_1.Container.getInstance();
            const quotaService = container.get('QuotaService');
            await quotaService.enforceQuota(req.tenantId, quotaType, requestedValue);
            next();
        }
        catch (error) {
            if (error instanceof Error && 'name' in error && error.name === 'QuotaExceededError') {
                const quotaError = error;
                res.status(429).json({
                    error: 'QuotaExceeded',
                    message: quotaError.message,
                    quotaType: quotaError.quotaType,
                    currentUsage: quotaError.currentUsage,
                    limit: quotaError.limit,
                });
                return;
            }
            next(error);
        }
    };
}
//# sourceMappingURL=quota.js.map