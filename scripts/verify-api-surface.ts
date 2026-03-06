#!/usr/bin/env tsx

import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const API_ROOT = join(process.cwd(), "packages/web/src/app/api");
const REQUIRED_PREFIXES = [
  "/api/health",
  "/api/status",
  "/api/v1",
  "/api/stripe",
  "/api/console",
  "/api/admin",
  "/api/receipts",
  "/api/runs",
  "/api/imports",
  "/api/workspaces",
];

function collectRoutes(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      collectRoutes(fullPath, acc);
      continue;
    }

    if (entry !== "route.ts") continue;

    const routeDir = relative(API_ROOT, dir).replace(/\\/g, "/");
    acc.push(`/api/${routeDir}`.replace(/\/api\/$/, "/api"));
  }

  return acc;
}

function main() {
  const routes = collectRoutes(API_ROOT).sort();

  for (const required of REQUIRED_PREFIXES) {
    if (!routes.some((route) => route === required || route.startsWith(`${required}/`))) {
      throw new Error(`Missing required API surface area: ${required}`);
    }
  }

  console.log("✅ API surface check passed");
  console.log(`   Discovered ${routes.length} API route handlers`);
}

main();
