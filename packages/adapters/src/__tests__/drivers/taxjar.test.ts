import { TaxJarDriver } from "../../drivers/taxjar";
import { ConnectorError } from "../../connector-driver";

describe("TaxJarDriver", () => {
  let driver: TaxJarDriver;
  const originalFetch = global.fetch;

  beforeEach(() => {
    driver = new TaxJarDriver();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  describe("testConnection", () => {
    it("should return success when credentials are valid", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await driver.testConnection({
        credentials: { api_key: "test_key" },
      });

      expect(result).toEqual({
        success: true,
        message: "Connection successful",
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.sandbox.taxjar.com/v2/categories",
        expect.objectContaining({
          headers: { Authorization: "Bearer test_key" },
        })
      );
    });

    it("should return failure when missing API key", async () => {
      const result = await driver.testConnection({
        credentials: {},
      });

      expect(result).toEqual({
        success: false,
        error: "Missing API key",
        message: "TaxJar API key is required",
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should return failure when API returns error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const result = await driver.testConnection({
        credentials: { api_key: "test_key" },
      });

      expect(result).toEqual({
        success: false,
        error: "Authentication failed",
        message: "Please check your TaxJar API key",
      });
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

      const result = await driver.testConnection({
        credentials: { api_key: "test_key" },
      });

      expect(result).toEqual({
        success: false,
        error: "Network Error",
        message: "Connection test failed: Network Error",
      });
    });
  });

  describe("sync", () => {
    it("should sync transactions and create tax estimates successfully", async () => {
      const mockResponse = {
        orders: [
          {
            transaction_id: "tx_123",
            transaction_date: "2023-01-01T00:00:00Z",
            amount: 100.0,
            amount_to_collect: 8.5,
            currency: "USD",
            rate: 0.085,
            to_state: "CA",
          },
          {
            transaction_id: "tx_456",
            transaction_date: "2023-01-02T00:00:00Z",
            amount: 50.0,
            amount_to_collect: 0,
            currency: "USD",
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await driver.sync({ api_key: "test_key" }, {});

      expect(result.counts.taxEstimates).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.taxEstimates).toHaveLength(1);
      expect(result.rawPayloads).toHaveLength(1);
      expect(result.rawPayloads![0].payload).toEqual(mockResponse);

      const estimate = result.taxEstimates![0];
      expect(estimate.externalId).toBe("tx_123");
      expect(estimate.amountCents).toBe(10000);
      expect(estimate.taxAmountCents).toBe(850);
      expect(estimate.jurisdiction).toBe("CA");
    });

    it("should handle sync when fetch throws an error", async () => {
      const networkError = new Error("Fetch failed");
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(driver.sync({ api_key: "test_key" }, {})).rejects.toThrow(
        new ConnectorError(
          "TaxJar sync failed: Fetch failed",
          "TAXJAR_SYNC_FAILED",
          "taxjar",
          networkError
        )
      );
    });

    it("should rethrow ConnectorErrors", async () => {
      const connectorError = new ConnectorError("Original Error", "ERR_CODE", "taxjar");
      (global.fetch as jest.Mock).mockRejectedValueOnce(connectorError);

      await expect(driver.sync({ api_key: "test_key" }, {})).rejects.toThrow(connectorError);
    });
  });
});
