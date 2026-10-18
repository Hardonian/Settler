import {
  assertSignedPolicyToken,
  createSignedPolicyToken,
  policyPayloadHash,
} from "../orchestrator";
import { InfrastructureOptimizerAgent } from "../infrastructure-optimizer";
import { AnomalyDetectorAgent } from "../anomaly-detector";
import { SyntheticUserSimulatorAgent } from "../synthetic-user-simulator";
import { SupportCopilotAgent } from "../support-copilot";
import { ReleaseQAAgent } from "../release-qa-agent";

describe("agent governance", () => {
  const tenantId = "00000000-0000-4000-8000-0000000000a1";
  const originalSecret = process.env.AGENT_POLICY_TOKEN_SECRET;

  beforeEach(() => {
    process.env.AGENT_POLICY_TOKEN_SECRET = "test-only-agent-policy-secret-32-bytes-minimum";
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AGENT_POLICY_TOKEN_SECRET;
    } else {
      process.env.AGENT_POLICY_TOKEN_SECRET = originalSecret;
    }
  });

  it("rejects prefix-only, tampered, expired, and cross-tenant policy tokens", () => {
    const nonce = "nonce-for-draft-0001";
    const bounds = {
      tenantId,
      agentId: "support-copilot",
      action: "execute_resolution",
      payloadHash: policyPayloadHash({ recommendationId: "rec-1", policyNonce: nonce }),
      nonce,
    };
    const valid = createSignedPolicyToken(bounds, nonce);

    expect(() => assertSignedPolicyToken(valid, bounds)).not.toThrow();
    expect(() => assertSignedPolicyToken(`pt_${"x".repeat(64)}`, bounds)).toThrow(
      /GOVERNANCE_INVARIANT_VIOLATION/
    );
    expect(() => assertSignedPolicyToken(`${valid.slice(0, -1)}x`, bounds)).toThrow(
      /GOVERNANCE_INVARIANT_VIOLATION/
    );
    expect(() => assertSignedPolicyToken(valid, { ...bounds, tenantId: "tenant_beta" })).toThrow(
      /GOVERNANCE_INVARIANT_VIOLATION/
    );
    expect(() =>
      assertSignedPolicyToken(valid, {
        ...bounds,
        payloadHash: policyPayloadHash({ recommendationId: "rec-2", policyNonce: nonce }),
      })
    ).toThrow(/GOVERNANCE_INVARIANT_VIOLATION/);

    const expired = createSignedPolicyToken(bounds, nonce, 100, 200);
    expect(() => assertSignedPolicyToken(expired, bounds)).toThrow(
      /GOVERNANCE_INVARIANT_VIOLATION/
    );
  });

  it("keeps every autonomous agent output draft-only and approval-gated", () => {
    const drafts = [
      new InfrastructureOptimizerAgent().createDraftJob(
        {
          id: "optimization-1",
          type: "query",
          description: "Index recommendation",
          currentState: {},
          proposedChange: {},
          expectedImpact: { riskLevel: "low" },
          recommendedAction: "human-review",
        },
        tenantId
      ),
      new AnomalyDetectorAgent().createDraftJob(
        {
          id: "anomaly-1",
          type: "security",
          severity: "high",
          description: "Suspicious request pattern",
          detectedAt: new Date("2026-10-18T00:00:00Z"),
          confidence: 99,
        },
        tenantId
      ),
      new SyntheticUserSimulatorAgent().createDraftJob({
        id: "simulation-1",
        name: "bounded simulation",
        description: "local load fixture",
        tenantId,
        targetTps: 100,
        durationSeconds: 60,
        pattern: "sustained",
        parameters: { transactionCount: 6000 },
        governance: { riskLevel: "medium", estimatedImpact: "local-only" },
      }),
      new SupportCopilotAgent().createDraftJob({
        recommendationId: "recommendation-1",
        inquiryId: "inquiry-1",
        tenantId,
        summary: "Timing explanation",
        suggestedResponse: "Await settlement window.",
        proposedAction: "explain_timing",
        confidenceScore: 0.95,
      }),
      new ReleaseQAAgent().createDraftJob({
        suiteId: "suite-1",
        tenantId,
        releaseVersion: "v1.6.0",
        checks: [],
        overallStatus: "ready_for_review",
        readinessScore: 100,
      }),
    ];

    for (const draft of drafts) {
      expect(draft.autoExecute).toBe(false);
      expect(draft.requireApproval).toBe(true);
      expect(draft.governance.requiresHumanReview).toBe(true);
      expect(draft.governance.signedPolicyBound).toMatch(/^pb_/);
    }
  });
});
