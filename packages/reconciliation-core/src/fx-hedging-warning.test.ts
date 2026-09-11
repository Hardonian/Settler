import {
  evaluateFxHedgingDrift,
  CurrencyBalancePosition,
  FxHedgingPolicy,
} from "./fx-hedging-warning";

describe("Autonomous Currency Hedging Drift Warning", () => {
  const tenantId = "tenant_fx_hedging";

  const policy: FxHedgingPolicy = {
    baseCurrency: "USD",
    maxUnhedgedExposureCents: 2500000, // $25,000 USD limit
    maxDriftBps: 100,
  };

  it("fails fast if tenantId is missing", () => {
    expect(() => evaluateFxHedgingDrift("", [], policy)).toThrow(
      /Tenant context invariant violation/
    );
  });

  it("reports safe exposure when foreign currency positions are minimal or hedged", () => {
    const positions: CurrencyBalancePosition[] = [
      {
        currency: "EUR",
        balanceMinorUnits: 500000, // 5,000.00 EUR (~$5,425 USD)
        rateToBaseBps: 10850,
        unhedgedRatioBps: 10000, // 100% unhedged
      },
      {
        currency: "USD",
        balanceMinorUnits: 10000000,
        rateToBaseBps: 10000,
        unhedgedRatioBps: 0,
      },
    ];

    const report = evaluateFxHedgingDrift(tenantId, positions, policy);
    expect(report.tenantId).toBe(tenantId);
    expect(report.status).toBe("EXPOSURE_SAFE");
    expect(report.totalUnhedgedExposureBaseCents).toBe(542500); // $5,425.00
    expect(report.breachingCurrencies).toHaveLength(0);
    expect(report.reportMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
  });

  it("flags critical drift and synthesizes spot/forward hedge orders when exposure breaches limit", () => {
    const positions: CurrencyBalancePosition[] = [
      {
        currency: "EUR",
        balanceMinorUnits: 3000000, // 30,000.00 EUR (~$32,550 USD > $25,000 limit)
        rateToBaseBps: 10850,
        unhedgedRatioBps: 10000,
      },
    ];

    const report = evaluateFxHedgingDrift(tenantId, positions, policy);
    expect(report.status).toBe("CRITICAL_UNHEDGED_DRIFT");
    expect(report.breachingCurrencies).toEqual(["EUR"]);
    expect(report.recommendedHedgeOrders).toHaveLength(1);
    expect(report.recommendedHedgeOrders[0]!.sellCurrency).toBe("EUR");
    expect(report.recommendedHedgeOrders[0]!.buyCurrency).toBe("USD");
    expect(report.recommendedHedgeOrders[0]!.recommendedOrderType).toBe("SPOT_CONVERSION");
  });
});
