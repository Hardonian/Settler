import { createClient } from "tigerbeetle-node";
import { TigerBeetleClusterDriver, parseTigerBeetleAddresses } from "../tigerbeetle-driver";
import { LedgerConnectionError } from "../../../domain/LedgerError";

jest.mock("tigerbeetle-node", () => ({
  createClient: jest.fn(),
}));

describe("TigerBeetleClusterDriver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parseTigerBeetleAddresses", () => {
    it("parses comma-separated string addresses", () => {
      const addresses = parseTigerBeetleAddresses("10.0.0.1:3001, 10.0.0.2:3002 ,10.0.0.3:3003");
      expect(addresses).toEqual(["10.0.0.1:3001", "10.0.0.2:3002", "10.0.0.3:3003"]);
    });

    it("parses array of addresses with embedded commas", () => {
      const addresses = parseTigerBeetleAddresses([
        "10.0.0.1:3001",
        "10.0.0.2:3002, 10.0.0.3:3003",
      ]);
      expect(addresses).toEqual(["10.0.0.1:3001", "10.0.0.2:3002", "10.0.0.3:3003"]);
    });

    it("defaults to 127.0.0.1:4300 when empty", () => {
      const addresses = parseTigerBeetleAddresses("");
      expect(addresses).toEqual(["127.0.0.1:4300"]);
    });
  });

  describe("resilience and retry behavior", () => {
    it("connects with configured cluster ID and replicas", async () => {
      const mockClient = { destroy: jest.fn() };
      jest.mocked(createClient).mockResolvedValue(mockClient as never);

      const driver = new TigerBeetleClusterDriver({
        clusterId: 42,
        addresses: ["127.0.0.1:3001", "127.0.0.1:3002"],
      });

      const client = await driver.getClient();
      expect(client).toBe(mockClient);
      expect(createClient).toHaveBeenCalledWith({
        cluster_id: 42n,
        replica_addresses: ["127.0.0.1:3001", "127.0.0.1:3002"],
      });
      expect(driver.isConnected()).toBe(true);

      await driver.close();
      expect(mockClient.destroy).toHaveBeenCalled();
      expect(driver.isConnected()).toBe(false);
    });

    it("retries on transient network errors with exponential backoff", async () => {
      const mockClient = { destroy: jest.fn() };
      jest.mocked(createClient).mockResolvedValue(mockClient as never);

      const driver = new TigerBeetleClusterDriver({
        clusterId: 0,
        addresses: ["127.0.0.1:3001"],
        maxRetries: 2,
        initialBackoffMs: 10,
        maxBackoffMs: 50,
      });

      let attempts = 0;
      const result = await driver.executeWithRetry(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error("read ECONNREFUSED");
        }
        return "success";
      });

      expect(result).toBe("success");
      expect(attempts).toBe(2);
      expect(driver.getFailoverCount()).toBe(1);
    });

    it("throws LedgerConnectionError when max retries exceeded", async () => {
      const mockClient = { destroy: jest.fn() };
      jest.mocked(createClient).mockResolvedValue(mockClient as never);

      const driver = new TigerBeetleClusterDriver({
        clusterId: 0,
        addresses: ["127.0.0.1:3001"],
        maxRetries: 1,
        initialBackoffMs: 5,
        maxBackoffMs: 10,
      });

      await expect(
        driver.executeWithRetry(async () => {
          throw new Error("read ECONNREFUSED");
        })
      ).rejects.toThrow(LedgerConnectionError);
    });
  });
});
