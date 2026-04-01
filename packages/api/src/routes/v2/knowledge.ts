/**
 * Knowledge Management API Routes
 *
 * REST API for decision logs and the preview knowledge assistant.
 */

import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import type { TenantAction } from "../../services/authz/openfga-authorization-service";
import { aiKnowledgeAssistant } from "../../services/knowledge/ai-assistant";
import {
  DECISION_STATUSES,
  type DecisionQuery,
  type DecisionStatus,
  decisionLog,
} from "../../services/knowledge/decision-log";
import { sendError } from "../../utils/api-response";
import { handleRouteError } from "../../utils/error-handler";
import { authorizeTenantActionOr403, requireTenantContext } from "../authz-helpers";
import {
  buildStrategicSurfaceMetadata,
  requireStrategicSurfaceAvailability,
} from "./strategic-preview";

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

const DecisionStatusSchema = z.enum(DECISION_STATUSES);

const pickFirstValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const optionalTrimmedStringSchema = z.preprocess((value) => {
  const normalized = pickFirstValue(value);

  if (normalized === undefined || normalized === null) {
    return undefined;
  }

  if (typeof normalized === "string") {
    const trimmed = normalized.trim();
    return trimmed === "" ? undefined : trimmed;
  }

  return normalized;
}, z.string().optional());

const optionalDateSchema = z.preprocess((value) => {
  const normalized = pickFirstValue(value);

  if (normalized === undefined || normalized === null || normalized === "") {
    return undefined;
  }

  return normalized;
}, z.coerce.date().optional());

const optionalDecisionStatusSchema = z.preprocess((value) => {
  const normalized = pickFirstValue(value);

  if (normalized === undefined || normalized === null || normalized === "") {
    return undefined;
  }

  return normalized;
}, DecisionStatusSchema.optional());

const DecisionIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Decision ID is required"),
});

const CreateDecisionBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  decisionMakers: z
    .array(z.string().trim().min(1))
    .min(1, "At least one decision maker is required"),
  status: DecisionStatusSchema,
  context: z.string().trim().min(1, "Context is required"),
  decision: z.string().trim().min(1, "Decision content is required"),
  rationale: z.string().trim().min(1, "Rationale is required"),
  alternativesConsidered: z
    .array(
      z.object({
        option: z.string().trim().min(1, "Alternative option is required"),
        whyNot: z.string().trim().min(1, "Alternative rationale is required"),
      })
    )
    .default([]),
  expectedOutcomes: z.string().trim().default(""),
  actualOutcomes: z
    .array(
      z.object({
        date: z.coerce.date(),
        outcome: z.string().trim().min(1, "Outcome description is required"),
      })
    )
    .default([]),
  lessonsLearned: z.string().trim().default(""),
  relatedDecisions: z.array(z.string().trim().min(1)).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
});

const UpdateOutcomeBodySchema = z.object({
  outcome: z.string().trim().min(1, "Outcome is required"),
});

const AssistantQueryBodySchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
  context: z
    .object({
      userId: z.string().trim().min(1).optional(),
      department: z.string().trim().min(1).optional(),
      project: z.string().trim().min(1).optional(),
    })
    .optional(),
});

const CreateDecisionRequestSchema = z.object({
  body: CreateDecisionBodySchema,
});

const UpdateOutcomeRequestSchema = z.object({
  params: DecisionIdParamsSchema,
  body: UpdateOutcomeBodySchema,
});

const GetDecisionRequestSchema = z.object({
  params: DecisionIdParamsSchema,
});

const AssistantQueryRequestSchema = z.object({
  body: AssistantQueryBodySchema,
});

const QueryDecisionsRequestSchema = z
  .object({
    query: z
      .object({
        status: optionalDecisionStatusSchema,
        decisionMaker: optionalTrimmedStringSchema,
        tag: optionalTrimmedStringSchema,
        startDate: optionalDateSchema,
        endDate: optionalDateSchema,
        search: optionalTrimmedStringSchema,
      })
      .superRefine((query, context) => {
        if ((query.startDate && !query.endDate) || (!query.startDate && query.endDate)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "startDate and endDate must be provided together",
            path: ["dateRange"],
          });
        }

        if (query.startDate && query.endDate && query.startDate > query.endDate) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "startDate must be before or equal to endDate",
            path: ["dateRange"],
          });
        }
      }),
  })
  .transform(
    ({ query }): DecisionQuery => ({
      status: query.status,
      decisionMaker: query.decisionMaker,
      tag: query.tag,
      search: query.search,
      dateRange:
        query.startDate && query.endDate
          ? {
              start: query.startDate,
              end: query.endDate,
            }
          : undefined,
    })
  );

