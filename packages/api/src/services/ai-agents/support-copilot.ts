/**
 * Support Copilot Agent
 *
 * Assists operators and customer support with reconciliation disputes, exception
 * explanations, and customer inquiry response drafting.
 *
 * GOVERNANCE: Strictly emits draft-only suggestions and response recommendations
 * (autoExecute: false, requireApproval: true). Never executes automated refunds,
 * waivers, or ledger adjustments without human review and verified signed policy tokens.
 */

import {
  BaseAgent,
  AgentJobDraft,
  AgentExecutionContext,
  assertSignedPolicyToken,
  policyPayloadHash,
} from "./orchestrator";
import { logInfo } from "../../utils/logger";

export interface SupportInquiryContext {
  inquiryId: string;
  tenantId: string;
  disputeId?: string;
  transactionId?: string;
  customerQuery: string;
  discrepancyAmount?: number;
  currency?: string;
}

export interface SupportRecommendation {
  recommendationId: string;
  inquiryId: string;
  tenantId: string;
  summary: string;
  suggestedResponse: string;
  proposedAction:
    "explain_timing" | "request_documentation" | "draft_credit_memo" | "escalate_to_analyst";
  estimatedVariance?: number;
  confidenceScore: number;
}

export class SupportCopilotAgent extends BaseAgent {
  id = "support-copilot";
  name = "Support Copilot";
  type = "support" as const;

  private pendingDrafts: Map<string, AgentJobDraft> = new Map();
  private lastCopilotAction?: Date;
  private draftedResolutionsCount = new Map<string, number>();

  async initialize(): Promise<void> {
    this.enabled = true;
    logInfo("Support Copilot Agent initialized with human-in-the-loop governance");
  }

  async execute(
    action: string,
    params: Record<string, unknown>,
    context?: AgentExecutionContext
  ): Promise<unknown> {
    const tenantId = context?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant context is required for support copilot execution");
    }

    switch (action) {
      case "draft_support_recommendation":
        return this.draftSupportRecommendation({ ...params, tenantId });

      case "execute_resolution":
        return await this.executeResolution(params, context);

      case "get_pending_drafts":
        return Array.from(this.pendingDrafts.values()).filter(
          (draft) => draft.payload.tenantId === tenantId
        );

      case "get_stats":
        return {
          pendingDrafts: Array.from(this.pendingDrafts.values()).filter(
            (draft) => draft.payload.tenantId === tenantId
          ).length,
          draftedResolutions: this.draftedResolutionsCount.get(tenantId) ?? 0,
          governanceMode: "draft_only_approval_required",
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async getStatus(): Promise<{
    enabled: boolean;
    lastExecution?: Date;
    metrics?: Record<string, unknown>;
  }> {
    return {
      enabled: this.enabled,
      ...(this.lastCopilotAction ? { lastExecution: this.lastCopilotAction } : {}),
      metrics: {
        pendingDrafts: this.pendingDrafts.size,
        draftedResolutions: Array.from(this.draftedResolutionsCount.values()).reduce(
          (sum, count) => sum + count,
          0
        ),
        governanceMode: "draft_only_approval_required",
      },
    };
  }

  /**
   * Drafts an explanation or remediation recommendation for operator review.
   */
  draftSupportRecommendation(params: Record<string, unknown>): {
    recommendation: SupportRecommendation;
    draftJob: AgentJobDraft;
  } {
    const inquiryId = (params.inquiryId as string) || `inq_${Date.now()}`;
    const tenantId = params.tenantId as string;
    if (!tenantId) throw new Error("Tenant context is required to draft a recommendation");
    const discrepancyAmount = Number(params.discrepancyAmount) || 0;

    const recommendation: SupportRecommendation = {
      recommendationId: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      inquiryId,
      tenantId,
      summary: `Automated analysis for inquiry ${inquiryId}`,
      suggestedResponse:
        (params.suggestedResponse as string) ||
        "No deterministic explanation is available from the supplied evidence. Escalate to an analyst.",
      proposedAction:
        (params.proposedAction as SupportRecommendation["proposedAction"]) || "explain_timing",
      estimatedVariance: discrepancyAmount,
      confidenceScore: Number(params.confidenceScore) || 0,
    };

    const draftJob = this.createDraftJob(recommendation);
    this.pendingDrafts.set(draftJob.payload.recommendationId as string, draftJob);
    this.emit("draft_job_created", draftJob);
    this.lastCopilotAction = new Date();
    this.draftedResolutionsCount.set(
      tenantId,
      (this.draftedResolutionsCount.get(tenantId) ?? 0) + 1
    );

    return { recommendation, draftJob };
  }

  /**
   * Generates strictly draft-only job request via JobForgeClient
   */
  createDraftJob(recommendation: SupportRecommendation): AgentJobDraft {
    return {
      agentId: this.id,
      jobType: "support.resolution.draft",
      payload: {
        recommendationId: recommendation.recommendationId,
        inquiryId: recommendation.inquiryId,
        tenantId: recommendation.tenantId,
        proposedAction: recommendation.proposedAction,
        estimatedVariance: recommendation.estimatedVariance,
        suggestedResponse: recommendation.suggestedResponse,
      },
      autoExecute: false,
      requireApproval: true,
      governance: {
        riskLevel: (recommendation.estimatedVariance || 0) > 1000 ? "high" : "low",
        estimatedImpact: `Support copilot draft: action=${recommendation.proposedAction}, variance=${recommendation.estimatedVariance || 0}`,
        requiresHumanReview: true,
        signedPolicyBound: "pb_support_copilot_draft_v1",
      },
    };
  }

  /**
   * Execute resolution - strictly guarded by signed policy token
   */
  private async executeResolution(
    params: Record<string, unknown>,
    context?: AgentExecutionContext
  ): Promise<{
    recommendationId: string;
    status: string;
    executedAt: string;
  }> {
    // SECURITY INVARIANT: Autonomous resolution execution forbidden without verified signed policy token
    assertSignedPolicyToken(params.policyToken as string | undefined, {
      tenantId: context?.tenantId ?? "",
      agentId: this.id,
      action: "execute_resolution",
      payloadHash: policyPayloadHash(params),
      nonce: params.policyNonce as string | undefined,
    });

    const recommendationId = (params.recommendationId as string) || "unknown";
    const draft = this.pendingDrafts.get(recommendationId);
    if (!draft || draft.payload.tenantId !== context?.tenantId) {
      throw new Error("Approved support recommendation not found for tenant");
    }
    this.pendingDrafts.delete(recommendationId);

    logInfo(`Executed support resolution under verified policy token: ${recommendationId}`);

    return {
      recommendationId,
      status: "applied_with_policy_token",
      executedAt: new Date().toISOString(),
    };
  }
}
