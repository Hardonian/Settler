/**
 * Release QA Agent
 *
 * Verifies release readiness, pre-deployment smoke checks, reconciliation
 * replay consistency, and rule integrity invariants.
 *
 * GOVERNANCE: Strictly emits draft-only verification summaries and release signoff
 * requests (autoExecute: false, requireApproval: true). Automated production promotions
 * or state-mutating actions strictly require human approval and signed policy tokens.
 */

import {
  BaseAgent,
  AgentJobDraft,
  AgentExecutionContext,
  assertSignedPolicyToken,
  policyPayloadHash,
} from "./orchestrator";
import { logInfo } from "../../utils/logger";

export interface ReleaseCheckSuite {
  suiteId: string;
  tenantId: string;
  releaseVersion: string;
  checks: Array<{
    name: string;
    category: "determinism" | "tenant_isolation" | "proofpack_integrity" | "reconciliation_parity";
    status: "pending" | "passed" | "failed";
  }>;
  overallStatus: "pending" | "ready_for_review" | "blocked";
  readinessScore: number;
}

export class ReleaseQAAgent extends BaseAgent {
  id = "release-qa-agent";
  name = "Release QA Agent";
  type = "qa" as const;

  private testSuites: Map<string, ReleaseCheckSuite> = new Map();
  private lastVerification?: Date;
  private verifiedReleasesCount = 0;

  async initialize(): Promise<void> {
    this.enabled = true;
    logInfo("Release QA Agent initialized in draft-governed mode");
  }

  async execute(
    action: string,
    params: Record<string, unknown>,
    context?: AgentExecutionContext
  ): Promise<unknown> {
    const tenantId = context?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant context is required for release QA agent execution");
    }

    switch (action) {
      case "evaluate_release":
        return this.evaluateRelease({ ...params, tenantId });

      case "promote_release":
        return await this.promoteRelease(params, context);

      case "get_suites":
        return Array.from(this.testSuites.values()).filter((suite) => suite.tenantId === tenantId);

      case "get_stats":
        return {
          activeSuites: Array.from(this.testSuites.values()).filter(
            (suite) => suite.tenantId === tenantId
          ).length,
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
      ...(this.lastVerification ? { lastExecution: this.lastVerification } : {}),
      metrics: {
        activeSuites: this.testSuites.size,
        verifiedReleases: this.verifiedReleasesCount,
        governanceMode: "draft_only_approval_required",
      },
    };
  }

  /**
   * Evaluates release criteria and creates a draft-only job request.
   */
  evaluateRelease(params: Record<string, unknown>): {
    suite: ReleaseCheckSuite;
    draftJob: AgentJobDraft;
  } {
    const version = (params.version as string) || "v1.6.0-release-candidate";
    const tenantId = params.tenantId as string;
    if (!tenantId) throw new Error("Tenant context is required to evaluate a release");
    const suiteId = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const suppliedChecks = Array.isArray(params.checks) ? params.checks : [];
    const checks = suppliedChecks.filter(
      (check): check is ReleaseCheckSuite["checks"][number] =>
        typeof check === "object" &&
        check !== null &&
        typeof (check as { name?: unknown }).name === "string" &&
        [
          "determinism",
          "tenant_isolation",
          "proofpack_integrity",
          "reconciliation_parity",
        ].includes(String((check as { category?: unknown }).category)) &&
        ["pending", "passed", "failed"].includes(String((check as { status?: unknown }).status))
    );
    const passed = checks.filter((check) => check.status === "passed").length;
    const readinessScore = checks.length === 0 ? 0 : Math.floor((passed / checks.length) * 100);

    const suite: ReleaseCheckSuite = {
      suiteId,
      tenantId,
      releaseVersion: version,
      checks,
      overallStatus:
        checks.length > 0 && checks.every((check) => check.status === "passed")
          ? "ready_for_review"
          : "blocked",
      readinessScore,
    };

    this.testSuites.set(suiteId, suite);
    const draftJob = this.createDraftJob(suite);
    this.emit("draft_job_created", draftJob);
    this.lastVerification = new Date();
    this.verifiedReleasesCount++;

    return { suite, draftJob };
  }

  /**
   * Generates strictly draft-only job request via JobForgeClient
   */
  createDraftJob(suite: ReleaseCheckSuite): AgentJobDraft {
    return {
      agentId: this.id,
      jobType: "qa.release.promotion.draft",
      payload: {
        suiteId: suite.suiteId,
        tenantId: suite.tenantId,
        releaseVersion: suite.releaseVersion,
        checks: suite.checks,
        readinessScore: suite.readinessScore,
      },
      autoExecute: false,
      requireApproval: true,
      governance: {
        riskLevel: "medium",
        estimatedImpact: `Release promotion request for version ${suite.releaseVersion} (readiness: ${suite.readinessScore}%)`,
        requiresHumanReview: true,
        signedPolicyBound: "pb_release_qa_draft_v1",
      },
    };
  }

  /**
   * Promotes release - requires verified signed policy token
   */
  private async promoteRelease(
    params: Record<string, unknown>,
    context?: AgentExecutionContext
  ): Promise<{
    suiteId: string;
    version: string;
    status: string;
  }> {
    // SECURITY INVARIANT: Autonomous release promotion forbidden without verified signed policy token
    assertSignedPolicyToken(params.policyToken as string | undefined, {
      tenantId: context?.tenantId ?? "",
      agentId: this.id,
      action: "promote_release",
      payloadHash: policyPayloadHash(params),
      nonce: params.policyNonce as string | undefined,
    });

    const suiteId = (params.suiteId as string) || "unknown";
    const version = (params.version as string) || "v1.6.0";
    const suite = this.testSuites.get(suiteId);
    if (
      !suite ||
      suite.tenantId !== context?.tenantId ||
      suite.overallStatus !== "ready_for_review"
    ) {
      throw new Error("Verified release suite not found or not ready for tenant");
    }

    logInfo(`Release promoted under verified policy token: ${version} (suite ${suiteId})`);

    return {
      suiteId,
      version,
      status: "promoted_under_policy",
    };
  }
}
