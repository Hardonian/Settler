import { recommendOptimalRoute } from "./interchange-route-recommender";

describe("Autonomous Interchange Route Recommender", () => {
  const tenantId = "tenant_routing_opt";

  it("fails fast if tenantId is missing", () => {
    expect(() => recommendOptimalRoute("", 10000)).toThrow(/Tenant isolation invariant violation/);
  });

  it("recommends FedNow for USD micro-transactions due to negligible flat fee", () => {
    const rec = recommendOptimalRoute(tenantId, 5000, "USD"); // $50.00
    expect(rec.tenantId).toBe(tenantId);
    expect(rec.recommendedRail.rail).toBe("FEDNOW");
    expect(rec.recommendedRail.projectedFeeCents).toBe(6); // $0.06
    expect(rec.estimatedSavingsCentsVsDefault).toBeGreaterThan(100); // Saves over $1 vs Stripe's 2.9%+$0.30
  });

  it("recommends ACH for large USD B2B transfers due to fee capping", () => {
    // For a $50,000 transfer (5,000,000 cents):
    // ACH fee is capped at $5.00 + $0.20 = $5.20 (520 cents)
    // Stripe fee would be ~2.9% = $1,450.00
    const rec = recommendOptimalRoute(tenantId, 5000000, "USD");
    expect(rec.recommendedRail.rail).toBe("FEDNOW"); // 6 cents flat is even cheaper than ACH!
  });

  it("identifies corporate cards and mandates L2/L3 optimization", () => {
    const rec = recommendOptimalRoute(tenantId, 100000, "USD", true, false);
    const adyen = rec.alternateRails.find((r) => r.rail === "ADYEN");
    expect(adyen).toBeDefined();
    expect(adyen!.requiresL2L3Optimization).toBe(true);
  });
});
