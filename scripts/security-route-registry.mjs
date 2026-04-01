#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

function walk(dir, collector, predicate) {
  let entries = [];
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
      if (["node_modules", ".next", "dist", ".turbo", ".git", "__tests__"].includes(entry)) {
        continue;
      }
      walk(fullPath, collector, predicate);
      continue;
    }

    if (predicate(fullPath)) {
      collector.push(fullPath);
    }
  }
}

function toPosixPath(input) {
  return input.split(path.sep).join("/");
}

function readSource(absoluteFile) {
  try {
    return readFileSync(absoluteFile, "utf8");
  } catch {
    return "";
  }
}

function resolveModuleFile(baseFile, specifier) {
  const basePath = path.resolve(path.dirname(baseFile), specifier);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.mjs"),
    path.join(basePath, "index.cjs"),
  ];

  return (
    candidates.find((candidate) => {
      if (!existsSync(candidate)) return false;
      try {
        return !statSync(candidate).isDirectory();
      } catch {
        return false;
      }
    }) ?? null
  );
}

function parseRelativeImports(absoluteFile, source) {
  const imports = new Map();
  const statements = source.match(/import[\s\S]*?;/g) ?? [];

  for (const statement of statements) {
    const match = statement.match(/import\s+([\s\S]*?)\s+from\s+["'](\.[^"']+)["'];?/);
    const clause = match?.[1]?.trim();
    const specifier = match?.[2];
    if (!clause || !specifier) continue;

    const resolved = resolveModuleFile(absoluteFile, specifier);
    if (!resolved) continue;

    if (!clause.startsWith("{")) {
      const defaultImport = clause.split(",")[0]?.trim();
      if (defaultImport) {
        imports.set(defaultImport, resolved);
      }
    }

    const namedMatch = clause.match(/\{([\s\S]*?)\}/);
    if (!namedMatch?.[1]) continue;

    for (const part of namedMatch[1].split(",")) {
      const normalized = part.trim();
      if (!normalized) continue;
      const aliasParts = normalized.split(/\s+as\s+/);
      const localName = aliasParts[aliasParts.length - 1]?.trim();
      if (localName) {
        imports.set(localName, resolved);
      }
    }
  }

  return imports;
}

function normalizeRoutePath(basePath, routePath = "") {
  if (!basePath && !routePath) return "/";
  if ((routePath === "/" || routePath === "") && basePath) {
    return basePath;
  }

  const joined = path.posix.join(basePath || "/", routePath || "");
  const normalized = joined.replace(/\/+/g, "/");
  return normalized.length > 1 && normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function extractLineUseCalls(source, callerName) {
  const results = [];
  const matcher = new RegExp(
    `^${callerName}\\.use\\(\\s*(?:(['"\`])([^'"\`]+)\\1\\s*,\\s*)?(.+?)\\);\\s*$`
  );

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(matcher);
    if (!match) continue;

    const prefix = match[2] ?? "";
    const tail = match[3] ?? "";
    const identifiers = tail
      .split(",")
      .map((part) => part.trim().replace(/[);]+$/g, ""))
      .filter(Boolean);

    const targetId = identifiers.at(-1) ?? null;
    results.push({
      prefix,
      targetId,
      identifiers,
      raw: line,
    });
  }

  return results;
}

function extractExpressMethodCalls(source) {
  const routes = [];
  const methodRegex =
    /\b(app|router|v1Router|v2Router)\.(get|post|put|patch|delete|options|head)\s*\(\s*(['"`])([^'"`]+)\3/gi;

  for (const match of source.matchAll(methodRegex)) {
    routes.push({
      method: String(match[2] ?? "").toUpperCase(),
      route: match[4] ?? "/",
    });
  }

  return routes;
}

function shouldExpandExpressTarget(targetId) {
  return targetId === "options.versionRouter" || /Router$/.test(targetId ?? "");
}

function buildRouteEntry(repoRoot, route, file, methods, kind) {
  return {
    route,
    kind,
    file: toPosixPath(path.relative(repoRoot, file)),
    methods: [...new Set(methods)].sort(),
  };
}

function expandRouterModule(repoRoot, absoluteFile, basePath, visited, overrides = {}) {
  const visitKey = `${absoluteFile}:${basePath}`;
  if (visited.has(visitKey)) {
    return [];
  }
  visited.add(visitKey);

  const source = readSource(absoluteFile);
  const imports = parseRelativeImports(absoluteFile, source);
  const routes = [];

  const methodCalls = extractExpressMethodCalls(source);
  if (methodCalls.length > 0) {
    const methodsByRoute = new Map();
    for (const methodCall of methodCalls) {
      const fullRoute = normalizeRoutePath(basePath, methodCall.route);
      const existing = methodsByRoute.get(fullRoute) ?? new Set();
      existing.add(methodCall.method);
      methodsByRoute.set(fullRoute, existing);
    }

    for (const [route, methodSet] of methodsByRoute.entries()) {
      routes.push(buildRouteEntry(repoRoot, route, absoluteFile, [...methodSet], "express-router"));
    }
  }

  for (const callerName of ["router", "v1Router", "v2Router"]) {
    const useCalls = extractLineUseCalls(source, callerName);
    for (const useCall of useCalls) {
      if (!shouldExpandExpressTarget(useCall.targetId)) continue;

      const nextBase = normalizeRoutePath(basePath, useCall.prefix || "");
      const targetFile =
        useCall.targetId === "options.versionRouter"
          ? overrides.versionRouter ?? null
          : imports.get(useCall.targetId);

      if (!targetFile) continue;
      routes.push(...expandRouterModule(repoRoot, targetFile, nextBase, visited, overrides));
    }
  }

  return routes;
}

function discoverNextAppRouterRoutes(repoRoot) {
  const apiRoot = path.join(repoRoot, "packages", "web", "src", "app");
  const files = [];
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

    const source = readSource(absoluteFile);
    const methods = HTTP_METHODS.filter((method) => {
      const functionExport = new RegExp(`export\\s+async\\s+function\\s+${method}\\b`);
      const constExport = new RegExp(`export\\s+const\\s+${method}\\b`);
      return functionExport.test(source) || constExport.test(source);
    });

    return {
      route: normalized || "/",
      kind: "next-app-router",
      file: rel,
      methods,
    };
  });
}

function discoverEdgeFunctions(repoRoot) {
  const edgeRoot = path.join(repoRoot, "supabase", "functions");
  const files = [];
  walk(edgeRoot, files, (file) => /\/index\.ts$/.test(file));

  return files.map((absoluteFile) => {
    const rel = toPosixPath(path.relative(repoRoot, absoluteFile));
    const fnName = toPosixPath(path.relative(edgeRoot, path.dirname(absoluteFile)));
    return {
      route: `/edge/${fnName}`,
      kind: "edge-function",
      file: rel,
      methods: [],
    };
  });
}

function discoverRpcAndInternal(repoRoot) {
  const results = [];
  const packageRoot = path.join(repoRoot, "packages");
  const packageEntries = existsSync(packageRoot) ? readdirSync(packageRoot, { withFileTypes: true }) : [];
  const roots = packageEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packageRoot, entry.name, "src"))
    .filter((entry) => existsSync(entry));

  roots.push(path.join(repoRoot, "scripts"));

  const files = [];
  for (const root of roots) {
    walk(root, files, (file) => /\.(ts|tsx|js|mjs|cjs)$/.test(file));
  }

  for (const absoluteFile of files) {
    const rel = toPosixPath(path.relative(repoRoot, absoluteFile));
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
        methods: [],
      });
    }
  }

  return results;
}

