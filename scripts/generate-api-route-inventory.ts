#!/usr/bin/env tsx
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

type MappingEntry = {
  method: string;
  path: string;
  testId: string;
  testFile: string;
};

type RouteEntry = {
  method: string;
  path: string;
  routeGroup: string;
  source: string;
  authRequired: boolean;
  tenantScoped: boolean;
  responseContract: string;
  testStatus: "covered" | "partial" | "missing";
  criticality: "critical" | "high" | "medium";
  testIds: string[];
};

type InventoryDiagnostics = {
  unmountedRouteCandidates: string[];
  undeclaredMethodHandlers: Array<{ path: string; source: string }>;
  duplicateMethodPathEntries: string[];
};

const root = process.cwd();
const apiRoot = path.join(root, "packages", "web", "src", "app", "api");
const outJson = path.join(root, "docs", "api", "route-inventory.json");
const outMd = path.join(root, "docs", "api", "route-inventory.md");
const mappingPath = path.join(root, "docs", "api", "route-test-mapping.json");

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

function walk(dir: string, matcher: (f: string) => boolean, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (["node_modules", ".next", "dist", ".git"].includes(entry)) continue;
      walk(full, matcher, acc);
      continue;
    }
    if (matcher(full)) acc.push(full);
  }
  return acc;
}

function findUnmountedCandidates(apiDir: string): string[] {
  const candidates = walk(apiDir, (f) => {
    const normalized = f.replace(/\\/g, "/");
    if (/\/route\.(ts|tsx|js|jsx)$/.test(normalized)) return false;
    if (/\/route\.(ts|tsx|js|jsx)\./.test(normalized)) return true;
    return /\/(handler|routes?)\.(ts|tsx|js|jsx)$/.test(normalized);
  });
  return candidates.map((file) => path.relative(root, file).replace(/\\/g, "/")).sort();
}

function classifyRouteGroup(routePath: string): string {
  const parts = routePath.split("/").filter(Boolean);
  if (parts.length < 2) return "root";
  return parts[1] ?? "root";
}

function inferCriticality(routePath: string): RouteEntry["criticality"] {
  if (
    /\/api\/(v1\/runs|admin|console\/support|control-plane|billing|stripe\/webhook|support|jobs|console\/usage|console\/operator)/.test(
      routePath
    )
  ) {
    return "critical";
  }
  if (/\/api\/(metrics|ops|enterprise|integrations|connectors)/.test(routePath)) return "high";
  return "medium";
}

function inferContracts(routePath: string): string {
  if (routePath.startsWith("/api/v1/runs"))
    return "application/problem+json + typed v1 run payload";
  if (routePath.startsWith("/api/v1")) return "application/problem+json + v1 JSON payload";
  return "NextResponse.json best-effort contract";
}

function toRoutePath(file: string): string {
  const rel = path.relative(apiRoot, file).replace(/\\/g, "/");
  const segment = rel.replace(/\/route\.(ts|tsx|js|jsx)$/, "");
  return `/api/${segment}`.replace(/\/+/, "/").replace(/\/+/g, "/");
}

function loadMappings(): MappingEntry[] {
  if (!existsSync(mappingPath)) return [];
  const mappingJson = JSON.parse(readFileSync(mappingPath, "utf8")) as {
    mappings?: MappingEntry[];
  };
  return mappingJson.mappings ?? [];
}

