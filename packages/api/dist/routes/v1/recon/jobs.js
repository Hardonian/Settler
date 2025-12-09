"use strict";
/**
 * Recon Jobs API Routes
 *
 * REST API for managing reconciliation jobs
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = {};
const reconEngine = new recon_core_1.ReconCoreEngine(prisma);
/**
 * POST /api/v1/recon/jobs
 * Create a new reconciliation job
 */
router.post('/', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const reconJob = await reconEngine.createReconJob(tenantId, userId, {
            name: req.body.name,
            description: req.body.description,
            templateId: req.body.templateId,
            sourceAdapter: req.body.sourceAdapter,
            sourceConfigEncrypted: req.body.sourceConfigEncrypted,
            targetAdapter: req.body.targetAdapter,
            targetConfigEncrypted: req.body.targetConfigEncrypted,
            mappingTemplateId: req.body.mappingTemplateId,
            transformRecipeId: req.body.transformRecipeId,
            validationRules: req.body.validationRules,
            reconStrategy: req.body.reconStrategy,
            scheduleCron: req.body.scheduleCron,
            scheduleTimezone: req.body.scheduleTimezone,
            metadata: req.body.metadata,
        });
        res.status(201).json({
            data: reconJob,
            message: 'Reconciliation job created successfully',
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to create reconciliation job', 400);
    }
});
/**
 * GET /api/v1/recon/jobs
 * List reconciliation jobs
 */
router.get('/', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const status = req.query.status;
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        const jobs = await reconEngine.listReconJobs(tenantId, {
            ...(status ? { status } : {}),
            limit,
            offset,
        });
        res.json({
            data: jobs,
            pagination: {
                limit,
                offset,
                total: jobs.length,
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to list reconciliation jobs', 400);
    }
});
/**
 * GET /api/v1/recon/jobs/:jobId
 * Get a specific reconciliation job
 */
router.get('/:jobId', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Job ID is required',
            });
        }
        const job = await reconEngine.getReconJob(jobId, tenantId);
        if (!job) {
            return res.status(404).json({
                error: 'Not found',
                message: `Reconciliation job ${jobId} not found`,
            });
        }
        return res.json({ data: job });
    }
    catch (error) {
        return (0, error_handler_1.handleRouteError)(res, error, 'Failed to get reconciliation job', 400);
    }
});
/**
 * POST /api/v1/recon/jobs/:jobId/execute
 * Execute a reconciliation job
 */
router.post('/:jobId/execute', auth_1.authMiddleware, tenant_1.tenantMiddleware, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Job ID is required',
            });
        }
        const result = await reconEngine.executeReconJob(jobId, tenantId, {
            dryRun: req.body.dryRun,
            skipValidation: req.body.skipValidation,
            skipTransformation: req.body.skipTransformation,
            customRules: req.body.customRules,
        });
        return res.status(201).json({
            data: result,
            message: 'Reconciliation job executed successfully',
        });
    }
    catch (error) {
        return (0, error_handler_1.handleRouteError)(res, error, 'Failed to execute reconciliation job', 400);
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map