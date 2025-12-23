/**
 * Network Effects API Routes
 * 
 * REST API for network effects features (cross-customer intelligence, performance pools)
 */

import { Router, Response } from 'express';
import { crossCustomerIntelligence } from '../../services/network-effects/cross-customer-intelligence';
import { performanceTuningPools } from '../../services/network-effects/performance-pools';
import { handleRouteError } from '../../utils/error-handler';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant';

const router = Router();

/**
 * POST /api/v2/network-effects/intelligence/opt-in
 * Opt-in to cross-customer intelligence
 */
router.post('/intelligence/opt-in', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    
    crossCustomerIntelligence.optIn(tenantId);

    res.json({
      data: {
        tenantId,
        optedIn: true,
      },
      message: 'Successfully opted in to cross-customer intelligence',
      traceId: req.traceId,
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
router.post('/intelligence/opt-out', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    
    crossCustomerIntelligence.optOut(tenantId);

    res.json({
      data: {
        tenantId,
        optedIn: false,
      },
      message: 'Successfully opted out of cross-customer intelligence',
      traceId: req.traceId,
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
router.post('/intelligence/check-pattern', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'type and data are required',
        traceId: req.traceId,
      });
    }

    const match = crossCustomerIntelligence.checkPattern(tenantId, { type, data });

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
router.get('/intelligence/insights', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const insights = crossCustomerIntelligence.getNetworkInsights(tenantId);

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
router.post('/performance/opt-in', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    
    performanceTuningPools.optIn(tenantId);

    res.json({
      data: {
        tenantId,
        optedIn: true,
      },
      message: 'Successfully opted in to performance tuning pools',
      traceId: req.traceId,
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
router.post('/performance/submit', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { jobId, adapter, ruleType, accuracy, latency, throughput } = req.body;

    if (!jobId || !adapter || !ruleType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId, adapter, and ruleType are required',
        traceId: req.traceId,
      });
    }

    performanceTuningPools.submitMetrics(tenantId, {
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
router.get('/performance/insights', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { adapter, ruleType } = req.query;

    if (!adapter) {
      return res.status(400).json({
        error: 'Missing adapter parameter',
        traceId: req.traceId,
      });
    }

    const insights = performanceTuningPools.getInsights(
      tenantId,
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
router.get('/performance/recommendations', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { adapter, useCase } = req.query;

    if (!adapter) {
      return res.status(400).json({
        error: 'Missing adapter parameter',
        traceId: req.traceId,
      });
    }

    const recommendations = performanceTuningPools.getRecommendedRules(
      tenantId,
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
router.get('/stats', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const intelligenceInsights = crossCustomerIntelligence.getNetworkInsights(tenantId);
    const performanceStats = performanceTuningPools.getStats(tenantId);

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