type KnowledgeCapability = NonNullable<ReturnType<typeof requireStrategicSurfaceAvailability>>;

type KnowledgeResponseOptions = {
  count?: number;
  message?: string;
  statusCode?: number;
};

type KnowledgeRouteAccess = {
  capability: KnowledgeCapability;
};

function formatValidationIssues(error: z.ZodError): Array<{
  code: string;
  message: string;
  path: string;
}> {
  return error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.join(".") || "request",
  }));
}

function parseKnowledgeRequest<TSchema extends z.ZodTypeAny>(
  res: Response,
  schema: TSchema,
  payload: unknown
): z.infer<TSchema> | null {
  const parsed = schema.safeParse(payload);
  if (parsed.success) {
    return parsed.data;
  }

  sendError(res, 400, "VALIDATION_ERROR", "Invalid knowledge request", {
    issues: formatValidationIssues(parsed.error),
  });
  return null;
}

async function resolveKnowledgeAccess(
  req: AuthRequest,
  res: Response,
  options: {
    action: TenantAction;
    message: string;
    route: string;
  }
): Promise<KnowledgeRouteAccess | null> {
  const tenantId = requireTenantContext(req, res);
  if (!tenantId) {
    return null;
  }

  if (!(await authorizeTenantActionOr403(req, res, tenantId, options.action, options.message))) {
    return null;
  }

  const capability = requireStrategicSurfaceAvailability(
    req,
    res,
    options.route,
    KNOWLEDGE_SURFACE
  );
  if (!capability) {
    return null;
  }

  return {
    capability,
  };
}

function sendKnowledgeResponse<T>(
  req: AuthRequest,
  res: Response,
  capability: KnowledgeCapability,
  data: T,
  options: KnowledgeResponseOptions = {}
): void {
  const response: {
    capability: KnowledgeCapability;
    count?: number;
    data: T;
    message?: string;
    metadata: ReturnType<typeof buildStrategicSurfaceMetadata>;
  } = {
    capability,
    data,
    metadata: buildStrategicSurfaceMetadata(req, capability),
  };

  if (options.count !== undefined) {
    response.count = options.count;
  }

  if (options.message) {
    response.message = options.message;
  }

  res.status(options.statusCode ?? 200).json(response);
}

function buildDecisionStatusSummary(
  decisions: ReturnType<typeof decisionLog.queryDecisions>
): Record<DecisionStatus, number> {
  const summary = Object.fromEntries(DECISION_STATUSES.map((status) => [status, 0])) as Record<
    DecisionStatus,
    number
  >;

  for (const decision of decisions) {
    summary[decision.status] += 1;
  }

  return summary;
}

/**
 * POST /api/v2/knowledge/decisions
 * Creates a decision record in the preview knowledge log.
 *
 * @param {AuthRequest} req - Express request containing the decision payload.
 * @param {Response} res - Express response used to return the persisted decision.
 * @returns {Promise<void>} Resolves when the response has been sent.
 * @throws {Error} When authorization succeeds but persistence fails.
 */
