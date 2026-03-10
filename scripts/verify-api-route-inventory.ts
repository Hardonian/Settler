#!/usr/bin/env tsx
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

type MappingEntry = {
  method: string;
  path: string;
  testId: string;
  testFile: string;
};

const root = process.cwd();
const apiRoot = path.join(root, "packages", "web", "src", "app", "api");
const inventoryPath = path.join(root, "docs", "api", "route-inventory.json");
const mappingPath = path.join(root, "docs", "api", "route-test-mapping.json");
const policyPath = path.join(root, "docs", "api", "route-coverage-policy.json");

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (["node_modules", ".next", "dist", ".git"].includes(entry)) continue;
      walk(full, acc);
      continue;
    }
    if (/\/route\.(ts|tsx|js|jsx)$/.test(full)) acc.push(full);
  }
  return acc;
}

function toPath(file: string): string {
  const rel = path.relative(apiRoot, file).replace(/\\/g, "/");
  return `/api/${rel.replace(/\/route\.(ts|tsx|js|jsx)$/, "")}`.replace(/\/+/g, "/");
}

function main() {
  const mounted = new Set(walk(apiRoot).map(toPath));
  const inv = JSON.parse(readFileSync(inventoryPath, "utf8")) as {
    totals: {
      criticalMissing?: number;
      unmountedCandidates?: number;
      undeclaredMethodHandlers?: number;
      duplicateMethodPathEntries?: number;
    };
    diagnostics?: {
      unmountedRouteCandidates?: string[];
      undeclaredMethodHandlers?: Array<{ path: string; source: string }>;
      duplicateMethodPathEntries?: string[];
    };
    routes: Array<{ path: string; method: string; criticality: string; testStatus: string }>;
  };
  const mapping = JSON.parse(readFileSync(mappingPath, "utf8")) as { mappings: MappingEntry[] };
  const policy = existsSync(policyPath)
    ? (JSON.parse(readFileSync(policyPath, "utf8")) as {
        maxCriticalMissing: number;
        maxCriticalMissingIncrease: number;
        baselineCriticalMissing?: number;
      })
    : {
        maxCriticalMissing: Number.MAX_SAFE_INTEGER,
        maxCriticalMissingIncrease: Number.MAX_SAFE_INTEGER,
        baselineCriticalMissing: Number.MAX_SAFE_INTEGER,
      };

  const inventoryPaths = new Set(inv.routes.map((r) => r.path));
  const missingFromInventory = [...mounted].filter((p) => !inventoryPaths.has(p));
  const staleInInventory = [...inventoryPaths].filter((p) => !mounted.has(p));

  const inventoryRouteKeys = new Set(inv.routes.map((r) => `${r.method} ${r.path}`));

  const duplicateRouteKeys = new Map<string, number>();
  for (const route of inv.routes) {
    const key = `${route.method} ${route.path}`;
    duplicateRouteKeys.set(key, (duplicateRouteKeys.get(key) ?? 0) + 1);
  }
  const duplicateRoutes = [...duplicateRouteKeys.entries()].filter(([, count]) => count > 1);
  const diagnosticDuplicates = inv.diagnostics?.duplicateMethodPathEntries ?? [];

  const mappingMissingRoute = mapping.mappings.filter(
    (m) => !inventoryRouteKeys.has(`${m.method} ${m.path}`)
  );
  const mappingMissingTestId = mapping.mappings.filter((m) => {
    const abs = path.join(root, m.testFile);
    if (!existsSync(abs)) return true;
    const text = readFileSync(abs, "utf8");
    return !text.includes(m.testId);
  });

  const criticalMissing = inv.routes.filter(
    (r) => r.criticality === "critical" && r.testStatus === "missing"
  ).length;
  const baselineCriticalMissing = Number(policy.baselineCriticalMissing ?? criticalMissing);

  const errors: string[] = [];

  if (missingFromInventory.length > 0) {
    errors.push(`Mounted routes missing from inventory (${missingFromInventory.length})`);
  }
  if (staleInInventory.length > 0) {
    errors.push(`Inventory contains unmounted routes (${staleInInventory.length})`);
  }
  if (mappingMissingRoute.length > 0) {
    errors.push(
      `Route-test mappings reference non-existent method/path entries (${mappingMissingRoute.length})`
    );
  }
  if (mappingMissingTestId.length > 0) {
    errors.push(
      `Route-test mappings reference missing test IDs/files (${mappingMissingTestId.length})`
    );
  }

  if (duplicateRoutes.length > 0) {
    errors.push(
      `Inventory contains duplicate method/path route entries (${duplicateRoutes.length})`
    );
  }
  if (diagnosticDuplicates.length !== duplicateRoutes.length) {
    errors.push(
      `Inventory diagnostics duplicate count (${diagnosticDuplicates.length}) does not match computed duplicates (${duplicateRoutes.length})`
    );
  }

  if (criticalMissing > policy.maxCriticalMissing) {
    errors.push(
      `Critical missing routes (${criticalMissing}) exceeds policy maxCriticalMissing (${policy.maxCriticalMissing})`
    );
  }
  if (criticalMissing - baselineCriticalMissing > policy.maxCriticalMissingIncrease) {
    errors.push(
      `Critical missing routes increased by ${criticalMissing - baselineCriticalMissing}, exceeds allowed increase ${policy.maxCriticalMissingIncrease}`
    );
  }

  if (errors.length > 0) {
    console.error("API route inventory verification failed.");
    for (const error of errors) console.error(`- ${error}`);
    if (mappingMissingTestId.length > 0) {
      for (const missing of mappingMissingTestId.slice(0, 20)) {
        console.error(`  - missing test id ${missing.testId} in ${missing.testFile}`);
      }
    }
    process.exit(1);
  }

  console.log(
    `API route inventory verification passed. criticalMissing=${criticalMissing}, max=${policy.maxCriticalMissing}, unmountedCandidates=${inv.totals.unmountedCandidates ?? 0}, undeclaredMethodHandlers=${inv.totals.undeclaredMethodHandlers ?? 0}`
  );
}

main();
