/**
 * Recon Jobs API Routes
 * 
 * REST API for managing reconciliation jobs
 * Part of Phase I: Recon Core Foundation
 */

import { Router, Request, Response } from 'express';
import { ReconCoreEngine } from '../../../services/recon-core';
import { PrismaClient } from '@prisma/client';
import { handleRouteError } from '../../../utils/error-handler';
import { authenticateRequest } from '../../../middleware/auth';
import { getTenantId } from '../../../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();
const reconEngine = new ReconCoreEngine(prisma);

/**
 * POST /api/v1/recon/jobs
 * Create a new reconciliation job
 */
router.post(
  '/',
  authenticateRequest,
  getTenantId,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;

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
    } catch (error) {
      handleRouteError(res, error, 'Failed to create reconciliation job', 400);
    }
  }
);

/**
 * GET /api/v1/recon/jobs
 * List reconciliation jobs
 */
router.get(
  '/',
  authenticateRequest,
  getTenantId,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const jobs = await reconEngine.listReconJobs(tenantId, {
        status,
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
    } catch (error) {
      handleRouteError(res, error, 'Failed to list reconciliation jobs', 400);
    }
  }
);

/**
 * GET /api/v1/recon/jobs/:jobId
 * Get a specific reconciliation job
 */
router.get(
  '/:jobId',
  authenticateRequest,
  getTenantId,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { jobId } = req.params;

      const job = await reconEngine.getReconJob(jobId, tenantId);

      if (!job) {
        return res.status(404).json({
          error: 'Not found',
          message: `Reconciliation job ${jobId} not found`,
        });
      }

      res.json({ data: job });
    } catch (error) {
      handleRouteError(res, error, 'Failed to get reconciliation job', 400);
    }
  }
);

/**
 * POST /api/v1/recon/jobs/:jobId/execute
 * Execute a reconciliation job
 */
router.post(
  '/:jobId/execute',
  authenticateRequest,
  getTenantId,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { jobId } = req.params;

      const result = await reconEngine.executeReconJob(jobId, tenantId, {
        dryRun: req.body.dryRun,
        skipValidation: req.body.skipValidation,
        skipTransformation: req.body.skipTransformation,
        customRules: req.body.customRules,
      });

      res.status(201).json({
        data: result,
        message: 'Reconciliation job executed successfully',
      });
    } catch (error) {
      handleRouteError(res, error, 'Failed to execute reconciliation job', 400);
    }
  }
);

export default router;
