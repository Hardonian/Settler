import { getAllConnectorMetadata, getConnectorDriver, CONNECTOR_REGISTRY } from "../drivers/index";

describe("Drivers Index", () => {
  describe("getConnectorDriver", () => {
    it("should return a driver for a valid connector ID", () => {
      const driver = getConnectorDriver("plaid");
      expect(driver).not.toBeNull();
      expect(driver?.metadata.id).toBe("plaid");
    });

    it("should handle case-insensitive connector IDs", () => {
      const driver = getConnectorDriver("pLaiD");
      expect(driver).not.toBeNull();
      expect(driver?.metadata.id).toBe("plaid");
    });

    it("should return null for an invalid connector ID", () => {
      const driver = getConnectorDriver("invalid-connector-id");
      expect(driver).toBeNull();
    });
  });

  describe("getAllConnectorMetadata", () => {
    it("should return an array of metadata for all registered drivers", () => {
      const metadata = getAllConnectorMetadata();

      const expectedCount = Object.keys(CONNECTOR_REGISTRY).length;
      expect(metadata).toHaveLength(expectedCount);

      // Check that it returned valid metadata objects
      expect(metadata[0]).toHaveProperty("id");
      expect(metadata[0]).toHaveProperty("displayName");
      expect(metadata[0]).toHaveProperty("category");

      // Verify all registered IDs are present in the returned metadata
      const registeredIds = Object.keys(CONNECTOR_REGISTRY);
      const returnedIds = metadata.map((m) => m.id);

      registeredIds.forEach((id) => {
        expect(returnedIds).toContain(id);
      });
    });
  });
});
