import { getConnectorDriver, getAllConnectorMetadata, CONNECTOR_REGISTRY } from "../drivers/index";
import { PlaidDriver } from "../drivers/plaid";

describe("Drivers Registry", () => {
  describe("getConnectorDriver", () => {
    it("should return a driver instance for a valid connector ID", () => {
      const driver = getConnectorDriver("plaid");
      expect(driver).toBeInstanceOf(PlaidDriver);
      expect(driver?.metadata.id).toBe("plaid");
    });

    it("should be case-insensitive", () => {
      const lowerDriver = getConnectorDriver("plaid");
      const upperDriver = getConnectorDriver("PLAID");
      const mixedDriver = getConnectorDriver("PlAiD");

      expect(lowerDriver).toBeInstanceOf(PlaidDriver);
      expect(upperDriver).toBeInstanceOf(PlaidDriver);
      expect(mixedDriver).toBeInstanceOf(PlaidDriver);
    });

    it("should return null for an invalid connector ID", () => {
      const driver = getConnectorDriver("invalid-connector-id");
      expect(driver).toBeNull();
    });
  });

  describe("getAllConnectorMetadata", () => {
    it("should return metadata for all registered connectors", () => {
      const allMetadata = getAllConnectorMetadata();
      const registrySize = Object.keys(CONNECTOR_REGISTRY).length;

      expect(allMetadata).toBeInstanceOf(Array);
      expect(allMetadata.length).toBe(registrySize);
      expect(registrySize).toBeGreaterThan(0);

      // Verify structure of a metadata item
      const sampleMetadata = allMetadata[0];
      expect(sampleMetadata).toHaveProperty("id");
      expect(sampleMetadata).toHaveProperty("displayName");
      expect(sampleMetadata).toHaveProperty("category");
      expect(sampleMetadata).toHaveProperty("authType");
    });
  });
});
