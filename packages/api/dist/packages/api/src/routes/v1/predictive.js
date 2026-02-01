"use strict";
/**
 * Predictive Operations API Routes
 *
 * Part 9: Predictive Ops, Meta-Models & Next-Gen Pipelines
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const tenant_1 = require("../../middleware/tenant");
const predictive_ops_1 = require("../../services/predictive/predictive-ops");
const meta_models_1 = require("../../services/predictive/meta-models");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const predictiveOps = new predictive_ops_1.PredictiveOps(prisma);
const metaModels = new meta_models_1.MetaModels();
/**
 * GET /api/v1/predictive/failures
 * Predict failures
 */
router.get('/failures', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (_req, res) => {
    try {
        const predictions = await predictiveOps.predictFailures();
        return res.json({
            data: predictions,
            message: 'Failure predictions generated',
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'PredictionError',
            message: errorMessage,
        });
    }
});
/**
 * POST /api/v1/predictive/complexity
 * Evaluate job complexity
 */
router.post('/complexity', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (req, res) => {
    try {
        const complexity = metaModels.evaluateJobComplexity(req.body);
        return res.json({
            data: complexity,
            message: 'Job complexity evaluated',
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'ComplexityError',
            message: errorMessage,
        });
    }
});
exports.default = router;
//# sourceMappingURL=predictive.js.map