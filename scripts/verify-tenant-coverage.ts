#!/usr/bin/env tsx
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type RegistryRoute = {
  route: string;
  kind: "next-app-router" | "edge-function" | "rpc-endpoint" | "internal-service-endpoint";
  file: string;
};

type Status = "verified" | "exempt" | "missing";

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "security", "route-registry.json");

const TENANT_CONTROL_TOKENS = [
  "tenantId",
  "tenant_id",
  "ctx.tenantId",
  "buildContext(",
  "set_tenant_context",
  "get_user_tenant_ids",
  "authenticateApiKey(",
  "withSecurity(",
  "RLS",
  "row level security",
  "authorizeTenant",
  "requireTenant",
  "requireAuth(",
  "withTrustRun(",
  "createClient()",
  "isSuperAdmin(",
];

const EXEMPT_ROUTE_PREFIXES = [
  "/api/health",
  "/api/status",
  "/api/docs",
  "/api/public",
  "/api/seo",
  "/api/stripe/webhook",
  "/api/cron/",
  "/api/admin/",
  "/api/internal/health",
  "/api/gtm/",
  "/api/legal/",
  "/api/vercel-example",
  "/api/v1/health",
  "/api/v1/meta",
  "/api/v1/ready",
  "/api/builder/revalidate",
  "/edge/",
  "rpc:",
];

function isTenantBoundRoute(route: RegistryRoute): boolean {
  if (!route.route.startsWith("/api")) return false;
  if (
    EXEMPT_ROUTE_PREFIXES.some((prefix) => route.route === prefix || route.route.startsWith(prefix))
  )
    return false;
  return true;
}

function evaluateRoute(route: RegistryRoute): { status: Status; reason: string } {
  if (!isTenantBoundRoute(route)) {
    return { status: "exempt", reason: "explicit non-tenant/public/admin/internal exemption" };
  }

  let content = "";
  try {
    content = readFileSync(path.join(repoRoot, route.file), "utf8");
  } catch (error) {
    return {
      status: "missing",
      reason: `unreadable route file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const matchedToken = TENANT_CONTROL_TOKENS.find((token) => content.includes(token));
  if (matchedToken) {
    return { status: "verified", reason: `tenant control token detected: ${matchedToken}` };
  }

  return { status: "missing", reason: "no tenant isolation control token matched" };
}

function main(): void {
  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
    routes: RegistryRoute[];
  };

  const results = registry.routes
    .filter(
      (route) => route.kind === "next-app-router" || route.kind === "internal-service-endpoint"
    )
    .map((route) => {
      const evaluation = evaluateRoute(route);
      return {
        ...route,
        ...evaluation,
      };
    });

  const tenantScopedRoutes = results.filter((entry) => entry.status !== "exempt");
  const verified = tenantScopedRoutes.filter((entry) => entry.status === "verified");
  const missing = tenantScopedRoutes.filter((entry) => entry.status === "missing");
  const coverage =
    tenantScopedRoutes.length === 0 ? 100 : (verified.length / tenantScopedRoutes.length) * 100;

  console.log("ROUTE COVERAGE REPORT");
  console.log("---------------------");
  console.log(`routes discovered: ${registry.routes.length}`);
  console.log(`tenant-scoped routes: ${tenantScopedRoutes.length}`);
  console.log(`routes verified: ${verified.length}`);
  console.log(`coverage: ${coverage.toFixed(2)}%`);

  const outputPath = path.join(repoRoot, "artifacts", "security", "tenant-coverage-latest.json");
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalRoutes: registry.routes.length,
        tenantScopedRoutes: tenantScopedRoutes.length,
        verifiedRoutes: verified.length,
        missingRoutes: missing.map((route) => ({
          route: route.route,
          file: route.file,
          reason: route.reason,
        })),
        coveragePct: Number(coverage.toFixed(2)),
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  if (missing.length > 0) {
    console.log("\nMissing tenant coverage:");
    for (const route of missing) {
      console.log(`- ${route.route} (${route.file}) -> ${route.reason}`);
    }
    process.exit(1);
  }
}

main();
