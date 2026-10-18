import {
  erpJournalSynthesizer,
  DEFAULT_ERP_CHART_OF_ACCOUNTS,
} from "../erp-journal-synthesizer.js";

describe("Autonomous ERP Journal Entry Synthesizer", () => {
  const tenantId = "00000000-0000-4000-8000-000000000001";

  it("synthesizes a perfectly balanced GAAP compound journal entry from a triangular settlement", () => {
    const journal = erpJournalSynthesizer.synthesizeFromTriangularSettlement({
      tenantId,
      settlement: {
        orderReference: "ORD-2026-901",
        orderAmountCents: 10000n, // $100.00
        capturedAmountCents: 10000n,
        feeDeductedCents: 320n, // $3.20 processor fee
        netSettledCents: 9680n, // $96.80 bank deposit
        currency: "USD",
        settledAt: "2026-10-18T12:00:00Z",
      },
      targetSystem: "NETSUITE",
    });

    expect(journal.isBalanced).toBe(true);
    expect(journal.totalDebitCents).toBe(10000n);
    expect(journal.totalCreditCents).toBe(10000n);
    expect(journal.lines).toHaveLength(3); // Cash in transit (debit), Merchant fee (debit), AR (credit)

    // Check individual line items
    const cashLine = journal.lines.find(
      (l) => l.accountCode === DEFAULT_ERP_CHART_OF_ACCOUNTS.cashClearingAccountCode
    );
    expect(cashLine).toBeDefined();
    expect(cashLine?.debitCents).toBe(9680n);
    expect(cashLine?.creditCents).toBe(0n);

    const feeLine = journal.lines.find(
      (l) => l.accountCode === DEFAULT_ERP_CHART_OF_ACCOUNTS.merchantFeesExpenseAccountCode
    );
    expect(feeLine).toBeDefined();
    expect(feeLine?.debitCents).toBe(320n);
    expect(feeLine?.creditCents).toBe(0n);

    const arLine = journal.lines.find(
      (l) => l.accountCode === DEFAULT_ERP_CHART_OF_ACCOUNTS.accountsReceivableAccountCode
    );
    expect(arLine).toBeDefined();
    expect(arLine?.debitCents).toBe(0n);
    expect(arLine?.creditCents).toBe(10000n);

    // Cryptographic proof binding
    expect(journal.merkleProofHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(journal.memo).toContain(journal.merkleProofHash);
  });

  it("handles fee discrepancy variances by routing delta to dispute receivable account while maintaining zero-sum", () => {
    // Scenario: Order $100.00, Fee $3.20 expected, but actual deposit was only $95.00 ($1.80 unexpected variance)
    const journal = erpJournalSynthesizer.synthesizeFromTriangularSettlement({
      tenantId,
      settlement: {
        orderReference: "ORD-VARIANCE-99",
        orderAmountCents: 10000n,
        capturedAmountCents: 10000n,
        feeDeductedCents: 320n,
        netSettledCents: 9500n, // $1.80 under-deposit
        currency: "USD",
      },
    });

    expect(journal.isBalanced).toBe(true);
    expect(journal.totalDebitCents).toBe(10000n);
    expect(journal.totalCreditCents).toBe(10000n);

    const varianceLine = journal.lines.find(
      (l) => l.accountCode === DEFAULT_ERP_CHART_OF_ACCOUNTS.feeVarianceReceivableAccountCode
    );
    expect(varianceLine).toBeDefined();
    expect(varianceLine?.debitCents).toBe(180n); // $1.80 routed to dispute receivable
  });

  it("synthesizes batch settlement journal entries across multiple transactions", () => {
    const batch = erpJournalSynthesizer.synthesizeBatchJournal({
      tenantId,
      batchReference: "BATCH-SWEEP-2026-W42",
      settlements: [
        {
          orderReference: "ORD-1",
          orderAmountCents: 15000,
          capturedAmountCents: 15000,
          feeDeductedCents: 450,
          netSettledCents: 14550,
          currency: "USD",
        },
        {
          orderReference: "ORD-2",
          orderAmountCents: 25000,
          capturedAmountCents: 25000,
          feeDeductedCents: 750,
          netSettledCents: 24250,
          currency: "USD",
        },
      ],
      postingDate: "2026-10-18",
    });

    expect(batch.isBalanced).toBe(true);
    expect(batch.totalDebitCents).toBe(40000n); // $400.00 total
    expect(batch.totalCreditCents).toBe(40000n);
    expect(batch.sourceReferences).toEqual(["ORD-1", "ORD-2"]);
  });

  it("exports valid NetSuite SuiteTalk REST payloads", () => {
    const journal = erpJournalSynthesizer.synthesizeFromTriangularSettlement({
      tenantId,
      settlement: {
        orderReference: "ORD-NETSUITE-01",
        orderAmountCents: 5000n,
        capturedAmountCents: 5000n,
        feeDeductedCents: 175n,
        netSettledCents: 4825n,
        currency: "USD",
      },
    });

    const nsPayload = erpJournalSynthesizer.exportToNetSuite(journal, { subsidiaryId: "3" });

    expect(nsPayload.subsidiary.id).toBe("3");
    expect(nsPayload.tranDate).toBe(journal.postingDate);
    expect(nsPayload.line.items.length).toBe(3);

    const totalDebit = nsPayload.line.items.reduce((s, i) => s + (i.debit || 0), 0);
    const totalCredit = nsPayload.line.items.reduce((s, i) => s + (i.credit || 0), 0);
    expect(Math.abs(totalDebit - totalCredit)).toBeLessThan(0.001);
  });

  it("exports valid SAP S/4HANA OData payloads with proper Soll (S) and Haben (H) codes", () => {
    const journal = erpJournalSynthesizer.synthesizeFromTriangularSettlement({
      tenantId,
      settlement: {
        orderReference: "ORD-SAP-01",
        orderAmountCents: 20000n,
        capturedAmountCents: 20000n,
        feeDeductedCents: 600n,
        netSettledCents: 19400n,
        currency: "EUR",
      },
      targetSystem: "SAP_S4HANA",
    });

    const sapPayload = erpJournalSynthesizer.exportToSapS4Hana(journal, { companyCode: "DE01" });

    expect(sapPayload.CompanyCode).toBe("DE01");
    expect(sapPayload.AccountingDocumentType).toBe("SA");
    expect(sapPayload.to_Item.results.length).toBe(3);

    const debits = sapPayload.to_Item.results
      .filter((i) => i.DebitCreditCode === "S")
      .reduce((s, i) => s + i.AmountInCompanyCodeCurrency, 0);

    const credits = sapPayload.to_Item.results
      .filter((i) => i.DebitCreditCode === "H")
      .reduce((s, i) => s + i.AmountInCompanyCodeCurrency, 0);

    expect(debits).toBe(200); // 194.00 + 6.00 = 200.00
    expect(credits).toBe(200); // 200.00
  });
});
