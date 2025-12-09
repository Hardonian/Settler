"use strict";
/**
 * Network Effects API Routes
 *
 * REST API for network effects features (cross-customer intelligence, performance pools)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cross_customer_intelligence_1 = require("../../services/network-effects/cross-customer-intelligence");
const performance_pools_1 = require("../../services/network-effects/performance-pools");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
/**
 * POST /api/v2/network-effects/intelligence/opt-in
 * Opt-in to cross-customer intelligence
 */
router.post('/intelligence/opt-in', async (req, res) => {
    try {
        const customerId = req.userId || req.body.customerId;
        if (!customerId) {
            return res.status(400).json({
                error: 'Missing customer ID',
            });
        }
        cross_customer_intelligence_1.crossCustomerIntelligence.optIn(customerId);
        res.json({
            data: {
                customerId,
                optedIn: true,
            },
            message: 'Successfully opted in to cross-customer intelligence',
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to opt in', 400);
        return;
    }
});
/**
 * POST /api/v2/network-effects/intelligence/opt-out
 * Opt-out of cross-customer intelligence
 */
router.post('/intelligence/opt-out', async (req, res) => {
    try {
        const customerId = req.userId || req.body.customerId;
        if (!customerId) {
            return res.status(400).json({
                error: 'Missing customer ID',
            });
        }
        cross_customer_intelligence_1.crossCustomerIntelligence.optOut(customerId);
        res.json({
            data: {
                customerId,
                optedIn: false,
            },
            message: 'Successfully opted out of cross-customer intelligence',
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to opt out', 400);
        return;
    }
});
/**
 * POST /api/v2/network-effects/intelligence/check-pattern
 * Check if a pattern matches known patterns
 */
router.post('/intelligence/check-pattern', async (req, res) => {
    try {
        const { type, data } = req.body;
        if (!type || !data) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'type and data are required',
            });
        }
        const match = cross_customer_intelligence_1.crossCustomerIntelligence.checkPattern({ type, data });
        res.json({
            data: match,
            matched: match !== null,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to check pattern', 400);
        return;
    }
});
/**
 * GET /api/v2/network-effects/intelligence/insights
 * Get network insights (anonymized)
 */
router.get('/intelligence/insights', async (_req, res) => {
    try {
        const insights = cross_customer_intelligence_1.crossCustomerIntelligence.getNetworkInsights();
        res.json({
            data: insights,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get insights', 500);
        return;
    }
});
/**
 * POST /api/v2/network-effects/performance/opt-in
 * Opt-in to performance tuning pools
 */
router.post('/performance/opt-in', async (req, res) => {
    try {
        const customerId = req.userId || req.body.customerId;
        if (!customerId) {
            return res.status(400).json({
                error: 'Missing customer ID',
            });
        }
        performance_pools_1.performanceTuningPools.optIn(customerId);
        res.json({
            data: {
                customerId,
                optedIn: true,
            },
            message: 'Successfully opted in to performance tuning pools',
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to opt in', 400);
        return;
    }
});
/**
 * POST /api/v2/network-effects/performance/submit
 * Submit performance metrics
 */
router.post('/performance/submit', async (req, res) => {
    try {
        const customerId = req.userId || req.body.customerId;
        const { jobId, adapter, ruleType, accuracy, latency, throughput } = req.body;
        if (!customerId || !jobId || !adapter || !ruleType) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'customerId, jobId, adapter, and ruleType are required',
            });
        }
        performance_pools_1.performanceTuningPools.submitMetrics(customerId, {
            jobId,
            adapter,
            ruleType,
            accuracy: accuracy || 0,
            latency: latency || 0,
            throughput: throughput || 0,
        });
        res.json({
            data: {
                submitted: true,
            },
            message: 'Performance metrics submitted successfully',
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to submit metrics', 400);
        return;
    }
});
/**
 * GET /api/v2/network-effects/performance/insights
 * Get performance insights
 */
router.get('/performance/insights', async (req, res) => {
    try {
        const { adapter, ruleType } = req.query;
        if (!adapter) {
            return res.status(400).json({
                error: 'Missing adapter parameter',
            });
        }
        const insights = performance_pools_1.performanceTuningPools.getInsights(adapter, ruleType);
        res.json({
            data: insights,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get insights', 500);
        return;
    }
});
/**
 * GET /api/v2/network-effects/performance/recommendations
 * Get recommended rules
 */
router.get('/performance/recommendations', async (req, res) => {
    try {
        const { adapter, useCase } = req.query;
        if (!adapter) {
            return res.status(400).json({
                error: 'Missing adapter parameter',
            });
        }
        const recommendations = performance_pools_1.performanceTuningPools.getRecommendedRules(adapter, useCase || 'default');
        res.json({
            data: recommendations,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get recommendations', 500);
        return;
    }
});
/**
 * GET /api/v2/network-effects/stats
 * Get network effects statistics
 */
router.get('/stats', async (_req, res) => {
    try {
        const intelligenceInsights = cross_customer_intelligence_1.crossCustomerIntelligence.getNetworkInsights();
        const performanceStats = performance_pools_1.performanceTuningPools.getStats();
        res.json({
            data: {
                intelligence: intelligenceInsights,
                performance: performanceStats,
            },
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get stats', 500);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=network-effects.js.map