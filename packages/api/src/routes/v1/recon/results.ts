/**
 * Recon Results API Routes
 * 
 * REST API for accessing reconciliation results
 * Part of Phase I: Recon Core Foundation
 */

import { Router, Response } from 'express';
import { ReconCoreEngine } from '../../../services/recon-core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import type { PrismaClient } from '@prisma/client';
import { handleRouteError } from '../../../utils/error-handler';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import type { TenantRequest } from '../../../middleware/tenant';

const router: Router = Router();
// Prisma client will be initialized at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = {} as PrismaClient;
const reconEngine = new ReconCoreEngine(prisma);

/**
 * GET /api/v1/recon/jobs/:jobId/results
 * List reconciliation results for a job
 */
router.get(
  '/',
  authMiddleware,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const jobId = (req.params.jobId || req.query.jobId) as string | undefined;

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

      return res.json({
        data: results,
        pagination: {
          limit,
          offset,
          total: results.length,
        },
      });
    } catch (error) {
      return handleRouteError(res, error, 'Failed to list reconciliation results', 400);
    }
  }
);

/**
 * GET /api/v1/recon/results/:resultId
 * Get a specific reconciliation result
 */
router.get(
  '/:resultId',
  authMiddleware,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
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
    } catch (error) {
      return handleRouteError(res, error, 'Failed to get reconciliation result', 400);
    }
  }
);

export default router;
