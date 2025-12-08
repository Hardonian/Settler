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
router.get('/', async (_req: Request, res: Response) => {
  try {
    const agents = agentOrchestrator.listAgents();
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
router.get('/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    if (!agentId) {
      return res.status(400).json({
        error: 'Agent ID is required',
      });
    }
    const agent = agentOrchestrator.getAgent(agentId);

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
router.post('/:agentId/execute', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }
    const { action, params } = req.body;

    const response = await agentOrchestrator.execute({
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
router.post('/:agentId/enable', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }
    const agent = agentOrchestrator.getAgent(agentId);

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
router.post('/:agentId/disable', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }
    const agent = agentOrchestrator.getAgent(agentId);

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
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = agentOrchestrator.getStats();
    res.json({
      data: stats,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, 'Failed to get stats', 500);
  }
});

export default router;
