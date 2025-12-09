"use strict";
/**
 * Usage Tracking Routes
 *
 * Provides endpoints for:
 * - Viewing usage statistics
 * - Cost tracking
 * - Usage limits and quotas
 * - Billing information
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const usage_tracking_1 = require("../middleware/usage-tracking");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.usageRouter = router;
/**
 * Get usage summary
 * GET /api/v1/usage
 */
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const period = req.query.period || 'day';
        const usage = await (0, usage_tracking_1.getCurrentUsage)(req, period);
        if (!usage) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Usage data not found',
            });
        }
        return res.json({
            period,
            ...usage,
            retrievedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get usage', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve usage data',
        });
    }
});
/**
 * Get usage by endpoint
 * GET /api/v1/usage/endpoints
 */
router.get('/endpoints', auth_1.authMiddleware, async (req, res) => {
    try {
        const period = req.query.period || 'day';
        const usage = await (0, usage_tracking_1.getCurrentUsage)(req, period);
        if (!usage) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Usage data not found',
            });
        }
        return res.json({
            period,
            byEndpoint: usage.byEndpoint,
            retrievedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get usage by endpoint', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve endpoint usage',
        });
    }
});
/**
 * Get cost summary
 * GET /api/v1/usage/cost
 */
router.get('/cost', auth_1.authMiddleware, async (req, res) => {
    try {
        const period = req.query.period || 'day';
        const usage = await (0, usage_tracking_1.getCurrentUsage)(req, period);
        if (!usage) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Usage data not found',
            });
        }
        return res.json({
            period,
            totalCost: usage.totalCost,
            currency: 'USD',
            breakdown: {
                requests: usage.totalRequests * 0.001, // $0.001 per request
                dataTransfer: (usage.totalCost - (usage.totalRequests * 0.001)),
            },
            retrievedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get cost summary', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve cost data',
        });
    }
});
//# sourceMappingURL=usage.js.map