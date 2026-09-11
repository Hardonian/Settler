import { SapS4HanaConnector, SapJournalHeader } from "../sap-s4hana";

describe("SapS4HanaConnector", () => {
  const connector = new SapS4HanaConnector();

  const validJournal: SapJournalHeader = {
    tenantId: "tenant_enterprise_us",
    companyCode: "1000",
    documentDate: "2026-09-11",
    postingDate: "2026-09-11",
    documentType: "SA",
    documentHeaderText: "Stripe-PayPal Bilateral Settlement Batch #902",
    referenceDocumentNumber: "REF-20260911-001",
    items: [
      {
        referenceDocumentItem: "001",
        glAccount: "113100", // Depository Clearing Bank
        amountInTransactionCurrency: 450000, // $4,500.00
        currency: "USD",
        debitCreditCode: "S", // Debit
        itemText: "Net Merchant Settlement Clearing",
      },
      {
        referenceDocumentItem: "002",
        glAccount: "610200", // Processor Interchange Expense
        amountInTransactionCurrency: 12500, // $125.00
        currency: "USD",
        debitCreditCode: "S", // Debit
        itemText: "Contracted Processing & Scheme Fees",
      },
      {
        referenceDocumentItem: "003",
        glAccount: "120000", // Accounts Receivable / Unsettled Ingestion
        amountInTransactionCurrency: 462500, // $4,625.00
        currency: "USD",
        debitCreditCode: "H", // Credit
        itemText: "Gross Transaction Volume Cleared",
      },
    ],
  };

  it("validates balanced double-entry journals with zero delta", () => {
    const res = connector.validateJournal(validJournal);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it("rejects unbalanced journals where debits != credits", () => {
    const unbalanced: SapJournalHeader = {
      ...validJournal,
      items: [
        { ...validJournal.items[0]!, amountInTransactionCurrency: 400000 },
        validJournal.items[1]!,
        validJournal.items[2]!,
      ],
    };

    const res = connector.validateJournal(unbalanced);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("SAP Double-Entry Imbalance");
  });

  it("rejects non-integer cents amounts", () => {
    const nonInteger: SapJournalHeader = {
      ...validJournal,
      items: [
        { ...validJournal.items[0]!, amountInTransactionCurrency: 4500.5 },
        validJournal.items[1]!,
        validJournal.items[2]!,
      ],
    };

    const res = connector.validateJournal(nonInteger);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Invalid integer cents amount");
  });

  it("rejects missing tenantId guardrail", () => {
    const missingTenant = { ...validJournal, tenantId: "" };
    const res = connector.validateJournal(missingTenant as SapJournalHeader);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("TenantId invariant violation");
  });

  it("generates SAP-compliant OData payload", () => {
    const payload = connector.generateSapPayload(validJournal) as any;
    expect(payload.JournalEntry).toBeDefined();
    expect(payload.JournalEntry.CompanyCode).toBe("1000");
    expect(payload.JournalEntry.to_Item).toHaveLength(3);
    expect(payload.JournalEntry.to_Item[0].AmountInTransactionCurrency).toBe("4500.00");
  });

  it("transmits journal and generates SHA-256 Merkle proof root", async () => {
    const result = await connector.transmitJournal(validJournal);
    expect(result.success).toBe(true);
    expect(result.sapDocumentNumber).toMatch(/^10[A-Z0-9]{8}$/);
    expect(result.totalDebitsCents).toBe(462500);
    expect(result.totalCreditsCents).toBe(462500);
    expect(result.merkleRootSha256).toHaveLength(64);
  });
});
