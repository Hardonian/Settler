"use strict";
/**
 * Recon Results API Routes
 *
 * REST API for accessing reconciliation results
 * Part of Phase I: Recon Core Foundation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recon_core_1 = require("../../../services/recon-core");
const error_handler_1 = require("../../../utils/error-handler");
const auth_1 = require("../../../middleware/auth");
const tenant_1 = require("../../../middleware/tenant");
const router = (0, express_1.Router)();
// Prisma client will be initialized at runtime
const prisma = {};
const reconEngine = new recon_core_1.ReconCoreEngine(prisma);
/**
 * GET /api/v1/recon/jobs/:jobId/results
 * List reconciliation results for a job
 */
router.get('/', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const jobId = (req.params.jobId || req.query.jobId);
        if (!jobId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Job ID is required',
            });
        }
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        const results = await reconEngine.listReconResults(jobId, tenantId, {
            limit,
            offset,
        });
        return res.json({
            data: results,
            pagination: {
                limit,
                offset,
                total: results.length,
            },
        });
    }
    catch (error) {
        return (0, error_handler_1.handleRouteError)(res, error, 'Failed to list reconciliation results', 400);
    }
});
/**
 * GET /api/v1/recon/results/:resultId
 * Get a specific reconciliation result
 */
router.get('/:resultId', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { resultId } = req.params;
        if (!resultId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Result ID is required',
            });
        }
        const result = await reconEngine.getReconResult(resultId, tenantId);
        if (!result) {
            return res.status(404).json({
                error: 'Not found',
                message: `Reconciliation result ${resultId} not found`,
            });
        }
        return res.json({ data: result });
    }
    catch (error) {
        return (0, error_handler_1.handleRouteError)(res, error, 'Failed to get reconciliation result', 400);
    }
});
exports.default = router;
//# sourceMappingURL=results.js.map