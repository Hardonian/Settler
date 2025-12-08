/**
 * Network Effects API Routes
 * 
 * REST API for network effects features (cross-customer intelligence, performance pools)
 */

import { Router, Request, Response } from 'express';
import { crossCustomerIntelligence } from '../../services/network-effects/cross-customer-intelligence';
import { performanceTuningPools } from '../../services/network-effects/performance-pools';
import { handleRouteError } from '../../utils/error-handler';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

/**
 * POST /api/v2/network-effects/intelligence/opt-in
 * Opt-in to cross-customer intelligence
 */
router.post('/intelligence/opt-in', async (req: Request, res: Response) => {
  try {
    const customerId = (req as AuthRequest).userId || req.body.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        error: 'Missing customer ID',
      });
    }

    crossCustomerIntelligence.optIn(customerId);

    res.json({
      data: {
        customerId,
        optedIn: true,
      },
      message: 'Successfully opted in to cross-customer intelligence',
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to opt in', 400);
    return;
  }
});

/**
 * POST /api/v2/network-effects/intelligence/opt-out
 * Opt-out of cross-customer intelligence
 */
router.post('/intelligence/opt-out', async (req: Request, res: Response) => {
  try {
    const customerId = (req as AuthRequest).userId || req.body.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        error: 'Missing customer ID',
      });
    }

    crossCustomerIntelligence.optOut(customerId);

    res.json({
      data: {
        customerId,
        optedIn: false,
      },
      message: 'Successfully opted out of cross-customer intelligence',
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to opt out', 400);
    return;
  }
});

/**
 * POST /api/v2/network-effects/intelligence/check-pattern
 * Check if a pattern matches known patterns
 */
router.post('/intelligence/check-pattern', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'type and data are required',
      });
    }

    const match = crossCustomerIntelligence.checkPattern({ type, data });

    res.json({
      data: match,
      matched: match !== null,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to check pattern', 400);
    return;
  }
});

/**
 * GET /api/v2/network-effects/intelligence/insights
 * Get network insights (anonymized)
 */
router.get('/intelligence/insights', async (_req: Request, res: Response) => {
  try {
    const insights = crossCustomerIntelligence.getNetworkInsights();

    res.json({
      data: insights,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get insights', 500);
    return;
  }
});

/**
 * POST /api/v2/network-effects/performance/opt-in
 * Opt-in to performance tuning pools
 */
router.post('/performance/opt-in', async (req: Request, res: Response) => {
  try {
    const customerId = (req as AuthRequest).userId || req.body.customerId;
    
    if (!customerId) {
      return res.status(400).json({
        error: 'Missing customer ID',
      });
    }

    performanceTuningPools.optIn(customerId);

    res.json({
      data: {
        customerId,
        optedIn: true,
      },
      message: 'Successfully opted in to performance tuning pools',
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to opt in', 400);
    return;
  }
});

/**
 * POST /api/v2/network-effects/performance/submit
 * Submit performance metrics
 */
router.post('/performance/submit', async (req: Request, res: Response) => {
  try {
    const customerId = (req as AuthRequest).userId || req.body.customerId;
    const { jobId, adapter, ruleType, accuracy, latency, throughput } = req.body;

    if (!customerId || !jobId || !adapter || !ruleType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'customerId, jobId, adapter, and ruleType are required',
      });
    }

    performanceTuningPools.submitMetrics(customerId, {
      jobId,
      adapter,
      ruleType,
      accuracy: accuracy || 0,
      latency: latency || 0,
      throughput: throughput || 0,
    });

    res.json({
      data: {
        submitted: true,
      },
      message: 'Performance metrics submitted successfully',
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to submit metrics', 400);
    return;
  }
});

/**
 * GET /api/v2/network-effects/performance/insights
 * Get performance insights
 */
router.get('/performance/insights', async (req: Request, res: Response) => {
  try {
    const { adapter, ruleType } = req.query;

    if (!adapter) {
      return res.status(400).json({
        error: 'Missing adapter parameter',
      });
    }

    const insights = performanceTuningPools.getInsights(
      adapter as string,
      ruleType as string | undefined
    );

    res.json({
      data: insights,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get insights', 500);
    return;
  }
});

/**
 * GET /api/v2/network-effects/performance/recommendations
 * Get recommended rules
 */
router.get('/performance/recommendations', async (req: Request, res: Response) => {
  try {
    const { adapter, useCase } = req.query;

    if (!adapter) {
      return res.status(400).json({
        error: 'Missing adapter parameter',
      });
    }

    const recommendations = performanceTuningPools.getRecommendedRules(
      adapter as string,
      (useCase as string) || 'default'
    );

    res.json({
      data: recommendations,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get recommendations', 500);
    return;
  }
});

/**
 * GET /api/v2/network-effects/stats
 * Get network effects statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const intelligenceInsights = crossCustomerIntelligence.getNetworkInsights();
    const performanceStats = performanceTuningPools.getStats();

    res.json({
      data: {
        intelligence: intelligenceInsights,
        performance: performanceStats,
      },
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get stats', 500);
    return;
  }
});

export default router;
