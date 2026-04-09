/**
 * AI Agents API Routes
 *
 * REST API for managing and interacting with AI agents
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { agentOrchestrator } from "../../services/ai-agents/orchestrator";
import { InfrastructureOptimizerAgent } from "../../services/ai-agents/infrastructure-optimizer";
import { AnomalyDetectorAgent } from "../../services/ai-agents/anomaly-detector";
import { handleRouteError } from "../../utils/error-handler";
import { logError } from "../../utils/logger";
import { authorizeTenantActionOr403, requireTenantContext } from "../authz-helpers";
import {
  buildStrategicSurfaceMetadata,
  requireStrategicSurfaceAvailability,
} from "./strategic-preview";

const router: Router = Router();
const AI_AGENTS_SURFACE = {
  key: "ai_agents_v2",
  unavailableReason:
    "AI agents v2 is disabled until orchestration state and agent control are tenant-scoped and durably persisted.",
  previewReason:
    "AI agents v2 is running in local-only preview mode without tenant-scoped durable orchestration state.",
};

let agentsInitialized = false;

function ensureAgentsInitialized(): void {
  if (agentsInitialized) {
    return;
  }

  const infrastructureOptimizer = new InfrastructureOptimizerAgent({});
  const anomalyDetector = new AnomalyDetectorAgent({});

  if (!agentOrchestrator.getAgent(infrastructureOptimizer.id)) {
    agentOrchestrator.registerAgent(infrastructureOptimizer);
  }

  if (!agentOrchestrator.getAgent(anomalyDetector.id)) {
    agentOrchestrator.registerAgent(anomalyDetector);
  }

  agentsInitialized = true;
  agentOrchestrator.initializeAll().catch((error) => {
    logError("Failed to initialize AI agents", error);
  });
}

/**
 * GET /api/v2/ai-agents
 * List all agents
 */
router.get(
  "/",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "AI agent control plane access is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ai-agents",
        AI_AGENTS_SURFACE
      );
      if (!capability) return;
      ensureAgentsInitialized();
      const agents = agentOrchestrator.listAgents();
      res.json({
        data: agents,
        capability,
        count: agents.length,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list agents", 500);
      return;
    }
  }
);

/**
 * GET /api/v2/ai-agents/stats
 * Get orchestrator stats
 */
router.get(
  "/stats",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "AI agent control plane access is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ai-agents/stats",
        AI_AGENTS_SURFACE
      );
      if (!capability) return;
      ensureAgentsInitialized();
      const stats = agentOrchestrator.getStats();
      res.json({
        data: stats,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get stats", 500);
    }
  }
);

/**
 * GET /api/v2/ai-agents/:agentId
 * Get agent details
 */
router.get(
  "/:agentId",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "AI agent control plane access is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ai-agents/:agentId",
        AI_AGENTS_SURFACE
      );
      if (!capability) return;
      ensureAgentsInitialized();
      const agentIdParam = req.params["agentId"];
      const agentId = Array.isArray(agentIdParam) ? (agentIdParam[0] ?? "") : (agentIdParam ?? "");
      if (!agentId) {
        return res.status(400).json({
          error: "Agent ID is required",
        });
      }
      const agent = agentOrchestrator.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({
          error: "Agent not found",
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
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get agent", 500);
      return;
    }
  }
);

/**
 * POST /api/v2/ai-agents/:agentId/execute
 * Execute an agent action
 */
router.post(
  "/:agentId/execute",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "AI agent control plane mutation is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ai-agents/:agentId/execute",
        AI_AGENTS_SURFACE
      );
      if (!capability) return;
      ensureAgentsInitialized();
      const agentIdParam = req.params["agentId"];
      const agentId = Array.isArray(agentIdParam) ? (agentIdParam[0] ?? "") : (agentIdParam ?? "");
      if (!agentId) {
        return res.status(400).json({ error: "Agent ID is required" });
      }
      const { action, params } = req.body;

      const response = await agentOrchestrator.execute({
        agentId,
        action,
        params: params || {},
        context: {
          tenantId,
          userId: req.userId ?? null,
          traceId: req.traceId ?? null,
        },
      });

      res.json({
        data: response,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to execute agent action", 400);
      return;
    }
  }
);

/**
 * POST /api/v2/ai-agents/:agentId/enable
 * Enable an agent
 */
router.post(
  "/:agentId/enable",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "AI agent control plane mutation is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ai-agents/:agentId/enable",
        AI_AGENTS_SURFACE
      );
      if (!capability) return;
      ensureAgentsInitialized();
      const agentIdParam = req.params["agentId"];
      const agentId = Array.isArray(agentIdParam) ? (agentIdParam[0] ?? "") : (agentIdParam ?? "");
      if (!agentId) {
        return res.status(400).json({ error: "Agent ID is required" });
      }
      const agent = agentOrchestrator.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({
          error: "Agent not found",
          message: `Agent ${agentId} not found`,
        });
      }

      agent.enable();

      res.json({
        data: {
          agentId,
          enabled: true,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Agent enabled successfully",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to enable agent", 400);
      return;
    }
  }
);

/**
 * POST /api/v2/ai-agents/:agentId/disable
 * Disable an agent
 */
router.post(
  "/:agentId/disable",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.operator.control",
          "AI agent control plane mutation is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/ai-agents/:agentId/disable",
        AI_AGENTS_SURFACE
      );
      if (!capability) return;
      ensureAgentsInitialized();
      const agentIdParam = req.params["agentId"];
      const agentId = Array.isArray(agentIdParam) ? (agentIdParam[0] ?? "") : (agentIdParam ?? "");
      if (!agentId) {
        return res.status(400).json({ error: "Agent ID is required" });
      }
      const agent = agentOrchestrator.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({
          error: "Agent not found",
          message: `Agent ${agentId} not found`,
        });
      }

      agent.disable();

      res.json({
        data: {
          agentId,
          enabled: false,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Agent disabled successfully",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to disable agent", 400);
      return;
    }
  }
);

export default router;
