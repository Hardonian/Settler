import { generateDueDiligencePackage } from "../due-diligence";

describe("generateDueDiligencePackage", () => {
  it("synthesizes deterministic financial dataset with Merkle root", () => {
    const pkg = generateDueDiligencePackage({
      tenantId: "tenant_stripe_mna",
      evaluator: "Stripe Corp Dev",
      txCount: 100,
    });

    expect(pkg.targetEvaluator).toBe("Stripe Corp Dev");
    expect(pkg.totalTransactionsCount).toBe(100);
    expect(pkg.totalGrossVolumeCents).toBeGreaterThan(0);
    expect(pkg.totalFeesCents).toBeGreaterThan(0);
    expect(pkg.totalNetVolumeCents).toBe(pkg.totalGrossVolumeCents - pkg.totalFeesCents);
    expect(pkg.merkleStateRootSha256).toHaveLength(64);
    expect(pkg.sampleTransactions.length).toBe(10);
    expect(pkg.sampleTransactions[0]!.leafHashSha256).toHaveLength(64);
  });
});
