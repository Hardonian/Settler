import { getConnectorDriver, getAllConnectorMetadata, CONNECTOR_REGISTRY } from "../drivers/index";

describe("drivers/index.ts", () => {
  describe("getConnectorDriver", () => {
    it("should return the connector driver for a valid ID", () => {
      const driver = getConnectorDriver("plaid");
      expect(driver).not.toBeNull();
      expect(driver?.metadata.id).toBe("plaid");
    });

    it("should handle case-insensitive connector IDs", () => {
      const driver = getConnectorDriver("PLAID");
      expect(driver).not.toBeNull();
      expect(driver?.metadata.id).toBe("plaid");
    });

    it("should return null for an invalid ID", () => {
      const driver = getConnectorDriver("invalid-connector-id");
      expect(driver).toBeNull();
    });
  });

  describe("getAllConnectorMetadata", () => {
    it("should return metadata for all registered connectors", () => {
      const metadata = getAllConnectorMetadata();
      const registeredIds = Object.keys(CONNECTOR_REGISTRY);

      expect(metadata).toHaveLength(registeredIds.length);
      expect(metadata.map((m) => m.id)).toEqual(expect.arrayContaining(registeredIds));
    });
  });
});
