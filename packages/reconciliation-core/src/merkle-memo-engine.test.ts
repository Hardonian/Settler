import { synthesizeDiscrepancyMemo, MerkleDiscrepancyContext } from "./merkle-memo-engine";

describe("Explainable Merkle Discrepancy Memo Engine (XAI)", () => {
  const tenantId = "tenant_audit_xai";

  it("fails fast if tenantId is missing", () => {
    expect(() =>
      synthesizeDiscrepancyMemo({
        tenantId: "",
        expectedStateRoot: "abc",
        actualStateRoot: "def",
        transactionId: "tx-1",
        rail: "STRIPE",
        expectedAmountCents: 1000,
        actualAmountCents: 900,
        expectedCurrency: "USD",
        actualCurrency: "USD",
        discrepancyType: "AMOUNT_MISMATCH",
      })
    ).toThrow(/Tenant context invariant violation/);
  });

  it("synthesizes an explainable memo with citations and corrective journal for amount mismatch", () => {
    const ctx: MerkleDiscrepancyContext = {
      tenantId,
      expectedStateRoot: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      actualStateRoot: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
      transactionId: "ch_stripe_998811",
      rail: "STRIPE",
      expectedAmountCents: 25000, // $250.00
      actualAmountCents: 24500, // $245.00 ($5.00 missing)
      expectedCurrency: "USD",
      actualCurrency: "USD",
      discrepancyType: "AMOUNT_MISMATCH",
    };

    const memo = synthesizeDiscrepancyMemo(ctx);

    expect(memo.tenantId).toBe(tenantId);
    expect(memo.severity).toBe("HIGH");
    expect(memo.summary).toContain("$5.00");
    expect(memo.detailedAnalysis).toContain("ch_stripe_998811");
    expect(memo.regulatoryStandardCitation).toContain("ASC-606");
    expect(memo.correctiveAction.amountCents).toBe(500);
    expect(memo.correctiveAction.debitAccount).toBe("1105-PROCESSOR-CLEARING-ADJUSTMENT");
    expect(memo.correctiveAction.creditAccount).toBe("5050-RECONCILIATION-VARIANCE-EXPENSE");
    expect(memo.merkleProofAttestation.memoHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("synthesizes a clawback receivable journal for processor fee creep", () => {
    const ctx: MerkleDiscrepancyContext = {
      tenantId,
      expectedStateRoot: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      actualStateRoot: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
      transactionId: "pp_capture_443322",
      rail: "PAYPAL",
      expectedAmountCents: 10000,
      actualAmountCents: 9850, // 150 cents fee creep
      expectedCurrency: "USD",
      actualCurrency: "USD",
      discrepancyType: "FEE_SURCHARGE_CREEP",
    };

    const memo = synthesizeDiscrepancyMemo(ctx);
    expect(memo.regulatoryStandardCitation).toContain("Durbin Amendment");
    expect(memo.correctiveAction.debitAccount).toBe("1350-PROCESSOR-CLAWBACK-RECEIVABLE");
    expect(memo.correctiveAction.creditAccount).toBe("5010-PAYMENT-PROCESSING-FEES");
    expect(memo.correctiveAction.amountCents).toBe(150);
  });
});
