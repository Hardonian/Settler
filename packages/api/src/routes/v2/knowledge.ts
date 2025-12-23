/**
 * Knowledge Management API Routes
 * 
 * REST API for decision logs and AI knowledge assistant
 */

import { Router, Response } from 'express';
import { decisionLog } from '../../services/knowledge/decision-log';
import { aiKnowledgeAssistant } from '../../services/knowledge/ai-assistant';
import { handleRouteError } from '../../utils/error-handler';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant';

const router = Router();

/**
 * POST /api/v2/knowledge/decisions
 * Create a new decision
 */
router.post('/decisions', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const decision = await decisionLog.createDecision({
      ...req.body,
      tenantId,
      userId,
    });

    res.status(201).json({
      data: decision,
      message: 'Decision created successfully',
    });
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to create decision', 400);
  }
});

/**
 * GET /api/v2/knowledge/decisions
 * Query decisions
 */
router.get('/decisions', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const queryOptions: {
      tenantId: string;
      status?: "proposed" | "accepted" | "rejected" | "superseded";
      decisionMaker?: string;
      tag?: string;
      dateRange?: { start: Date; end: Date };
      search?: string;
    } = { tenantId };
    if (req.query.status) {
      queryOptions.status = req.query.status as "proposed" | "accepted" | "rejected" | "superseded";
    }
    if (req.query.decisionMaker) {
      queryOptions.decisionMaker = req.query.decisionMaker as string;
    }
    if (req.query.tag) {
      queryOptions.tag = req.query.tag as string;
    }
    if (req.query.startDate && req.query.endDate) {
      queryOptions.dateRange = {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string),
      };
    }
    if (req.query.search) {
      queryOptions.search = req.query.search as string;
    }
    const decisions = decisionLog.queryDecisions(queryOptions);

    res.json({
      data: decisions,
      count: decisions.length,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to query decisions', 400);
    return;
  }
});

/**
 * GET /api/v2/knowledge/decisions/:id
 * Get a decision by ID
 */
router.get('/decisions/:id', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Decision ID is required',
        traceId: req.traceId,
      });
    }
    const decision = decisionLog.getDecision(id, tenantId);

    if (!decision) {
      return res.status(404).json({
        error: 'Decision not found',
        message: `Decision ${id} not found`,
      });
    }

    const related = decisionLog.getRelatedDecisions(id, tenantId);

    res.json({
      data: {
        ...decision,
        relatedDecisions: related,
      },
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get decision', 400);
    return;
  }
});

/**
 * PATCH /api/v2/knowledge/decisions/:id/outcomes
 * Update decision outcomes
 */
router.patch('/decisions/:id/outcomes', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const { outcome } = req.body;

    if (!id) {
      return res.status(400).json({ 
        error: 'Decision ID is required',
        traceId: req.traceId,
      });
    }

    if (!outcome) {
      return res.status(400).json({
        error: 'Missing outcome',
        traceId: req.traceId,
      });
    }

    const decision = await decisionLog.updateOutcomes(id, tenantId, outcome);

    res.json({
      data: decision,
      message: 'Outcome updated successfully',
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to update outcome', 400);
    return;
  }
});

/**
 * POST /api/v2/knowledge/assistant/query
 * Query the AI knowledge assistant
 */
router.post('/assistant/query', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { question, context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'Missing question',
        traceId: req.traceId,
      });
    }

    const response = await aiKnowledgeAssistant.query({
      tenantId,
      question,
      context,
    });

    res.json({
      data: response,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to query assistant', 400);
    return;
  }
});

/**
 * GET /api/v2/knowledge/stats
 * Get knowledge base statistics
 */
router.get('/stats', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const assistantStats = aiKnowledgeAssistant.getStats(tenantId);
    
    // Get decision stats
    const allDecisions = decisionLog.queryDecisions({ tenantId });
    const decisionsByStatus = allDecisions.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      data: {
        assistant: assistantStats,
        decisions: {
          total: allDecisions.length,
          byStatus: decisionsByStatus,
        },
      },
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get stats', 500);
    return;
  }
});

export default router;
