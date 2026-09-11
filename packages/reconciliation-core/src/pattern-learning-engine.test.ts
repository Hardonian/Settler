import {
  categorizeVarianceBand,
  generatePatternFingerprint,
  PatternLearningEngine,
} from "./pattern-learning-engine.js";
import {
  evaluateBatchThreats,
  type TransactionThreatContext,
} from "./threat-recognition-engine.js";

describe("Pattern Learning Engine", () => {
  const TENANT = "tenant_enterprise_beta";

  it("categorizes variance bands with zero-float integer precision", () => {
    expect(categorizeVarianceBand(0n)).toBe("zero");
    expect(categorizeVarianceBand(4n)).toBe("micro");
    expect(categorizeVarianceBand(-5n)).toBe("micro");
    expect(categorizeVarianceBand(85n)).toBe("sub_dollar");
    expect(categorizeVarianceBand(500n)).toBe("material");
  });

  it("clusters recurring threat signals and learns Bayesian confidence over time", () => {
    const engine = new PatternLearningEngine(TENANT);

    const transactions: TransactionThreatContext[] = [
      {
        id: "tx_float_01",
        tenantId: TENANT,
        rail: "ach",
        amountCents: 500000n,
        currency: "USD",
        timestamp: "2026-09-01T00:00:00Z",
        clearingExpectedAt: "2026-09-02T00:00:00Z",
        actualSettledAt: "2026-09-06T12:00:00Z", // 108 hours lag
      },
      {
        id: "tx_float_02",
        tenantId: TENANT,
        rail: "ach",
        amountCents: 350000n,
        currency: "USD",
        timestamp: "2026-09-02T00:00:00Z",
        clearingExpectedAt: "2026-09-03T00:00:00Z",
        actualSettledAt: "2026-09-07T14:00:00Z", // 110 hours lag
      },
      {
        id: "tx_comm_01",
        tenantId: TENANT,
        rail: "card_interchange",
        amountCents: 1200000n,
        currency: "USD",
        timestamp: "2026-09-02T00:00:00Z",
        cardCommercialType: "corporate",
        hasLevel2Data: false,
        hasLevel3Data: false,
      },
    ];

    const report = evaluateBatchThreats(transactions, { tenantId: TENANT });
    expect(report.threatsDetectedCount).toBe(3);

    // Ingest into pattern learning engine
    engine.ingestThreatObservations(report.threats, { rail: "ach", currency: "USD" });

    const summary = engine.produceSummaryReport();
    expect(summary.totalClustersTracked).toBeGreaterThan(0);
    expect(summary.healingPlans.length).toBeGreaterThan(0);

    // Verify self-healing plan generation
    const timingPlan = summary.healingPlans.find((p) => p.actionType === "HEAL_FLOAT_TIMING");
    expect(timingPlan).toBeDefined();
    expect(timingPlan?.parameters.newWindowSeconds).toBe(300);
    expect(timingPlan?.expectedNoiseReductionPct).toBe(78);

    const enrichmentPlan = summary.healingPlans.find(
      (p) => p.actionType === "HEAL_METADATA_ENRICHMENT"
    );
    expect(enrichmentPlan).toBeDefined();
    expect(enrichmentPlan?.expectedNoiseReductionPct).toBe(92);
  });
});
