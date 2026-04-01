import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { validateRequest } from "../../middleware/validation";
import { handleRouteError } from "../../utils/error-handler";
import { ExceptionIntelligenceService } from "../../services/operator-mode/exception-intelligence-service";
import {
  getOpenFgaAuthorizationService,
  TenantAction,
} from "../../services/authz/openfga-authorization-service";

const router: Router = Router();
const service = new ExceptionIntelligenceService();

const snapshotSchema = z.object({
  query: z.object({
    lookbackDays: z.coerce.number().int().min(1).max(365).default(30),
  }),
});

const runSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
  }),
});

const proposalParamsSchema = z.object({
  params: z.object({
    proposalId: z.string().min(8).max(64),
  }),
});

const policySandboxSchema = z.object({
  body: z.object({
    runId: z.string().uuid(),
    candidatePolicy: z.object({
      amountTolerance: z.number().min(0).max(100000),
      dateWindowDays: z.number().int().min(0).max(365),
      fuzzyDescriptionThreshold: z.number().min(0).max(1),
      requireExactAmount: z.boolean(),
    }),
  }),
});

const policyProposalReviewSchema = z.object({
  params: z.object({ proposalId: z.string().min(8).max(64) }),
  body: z.object({
    decision: z.enum(["approved", "rejected", "deferred"]),
    reason: z.string().max(500).nullable().optional(),
  }),
});

const signatureLifecycleSchema = z.object({
  params: z.object({ signature: z.string().length(20) }),
  query: z.object({
    lookbackDays: z.coerce.number().int().min(1).max(365).default(30),
  }),
});

const decisionHistorySchema = z.object({
  query: z.object({
    runId: z.string().uuid().optional(),
    sourceId: z.string().uuid().optional(),
    counterpartyKey: z.string().min(1).max(255).optional(),
    signature: z.string().min(20).max(20).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  }),
});

function tenantOr400(req: AuthRequest, res: Response): string | null {
  if (!req.tenantId) {
    res.status(400).json({
      error: "TENANT_CONTEXT_REQUIRED",
      message: "Tenant context is required",
    });
    return null;
  }
  return req.tenantId;
}

router.get(
  "/operator/intelligence/exceptions/snapshot",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(snapshotSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const lookbackDays = Number(req.query.lookbackDays ?? 30);
      const data = await service.getSnapshot(tenantId, lookbackDays);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load exception intelligence snapshot", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/memory-graph",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(snapshotSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const lookbackDays = Number(req.query.lookbackDays ?? 30);
      const data = await service.getReconciliationMemoryGraph(tenantId, lookbackDays);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load reconciliation memory graph", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/policy/proposals",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(snapshotSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const lookbackDays = Number(req.query.lookbackDays ?? 30);
      const data = await service.listPolicyEvolutionProposals(tenantId, lookbackDays);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to list policy proposals", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/policy/proposals/:proposalId",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(proposalParamsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const proposalId = req.params["proposalId"] as string;
      const data = await service.getPolicyEvolutionProposalDetail(tenantId, proposalId);
      if (!data) {
        return res.status(404).json({ error: "PROPOSAL_NOT_FOUND", message: "Proposal not found" });
      }
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load policy proposal detail", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.post(
  "/operator/intelligence/policy/proposals/:proposalId/review",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(policyProposalReviewSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const proposalId = req.params["proposalId"] as string;
      const data = await service.reviewPolicyEvolutionProposal(tenantId, {
        proposalId,
        decision: req.body.decision,
        reviewerId: req.userId ?? null,
        reason: req.body.reason ?? null,
      });
      return res.status(data.accepted ? 200 : 404).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to review policy proposal", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/policy/proposals/:proposalId/history",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(proposalParamsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const proposalId = req.params["proposalId"] as string;
      const data = await service.getProposalHistory(tenantId, proposalId);
      if (!data) {
        return res.status(404).json({ error: "PROPOSAL_NOT_FOUND", message: "Proposal not found" });
      }
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load policy proposal history", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/playbooks",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(snapshotSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const lookbackDays = Number(req.query.lookbackDays ?? 30);
      const data = await service.getExceptionPlaybooks(tenantId, lookbackDays);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load exception playbooks", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/decisions/history",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(decisionHistorySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const data = await service.getDecisionHistory(tenantId, {
        runId: req.query.runId as string | undefined,
        sourceId: req.query.sourceId as string | undefined,
        counterpartyKey: req.query.counterpartyKey as string | undefined,
        signature: req.query.signature as string | undefined,
        limit: Number(req.query.limit ?? 100),
      });
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load decision history", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/runs/:runId/proof-graph",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(runSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const runId = req.params["runId"] as string;
      const data = await service.getProofGraph(tenantId, runId);
      return res.status(data.degraded && data.nodes.length === 0 ? 404 : 200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load proof graph", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/runs/:runId/evidence-pack",
  requirePermission(Permission.REPORTS_EXPORT),
  validateRequest(runSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const runId = req.params["runId"] as string;
      const data = await service.buildEvidencePack(tenantId, runId);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to build evidence pack", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.post(
  "/operator/intelligence/policy/sandbox",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(policySandboxSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const data = await service.simulatePolicy(tenantId, req.body);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to run policy sandbox", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/policy/proposals",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(policyProposalSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
      }
      const lookbackDays = Number(req.query.lookbackDays ?? 30);
      const data = await service.listPolicyEvolutionProposals(tenantId, lookbackDays);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load policy evolution proposals", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.post(
  "/operator/intelligence/policy/proposals/:proposalId/review",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(policyProposalReviewSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
      }
      const proposalId = req.params["proposalId"] as string;
      const data = await service.reviewPolicyEvolutionProposal(tenantId, {
        proposalId,
        decision: req.body.decision,
        reviewerId: req.userId ?? null,
        reason: req.body.reason ?? null,
      });
      return res.status(data.accepted ? 200 : 404).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to review policy evolution proposal", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/decisions/history",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(decisionHistorySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
      }
      const data = await service.getDecisionHistory(tenantId, {
        runId: req.query.runId as string | undefined,
        sourceId: req.query.sourceId as string | undefined,
        counterpartyKey: req.query.counterpartyKey as string | undefined,
        signature: req.query.signature as string | undefined,
        limit: Number(req.query.limit ?? 100),
      });
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load decision history", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

export default router;
