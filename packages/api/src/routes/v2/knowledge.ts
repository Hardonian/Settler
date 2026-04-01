/**
 * Knowledge Management API Routes
 *
 * REST API for decision logs and AI knowledge assistant
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { decisionLog } from "../../services/knowledge/decision-log";
import { aiKnowledgeAssistant } from "../../services/knowledge/ai-assistant";
import { handleRouteError } from "../../utils/error-handler";
import {
  authorizeTenantActionOr403,
  requireTenantContext,
  requireUserContext,
} from "../authz-helpers";

const router: Router = Router();

/**
 * POST /api/v2/knowledge/decisions
 * Create a new decision
 */
router.post(
  "/decisions",
  requirePermission(Permission.TENANT_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      const userId = requireUserContext(req, res);
      if (!tenantId || !userId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.knowledge.manage",
          "Knowledge decision creation is not authorized"
        ))
      ) {
        return;
      }
      const decision = await decisionLog.createDecision(req.body);

      res.status(201).json({
        data: decision,
        message: "Decision created successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create decision", 400);
    }
  }
);

/**
 * GET /api/v2/knowledge/decisions
 * Query decisions
 */
router.get(
  "/decisions",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.knowledge.read",
          "Knowledge decision read is not authorized"
        ))
      ) {
        return;
      }
      const queryOptions: {
        status?: "proposed" | "accepted" | "rejected" | "superseded";
        decisionMaker?: string;
        tag?: string;
        dateRange?: { start: Date; end: Date };
        search?: string;
      } = {};
      if (req.query.status) {
        queryOptions.status = req.query.status as
          | "proposed"
          | "accepted"
          | "rejected"
          | "superseded";
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
      handleRouteError(res, error, "Failed to query decisions", 400);
      return;
    }
  }
);

/**
 * GET /api/v2/knowledge/decisions/:id
 * Get a decision by ID
 */
router.get(
  "/decisions/:id",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.knowledge.read"))) return;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(400).json({ error: "Decision ID is required" });
      }
      const decision = decisionLog.getDecision(id);

      if (!decision) {
        return res.status(404).json({
          error: "Decision not found",
          message: `Decision ${id} not found`,
        });
      }

      const related = decisionLog.getRelatedDecisions(id);

      res.json({
        data: {
          ...decision,
          relatedDecisions: related,
        },
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get decision", 400);
      return;
    }
  }
);

/**
 * PATCH /api/v2/knowledge/decisions/:id/outcomes
 * Update decision outcomes
 */
router.patch(
  "/decisions/:id/outcomes",
  requirePermission(Permission.TENANT_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.knowledge.manage")))
        return;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { outcome } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Decision ID is required" });
      }

      if (!outcome) {
        return res.status(400).json({
          error: "Missing outcome",
        });
      }

      const decision = await decisionLog.updateOutcomes(id, outcome);

      res.json({
        data: decision,
        message: "Outcome updated successfully",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to update outcome", 400);
      return;
    }
  }
);

/**
 * POST /api/v2/knowledge/assistant/query
 * Query the AI knowledge assistant
 */
router.post(
  "/assistant/query",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.knowledge.read"))) return;
      const { question, context } = req.body;

      if (!question || typeof question !== "string") {
        return res.status(400).json({
          error: "Missing question",
        });
      }

      const response = await aiKnowledgeAssistant.query({
        question,
        context,
      });

      res.json({
        data: response,
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to query assistant", 400);
      return;
    }
  }
);

/**
 * GET /api/v2/knowledge/stats
 * Get knowledge base statistics
 */
router.get(
  "/stats",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.knowledge.read"))) return;
      const assistantStats = aiKnowledgeAssistant.getStats();

      // Get decision stats
      const allDecisions = decisionLog.queryDecisions({});
      const decisionsByStatus = allDecisions.reduce(
        (acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

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
      handleRouteError(res, error, "Failed to get stats", 500);
      return;
    }
  }
);

export default router;
