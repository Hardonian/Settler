import {
  interchangeMarginAnalyzer,
  InterchangeAnalysisInput,
} from "../interchange-margin-analyzer";

describe("Interchange++ Forensic Margin Recovery & Downgrade Classifier", () => {
  it("detects B2B Commercial card Level 1 downgrade due to missing Level 3 data", () => {
    const input: InterchangeAnalysisInput = {
      transactionId: "tx_b2b_901",
      orderReference: "ORD-CORP-901",
      amountCents: 500000, // $5,000.00
      currency: "USD",
      actualFeeCents: 14500, // 2.90% ($145.00) charged on blended/downgraded rate
      cardBrand: "VISA",
      cardCategory: "CREDIT_COMMERCIAL_B2B",
      dataLevelProvided: "LEVEL_1",
      hoursToCapture: 12,
      hasSalesTaxAmount: false,
      hasLineItemDetail: false,
    };

    const result = interchangeMarginAnalyzer.analyzeTransaction(input);

    expect(result.downgradeReason).toBe("DOWNGRADE_MISSING_LEVEL_3");
    expect(result.isRecoveryEligible).toBe(true);
    expect(result.basisPointsPaid).toBe(290); // 2.90%
    expect(result.optimalBasisPointsTarget).toBeLessThan(215); // ~2.00% target
    expect(result.basisPointsLeaked).toBeGreaterThan(70); // > 70 bps leaked
    expect(result.excessLeakageCents).toBeGreaterThan(3500); // > $35.00 excess on $5,000 tx
    expect(result.recommendedRemediation).toContain("Level 2/3");
    expect(result.proofHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("classifies EIRF timing breach when settlement capture is delayed past 48 hours", () => {
    const input: InterchangeAnalysisInput = {
      transactionId: "tx_delayed_101",
      orderReference: "ORD-DELAYED-101",
      amountCents: 200000, // $2,000.00
      currency: "USD",
      actualFeeCents: 5200, // 2.60% ($52.00)
      cardBrand: "MASTERCARD",
      cardCategory: "CREDIT_CONSUMER",
      dataLevelProvided: "LEVEL_1",
      hoursToCapture: 72, // 3 days delay (>48h)
    };

    const result = interchangeMarginAnalyzer.analyzeTransaction(input);

    expect(result.downgradeReason).toBe("DOWNGRADE_EIRF_TIMING_BREACH");
    expect(result.recommendedRemediation).toContain("delayed by 72 hours");
    expect(result.excessLeakageCents).toBeGreaterThan(0);
  });

  it("validates Durbin Amendment regulated debit card pricing and flags overcharge", () => {
    const input: InterchangeAnalysisInput = {
      transactionId: "tx_debit_001",
      orderReference: "ORD-DEBIT-001",
      amountCents: 100000, // $1,000.00
      currency: "USD",
      actualFeeCents: 2930, // 2.9% + 30c charged instead of regulated debit cap
      cardBrand: "VISA",
      cardCategory: "DEBIT_REGULATED",
      dataLevelProvided: "LEVEL_1",
      hoursToCapture: 10,
    };

    const result = interchangeMarginAnalyzer.analyzeTransaction(input);

    expect(result.downgradeReason).toBe("DOWNGRADE_DURBIN_OVERCHARGE");
    expect(result.isRecoveryEligible).toBe(true);
    expect(result.optimalFeeCents).toBeLessThan(350); // Exact sum: 72c interchange + 142c assessment + 105c markup = $3.19
    expect(result.excessLeakageCents).toBeGreaterThan(2500); // Over $25.00 overcharge on $1,000 debit card!
  });

  it("aggregates portfolio margin analytics and projects annual recovery potential", () => {
    const transactions: InterchangeAnalysisInput[] = [
      {
        transactionId: "tx_1",
        orderReference: "ORD-1",
        amountCents: 1000000, // $10,000
        currency: "USD",
        actualFeeCents: 29000, // 2.90%
        cardBrand: "VISA",
        cardCategory: "CREDIT_COMMERCIAL_B2B",
        dataLevelProvided: "LEVEL_1",
        hoursToCapture: 12,
      },
      {
        transactionId: "tx_2",
        orderReference: "ORD-2",
        amountCents: 500000, // $5,000
        currency: "USD",
        actualFeeCents: 8500, // 1.70% optimal consumer credit
        cardBrand: "VISA",
        cardCategory: "CREDIT_CONSUMER",
        dataLevelProvided: "LEVEL_1",
        hoursToCapture: 10,
      },
    ];

    const report = interchangeMarginAnalyzer.analyzePortfolioMargin(transactions);

    expect(report.totalTransactionsAnalyzed).toBe(2);
    expect(report.totalGrossVolumeCents).toBe(1500000);
    expect(report.totalRecoverableLeakageCents).toBeGreaterThan(0);
    expect(report.projectedAnnualRecoveryCents).toBe(report.totalRecoverableLeakageCents * 52);
    expect(report.downgradeCounts.DOWNGRADE_MISSING_LEVEL_3).toBe(1);
    expect(report.flaggedTransactions.length).toBe(1);
  });
});
