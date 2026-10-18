import { existsSync } from "node:fs";
import path from "node:path";
import { CONSOLE_ROUTE_REGISTRY } from "@/lib/console/route-maturity";

describe("Console Navigation & Route Consistency Contract", () => {
  const repoRoot = path.resolve(__dirname, "../../../../../");
  const appDir = path.join(repoRoot, "packages/web/src/app");

  it("registers all primary console routes with valid definitions", () => {
    expect(CONSOLE_ROUTE_REGISTRY.length).toBeGreaterThanOrEqual(39);

    const hrefs = new Set<string>();
    for (const route of CONSOLE_ROUTE_REGISTRY) {
      expect(route.href).toMatch(/^\/console/);
      expect(route.label.trim().length).toBeGreaterThan(0);
      expect(route.section).toBeDefined();
      expect(hrefs.has(route.href)).toBe(false);
      hrefs.add(route.href);
    }
  });

  it("verifies every registered console route has a corresponding page file", () => {
    for (const route of CONSOLE_ROUTE_REGISTRY) {
      const relPath = route.href.replace(/^\//, "");
      const candidates = [
        path.join(appDir, relPath, "page.tsx"),
        path.join(appDir, relPath, "page.ts"),
      ];
      const found = candidates.some((p) => existsSync(p));
      expect(found).toBe(true);
    }
  });

  it("verifies all marquee ledger and intelligence routes are runtime-operational", () => {
    const marqueeHrefs = [
      "/console/daemon",
      "/console/audit-dossier",
      "/console/ledger-parity",
      "/console/time-travel",
    ];

    for (const href of marqueeHrefs) {
      const entry = CONSOLE_ROUTE_REGISTRY.find((r) => r.href === href);
      expect(entry).toBeDefined();
      expect(entry?.maturity).toBe("runtime-operational");
      expect(entry?.authRequired).toBe(true);
      expect(entry?.tenantScopeRequired).toBe(true);
      expect(entry?.navTreatment).toBe("primary");
    }
  });
});
