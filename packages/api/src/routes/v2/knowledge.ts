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
import {
  buildStrategicSurfaceMetadata,
  requireStrategicSurfaceAvailability,
} from "./strategic-preview";
import { z } from "zod";

const router: Router = Router();

/**
 * Metadata for the Knowledge Management Strategic Surface.
 * This surface is currently in preview and requires specific feature flags.
 */
const KNOWLEDGE_SURFACE = {
  key: "knowledge_management_v2",
  unavailableReason:
    "Knowledge management v2 is disabled until decision storage and retrieval are tenant-scoped and durably persisted.",
  previewReason:
    "Knowledge management v2 is running in local-only preview mode without tenant-scoped durable storage.",
};

// --- Validation Schemas ---

const CreateDecisionSchema = z.object({
  title: z.string().min(1),
  decisionMakers: z.array(z.string()),
  status: z.enum(["proposed", "accepted", "rejected", "superseded"]),
  context: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternativesConsidered: z
    .array(
      z.object({
        option: z.string(),
        whyNot: z.string(),
      })
    )
    .default([]),
  expectedOutcomes: z.string().default(""),
  actualOutcomes: z
    .array(
      z.object({
        date: z.coerce.date(),
        outcome: z.string(),
      })
    )
    .default([]),
  lessonsLearned: z.string().default(""),
  relatedDecisions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

const UpdateOutcomeSchema = z.object({
  outcome: z.string().min(1),
});

const AssistantQuerySchema = z.object({
  question: z.string().min(1),
  context: z
    .object({
      userId: z.string().optional(),
      department: z.string().optional(),
      project: z.string().optional(),
    })
    .optional(),
});

const QueryDecisionsSchema = z.object({
  status: z.enum(["proposed", "accepted", "rejected", "superseded"]).optional(),
  decisionMaker: z.string().optional(),
  tag: z.string().optional(),
  startDate: z.string().datetime().optional().or(z.string().optional()), // Allow flexible date strings
  endDate: z.string().datetime().optional().or(z.string().optional()),
  search: z.string().optional(),
});

/**
 * POST /api/v2/knowledge/decisions
 * Creates a new decision in the institutional memory log.
 *
 * @param {string} req.body.title - The title of the decision.
 * @param {string[]} req.body.decisionMakers - List of individuals involved in the decision.
 * @param {string} req.body.status - Initial status (e.g., 'proposed', 'accepted').
 * @returns {Promise<void>}
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

      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/knowledge/decisions",
        KNOWLEDGE_SURFACE
      );
      if (!capability) return;

      const validatedBody = CreateDecisionSchema.parse(req.body);
      const decision = await decisionLog.createDecision(validatedBody);

      res.status(201).json({
        data: decision,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Decision created successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create decision", 400);
    }
  }
);

/**
 * GET /api/v2/knowledge/decisions
 * Queries the decision log with optional filters.
 *
 * @param {string} [req.query.status] - Filter by decision status.
 * @param {string} [req.query.decisionMaker] - Filter by decision maker.
 * @param {string} [req.query.tag] - Filter by tag.
 * @param {string} [req.query.startDate] - ISO date string for range start.
 * @param {string} [req.query.endDate] - ISO date string for range end.
 * @param {string} [req.query.search] - Search text in title or content.
 * @returns {Promise<void>}
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

      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/knowledge/decisions",
        KNOWLEDGE_SURFACE
      );
      if (!capability) return;

      const validatedQuery = QueryDecisionsSchema.parse(req.query);

      const queryOptions: Parameters<typeof decisionLog.queryDecisions>[0] = {
        status: validatedQuery.status,
        decisionMaker: validatedQuery.decisionMaker,
        tag: validatedQuery.tag,
        search: validatedQuery.search,
      };

      if (validatedQuery.startDate && validatedQuery.endDate) {
        queryOptions.dateRange = {
          start: new Date(validatedQuery.startDate),
          end: new Date(validatedQuery.endDate),
        };
      }

      const decisions = decisionLog.queryDecisions(queryOptions);

      res.json({
        data: decisions,
        capability,
        count: decisions.length,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to query decisions", 400);
    }
  }
);

/**
 * GET /api/v2/knowledge/decisions/:id
 * Retrieves a single decision by its unique identifier, including related decisions.
 *
 * @param {string} req.params.id - The unique identifier of the decision.
 * @returns {Promise<void>}
 */
router.get(
  "/decisions/:id",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;

      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.knowledge.read"))) return;

      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/knowledge/decisions/:id",
        KNOWLEDGE_SURFACE
      );
      if (!capability) return;

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
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get decision", 400);
    }
  }
);

/**
 * PATCH /api/v2/knowledge/decisions/:id/outcomes
 * Updates the actual outcomes of a decision.
 *
 * @param {string} req.params.id - The unique identifier of the decision.
 * @param {string} req.body.outcome - The outcome description to append.
 * @returns {Promise<void>}
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

      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/knowledge/decisions/:id/outcomes",
        KNOWLEDGE_SURFACE
      );
      if (!capability) return;

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(400).json({ error: "Decision ID is required" });
      }

      const validatedBody = UpdateOutcomeSchema.parse(req.body);
      const decision = await decisionLog.updateOutcomes(id, validatedBody.outcome);

      res.json({
        data: decision,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Outcome updated successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to update outcome", 400);
    }
  }
);

/**
 * POST /api/v2/knowledge/assistant/query
 * Queries the AI knowledge assistant with a natural language question.
 *
 * @param {string} req.body.question - The question to ask the assistant.
 * @param {Object} [req.body.context] - Additional context for the query.
 * @returns {Promise<void>}
 */
router.post(
  "/assistant/query",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;

      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.knowledge.read"))) return;

      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/knowledge/assistant/query",
        KNOWLEDGE_SURFACE
      );
      if (!capability) return;

      const validatedBody = AssistantQuerySchema.parse(req.body);
      const response = await aiKnowledgeAssistant.query(validatedBody);

      res.json({
        data: response,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to query assistant", 400);
    }
  }
);

/**
 * GET /api/v2/knowledge/stats
 * Retrieves aggregated statistics for the knowledge base and AI assistant.
 *
 * @returns {Promise<void>}
 */
router.get(
  "/stats",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;

      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.knowledge.read"))) return;

      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/knowledge/stats",
        KNOWLEDGE_SURFACE
      );
      if (!capability) return;

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
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get stats", 500);
    }
  }
);

export default router;
