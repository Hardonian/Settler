#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "admin-route-authz", runId);
mkdirSync(outputDir, { recursive: true });

const adminRoot = path.join(repoRoot, "packages", "web", "src", "app", "api", "admin");
const authzTokens = ["isSuperAdmin(", "requireSuperAdmin("];
const denialTokens = [
  "Forbidden",
  "Super admin access required",
  "status: 403",
  "Unauthorized",
  "status: 401",
];
const cacheDenyTokens = ["cache-control", "no-store", "private, no-store", "setCachingHeaders"];
const wrapperTokens = ["withSecurity(", "withAPISecurity(", "requireAuth: true"];

function walkRoutes(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walkRoutes(full, out);
    } else if (entry === "route.ts") {
      out.push(full);
    }
  }
}

function evaluateRoute(absPath) {
  const rel = path.relative(repoRoot, absPath).split(path.sep).join("/");
  const content = readFileSync(absPath, "utf8");

  const authToken = authzTokens.find((token) => content.includes(token));
  const wrapperToken = wrapperTokens.find((token) => content.includes(token));
  const denialToken = denialTokens.find((token) => content.includes(token));
  const cacheToken = cacheDenyTokens.find((token) => content.includes(token));

  const failures = [];
  const warnings = [];
  if (!authToken)
    failures.push("missing admin authorization primitive (isSuperAdmin/requireSuperAdmin)");
  const usesThrowingGuard = content.includes("requireSuperAdmin(");
  if (!usesThrowingGuard && !denialToken)
    failures.push("missing explicit 401/403 denial response semantics");
  if (!usesThrowingGuard && !wrapperToken)
    failures.push("missing security wrapper/requireAuth declaration");
  if (!cacheToken)
    warnings.push(
      "no explicit denial cache-control/no-store token (verify at runtime/header probe)"
    );

  return {
    routeFile: rel,
    route: rel
      .replace("packages/web/src/app", "")
      .replace(/\/route\.ts$/, "")
      .replace(/\\/g, "/"),
    status: failures.length ? "failed" : "passed",
    checks: {
      authToken: authToken || null,
      denialToken: denialToken || null,
      wrapperToken: wrapperToken || null,
      cacheToken: cacheToken || null,
    },
    failures,
    warnings,
  };
}

function main() {
  const routeFiles = [];
  walkRoutes(adminRoot, routeFiles);
  routeFiles.sort();

  const checks = routeFiles.map(evaluateRoute);
  const failed = checks.filter((item) => item.status === "failed");

  const summary = {
    generatedAt: new Date().toISOString(),
    verifierVersion: "2026-03-07.1",
    runId,
    totalAdminRoutes: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    warnings: checks.reduce((acc, item) => acc + (item.warnings?.length || 0), 0),
    checks,
    denialPolicy:
      "Unauthenticated and non-admin callers must be denied (401/403) with non-sensitive payloads and no-store cache directives.",
  };

  const summaryPath = path.join(outputDir, "admin-route-authz.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  writeFileSync(
    path.join(repoRoot, "artifacts", "security", "admin-route-authz-latest.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`Admin auth/authz artifact: ${path.relative(repoRoot, summaryPath)}`);
  console.log(
    `Admin auth/authz checks: passed=${summary.passed} failed=${summary.failed} warnings=${summary.warnings}`
  );

  if (failed.length > 0) {
    for (const item of failed) {
      console.error(`- ${item.route} (${item.routeFile})`);
      for (const failure of item.failures) {
        console.error(`  - ${failure}`);
      }
    }
    process.exit(1);
  }
}

main();
