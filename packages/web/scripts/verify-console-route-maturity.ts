import { CONSOLE_ROUTE_REGISTRY } from "../src/lib/console/route-maturity";

const errors: string[] = [];
const seen = new Set<string>();

for (const route of CONSOLE_ROUTE_REGISTRY) {
  if (seen.has(route.href)) {
    errors.push(`duplicate href in console route registry: ${route.href}`);
  }
  seen.add(route.href);

  if (route.authRequired && route.tenantScopeRequired && route.dataMode === "synthetic") {
    errors.push(`synthetic route cannot require tenant scope: ${route.href}`);
  }

  if (route.maturity === "thin" && !route.explicitDisclosureRequired) {
    errors.push(`thin route must require explicit disclosure: ${route.href}`);
  }

  if (route.maturity === "admin-only" && route.roleRestriction !== "super-admin") {
    errors.push(`admin-only route must be super-admin restricted: ${route.href}`);
  }

  if (route.stripeRequired && route.runtimeDependency !== "stripe") {
    errors.push(`stripeRequired route must have stripe runtime dependency: ${route.href}`);
  }

  if (
    route.navTreatment === "primary" &&
    (route.maturity === "thin" || route.maturity === "admin-only")
  ) {
    errors.push(`primary nav route cannot be thin/admin-only: ${route.href}`);
  }
}

if (errors.length > 0) {
  console.error("❌ Console route maturity verification failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.warn(
  `✅ Console route maturity verification passed (${CONSOLE_ROUTE_REGISTRY.length} routes)`
);
