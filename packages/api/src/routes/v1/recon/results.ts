/**
 * Recon Results API Routes
 * 
 * REST API for accessing reconciliation results
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
 * GET /api/v1/recon/jobs/:jobId/results
 * List reconciliation results for a job
 */
router.get(
  '/',
  authenticateRequest,
  getTenantId,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const jobId = req.params.jobId || req.query.jobId as string;

      if (!jobId) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Job ID is required',
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const results = await reconEngine.listReconResults(jobId, tenantId, {
        limit,
        offset,
      });

      res.json({
        data: results,
        pagination: {
          limit,
          offset,
          total: results.length,
        },
      });
    } catch (error) {
      handleRouteError(res, error, 'Failed to list reconciliation results', 400);
    }
  }
);

/**
 * GET /api/v1/recon/results/:resultId
 * Get a specific reconciliation result
 */
router.get(
  '/:resultId',
  authenticateRequest,
  getTenantId,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { resultId } = req.params;

      const result = await reconEngine.getReconResult(resultId, tenantId);

      if (!result) {
        return res.status(404).json({
          error: 'Not found',
          message: `Reconciliation result ${resultId} not found`,
        });
      }

      res.json({ data: result });
    } catch (error) {
      handleRouteError(res, error, 'Failed to get reconciliation result', 400);
    }
  }
);

export default router;
