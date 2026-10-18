/**
 * Agent Governance & Policy Token Signing Specification
 *
 * Verifies human-in-the-loop draft approval, cryptographic HMAC policy tokens,
 * and tenant-isolated execution authorization.
 */

import {
  AgentGovernanceService,
  StoredAgentDraft,
} from "../src/services/ai-agents/agent-governance-service";
import {
  AgentJobDraft,
  agentOrchestrator,
  policyPayloadHash,
} from "../src/services/ai-agents/orchestrator";
import { SupportCopilotAgent } from "../src/services/ai-agents/support-copilot";

describe("Agent Governance & Policy Token Signer", () => {
  let governanceService: AgentGovernanceService;
  const TENANT_A = "00000000-0000-4000-8000-00000000000a";
  const TENANT_B = "00000000-0000-4000-8000-00000000000b";

  beforeEach(() => {
    process.env.AGENT_POLICY_TOKEN_SECRET = "test-only-agent-policy-secret-32-bytes-minimum";
    if (!agentOrchestrator.getAgent("support-copilot")) {
      const agent = new SupportCopilotAgent();
      agent.enable();
      agentOrchestrator.registerAgent(agent);
    }
    governanceService = new AgentGovernanceService();
  });

  it("records a draft job in pending status bounded by policy", () => {
    const draft: AgentJobDraft = {
      agentId: "anomaly-detector",
      jobType: "anomaly.remediation.fx_spread",
      payload: { delta: 12.5 },
      autoExecute: false,
      requireApproval: true,
      governance: {
        riskLevel: "medium",
        estimatedImpact: "Adjust tolerance delta",
        requiresHumanReview: true,
        signedPolicyBound: "pb_fx_v1",
      },
    };

    const stored = governanceService.recordDraft(TENANT_A, draft);
    expect(stored.id).toMatch(/^draft_/);
    expect(stored.tenantId).toBe(TENANT_A);
    expect(stored.status).toBe("pending");
    expect(stored.autoExecute).toBe(false);
    expect(stored.requireApproval).toBe(true);
  });

  it("generates and verifies cryptographic HMAC policy tokens", () => {
    const claims = {
      tenantId: TENANT_A,
      agentId: "infrastructure-optimizer",
      draftId: "draft_test_123",
      approverId: "user_operator_1",
      approverRole: "operator.governance",
      signedAt: Date.now(),
      payloadHash: policyPayloadHash({ opportunityId: "opt-1" }),
    };

    const token = governanceService.signPolicyToken(claims);
    expect(token.startsWith("pt_")).toBe(true);
    expect(token.length).toBeGreaterThanOrEqual(32);

    const isValid = governanceService.verifyPolicyToken(token, {
      tenantId: TENANT_A,
      agentId: "infrastructure-optimizer",
      draftId: "draft_test_123",
      approverId: "user_operator_1",
      approverRole: "operator.governance",
      payloadHash: policyPayloadHash({ opportunityId: "opt-1" }),
    });
    expect(isValid).toBe(true);

    // Mismatched tenant must fail verification
    const spoofedTenant = governanceService.verifyPolicyToken(token, {
      tenantId: TENANT_B,
      agentId: "infrastructure-optimizer",
      draftId: "draft_test_123",
      approverId: "user_operator_1",
      approverRole: "operator.governance",
      payloadHash: policyPayloadHash({ opportunityId: "opt-1" }),
    });
    expect(spoofedTenant).toBe(false);
  });

  it("approves pending draft and attaches execution proof", async () => {
    const draft: AgentJobDraft = {
      agentId: "support-copilot",
      jobType: "support.resolution.draft",
      payload: { recommendationId: "rec_99", action: "explain_timing" },
      autoExecute: false,
      requireApproval: true,
      governance: {
        riskLevel: "low",
        estimatedImpact: "Customer dispute explanation",
        requiresHumanReview: true,
        signedPolicyBound: "pb_support_v1",
      },
    };

    const stored = governanceService.recordDraft(TENANT_A, draft);
    const result = await governanceService.approveDraft(TENANT_A, stored.id, {
      id: "admin_user",
      role: "operator.admin",
    });

    expect(result.draft.status).toBe("approved");
    expect(result.draft.approvedBy).toBe("admin_user");
    expect(result.policyToken.startsWith("pt_")).toBe(true);
    expect(result.executionResult).toBeDefined();

    // Secondary approval must fail
    await expect(
      governanceService.approveDraft(TENANT_A, stored.id, {
        id: "admin_user_2",
        role: "operator.admin",
      })
    ).rejects.toThrow(/cannot be approved from status/);
  });

  it("rejects pending draft with reason", () => {
    const draft: AgentJobDraft = {
      agentId: "release-qa-agent",
      jobType: "qa.release.promotion.draft",
      payload: { version: "v1.6.0" },
      autoExecute: false,
      requireApproval: true,
      governance: {
        riskLevel: "medium",
        estimatedImpact: "Release candidate promotion",
        requiresHumanReview: true,
        signedPolicyBound: "pb_qa_v1",
      },
    };

    const stored = governanceService.recordDraft(TENANT_A, draft);
    const rejected = governanceService.rejectDraft(
      TENANT_A,
      stored.id,
      "sec_auditor",
      "Requires additional canary verification"
    );

    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toBe("Requires additional canary verification");
    expect(rejected.rejectedBy).toBe("sec_auditor");
  });

  it("enforces tenant boundary isolation across drafts", () => {
    const draftA: AgentJobDraft = {
      agentId: "anomaly-detector",
      jobType: "anomaly.remediation.critical",
      payload: { secret: "tenant_alpha_anomaly" },
      autoExecute: false,
      requireApproval: true,
      governance: {
        riskLevel: "high",
        estimatedImpact: "Critical tenant Alpha remediation",
        requiresHumanReview: true,
        signedPolicyBound: "pb_crit_v1",
      },
    };

    const storedA = governanceService.recordDraft(TENANT_A, draftA);

    // Tenant B cannot retrieve Tenant A's draft
    const draftForB = governanceService.getDraft(TENANT_B, storedA.id);
    expect(draftForB).toBeNull();

    // Tenant B cannot approve Tenant A's draft
    expect(
      governanceService.approveDraft(TENANT_B, storedA.id, {
        id: "attacker",
        role: "operator.admin",
      })
    ).rejects.toThrow(/not found for tenant/);
  });
});
