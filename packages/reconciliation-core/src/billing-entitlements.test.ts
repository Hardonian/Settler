import { evaluateEntitlement, normalizeSettlerPlan } from "./billing-entitlements.js";

describe("billing entitlements", () => {
  it("maps legacy paid plan ids into the canonical Pro plan", () => {
    expect(normalizeSettlerPlan("starter")).toBe("pro");
    expect(normalizeSettlerPlan("growth")).toBe("pro");
    expect(normalizeSettlerPlan("enterprise_edge")).toBe("enterprise");
  });

  it("removes proofpack access immediately after downgrade", () => {
    const before = evaluateEntitlement({
      feature: "proofpack_exports",
      planId: "pro",
      subscriptionStatus: "active",
    });
    const after = evaluateEntitlement({
      feature: "proofpack_exports",
      planId: "free",
      subscriptionStatus: "active",
    });

    expect(before.allowed).toBe(true);
    expect(after.allowed).toBe(false);
    expect(after.reason).toBe("plan_upgrade_required");
  });

  it("unlocks without cached state when upgraded", () => {
    const before = evaluateEntitlement({
      feature: "delta_intelligence",
      planId: "free",
      subscriptionStatus: "active",
    });
    const after = evaluateEntitlement({
      feature: "delta_intelligence",
      planId: "pro",
      subscriptionStatus: "active",
    });

    expect(before.allowed).toBe(false);
    expect(after.allowed).toBe(true);
    expect(after.state).toBe("VERIFIED");
  });

  it("gates audit logs to Enterprise", () => {
    expect(
      evaluateEntitlement({
        feature: "audit_logs",
        planId: "pro",
        subscriptionStatus: "active",
      })
    ).toMatchObject({
      allowed: false,
      requiredPlan: "enterprise",
    });

    expect(
      evaluateEntitlement({
        feature: "audit_logs",
        planId: "enterprise",
        subscriptionStatus: "active",
      }).allowed
    ).toBe(true);
  });

  it("fails closed when billing lookup is degraded or unavailable", () => {
    expect(
      evaluateEntitlement({
        feature: "api_access",
        planId: "enterprise",
        billingLookupState: "degraded",
      })
    ).toMatchObject({ allowed: false, state: "DEGRADED" });

    expect(
      evaluateEntitlement({
        feature: "api_access",
        planId: "enterprise",
        billingLookupState: "unavailable",
      })
    ).toMatchObject({ allowed: false, state: "UNAVAILABLE" });
  });
});
