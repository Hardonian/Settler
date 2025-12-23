/**
 * AI Agents API Routes
 * 
 * REST API for managing and interacting with AI agents
 */

import { Router, Request, Response } from 'express';
import { agentOrchestrator } from '../../services/ai-agents/orchestrator';
import { InfrastructureOptimizerAgent } from '../../services/ai-agents/infrastructure-optimizer';
import { AnomalyDetectorAgent } from '../../services/ai-agents/anomaly-detector';
import { handleRouteError } from '../../utils/error-handler';
import { tenantMiddleware, TenantRequest } from '../../middleware/tenant';

const router = Router();

// Initialize agents
const infrastructureOptimizer = new InfrastructureOptimizerAgent({});
const anomalyDetector = new AnomalyDetectorAgent({});

agentOrchestrator.registerAgent(infrastructureOptimizer);
agentOrchestrator.registerAgent(anomalyDetector);

// Initialize all agents on startup
agentOrchestrator.initializeAll().catch(console.error);

/**
 * GET /api/v2/ai-agents
 * List all agents
 */
router.get('/', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const agents = agentOrchestrator.listAgents(tenantId);
    res.json({
      data: agents,
      count: agents.length,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to list agents', 500);
    return;
  }
});

/**
 * GET /api/v2/ai-agents/:agentId
 * Get agent details
 */
router.get('/:agentId', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId!;
    
    if (!agentId) {
      return res.status(400).json({
        error: 'Agent ID is required',
        traceId: req.traceId,
      });
    }
    const agent = agentOrchestrator.getAgent(agentId, tenantId);

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `Agent ${agentId} not found`,
      });
    }

    const status = await agent.getStatus();

    res.json({
      data: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status,
      },
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get agent', 500);
    return;
  }
});

/**
 * POST /api/v2/ai-agents/:agentId/execute
 * Execute an agent action
 */
router.post('/:agentId/execute', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId!;
    
    if (!agentId) {
      return res.status(400).json({ 
        error: 'Agent ID is required',
        traceId: req.traceId,
      });
    }
    const { action, params } = req.body;

    const response = await agentOrchestrator.execute({
      tenantId,
      agentId,
      action,
      params: params || {},
    });

    res.json({
      data: response,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to execute agent action', 400);
    return;
  }
});

/**
 * POST /api/v2/ai-agents/:agentId/enable
 * Enable an agent
 */
router.post('/:agentId/enable', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId!;
    
    if (!agentId) {
      return res.status(400).json({ 
        error: 'Agent ID is required',
        traceId: req.traceId,
      });
    }
    const agent = agentOrchestrator.getAgent(agentId, tenantId);

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `Agent ${agentId} not found`,
      });
    }

    agent.enable();

    res.json({
      data: {
        agentId,
        enabled: true,
      },
      message: 'Agent enabled successfully',
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to enable agent', 400);
    return;
  }
});

/**
 * POST /api/v2/ai-agents/:agentId/disable
 * Disable an agent
 */
router.post('/:agentId/disable', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId!;
    
    if (!agentId) {
      return res.status(400).json({ 
        error: 'Agent ID is required',
        traceId: req.traceId,
      });
    }
    const agent = agentOrchestrator.getAgent(agentId, tenantId);

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `Agent ${agentId} not found`,
      });
    }

    agent.disable();

    res.json({
      data: {
        agentId,
        enabled: false,
      },
      message: 'Agent disabled successfully',
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to disable agent', 400);
    return;
  }
});

/**
 * GET /api/v2/ai-agents/stats
 * Get orchestrator stats
 */
router.get('/stats', tenantMiddleware, async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const stats = agentOrchestrator.getStats(tenantId);
    res.json({
      data: stats,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get stats', 500);
  }
});

export default router;
