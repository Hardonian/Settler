import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONSOLE_ROUTE_REGISTRY, type ConsoleNavSection } from "@/lib/console/route-maturity";
import { COMMERCIAL_OFFERS } from "@/domain/billing/commercialModel";
import { planConfigs, type PlanCode } from "@/domain/billing/planConfig";
import { PREMIUM_PACKS } from "@/domain/billing/premiumPacks";

const PILLARS: ConsoleNavSection[] = [
  "Reconciliation core",
  "Exception ops",
  "Evidence + audit",
  "Control plane",
  "Administration",
];

describe("product IA and billing alignment", () => {
  it("places every console nav entry under the four product pillars (+ admin)", () => {
    for (const route of CONSOLE_ROUTE_REGISTRY) {
      expect(PILLARS).toContain(route.section);
    }
  });

  it("lists /console/schedules in the route registry (nav discoverability)", () => {
    expect(CONSOLE_ROUTE_REGISTRY.some((r) => r.href === "/console/schedules")).toBe(true);
  });

  it("keeps COMMERCIAL_OFFERS plan codes on defined planConfigs entries", () => {
    for (const offer of COMMERCIAL_OFFERS) {
      const code = offer.planCode;
      expect(code).toBeDefined();
      expect(planConfigs[code as PlanCode]).toBeDefined();
    }
  });

  it("maps premium pack console routes to registry hrefs when non-empty", () => {
    const hrefs = new Set(CONSOLE_ROUTE_REGISTRY.map((r) => r.href));
    for (const pack of PREMIUM_PACKS) {
      for (const href of pack.consoleRoutes) {
        expect(hrefs.has(href)).toBe(true);
      }
    }
  });

  it("documents planConfig as canonical owner in route-maturity (drift guard)", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/lib/console/route-maturity.ts"),
      "utf-8"
    );
    expect(source).toContain("COMMERCIAL_OFFERS");
  });
});
