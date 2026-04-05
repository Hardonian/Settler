import {
  LEGACY_SUBSCRIPTION_PLAN_ID_MAP,
  PLAN_SPINE,
  PREMIUM_PACKS,
  USAGE_METERS,
  mapLegacyPlanTypeToPlanCode,
  mapLegacySubscriptionPlanId,
} from "@settler/types";
import { PRICING_PLANS } from "@/config/pricing-simple";
import { mapLegacyPlanId, planConfigs } from "@/domain/billing/planConfig";

describe("commercial spine consistency", () => {
  it("exports every plan code in PLAN_SPINE", () => {
    expect(Object.keys(PLAN_SPINE).sort()).toEqual(["enterprise", "growth", "scale", "starter"]);
  });

  it("maps legacy subscription ids into PLAN_SPINE keys only", () => {
    for (const [legacy, code] of Object.entries(LEGACY_SUBSCRIPTION_PLAN_ID_MAP)) {
      expect(PLAN_SPINE[code]).toBeDefined();
      expect(legacy).toBe(legacy.toLowerCase());
    }
  });

  it("aligns web planConfig with spine monthly prices and volumes", () => {
    for (const code of Object.keys(PLAN_SPINE) as Array<keyof typeof PLAN_SPINE>) {
      expect(planConfigs[code].monthlyPrice).toBe(PLAN_SPINE[code].monthlyPrice);
      expect(planConfigs[code].limits.reconcile.monthlyVolume).toBe(
        PLAN_SPINE[code].limits.reconcile.monthlyVolume
      );
    }
  });

  it("aligns pricing-simple with spine for canonical ids", () => {
    for (const id of ["starter", "growth", "scale", "enterprise"] as const) {
      const p = PRICING_PLANS[id]!;
      expect(p.basePriceMonthly).toBe(PLAN_SPINE[id].monthlyPrice);
      expect(p.includedTransactions).toBe(PLAN_SPINE[id].limits.reconcile.monthlyVolume);
      expect(p.pricePerTransaction).toBe(PLAN_SPINE[id].limits.reconcile.pricePerReconciliation);
    }
  });

  it("maps legacy plan types to canonical codes", () => {
    expect(mapLegacyPlanTypeToPlanCode("free")).toBe("starter");
    expect(mapLegacyPlanTypeToPlanCode("trial")).toBe("growth");
    expect(mapLegacyPlanTypeToPlanCode("commercial")).toBe("growth");
    expect(mapLegacyPlanTypeToPlanCode("enterprise")).toBe("enterprise");
    expect(mapLegacyPlanTypeToPlanCode("starter")).toBe("starter");
  });

  it("keeps mapLegacyPlanId aligned with spine helper", () => {
    expect(mapLegacyPlanId("pro")).toBe(mapLegacySubscriptionPlanId("pro"));
    expect(mapLegacyPlanId("unknown_plan")).toBe("starter");
  });

  it("defines premium pack with integration id and capabilities", () => {
    const pack = PREMIUM_PACKS.exceptionIntelligence;
    expect(pack.integrationId).toMatch(/^[a-z0-9-]+$/);
    expect(pack.ownedCapabilities.length).toBeGreaterThan(0);
  });

  it("defines unique usage meter ids", () => {
    const ids = USAGE_METERS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
