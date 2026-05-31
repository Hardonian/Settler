import { getConnectorDriver, getAllConnectorMetadata, CONNECTOR_REGISTRY } from "../drivers/index";
import { PlaidDriver } from "../drivers/plaid";

// Ensure actual test coverage for functions
describe("drivers/index", () => {
  describe("getConnectorDriver", () => {
    it("returns null for unknown connector id", () => {
      expect(getConnectorDriver("unknown-connector-id")).toBeNull();
    });

    it("returns a driver instance for a known connector id", () => {
      const driver = getConnectorDriver("plaid");
      expect(driver).toBeInstanceOf(PlaidDriver);
    });

    it("is case insensitive", () => {
      const driver = getConnectorDriver("PLAID");
      expect(driver).toBeInstanceOf(PlaidDriver);
    });
  });

  describe("getAllConnectorMetadata", () => {
    it("returns metadata for all registered drivers", () => {
      const metadataList = getAllConnectorMetadata();
      const expectedCount = Object.keys(CONNECTOR_REGISTRY).length;

      expect(metadataList.length).toBe(expectedCount);

      // Ensure we got metadata objects (they should have an id)
      expect(metadataList[0]).toHaveProperty("id");
      expect(metadataList.some((m) => m.id === "plaid")).toBe(true);
    });
  });
});
