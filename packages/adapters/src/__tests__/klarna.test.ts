import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { KlarnaDriver } from "../drivers/klarna";
import { ConnectorError } from "../connector-driver";

describe("KlarnaDriver", () => {
  let driver: KlarnaDriver;
  const originalFetch = global.fetch;

  beforeEach(() => {
    driver = new KlarnaDriver();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("metadata", () => {
    it("has valid BNPL connector metadata", () => {
      expect(driver.metadata.id).toBe("klarna");
      expect(driver.metadata.category).toBe("payment_processor");
      expect(driver.metadata.authType).toBe("api_key");
      expect(driver.metadata.supportsWebhooks).toBe(true);
      expect(driver.metadata.supportsPolling).toBe(true);
      expect(driver.metadata.requiredConfig).toContain("api_username");
      expect(driver.metadata.requiredConfig).toContain("api_password");
    });
  });

  describe("testConnection", () => {
    it("fails early if credentials are missing", async () => {
      const result = await driver.testConnection({ credentials: {} });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing Klarna API credentials");
    });

    it("succeeds when Klarna settlements API responds 200", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ payouts: [] }),
        } as unknown as Response)
      ) as unknown as typeof fetch;

      const result = await driver.testConnection({
        credentials: {
          api_username: "test_merchant_user",
          api_password: "test_merchant_pwd",
          environment: "playground",
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Successfully connected to Klarna");
    });

    it("returns friendly error on 401 Unauthorized", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as unknown as Response)
      ) as unknown as typeof fetch;

      const result = await driver.testConnection({
        credentials: {
          api_username: "wrong_user",
          api_password: "wrong_password",
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid Klarna API username or password");
    });
  });

  describe("sync", () => {
    it("normalizes payouts and synthesizes fee transactions accurately", async () => {
      const mockPayouts = [
        {
          payment_reference: "KL-PAYOUT-9001",
          payout_date: "2026-11-04T12:00:00Z",
          currency: "USD",
          totals: {
            gross_amount: 100000, // $1,000.00
            commission_amount: 2500, // $25.00
            fee_amount: 500, // $5.00
            net_amount: 97000, // $970.00
            repay_amount: 0,
            sale_amount: 100000,
            tax_amount: 0,
          },
        },
      ];

      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ payouts: mockPayouts }),
        } as unknown as Response)
      ) as unknown as typeof fetch;

      const syncResult = await driver.sync({
        api_username: "user",
        api_password: "password",
      });

      expect(syncResult.counts.payouts).toBe(1);
      expect(syncResult.counts.transactions).toBe(1);

      const payout = syncResult.payouts?.[0];
      expect(payout?.externalId).toBe("KL-PAYOUT-9001");
      expect(payout?.amountCents).toBe(97000);
      expect(payout?.feeCents).toBe(3000);
      expect(payout?.currency).toBe("USD");
      expect(payout?.status).toBe("paid");

      const feeTx = syncResult.transactions?.[0];
      expect(feeTx?.transactionType).toBe("fee");
      expect(feeTx?.amountCents).toBe(3000);
      expect(feeTx?.referenceId).toBe("KL-PAYOUT-9001");
    });

    it("throws ConnectorError on network failure", async () => {
      global.fetch = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject(new Error("Connection refused"))
        ) as unknown as typeof fetch;

      await expect(
        driver.sync({
          api_username: "user",
          api_password: "password",
        })
      ).rejects.toThrow(ConnectorError);
    });
  });

  describe("normalizeTransactionRecord", () => {
    it("normalizes SALE transaction correctly", () => {
      const tx = driver.normalizeTransactionRecord({
        capture_id: "cap_123",
        order_id: "ord_456",
        payment_reference: "KL-PAYOUT-1",
        type: "SALE",
        amount: 4500,
        fee_amount: 150,
        currency: "USD",
        transaction_time: "2026-11-04T10:00:00Z",
      });

      expect(tx.externalId).toBe("cap_123");
      expect(tx.transactionType).toBe("credit");
      expect(tx.amountCents).toBe(4500);
      expect(tx.referenceId).toBe("ord_456");
      expect(tx.providerMetadata?.["fee_cents"]).toBe(150);
    });

    it("normalizes REFUND transaction as refund type", () => {
      const tx = driver.normalizeTransactionRecord({
        order_id: "ord_789",
        payment_reference: "KL-PAYOUT-2",
        type: "REFUND",
        amount: 2000,
        currency: "USD",
        transaction_time: "2026-11-04T11:00:00Z",
      });

      expect(tx.transactionType).toBe("refund");
      expect(tx.amountCents).toBe(2000);
    });
  });
});
