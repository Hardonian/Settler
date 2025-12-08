/**
 * Autonomous Evolution Layer API Routes
 * 
 * Part 7: Autonomous AIOS Evolution
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '../../middleware/auth';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant';
import { AutonomousEvolutionLayer } from '../../services/ael/autonomous-evolution-layer';

const router = Router();
const prisma = new PrismaClient();
const ael = new AutonomousEvolutionLayer(prisma);

/**
 * GET /api/v1/ael/evolve
 * Run evolution cycle
 */
router.get(
  '/evolve',
  authenticateRequest,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const proposals = await ael.evolve();
      res.json({
        data: proposals,
        message: 'Evolution cycle completed',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'EvolutionError',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/v1/ael/log
 * Get evolution log
 */
router.get(
  '/log',
  authenticateRequest,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const log = ael.getEvolutionLog();
      res.json({
        data: log,
        message: 'Evolution log retrieved',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'EvolutionError',
        message: error.message,
      });
    }
  }
);

export default router;
