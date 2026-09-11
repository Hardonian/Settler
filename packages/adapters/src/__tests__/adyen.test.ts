import { parseAdyenSettlementReport } from "../adyen";

describe("Adyen Settlement Detail Reporter Connector", () => {
  const sampleCsv = `
"Company Account","Merchant Account","Psp Reference","Merchant Reference","Payment Method","Creation Date","TimeZone","Type","Gross Credit (GC)","Gross Debit (GC)","Net Credit (NC)","Net Debit (ND)","Commission (NC)","Markup (NC)","Scheme Fees (NC)","Interchange (NC)","Currency"
"SettlerCorp","MerchantEU","8836123456789012","ORDER-7701","mc","2026-09-08 14:22:00","UTC","Settled","150.00","0.00","147.15","0.00","0.35","0.20","0.80","1.50","EUR"
"SettlerCorp","MerchantEU","8836123456789013","ORDER-7702","visa","2026-09-08 15:10:00","UTC","Refunded","0.00","50.00","0.00","50.35","0.35","0.00","0.00","0.00","EUR"
"SettlerCorp","MerchantEU","8836123456789014","DISPUTE-9901","visa","2026-09-08 16:00:00","UTC","Chargeback","0.00","100.00","0.00","115.00","15.00","0.00","0.00","0.00","EUR"
`.trim();

  it("fails fast if tenantId invariant is violated", () => {
    expect(() => parseAdyenSettlementReport("", sampleCsv)).toThrow(
      /Tenant context invariant violation/
    );
  });

  it("parses Adyen settlement records with exact integer cents and deconstructs interchange fees", () => {
    const batch = parseAdyenSettlementReport("tenant_acme_corp", sampleCsv);

    expect(batch.tenantId).toBe("tenant_acme_corp");
    expect(batch.merchantAccount).toBe("MerchantEU");
    expect(batch.records).toHaveLength(3);

    const [rec1, rec2, rec3] = batch.records;

    // Record 1: Settled 150.00 EUR
    expect(rec1!.pspReference).toBe("8836123456789012");
    expect(rec1!.type).toBe("Settled");
    expect(rec1!.grossCreditCents).toBe(15000);
    expect(rec1!.netCreditCents).toBe(14715);
    expect(rec1!.interchangeFeeCents).toBe(150);
    expect(rec1!.schemeFeeCents).toBe(80);
    expect(rec1!.markupCents).toBe(20);
    expect(rec1!.commissionCents).toBe(35);
    expect(rec1!.leafHash).toMatch(/^[a-f0-9]{64}$/);

    // Record 2: Refunded 50.00 EUR
    expect(rec2!.pspReference).toBe("8836123456789013");
    expect(rec2!.type).toBe("Refunded");
    expect(rec2!.grossDebitCents).toBe(5000);
    expect(rec2!.netDebitCents).toBe(5035);

    // Record 3: Chargeback 100.00 EUR + 15.00 EUR fee
    expect(rec3!.pspReference).toBe("8836123456789014");
    expect(rec3!.type).toBe("Chargeback");
    expect(rec3!.grossDebitCents).toBe(10000);
    expect(rec3!.netDebitCents).toBe(11500);

    // Batch totals in integer cents
    expect(batch.totalGrossCreditCents).toBe(15000);
    expect(batch.totalGrossDebitCents).toBe(15000); // 5000 + 10000
    expect(batch.totalInterchangeCents).toBe(150);
    expect(batch.totalSchemeFeeCents).toBe(80);
    expect(batch.batchMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
  });
});
