import {
  simulatePolicyDraft,
  type CounterfactualSimulationInput,
  type SandboxTransaction,
} from "./counterfactual-policy-sandbox";

describe("Counterfactual Policy Sandbox & Predictive Simulation Engine", () => {
  const sourceTransactions: SandboxTransaction[] = [
    {
      id: "src_001",
      amountCents: 5000n,
      date: "2026-10-01T10:00:00Z",
      description: "Acme Corp Monthly Subscription",
      currency: "USD",
    },
    {
      id: "src_002",
      amountCents: 10025n, // 25 cents delta from target
      date: "2026-10-01T11:00:00Z",
      description: "Globex Enterprise Cloud License",
      currency: "USD",
    },
    {
      id: "src_003",
      externalId: "arn:card:12345678901234567890123",
      amountCents: 7500n,
      date: "2026-10-01T12:00:00Z",
      description: "Initech Hardware Purchase ARN match",
      currency: "USD",
    },
    {
      id: "src_004",
      amountCents: 20000n,
      date: "2026-10-01T14:00:00Z",
      description: "Umbrella Corp Bi-Annual Retainer",
      currency: "USD",
    },
  ];

  const targetTransactions: SandboxTransaction[] = [
    {
      id: "tgt_001",
      amountCents: 5000n,
      date: "2026-10-01T10:05:00Z",
      description: "Acme Corp Monthly Subscription",
      currency: "USD",
    },
    {
      id: "tgt_002",
      amountCents: 10000n, // Baseline tolerance (0) will fail; 30 cents tolerance will match
      date: "2026-10-02T09:00:00Z",
      description: "Globex Enterprise Cloud License",
      currency: "USD",
    },
    {
      id: "tgt_003",
      externalId: "arn:card:12345678901234567890123",
      amountCents: 7500n,
      date: "2026-10-04T12:00:00Z", // 3 days later
      description: "Initech Hardware Purchase ARN match",
      currency: "USD",
    },
  ];

  it("simulates baseline vs proposed ruleset with positive match lift and zero-float calculation", () => {
    const input: CounterfactualSimulationInput = {
      tenantId: "tenant_alpha_01",
      baselineRuleset: {
        dateWindowDays: 1,
        amountToleranceCents: 0,
        fuzzyDescriptionThreshold: 0.8,
        enableArnCorrelation: false,
      },
      candidatePolicy: {
        policyId: "pol_adjust_rounding_and_arn",
        tenantId: "tenant_alpha_01",
        proposedBy: "operator_alice",
        actionType: "HEAL_ROUNDING_AND_ARN",
        proposedRuleset: {
          dateWindowDays: 4,
          amountToleranceCents: 30, // Allows 25 cents delta
          fuzzyDescriptionThreshold: 0.7,
          enableArnCorrelation: true,
        },
        rationale:
          "Widening tolerance by 30 cents to absorb processor rounding and enabling ARN correlation.",
      },
      sourceTransactions,
      targetTransactions,
    };

    const report = simulatePolicyDraft(input);

    expect(report.simulationId).toMatch(/^sim_[a-f0-9]{16}$/);
    expect(report.tenantId).toBe("tenant_alpha_01");

    // Baseline matched src_001 only (1/4 = 25%)
    expect(report.baseline.matchedCount).toBe(1);
    expect(report.baseline.autoMatchRatePct).toBe(25);
    expect(report.baseline.totalMatchedVolumeCents).toBe(5000n);

    // Simulated matched src_001, src_002 (via 30 cent tolerance), and src_003 (via ARN) (3/4 = 75%)
    expect(report.simulated.matchedCount).toBe(3);
    expect(report.simulated.autoMatchRatePct).toBe(75);

    // Delta analysis
    expect(report.delta.matchCountDelta).toBe(2);
    expect(report.delta.autoMatchRateDeltaPct).toBe(50);
    expect(report.delta.newlyMatchedCount).toBe(2);
    expect(report.delta.brokenMatchCount).toBe(0);
    expect(report.delta.netFloatDeltaCents).toBe(10025n + 7500n);

    // SOX compliance
    expect(report.soxCompliance.isCompliant).toBe(true);
    expect(report.soxCompliance.violations).toHaveLength(0);

    // Risk assessment
    expect(report.riskAssessment.riskTier).not.toBe("BLOCKED");
    expect(report.simulationMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
  });

  it("blocks policy drafts that violate SOX-404 hard tolerance or window limits", () => {
    const input: CounterfactualSimulationInput = {
      tenantId: "tenant_bravo_02",
      baselineRuleset: {
        dateWindowDays: 2,
        amountToleranceCents: 10,
        fuzzyDescriptionThreshold: 0.8,
      },
      candidatePolicy: {
        policyId: "pol_excessive_tolerance_hazard",
        tenantId: "tenant_bravo_02",
        proposedBy: "operator_bob",
        actionType: "UNSAFE_WIDEN",
        proposedRuleset: {
          dateWindowDays: 14, // Exceeds 7-day limit
          amountToleranceCents: 200, // Exceeds 50-cent limit
          fuzzyDescriptionThreshold: 0.4,
        },
        rationale: "Unsafe wide tolerance test",
      },
      sourceTransactions,
      targetTransactions,
    };

    const report = simulatePolicyDraft(input);

    expect(report.soxCompliance.isCompliant).toBe(false);
    expect(report.soxCompliance.maxToleranceCentsExceeded).toBe(true);
    expect(report.soxCompliance.maxWindowDaysExceeded).toBe(true);
    expect(report.soxCompliance.violations.length).toBeGreaterThanOrEqual(2);
    expect(report.riskAssessment.riskTier).toBe("BLOCKED");
    expect(report.riskAssessment.recommendedAction).toBe("REJECT_POLICY");
  });
});
