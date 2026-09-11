import {
  generateRenegotiationDossier,
  type MonthlyProcessingAggregate,
  type ProposedFeeSchedule,
} from "./processor-renegotiation.js";

describe("Processor Contract Renegotiation Intelligence Dossier", () => {
  const history: MonthlyProcessingAggregate[] = [
    {
      monthYear: "2026-01",
      processorName: "Stripe",
      grossVolumeCents: 50000000n, // $500,000.00
      totalTransactionsCount: 10000,
      totalFeesPaidCents: 1550000n, // $15,500.00 (3.10%)
      cardMix: {
        regulatedDebitCount: 4000,
        regulatedDebitVolumeCents: 20000000n, // $200k (40% debit)
        standardCreditCount: 5000,
        standardCreditVolumeCents: 25000000n,
        corporateCommercialCount: 500,
        corporateCommercialVolumeCents: 3000000n,
        internationalCount: 500,
        internationalVolumeCents: 2000000n,
      },
    },
    {
      monthYear: "2026-02",
      processorName: "Stripe",
      grossVolumeCents: 60000000n, // $600,000.00
      totalTransactionsCount: 12000,
      totalFeesPaidCents: 1980000n, // $19,800.00 (3.30% -> fee creep!)
      cardMix: {
        regulatedDebitCount: 4800,
        regulatedDebitVolumeCents: 24000000n, // $240k (40% debit)
        standardCreditCount: 6000,
        standardCreditVolumeCents: 30000000n,
        corporateCommercialCount: 600,
        corporateCommercialVolumeCents: 3600000n,
        internationalCount: 600,
        internationalVolumeCents: 2400000n,
      },
    },
  ];

  const proposedSchedules: ProposedFeeSchedule[] = [
    {
      name: "Interchange Plus 15 bps + 10c",
      pricingType: "INTERCHANGE_PLUS",
      percentageBps: 15,
      fixedPerTxCents: 10n,
    },
    {
      name: "Blended 2.2% + 15c",
      pricingType: "BLENDED_FLAT",
      percentageBps: 220,
      fixedPerTxCents: 15n,
    },
  ];

  it("identifies Durbin debit leverage, flags fee creep, and models cost savings", () => {
    const dossier = generateRenegotiationDossier(
      "tenant_merchant_corp",
      history,
      proposedSchedules
    );

    expect(dossier.processorName).toBe("Stripe");
    expect(dossier.totalHistoricalVolumeCents).toBe(110000000n); // $1,100,000.00
    expect(dossier.feeCreepTrajectoryBps).toBe(20); // 3.30% - 3.10% = +20 bps fee creep
    expect(dossier.cardMixBreakdown.regulatedDebitPct).toBe(40);

    expect(dossier.renegotiationLeveragePoints.length).toBeGreaterThanOrEqual(2);
    expect(dossier.renegotiationLeveragePoints.some((l) => l.includes("Durbin"))).toBe(true);
    expect(dossier.renegotiationLeveragePoints.some((l) => l.includes("fee creep"))).toBe(true);

    expect(dossier.proposedScheduleComparisons.length).toBe(2);
    expect(dossier.proposedScheduleComparisons[0]!.annualSavingsCents).toBeGreaterThan(0n);
    expect(dossier.dossierMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
  });
});
