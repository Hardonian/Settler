"use strict";
/**
 * Metrics Route
 * Exposes Prometheus-compatible metrics endpoint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRouter = void 0;
const express_1 = require("express");
const metrics_1 = require("../infrastructure/observability/metrics");
const router = (0, express_1.Router)();
exports.metricsRouter = router;
router.get('/', async (_req, res) => {
    try {
        res.set('Content-Type', metrics_1.register.contentType);
        const metrics = await metrics_1.register.metrics();
        res.end(metrics);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to generate metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
//# sourceMappingURL=metrics.js.map