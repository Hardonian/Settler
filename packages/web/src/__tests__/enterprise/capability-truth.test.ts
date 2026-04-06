import {
  ENTERPRISE_CAPABILITY_TRUTH,
  getCapabilityStateLabel,
} from "@/lib/enterprise/capabilityTruth";

describe("enterprise capability truth contract", () => {
  it("contains explicit SSO and SCIM boundaries", () => {
    const sso = ENTERPRISE_CAPABILITY_TRUTH.find((item) => item.capability === "SSO (OIDC)");
    const scim = ENTERPRISE_CAPABILITY_TRUTH.find(
      (item) => item.capability === "SCIM lifecycle provisioning"
    );

    expect(sso?.state).toBe("implemented_unverified");
    expect(scim?.state).toBe("staged");
  });

  it("keeps verification paths non-empty for all listed capabilities", () => {
    for (const capability of ENTERPRISE_CAPABILITY_TRUTH) {
      expect(capability.verificationPath.length).toBeGreaterThan(0);
    }
  });

  it("maps state to a stable label", () => {
    expect(getCapabilityStateLabel("verified")).toBe("Verified");
    expect(getCapabilityStateLabel("implemented_unverified")).toBe("Implemented / unverified");
    expect(getCapabilityStateLabel("staged")).toBe("Staged");
    expect(getCapabilityStateLabel("missing")).toBe("Missing");
  });
});
