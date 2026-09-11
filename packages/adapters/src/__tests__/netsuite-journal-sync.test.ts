import {
  NetSuiteJournalSyncEngine,
  NetSuiteJournalSyncRequest,
  NetSuiteTbaCredentials,
} from "../netsuite-journal-sync";

describe("NetSuite SuiteTalk ERP Journal Sync Connector (#54)", () => {
  const tenantId = "tenant_enterprise_netsuite";

  const credentials: NetSuiteTbaCredentials = {
    accountId: "1234567_SB1",
    consumerKey: "ns_consumer_key_mock",
    consumerSecret: "ns_consumer_secret_mock",
    tokenId: "ns_token_id_mock",
    tokenSecret: "ns_token_secret_mock",
  };

  const balancedRequest: NetSuiteJournalSyncRequest = {
    batchId: "batch_settlement_2026_09",
    tenantId,
    tranDate: "2026-09-10",
    memo: "Automated Settler Multi-Rail Settlement Batch Close",
    subsidiaryId: "1",
    currency: "USD",
    merkleRoot: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    lines: [
      {
        accountNumber: "10100", // Cash
        debitCents: 1250000, // $12,500.00
        creditCents: 0,
        memo: "Depository Bank Net Payout",
      },
      {
        accountNumber: "60500", // Processing Fees
        debitCents: 35000, // $350.00
        creditCents: 0,
        memo: "Stripe & Interchange Scheme Fees",
      },
      {
        accountNumber: "40100", // Revenue
        debitCents: 0,
        creditCents: 1285000, // $12,850.00
        memo: "Merchant Gross Sales",
      },
    ],
  };

  it("generates valid OAuth 1.0a TBA authorization header", () => {
    const header = NetSuiteJournalSyncEngine.generateTbaHeader(
      credentials,
      "POST",
      "https://1234567_SB1.suitetalk.api.netsuite.com/services/rest/record/v1/journalEntry",
      "fixed_nonce_12345",
      1757548800
    );

    expect(header).toContain('OAuth realm="1234567_SB1"');
    expect(header).toContain('oauth_consumer_key="ns_consumer_key_mock"');
    expect(header).toContain('oauth_signature_method="HMAC-SHA256"');
    expect(header).toContain('oauth_nonce="fixed_nonce_12345"');
    expect(header).toContain("oauth_signature=");
  });

  it("validates and formats a balanced double-entry batch for NetSuite GL", () => {
    const result = NetSuiteJournalSyncEngine.prepareSyncPayload(
      tenantId,
      balancedRequest,
      credentials,
      { dryRun: false }
    );

    expect(result.status).toBe("SYNCED");
    expect(result.tenantId).toBe(tenantId);
    expect(result.totalDebitsCents).toBe(1285000);
    expect(result.totalCreditsCents).toBe(1285000);
    expect(result.externalId).toBe("stlr_ns_7f83b1657ff1fc53b92dc18148a1d65d");
    expect(result.payloadDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(result.netSuiteInternalId).toBeDefined();
  });

  it("strictly rejects unbalanced journal entries before dispatch", () => {
    const unbalancedRequest: NetSuiteJournalSyncRequest = {
      ...balancedRequest,
      lines: [
        {
          accountNumber: "10100",
          debitCents: 100000,
          creditCents: 0,
          memo: "Cash",
        },
        {
          accountNumber: "40100",
          debitCents: 0,
          creditCents: 90000, // Missing $100
          memo: "Sales",
        },
      ],
    };

    expect(() => {
      NetSuiteJournalSyncEngine.prepareSyncPayload(tenantId, unbalancedRequest, credentials);
    }).toThrow(/Unbalanced journal entry/);
  });

  it("strictly enforces tenant boundaries and rejects cross-tenant sync", () => {
    expect(() => {
      NetSuiteJournalSyncEngine.prepareSyncPayload("tenant_other", balancedRequest, credentials);
    }).toThrow(/Tenant mismatch/);
  });
});
