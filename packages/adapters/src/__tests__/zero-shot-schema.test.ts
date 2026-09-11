import { ZeroShotSchemaDiscovery } from "../zero-shot-schema";

describe("ZeroShotSchemaDiscovery", () => {
  const engine = new ZeroShotSchemaDiscovery();

  it("discovers comma-separated standard processor CSV format", () => {
    const csv = `Transaction_Reference,Created_At,Gross_Amount,Currency,Processing_Fee,Merchant_Descriptor
tx_8819401,2026-09-10T14:22:00Z,1250.00,USD,36.25,ACME Corp SaaS Monthly
tx_8819402,2026-09-10T14:25:30Z,420.50,USD,12.20,Beta Cloud Hosting
tx_8819403,2026-09-10T14:31:12Z,99.00,USD,2.87,Gamma Dev Tools`;

    const schema = engine.discover(csv);

    expect(schema.delimiter).toBe(",");
    expect(schema.hasHeader).toBe(true);
    expect(schema.detectedCurrency).toBe("USD");
    expect(schema.suggestedMapping.transactionIdIndex).toBe(0);
    expect(schema.suggestedMapping.dateIndex).toBe(1);
    expect(schema.suggestedMapping.amountIndex).toBe(2);
    expect(schema.suggestedMapping.currencyIndex).toBe(3);
    expect(schema.suggestedMapping.feeIndex).toBe(4);
    expect(schema.suggestedMapping.descriptorIndex).toBe(5);
  });

  it("discovers tab-separated unformatted bank export with European headers", () => {
    const tsv = `Valuta\tBuchungstext\tBetrag\tWaehrung\tReferenz-ID
2026-09-08\tSEPA-Ueberweisung Firma GmbH\t5400.00\tEUR\tDE8920194819
2026-09-09\tKartenzahlung Terminal 01\t128.90\tEUR\tDE8920194820`;

    const schema = engine.discover(tsv);

    expect(schema.delimiter).toBe("\t");
    expect(schema.hasHeader).toBe(true);
    expect(schema.detectedCurrency).toBe("EUR");
    expect(schema.suggestedMapping.dateIndex).toBe(0);
    expect(schema.suggestedMapping.amountIndex).toBe(2);
    expect(schema.suggestedMapping.transactionIdIndex).toBe(4);
  });

  it("infers column types when file has no header row", () => {
    const rawNoHeader = `2026-09-01,9800.00,USD,PO_991823,Stripe Payout Batch
2026-09-02,14200.00,USD,PO_991824,Stripe Payout Batch`;

    const schema = engine.discover(rawNoHeader);
    expect(schema.hasHeader).toBe(false);
    expect(schema.suggestedMapping.dateIndex).toBe(0);
    expect(schema.suggestedMapping.amountIndex).toBe(1);
    expect(schema.suggestedMapping.currencyIndex).toBe(2);
    expect(schema.suggestedMapping.transactionIdIndex).toBe(3);
  });
});
