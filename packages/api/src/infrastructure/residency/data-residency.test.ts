import {
  validateDataResidency,
  DataResidencyViolationError,
  TenantResidencyProfile,
} from "./data-residency";

describe("Multi-Region Data Residency Sharding Enclaves", () => {
  const euProfile: TenantResidencyProfile = {
    tenantId: "tenant_eu_finance",
    allowedRegions: ["EU_CENTRAL", "EU_WEST"],
    primaryRegion: "EU_CENTRAL",
    strictSovereigntyRequired: true,
  };

  it("authorizes requests executed within allowed sovereign regions", () => {
    const res = validateDataResidency(euProfile, "EU_CENTRAL");
    expect(res.authorized).toBe(true);
    expect(res.attestationProof).toMatch(/^[a-f0-9]{64}$/);

    const resWest = validateDataResidency(euProfile, "EU_WEST");
    expect(resWest.authorized).toBe(true);
  });

  it("strictly rejects and throws DataResidencyViolationError when access attempts escape to US region", () => {
    expect(() => validateDataResidency(euProfile, "US_EAST")).toThrow(DataResidencyViolationError);
  });

  it("fails fast if tenantId is missing", () => {
    expect(() => validateDataResidency({ ...euProfile, tenantId: "" }, "EU_CENTRAL")).toThrow(
      /Tenant isolation invariant violation/
    );
  });
});
