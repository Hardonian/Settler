/**
 * Pricing Simulator API Routes
 * 
 * Part of Section 9: Pricing Intelligence
 */

import { Router, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware, TenantRequest } from '../../../middleware/tenant';
import { UsageSimulator } from '../../../services/pricing/usage-simulator';

const router = Router();
// Prisma client will be initialized at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = {} as PrismaClient;
const simulator = new UsageSimulator(prisma);

/**
 * GET /api/v1/pricing/simulator
 * Simulate usage and costs
 */
router.get(
  '/',
  authMiddleware,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
      if (!req.tenantId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Tenant ID required' });
      }
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
