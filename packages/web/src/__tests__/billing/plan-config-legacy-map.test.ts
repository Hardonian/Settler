import { mapLegacyPlanId } from "../../domain/billing/planConfig";

describe("mapLegacyPlanId", () => {
  it("maps enterprise subscription ids to enterprise plan code", () => {
    expect(mapLegacyPlanId("enterprise")).toBe("enterprise");
  });

  it("passes through modern plan codes", () => {
    expect(mapLegacyPlanId("pro")).toBe("pro");
    expect(mapLegacyPlanId("scale")).toBe("scale");
  });
});
