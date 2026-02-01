/**
 * Predictive Operations API Routes
 * 
 * Part 9: Predictive Ops, Meta-Models & Next-Gen Pipelines
 */

import { Router, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant';
import { PredictiveOps } from '../../services/predictive/predictive-ops';
import { MetaModels } from '../../services/predictive/meta-models';

const router: Router = Router();
const prisma = new PrismaClient();
const predictiveOps = new PredictiveOps(prisma);
const metaModels = new MetaModels();

/**
 * GET /api/v1/predictive/failures
 * Predict failures
 */
router.get(
  '/failures',
  authMiddleware,
  tenantMiddleware,
  async (_req: TenantRequest, res: Response) => {
    try {
      const predictions = await predictiveOps.predictFailures();
      return res.json({
        data: predictions,
        message: 'Failure predictions generated',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        error: 'PredictionError',
        message: errorMessage,
      });
    }
  }
);

/**
 * POST /api/v1/predictive/complexity
 * Evaluate job complexity
 */
router.post(
  '/complexity',
  authMiddleware,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const complexity = metaModels.evaluateJobComplexity(req.body);
      return res.json({
        data: complexity,
        message: 'Job complexity evaluated',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        error: 'ComplexityError',
        message: errorMessage,
      });
    }
  }
);

export default router;
