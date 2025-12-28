/**
 * Activation Funnel API Routes
 * 
 * Provides endpoints for querying activation funnel metrics.
 */

import { Router } from 'express';
import { getActivationFunnelMetrics } from '../../ops/activation-funnel';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/authorization';

const router = Router();

/**
 * GET /api/ops/activation-funnel
 * Get activation funnel metrics for a time period
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, tenantId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Use ISO 8601 format.',
      });
    }

    const metrics = await getActivationFunnelMetrics({
      startDate: start,
      endDate: end,
      tenantId: tenantId as string | undefined,
    });

    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      metrics,
    });
  } catch (error) {
    console.error('Failed to get activation funnel metrics:', error);
    res.status(500).json({
      error: 'Failed to retrieve activation funnel metrics',
    });
  }
});

export default router;
