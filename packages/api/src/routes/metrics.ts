/**
 * Metrics Route
 * Exposes Prometheus-compatible metrics endpoint
 */

import { Router, Request, Response } from 'express';
import { register } from '../infrastructure/observability/metrics';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to generate metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as metricsRouter };
