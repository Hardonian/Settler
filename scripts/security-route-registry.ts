#!/usr/bin/env tsx
import { readdirSync, statSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

type RouteKind = "next-app-router" | "edge-function" | "rpc-endpoint" | "internal-service-endpoint";

interface RouteEntry {
  route: string;
  kind: RouteKind;
  file: string;
  methods: string[];
}

const repoRoot = process.cwd();

function walk(dir: string, collector: string[], predicate: (file: string) => boolean): void {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    let stats;
    try {
      stats = statSync(fullPath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      if (["node_modules", ".next", "dist", ".turbo", ".git"].includes(entry)) continue;
      walk(fullPath, collector, predicate);
      continue;
    }

    if (predicate(fullPath)) {
      collector.push(fullPath);
    }
  }
}

function toPosixPath(input: string): string {
  return input.split(path.sep).join("/");
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

function discoverRouteMethods(absoluteFile: string): string[] {
  let source = "";
  try {
    source = readFileSync(absoluteFile, "utf8");
  } catch {
    return [];
  }

  const methods = new Set<string>();
  for (const method of HTTP_METHODS) {
    const functionExport = new RegExp(`export\\s+async\\s+function\\s+${method}\\b`);
    const constExport = new RegExp(`export\\s+const\\s+${method}\\b`);
    if (functionExport.test(source) || constExport.test(source)) methods.add(method);
  }
  return [...methods].sort();
}

function discoverNextAppRouterRoutes(): RouteEntry[] {
  const apiRoot = path.join(repoRoot, "packages", "web", "src", "app");
  const files: string[] = [];
  walk(apiRoot, files, (file) => /\/route\.(ts|tsx|js|jsx)$/.test(file));

  return files.map((absoluteFile) => {
    const rel = toPosixPath(path.relative(repoRoot, absoluteFile));
    const fromAppRoot = toPosixPath(
      path.relative(path.join(repoRoot, "packages", "web", "src", "app"), absoluteFile)
    );
    const routeSegment = fromAppRoot.replace(/\/route\.(ts|tsx|js|jsx)$/, "");
    const normalized = `/${routeSegment}`
      .replace(/\/+/g, "/")
      .replace(/\/(index)?$/, "/")
      .replace(/\/$/, "");

    return {
      route: normalized || "/",
      kind: "next-app-router" as const,
      file: rel,
      methods: discoverRouteMethods(absoluteFile),
    };
  });
}

function discoverEdgeFunctions(): RouteEntry[] {
  const edgeRoot = path.join(repoRoot, "supabase", "functions");
  const files: string[] = [];
  walk(edgeRoot, files, (file) => /\/index\.ts$/.test(file));

  return files.map((absoluteFile) => {
    const rel = toPosixPath(path.relative(repoRoot, absoluteFile));
    const fnName = toPosixPath(path.relative(edgeRoot, path.dirname(absoluteFile)));
    return {
      route: `/edge/${fnName}`,
      kind: "edge-function" as const,
      file: rel,
      methods: [],
    };
  });
}

function discoverRpcAndInternal(): RouteEntry[] {
  const results: RouteEntry[] = [];
  const roots = [path.join(repoRoot, "packages"), path.join(repoRoot, "scripts")];

  const files: string[] = [];
  for (const root of roots) {
    walk(root, files, (file) => /\.(ts|tsx|js|mjs|cjs)$/.test(file));
  }

  for (const absoluteFile of files) {
    const rel = toPosixPath(path.relative(repoRoot, absoluteFile));
    if (rel.includes("/node_modules/") || rel.includes("/.next/") || rel.includes("/dist/"))
      continue;

    if (/\brpc\b/i.test(rel)) {
      results.push({ route: `rpc:${rel}`, kind: "rpc-endpoint", file: rel, methods: [] });
    }

    if (/\/internal\//.test(rel) && /route\.(ts|tsx|js|jsx)$/.test(rel)) {
      const normalized =
        rel.replace("packages/web/src/app", "").replace(/\/route\.(ts|tsx|js|jsx)$/, "") || "/";
      results.push({
        route: normalized,
        kind: "internal-service-endpoint",
        file: rel,
        methods: discoverRouteMethods(absoluteFile),
      });
    }
  }

  return results;
}

function dedupe(routes: RouteEntry[]): RouteEntry[] {
  const byKey = new Map<string, RouteEntry>();
  for (const route of routes) {
    byKey.set(`${route.kind}:${route.route}:${route.file}`, route);
  }

  return [...byKey.values()].sort(
    (a, b) => a.route.localeCompare(b.route) || a.kind.localeCompare(b.kind)
  );
}

function main(): void {
  const routes = dedupe([
    ...discoverNextAppRouterRoutes(),
    ...discoverEdgeFunctions(),
    ...discoverRpcAndInternal(),
  ]);

  const outputPath = path.join(repoRoot, "security", "route-registry.json");
  mkdirSync(path.dirname(outputPath), { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    totalRoutes: routes.length,
    routes,
  };

  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Generated ${routes.length} routes -> ${path.relative(repoRoot, outputPath)}`);
}

main();