export function discoverExpressRoutes(repoRoot) {
  const indexFile = path.join(repoRoot, "packages", "api", "src", "index.ts");
  if (!existsSync(indexFile)) {
    return [];
  }

  const source = readSource(indexFile);
  const imports = parseRelativeImports(indexFile, source);
  const routes = [];
  const visited = new Set();

  for (const methodCall of extractExpressMethodCalls(source)) {
    routes.push(
      buildRouteEntry(repoRoot, normalizeRoutePath("", methodCall.route), indexFile, [methodCall.method], "express-router")
    );
  }

  const protectedMounts = extractLineUseCalls(source, "router");
  const protectedDefinitions = protectedMounts.filter((call) => shouldExpandExpressTarget(call.targetId));

  const protectedRouterConfig = new Map([
    ["v1ProtectedRouter", { basePath: "/api/v1", versionRouter: imports.get("v1Router") ?? null }],
    ["v2ProtectedRouter", { basePath: "/api/v2", versionRouter: imports.get("v2Router") ?? null }],
  ]);

  for (const appUse of extractLineUseCalls(source, "app")) {
    const targetId = appUse.targetId;
    if (!targetId) continue;

    if (protectedRouterConfig.has(targetId)) {
      const config = protectedRouterConfig.get(targetId);
      for (const definition of protectedDefinitions) {
        const nextBase = normalizeRoutePath(config.basePath, definition.prefix || "");
        const targetFile =
          definition.targetId === "options.versionRouter"
            ? config.versionRouter
            : imports.get(definition.targetId);
        if (!targetFile) continue;
        routes.push(
          ...expandRouterModule(repoRoot, targetFile, nextBase, visited, {
            versionRouter: config.versionRouter,
          })
        );
      }
      continue;
    }

    if (!shouldExpandExpressTarget(targetId)) continue;

    const targetFile = imports.get(targetId);
    if (!targetFile) continue;
    routes.push(
      ...expandRouterModule(
        repoRoot,
        targetFile,
        normalizeRoutePath("", appUse.prefix || ""),
        visited
      )
    );
  }

  return routes;
}

function dedupe(routes) {
  const byKey = new Map();
  for (const route of routes) {
    byKey.set(
      `${route.kind}:${route.route}:${route.file}:${route.methods.join(",")}`,
      route
    );
  }

  return [...byKey.values()].sort(
    (a, b) =>
      a.route.localeCompare(b.route) ||
      a.kind.localeCompare(b.kind) ||
      a.file.localeCompare(b.file)
  );
}

export function discoverRouteRegistry(repoRoot = process.cwd()) {
  return dedupe([
    ...discoverNextAppRouterRoutes(repoRoot),
    ...discoverExpressRoutes(repoRoot),
    ...discoverEdgeFunctions(repoRoot),
    ...discoverRpcAndInternal(repoRoot),
  ]);
}

export function writeRouteRegistry(repoRoot = process.cwd()) {
  const routes = discoverRouteRegistry(repoRoot);
  const outputPaths = [
    path.join(repoRoot, "artifacts", "security", "route-registry.json"),
    path.join(repoRoot, "security", "route-registry.json"),
  ];

  for (const outputPath of outputPaths) {
    mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    totalRoutes: routes.length,
    routes,
  };

  for (const outputPath of outputPaths) {
    writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }

  return {
    totalRoutes: routes.length,
    outputPaths: outputPaths.map((outputPath) => path.relative(repoRoot, outputPath)),
  };
}

function isMain() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMain()) {
  const result = writeRouteRegistry(process.cwd());
  console.log(
    `Generated ${result.totalRoutes} routes -> ${result.outputPaths.join(", ")}`
  );
}
