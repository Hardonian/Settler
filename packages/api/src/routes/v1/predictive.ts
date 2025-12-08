/**
 * Predictive Operations API Routes
 * 
 * Part 9: Predictive Ops, Meta-Models & Next-Gen Pipelines
 */

import { Router, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant';
import { PredictiveOps } from '../../services/predictive/predictive-ops';
import { MetaModels } from '../../services/predictive/meta-models';

const router = Router();
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
      res.json({
        data: predictions,
        message: 'Failure predictions generated',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'PredictionError',
        message: error.message,
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
  authenticateRequest,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const complexity = metaModels.evaluateJobComplexity(req.body);
      res.json({
        data: complexity,
        message: 'Job complexity evaluated',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'ComplexityError',
        message: error.message,
      });
    }
  }
);

export default router;
