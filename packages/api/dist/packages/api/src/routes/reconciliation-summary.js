"use strict";
/**
 * Reconciliation Summary Route
 * Optimized endpoint using materialized views and caching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconciliationSummaryRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const api_gateway_cache_1 = require("../middleware/api-gateway-cache");
const query_optimization_1 = require("../infrastructure/query-optimization");
const api_response_1 = require("../utils/api-response");
const error_handler_1 = require("../utils/error-handler");
const router = (0, express_1.Router)();
exports.reconciliationSummaryRouter = router;
const getSummarySchema = zod_1.z.object({
    params: zod_1.z.object({
        jobId: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        start: zod_1.z.string().datetime().optional(),
        end: zod_1.z.string().datetime().optional(),
        useView: zod_1.z.string().transform((val) => val === 'true').optional(),
        refreshView: zod_1.z.string().transform((val) => val === 'true').optional(),
    }),
});
// Get reconciliation summary (cached, uses materialized view)
router.get('/:jobId', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, api_gateway_cache_1.apiGatewayCache)(api_gateway_cache_1.cacheConfigs.reconciliationSummary()), (0, validation_1.validateRequest)(getSummarySchema), async (req, res) => {
    try {
        const { jobId } = req.params;
        const { start, end, useView = true, refreshView = false } = req.query;
        if (!jobId) {
            return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', 'Job ID is required');
        }
        const dateRange = start && end
            ? { start: new Date(start), end: new Date(end) }
            : undefined;
        const summary = await (0, query_optimization_1.getReconciliationSummary)(jobId, dateRange, {
            useMaterializedView: useView,
            refreshView: refreshView,
            cache: true,
            cacheTtl: 60,
        });
        (0, api_response_1.sendSuccess)(res, summary, 'Reconciliation summary retrieved successfully');
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get reconciliation summary', 500, { jobId: req.params.jobId });
    }
});
// Get job performance metrics
router.get('/:jobId/performance', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, api_gateway_cache_1.apiGatewayCache)({ ttl: 300, includeUserId: true }), async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', 'Job ID is required');
        }
        const performance = await (0, query_optimization_1.getJobPerformance)(jobId, {
            useMaterializedView: true,
            cache: true,
        });
        if (!performance) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'Job performance data not found');
        }
        (0, api_response_1.sendSuccess)(res, performance, 'Job performance retrieved successfully');
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get job performance', 500, { jobId: req.params.jobId });
    }
});
// Get match accuracy
router.get('/:jobId/accuracy', (0, authorization_1.requirePermission)(Permissions_1.Permission.REPORTS_READ), (0, api_gateway_cache_1.apiGatewayCache)({ ttl: 300, includeUserId: true }), async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', 'Job ID is required');
        }
        const accuracy = await (0, query_optimization_1.getMatchAccuracy)(jobId, {
            useMaterializedView: true,
            cache: true,
        });
        if (!accuracy) {
            return (0, api_response_1.sendError)(res, 404, 'NOT_FOUND', 'Match accuracy data not found');
        }
        (0, api_response_1.sendSuccess)(res, accuracy, 'Match accuracy retrieved successfully');
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to get match accuracy', 500, { jobId: req.params.jobId });
    }
});
//# sourceMappingURL=reconciliation-summary.js.map