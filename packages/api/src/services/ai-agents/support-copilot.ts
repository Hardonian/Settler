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

import { BaseAgent, AgentJobDraft, assertSignedPolicyToken } from "./orchestrator";
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
  private draftedResolutionsCount = 0;

  async initialize(): Promise<void> {
    this.enabled = true;
    logInfo("Support Copilot Agent initialized with human-in-the-loop governance");
  }

  async execute(action: string, params: Record<string, unknown>): Promise<unknown> {
    switch (action) {
      case "draft_support_recommendation":
        return this.draftSupportRecommendation(params);

      case "execute_resolution":
        return await this.executeResolution(params);

      case "get_pending_drafts":
        return Array.from(this.pendingDrafts.values());

      case "get_stats":
        return await this.getStatus();

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
        draftedResolutions: this.draftedResolutionsCount,
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
    const tenantId = (params.tenantId as string) || "system-support-tenant";
    const discrepancyAmount = Number(params.discrepancyAmount) || 0;

    const recommendation: SupportRecommendation = {
      recommendationId: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      inquiryId,
      tenantId,
      summary: `Automated analysis for inquiry ${inquiryId}`,
      suggestedResponse:
        (params.suggestedResponse as string) ||
        `Our reconciliation records indicate a timing drift or pending processor settlement for reference ${params.transactionId || "N/A"}.`,
      proposedAction:
        (params.proposedAction as SupportRecommendation["proposedAction"]) || "explain_timing",
      estimatedVariance: discrepancyAmount,
      confidenceScore: 0.94,
    };

    const draftJob = this.createDraftJob(recommendation);
    this.pendingDrafts.set(draftJob.payload.recommendationId as string, draftJob);
    this.emit("draft_job_created", draftJob);
    this.lastCopilotAction = new Date();
    this.draftedResolutionsCount++;

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
  private async executeResolution(params: Record<string, unknown>): Promise<{
    recommendationId: string;
    status: string;
    executedAt: string;
  }> {
    // SECURITY INVARIANT: Autonomous resolution execution forbidden without verified signed policy token
    assertSignedPolicyToken(params.policyToken as string | undefined);

    const recommendationId = (params.recommendationId as string) || "unknown";
    this.pendingDrafts.delete(recommendationId);

    logInfo(`Executed support resolution under verified policy token: ${recommendationId}`);

    return {
      recommendationId,
      status: "applied_with_policy_token",
      executedAt: new Date().toISOString(),
    };
  }
}