function main() {
  const routeFiles = walk(apiRoot, (f) => /\/route\.(ts|tsx|js|jsx)$/.test(f));
  const mappings = loadMappings();

  const byMethodAndPath = new Map<string, MappingEntry[]>();
  const byPath = new Map<string, MappingEntry[]>();
  for (const entry of mappings) {
    const key = `${entry.method} ${entry.path}`;
    byMethodAndPath.set(key, [...(byMethodAndPath.get(key) ?? []), entry]);
    byPath.set(entry.path, [...(byPath.get(entry.path) ?? []), entry]);
  }

  const entries: RouteEntry[] = [];
  const mountedPaths = new Set<string>();
  const diagnostics: InventoryDiagnostics = {
    unmountedRouteCandidates: findUnmountedCandidates(apiRoot),
    undeclaredMethodHandlers: [],
    duplicateMethodPathEntries: [],
  };

  for (const file of routeFiles) {
    const source = readFileSync(file, "utf8");
    const routePath = toRoutePath(file);
    mountedPaths.add(routePath);

    const methods = HTTP_METHODS.filter(
      (method) =>
        new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`).test(source) ||
        new RegExp(`export\\s+const\\s+${method}\\b`).test(source)
    );

    const authRequired =
      /buildContext\(/.test(source) ||
      /requireAuth\s*:\s*true/.test(source) ||
      /authenticateApiKey\(/.test(source);
    const tenantScoped = /tenantId|tenant/.test(source);

    const routeMethods = methods.length > 0 ? methods : ["UNDECLARED"];

    if (methods.length === 0) {
      diagnostics.undeclaredMethodHandlers.push({
        path: routePath,
        source: path.relative(root, file).replace(/\\/g, "/"),
      });
    }

    for (const method of routeMethods) {
      const exact = byMethodAndPath.get(`${method} ${routePath}`) ?? [];
      const samePathAnyMethod = byPath.get(routePath) ?? [];
      const testStatus: RouteEntry["testStatus"] =
        exact.length > 0 ? "covered" : samePathAnyMethod.length > 0 ? "partial" : "missing";

      entries.push({
        method,
        path: routePath,
        routeGroup: classifyRouteGroup(routePath),
        source: path.relative(root, file).replace(/\\/g, "/"),
        authRequired,
        tenantScoped,
        responseContract: inferContracts(routePath),
        testStatus,
        criticality: inferCriticality(routePath),
        testIds: exact.map((test) => test.testId),
      });
    }
  }

  entries.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  const routeMethodCounts = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.method} ${entry.path}`;
    routeMethodCounts.set(key, (routeMethodCounts.get(key) ?? 0) + 1);
  }
  diagnostics.duplicateMethodPathEntries = [...routeMethodCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key)
    .sort();

  const criticalMissing = entries.filter(
    (e) => e.criticality === "critical" && e.testStatus === "missing"
  ).length;

  const payload = {
    generatedAt: new Date().toISOString(),
    coverageModel: "route-test-mapping@v1",
    totals: {
      routes: entries.length,
      uniquePaths: mountedPaths.size,
      critical: entries.filter((e) => e.criticality === "critical").length,
      covered: entries.filter((e) => e.testStatus === "covered").length,
      partial: entries.filter((e) => e.testStatus === "partial").length,
      missing: entries.filter((e) => e.testStatus === "missing").length,
      criticalMissing,
      unmountedCandidates: diagnostics.unmountedRouteCandidates.length,
      undeclaredMethodHandlers: diagnostics.undeclaredMethodHandlers.length,
      duplicateMethodPathEntries: diagnostics.duplicateMethodPathEntries.length,
    },
    diagnostics,
    routes: entries,
  };

  mkdirSync(path.dirname(outJson), { recursive: true });
  writeFileSync(outJson, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const md = [
    "# API Route Inventory",
    "",
    `Generated: ${payload.generatedAt}`,
    "",
    `- Coverage model: **${payload.coverageModel}**`,
    `- Total mounted method routes: **${payload.totals.routes}**`,
    `- Unique API paths: **${payload.totals.uniquePaths}**`,
    `- Critical routes: **${payload.totals.critical}**`,
    `- Critical routes missing tests: **${payload.totals.criticalMissing}**`,
    `- Covered / Partial / Missing tests: **${payload.totals.covered} / ${payload.totals.partial} / ${payload.totals.missing}**`,
    `- Unmounted route candidates: **${payload.totals.unmountedCandidates}**`,
    `- Route handlers with undeclared HTTP methods: **${payload.totals.undeclaredMethodHandlers}**`,
    `- Duplicate mounted method/path entries: **${payload.totals.duplicateMethodPathEntries}**`,
    "",
    "| Method | Path | Group | Auth | Tenant | Criticality | Test | Test IDs | Source |",
    "|---|---|---|---:|---:|---|---|---|---|",
    ...entries.map(
      (e) =>
        `| ${e.method} | \`${e.path}\` | ${e.routeGroup} | ${e.authRequired ? "yes" : "no"} | ${e.tenantScoped ? "yes" : "no"} | ${e.criticality} | ${e.testStatus} | ${e.testIds.length > 0 ? `\`${e.testIds.join(", ")}\`` : "-"} | \`${e.source}\` |`
    ),
    "",
    "## Notes",
    "",
    "- Inventory is generated from mounted Next.js App Router `route.ts` handlers under `packages/web/src/app/api`.",
    "- Test status is machine-derived from `docs/api/route-test-mapping.json` (no heuristic inference).",
    "- Unmounted route candidates capture `route.ts.*` variants and route-like helper files in `app/api` that are not mounted handlers.",
  ].join("\n");

  writeFileSync(outMd, `${md}\n`, "utf8");
  console.log(`Generated API route inventory: ${path.relative(root, outJson)}`);
}

main();
