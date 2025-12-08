/**
 * Pricing Simulator API Routes
 * 
 * Part of Section 9: Pricing Intelligence
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '../../../middleware/auth';
import { tenantMiddleware, TenantRequest } from '../../../middleware/tenant';
import { UsageSimulator } from '../../../services/pricing/usage-simulator';

const router = Router();
const prisma = new PrismaClient();
const simulator = new UsageSimulator(prisma);

/**
 * GET /api/v1/pricing/simulator
 * Simulate usage and costs
 */
router.get(
  '/',
  authenticateRequest,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
      const simulation = await simulator.simulateUsage(req.tenantId, period);
      
      res.json({
        data: simulation,
        message: 'Usage simulation generated',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'SimulationError',
        message: error.message,
      });
    }
  }
);

export default router;
