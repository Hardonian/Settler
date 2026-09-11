import {
  DoubleEntryImbalanceError,
  postDoubleEntryBatch,
  STANDARD_CHART_OF_ACCOUNTS,
  synthesizeBilateralSettlementJournal,
} from "./double-entry-posting-engine.js";

describe("Deterministic Double-Entry Posting Engine", () => {
  const TENANT_ID = "tenant_fintech_sovereign";

  it("finalizes balanced double-entry batch and generates RFC 6962 Merkle leaf hash", () => {
    // Balanced journal:
    // Debit: Operating Cash 9,700 cents
    // Debit: Processor Fee 300 cents
    // Credit: Merchant Payable 10,000 cents
    const result = postDoubleEntryBatch({
      batchId: "batch_settle_001",
      tenantId: TENANT_ID,
      sourceRail: "stripe",
      externalReference: "po_1P92837492",
      effectiveDate: "2026-09-10T12:00:00Z",
      lines: [
        {
          accountId: STANDARD_CHART_OF_ACCOUNTS.OPERATING_CASH!.id,
          accountType: STANDARD_CHART_OF_ACCOUNTS.OPERATING_CASH!.type,
          direction: "debit",
          amountCents: 9700n,
          currency: "USD",
          description: "Net bank deposit",
        },
        {
          accountId: STANDARD_CHART_OF_ACCOUNTS.PROCESSOR_FEE_EXPENSE!.id,
          accountType: STANDARD_CHART_OF_ACCOUNTS.PROCESSOR_FEE_EXPENSE!.type,
          direction: "debit",
          amountCents: 300n,
          currency: "USD",
          description: "Stripe 2.9% + 30c fee",
        },
        {
          accountId: STANDARD_CHART_OF_ACCOUNTS.MERCHANT_PAYABLE!.id,
          accountType: STANDARD_CHART_OF_ACCOUNTS.MERCHANT_PAYABLE!.type,
          direction: "credit",
          amountCents: 10000n,
          currency: "USD",
          description: "Gross checkout sales",
        },
      ],
    });

    expect(result.isZeroSumBalanced).toBe(true);
    expect(result.balanceDeltaCents).toBe(0n);
    expect(result.totalDebitCents).toBe(10000n);
    expect(result.totalCreditCents).toBe(10000n);
    expect(result.merkleLeafHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.tigerbeetleTransferIds.length).toBe(3);
  });

  it("strictly rejects imbalanced journal batch with DoubleEntryImbalanceError", () => {
    expect(() =>
      postDoubleEntryBatch({
        batchId: "batch_imbalanced_002",
        tenantId: TENANT_ID,
        sourceRail: "paypal",
        externalReference: "pay_bad_01",
        effectiveDate: "2026-09-10T12:00:00Z",
        lines: [
          {
            accountId: STANDARD_CHART_OF_ACCOUNTS.OPERATING_CASH!.id,
            accountType: STANDARD_CHART_OF_ACCOUNTS.OPERATING_CASH!.type,
            direction: "debit",
            amountCents: 5000n, // $50.00 debit
            currency: "USD",
            description: "Partial deposit",
          },
          {
            accountId: STANDARD_CHART_OF_ACCOUNTS.MERCHANT_PAYABLE!.id,
            accountType: STANDARD_CHART_OF_ACCOUNTS.MERCHANT_PAYABLE!.type,
            direction: "credit",
            amountCents: 4999n, // $49.99 credit (1 cent drift!)
            currency: "USD",
            description: "Sales total with 1-cent drift",
          },
        ],
      })
    ).toThrow(DoubleEntryImbalanceError);
  });

  it("synthesizes complex bilateral settlement journal with interchange, gateway fee, and dispute reserve", () => {
    const grossSalesCents = 1000000n; // $10,000.00
    const interchangeFeeCents = 18000n; // $180.00 (1.8%)
    const processorCutCents = 4000n; // $40.00 (0.4%)
    const disputeReserveHoldCents = 50000n; // $500.00 (5% reserve hold)

    const journal = synthesizeBilateralSettlementJournal({
      batchId: "batch_bilateral_003",
      tenantId: TENANT_ID,
      rail: "stripe",
      grossSalesCents,
      interchangeFeeCents,
      processorCutCents,
      disputeReserveHoldCents,
      currency: "USD",
      externalReference: "payout_stripe_82937419",
    });

    expect(journal.isZeroSumBalanced).toBe(true);
    expect(journal.totalDebitCents).toBe(grossSalesCents);
    expect(journal.totalCreditCents).toBe(grossSalesCents);

    // Verify operating cash received = 10,000 - 180 - 40 - 500 = $9,280.00 (928,000 cents)
    const cashLine = journal.lines.find(
      (l) => l.accountId === STANDARD_CHART_OF_ACCOUNTS.OPERATING_CASH!.id
    );
    expect(cashLine?.amountCents).toBe(928000n);
    expect(journal.merkleLeafHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
