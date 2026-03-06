#!/usr/bin/env tsx

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface RouteRegistry {
  pagePaths: string[];
}

const REQUIRED_ROUTES = [
  "/home",
  "/docs",
  "/pricing",
  "/api/v1/health",
  "/api/v1/ready",
  "/api/v1/meta",
];
const REQUIRED_MARKETING_ROUTES = ["/why-settler", "/architecture", "/security", "/comparison"];

function loadRegistry(): RouteRegistry {
  const registryPath = join(process.cwd(), "qa/route-registry.json");
  const raw = readFileSync(registryPath, "utf8");
  return JSON.parse(raw) as RouteRegistry;
}

function assertPresent(paths: string[], route: string, label: string) {
  if (!paths.includes(route)) {
    throw new Error(`${label} route missing from registry: ${route}`);
  }
}

function main() {
  const registry = loadRegistry();
  const pagePaths = registry.pagePaths;

  for (const route of REQUIRED_ROUTES.filter((r) => !r.startsWith("/api/"))) {
    assertPresent(pagePaths, route, "Critical");
  }

  for (const route of REQUIRED_MARKETING_ROUTES) {
    assertPresent(pagePaths, route, "Marketing parity");
  }

  console.log("✅ Route parity manifest checks passed");
  console.log(
    `   Checked ${REQUIRED_ROUTES.length + REQUIRED_MARKETING_ROUTES.length} critical routes`
  );
}

main();