router.post(
  "/decisions",
  requirePermission(Permission.TENANT_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const access = await resolveKnowledgeAccess(req, res, {
        action: "tenant.knowledge.manage",
        message: "Knowledge decision creation is not authorized",
        route: "/api/v2/knowledge/decisions",
      });
      if (!access) {
        return;
      }

      const parsed = parseKnowledgeRequest(res, CreateDecisionRequestSchema, {
        body: req.body,
      });
      if (!parsed) {
        return;
      }

      const decision = await decisionLog.createDecision(parsed.body);
      sendKnowledgeResponse(req, res, access.capability, decision, {
        message: "Decision created successfully",
        statusCode: 201,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create decision", 400);
    }
  }
);

/**
 * GET /api/v2/knowledge/decisions
 * Lists decisions using structured filter parameters.
 *
 * @param {AuthRequest} req - Express request containing optional query filters.
 * @param {Response} res - Express response used to return matching decisions.
 * @returns {Promise<void>} Resolves when the response has been sent.
 * @throws {Error} When authorization succeeds but querying fails.
 */
router.get(
  "/decisions",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const access = await resolveKnowledgeAccess(req, res, {
        action: "tenant.knowledge.read",
        message: "Knowledge decision read is not authorized",
        route: "/api/v2/knowledge/decisions",
      });
      if (!access) {
        return;
      }

      const query = parseKnowledgeRequest(res, QueryDecisionsRequestSchema, {
        query: req.query,
      });
      if (!query) {
        return;
      }

      const decisions = decisionLog.queryDecisions(query);
      sendKnowledgeResponse(req, res, access.capability, decisions, {
        count: decisions.length,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to query decisions", 400);
    }
  }
);

/**
 * GET /api/v2/knowledge/decisions/:id
 * Returns a single decision together with any currently indexed related decisions.
 *
 * @param {AuthRequest} req - Express request containing the decision identifier.
 * @param {Response} res - Express response used to return the decision detail.
 * @returns {Promise<void>} Resolves when the response has been sent.
 * @throws {Error} When authorization succeeds but retrieval fails.
 */
router.get(
  "/decisions/:id",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const access = await resolveKnowledgeAccess(req, res, {
        action: "tenant.knowledge.read",
        message: "Knowledge decision read is not authorized",
        route: "/api/v2/knowledge/decisions/:id",
      });
      if (!access) {
        return;
      }

      const parsed = parseKnowledgeRequest(res, GetDecisionRequestSchema, {
        params: req.params,
      });
      if (!parsed) {
        return;
      }

      const decision = decisionLog.getDecision(parsed.params.id);
      if (!decision) {
        sendError(res, 404, "NOT_FOUND", `Decision ${parsed.params.id} not found`);
        return;
      }

      const relatedDecisions = decisionLog.getRelatedDecisions(parsed.params.id);
      sendKnowledgeResponse(req, res, access.capability, {
        decision,
        relatedDecisions,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get decision", 400);
    }
  }
);

/**
 * PATCH /api/v2/knowledge/decisions/:id/outcomes
 * Appends an observed outcome to an existing decision.
 *
 * @param {AuthRequest} req - Express request containing the decision ID and outcome payload.
 * @param {Response} res - Express response used to return the updated decision.
 * @returns {Promise<void>} Resolves when the response has been sent.
 * @throws {Error} When authorization succeeds but the update fails.
 */
router.patch(
  "/decisions/:id/outcomes",
  requirePermission(Permission.TENANT_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const access = await resolveKnowledgeAccess(req, res, {
        action: "tenant.knowledge.manage",
        message: "Knowledge outcome update is not authorized",
        route: "/api/v2/knowledge/decisions/:id/outcomes",
      });
      if (!access) {
        return;
      }

      const parsed = parseKnowledgeRequest(res, UpdateOutcomeRequestSchema, {
        body: req.body,
        params: req.params,
      });
      if (!parsed) {
        return;
      }

      const decision = await decisionLog.updateOutcomes(parsed.params.id, parsed.body.outcome);
      sendKnowledgeResponse(req, res, access.capability, decision, {
        message: "Outcome updated successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to update outcome", 400);
    }
  }
);

/**
 * POST /api/v2/knowledge/assistant/query
 * Queries the preview knowledge assistant with an operator question.
 *
 * @param {AuthRequest} req - Express request containing the question payload.
 * @param {Response} res - Express response used to return the assistant result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 * @throws {Error} When authorization succeeds but assistant processing fails.
 */
router.post(
  "/assistant/query",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const access = await resolveKnowledgeAccess(req, res, {
        action: "tenant.knowledge.read",
        message: "Knowledge assistant query is not authorized",
        route: "/api/v2/knowledge/assistant/query",
      });
      if (!access) {
        return;
      }

      const parsed = parseKnowledgeRequest(res, AssistantQueryRequestSchema, {
        body: req.body,
      });
      if (!parsed) {
        return;
      }

      const response = await aiKnowledgeAssistant.query(parsed.body);
      sendKnowledgeResponse(req, res, access.capability, response);
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to query assistant", 400);
    }
  }
);

/**
 * GET /api/v2/knowledge/stats
 * Returns preview knowledge-system statistics and decision distribution totals.
 *
 * @param {AuthRequest} req - Express request for the stats surface.
 * @param {Response} res - Express response used to return aggregated stats.
 * @returns {Promise<void>} Resolves when the response has been sent.
 * @throws {Error} When authorization succeeds but stats collection fails.
 */
router.get(
  "/stats",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const access = await resolveKnowledgeAccess(req, res, {
        action: "tenant.knowledge.read",
        message: "Knowledge statistics access is not authorized",
        route: "/api/v2/knowledge/stats",
      });
      if (!access) {
        return;
      }

      const assistantStats = aiKnowledgeAssistant.getStats();
      const allDecisions = decisionLog.queryDecisions({});

      sendKnowledgeResponse(req, res, access.capability, {
        assistant: assistantStats,
        decisions: {
          total: allDecisions.length,
          byStatus: buildDecisionStatusSummary(allDecisions),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get stats", 500);
    }
  }
);

export default router;
