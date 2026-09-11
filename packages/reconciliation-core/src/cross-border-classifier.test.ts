import { classifyCrossBorderSurcharge, CrossBorderTransaction } from "./cross-border-classifier";

describe("Cross-Border Card Scheme Surcharge Classifier", () => {
  const tenantId = "tenant_cross_border";

  it("fails fast if tenantId is missing or mismatched", () => {
    const tx: CrossBorderTransaction = {
      id: "tx-1",
      tenantId: "tenant_diff",
      cardScheme: "VISA",
      merchantCountry: "US",
      cardholderCountry: "GB",
      settlementCurrency: "USD",
      transactionCurrency: "USD",
      amountCents: 10000,
      actualProcessorSurchargeCents: 100,
    };

    expect(() => classifyCrossBorderSurcharge("tenant_A", tx)).toThrow(
      /Cross-tenant access violation/
    );
  });

  it("identifies domestic transactions without surcharge assessment", () => {
    const tx: CrossBorderTransaction = {
      id: "tx-domestic",
      tenantId,
      cardScheme: "VISA",
      merchantCountry: "US",
      cardholderCountry: "US",
      settlementCurrency: "USD",
      transactionCurrency: "USD",
      amountCents: 10000, // $100.00
      actualProcessorSurchargeCents: 0,
    };

    const res = classifyCrossBorderSurcharge(tenantId, tx);
    expect(res.isCrossBorder).toBe(false);
    expect(res.expectedSurchargeCents).toBe(0);
    expect(res.isMarkupCompliant).toBe(true);
  });

  it("audits single-currency cross-border assessment (1.00% / 100 bps)", () => {
    const tx: CrossBorderTransaction = {
      id: "tx-xb-single",
      tenantId,
      cardScheme: "VISA",
      merchantCountry: "US",
      cardholderCountry: "GB",
      settlementCurrency: "USD",
      transactionCurrency: "USD",
      amountCents: 20000, // $200.00
      actualProcessorSurchargeCents: 200, // $2.00 = exactly 100 bps
    };

    const res = classifyCrossBorderSurcharge(tenantId, tx);
    expect(res.isCrossBorder).toBe(true);
    expect(res.isMultiCurrency).toBe(false);
    expect(res.contractualAssessmentBps).toBe(100);
    expect(res.expectedSurchargeCents).toBe(200);
    expect(res.varianceCents).toBe(0);
    expect(res.isMarkupCompliant).toBe(true);
  });

  it("audits multi-currency cross-border assessment (1.40% / 140 bps) and flags predatory markup", () => {
    const tx: CrossBorderTransaction = {
      id: "tx-xb-multi",
      tenantId,
      cardScheme: "MASTERCARD",
      merchantCountry: "US",
      cardholderCountry: "FR",
      settlementCurrency: "USD",
      transactionCurrency: "EUR",
      amountCents: 10000, // $100.00
      actualProcessorSurchargeCents: 250, // $2.50 charged (contractual is $1.40) -> 110 bps markup!
    };

    const res = classifyCrossBorderSurcharge(tenantId, tx);
    expect(res.isCrossBorder).toBe(true);
    expect(res.isMultiCurrency).toBe(true);
    expect(res.contractualAssessmentBps).toBe(140);
    expect(res.expectedSurchargeCents).toBe(140);
    expect(res.varianceCents).toBe(110);
    expect(res.isMarkupCompliant).toBe(false); // Surcharge leakage detected
  });
});
