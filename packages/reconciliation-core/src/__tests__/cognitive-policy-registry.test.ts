import {
  createPolicyProposal,
  approvePolicy,
  rejectPolicy,
  applyActiveCognitivePolicies,
} from "../cognitive-policy-registry.js";

describe("CognitivePolicyRegistry & Dual-Signature Governance", () => {
  const tenantId = "tenant-enterprise-sox-01";
  const proposerId = "operator-alice";
  const checkerId = "controller-bob";

  it("creates a policy proposal with deterministic rule hash", () => {
    const proposal = createPolicyProposal({
      tenantId,
      rail: "stripe_payout",
      action: "HEAL_FLOAT_TIMING",
      rationale: "Extend clearing window for UK bank holiday",
      ruleConfig: { windowMultiplier: 3 },
      noiseReductionPct: 92.5,
      capitalGuardedCents: 45000000n,
      proposerId,
    });

    expect(proposal.proposalId).toMatch(/^pol_[a-f0-9]{16}$/);
    expect(proposal.status).toBe("proposed");
    expect(proposal.tenantId).toBe(tenantId);
    expect(proposal.proposerId).toBe(proposerId);
    expect(proposal.capitalGuardedCents).toBe(45000000n);
  });

  it("enforces SOX-404 separation of duties (checker cannot equal proposer)", () => {
    const proposal = createPolicyProposal({
      tenantId,
      rail: "cross_border_fx",
      action: "HEAL_ROUNDING_PRECISION",
      rationale: "Micro-rounding adjustment",
      ruleConfig: { deltaToleranceCents: 2 },
      noiseReductionPct: 88,
      capitalGuardedCents: 1200000n,
      proposerId,
    });

    expect(() => {
      approvePolicy({
        proposal,
        checkerId: proposerId, // VIOLATION: same user
        tenantId,
      });
    }).toThrow("SOX-404 dual-signature violation");
  });

  it("rejects approval if tenantId does not match proposal", () => {
    const proposal = createPolicyProposal({
      tenantId,
      rail: "cross_border_fx",
      action: "HEAL_ROUNDING_PRECISION",
      rationale: "Micro-rounding adjustment",
      ruleConfig: { deltaToleranceCents: 2 },
      noiseReductionPct: 88,
      capitalGuardedCents: 1200000n,
      proposerId,
    });

    expect(() => {
      approvePolicy({
        proposal,
        checkerId,
        tenantId: "tenant-evil-intruder", // VIOLATION: cross-tenant
      });
    }).toThrow("Tenant mismatch");
  });

  it("approves policy with dual-signature and generates immutable certificate hash", () => {
    const proposal = createPolicyProposal({
      tenantId,
      rail: "stripe_payout",
      action: "HEAL_FLOAT_TIMING",
      rationale: "Extend clearing window for UK bank holiday",
      ruleConfig: { windowMultiplier: 2 },
      noiseReductionPct: 92.5,
      capitalGuardedCents: 45000000n,
      proposerId,
    });

    const approved = approvePolicy({
      proposal,
      checkerId,
      tenantId,
    });

    expect(approved.status).toBe("active");
    expect(approved.checkerId).toBe(checkerId);
    expect(approved.approvedAt).toBeDefined();
    expect(approved.immutableCertificateHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("supports rejecting a proposed policy with reason", () => {
    const proposal = createPolicyProposal({
      tenantId,
      rail: "fedwire",
      action: "HEAL_TIMING",
      rationale: "High variance window",
      ruleConfig: { windowMultiplier: 10 },
      noiseReductionPct: 20,
      capitalGuardedCents: 50000n,
      proposerId,
    });

    const rejected = rejectPolicy({
      proposal,
      checkerId,
      tenantId,
      rejectionReason: "Window multiplier of 10 exceeds risk threshold",
    });

    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toContain("exceeds risk threshold");
  });

  it("deterministically applies active cognitive policies with bounds enforcement", () => {
    const proposal1 = createPolicyProposal({
      tenantId,
      rail: "stripe_payout",
      action: "HEAL_FLOAT_TIMING",
      rationale: "Extend clearing window",
      ruleConfig: { windowMultiplier: 3 },
      noiseReductionPct: 90,
      capitalGuardedCents: 100000n,
      proposerId,
    });
    const approved1 = approvePolicy({ proposal: proposal1, checkerId, tenantId });

    const proposal2 = createPolicyProposal({
      tenantId,
      rail: "stripe_payout",
      action: "HEAL_ROUNDING_PRECISION",
      rationale: "Sub-cent rounding",
      ruleConfig: { deltaToleranceCents: 4 },
      noiseReductionPct: 85,
      capitalGuardedCents: 50000n,
      proposerId,
    });
    const approved2 = approvePolicy({ proposal: proposal2, checkerId, tenantId });

    const result = applyActiveCognitivePolicies({
      tenantId,
      baseToleranceCents: 10n,
      baseWindowSeconds: 86400, // 24h
      policies: [approved1, approved2],
    });

    expect(result.appliedPolicyIds).toHaveLength(2);
    expect(result.effectiveWindowSeconds).toBe(86400 * 3);
    expect(result.effectiveToleranceCents).toBe(14n);
    expect(result.auditHash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
