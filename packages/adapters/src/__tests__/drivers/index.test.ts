import { getConnectorDriver, getAllConnectorMetadata, CONNECTOR_REGISTRY } from "../../drivers/index";

describe("Connector Drivers Registry", () => {
  describe("getConnectorDriver", () => {
    it("should return a driver for a valid connector ID in lowercase", () => {
      const driver = getConnectorDriver("plaid");
      expect(driver).toBeDefined();
      expect(driver?.metadata.id).toBe("plaid");
    });

    it("should return a driver for a valid connector ID with mixed case", () => {
      const driver = getConnectorDriver("pLaId");
      expect(driver).toBeDefined();
      expect(driver?.metadata.id).toBe("plaid");
    });

    it("should return null for an invalid connector ID", () => {
      const driver = getConnectorDriver("invalid-connector-id");
      expect(driver).toBeNull();
    });
  });

  describe("getAllConnectorMetadata", () => {
    it("should return metadata for all registered drivers", () => {
      const metadataList = getAllConnectorMetadata();
      const expectedLength = Object.keys(CONNECTOR_REGISTRY).length;

      expect(metadataList).toBeDefined();
      expect(metadataList.length).toBe(expectedLength);

      // Check if plaid is in the returned list
      const plaidMetadata = metadataList.find(m => m.id === "plaid");
      expect(plaidMetadata).toBeDefined();
      expect(plaidMetadata?.displayName).toBe("Plaid");
    });
  });
});
