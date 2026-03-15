import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OPERATIONAL_ROUTE_REGISTRY } from "../src/lib/routes/operational-truth";

const WEB_APP_ROOT = join(process.cwd(), "src", "app");

const significantRoutePrefixes = [
  "/console",
  "/app",
  "/dashboard",
  "/admin",
  "/operator/incidents",
];

function walkPageRoutes(dir: string, base = ""): string[] {
  const entries = readdirSync(dir);
  const routes: string[] = [];

  for (const entry of entries) {
    if (entry.startsWith("(") || entry.startsWith("_")) continue;
    const abs = join(dir, entry);
    const rel = `${base}/${entry}`.replace(/\/+/g, "/");
    const st = statSync(abs);
    if (st.isDirectory()) {
      routes.push(...walkPageRoutes(abs, rel));
      continue;
    }
    if (entry === "page.tsx") {
      const routePath = base || "/";
      routes.push(routePath);
    }
  }

  return routes;
}

function validate() {
  const errors: string[] = [];
  const warnings: string[] = [];

  const seenPrefixes = new Set<string>();
  for (const entry of OPERATIONAL_ROUTE_REGISTRY) {
    if (seenPrefixes.has(entry.routePrefix)) {
      errors.push(`duplicate routePrefix in operational route registry: ${entry.routePrefix}`);
    }
    seenPrefixes.add(entry.routePrefix);

    if (entry.maturity === "thin" && entry.operationalClass !== "synthetic") {
      errors.push(`thin routePrefix must be synthetic operationalClass: ${entry.routePrefix}`);
    }

    if (entry.roleRestriction === "super-admin" && entry.navTreatment !== "restricted") {
      errors.push(`super-admin routePrefix must be restricted nav treatment: ${entry.routePrefix}`);
    }

    if (entry.tenantScopeRequired && entry.scopeSignal !== "tenant") {
      errors.push(`tenant-scoped routePrefix must use tenant scope signal: ${entry.routePrefix}`);
    }

    if (entry.dataMode === "synthetic" && !entry.syntheticDataAllowed) {
      errors.push(`synthetic data mode must explicitly allow synthetic data: ${entry.routePrefix}`);
    }
  }

  const allPages = walkPageRoutes(WEB_APP_ROOT);
  const significantPages = allPages.filter((route) =>
    significantRoutePrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`))
  );

  for (const prefix of significantRoutePrefixes) {
    const hasCoverage = OPERATIONAL_ROUTE_REGISTRY.some(
      (entry) => prefix === entry.routePrefix || prefix.startsWith(`${entry.routePrefix}/`)
    );
    if (!hasCoverage) {
      errors.push(`missing operational truth registry coverage for significant prefix: ${prefix}`);
    }
  }

  for (const route of significantPages) {
    const covered = OPERATIONAL_ROUTE_REGISTRY.some(
      (entry) => route === entry.routePrefix || route.startsWith(`${entry.routePrefix}/`)
    );
    if (!covered) {
      warnings.push(`significant route not explicitly covered by registry prefix: ${route}`);
    }
  }

  const disclosureHosts = [
    "src/components/console/ConsoleLayout.tsx",
    "src/app/app/layout.tsx",
    "src/app/dashboard/layout.tsx",
    "src/app/admin/layout.tsx",
  ];
  for (const host of disclosureHosts) {
    const abs = join(process.cwd(), host);
    if (!existsSync(abs)) {
      errors.push(`missing disclosure host file: ${host}`);
      continue;
    }
    const content = readFileSync(abs, "utf8");
    if (!content.includes("OperationalRouteNotice")) {
      errors.push(`required disclosure primitive missing from layout: ${host}`);
    }
  }

  if (warnings.length > 0) {
    console.warn("⚠️ Operational route truth warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (errors.length > 0) {
    console.error("❌ Operational route truth verification failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log(
    `✅ Operational route truth verification passed (${OPERATIONAL_ROUTE_REGISTRY.length} registry entries, ${significantPages.length} significant routes scanned)`
  );
}

validate();
