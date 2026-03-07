#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const baselinePath = path.join(repoRoot, "security", "baseline", "security-drift-baseline.json");
const allowUpdate = process.env.SECURITY_BASELINE_UPDATE === "1";

function readJson(relPath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relPath), "utf8"));
}

function listDiff(before = [], after = []) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    added: [...afterSet].filter((entry) => !beforeSet.has(entry)).sort(),
    removed: [...beforeSet].filter((entry) => !afterSet.has(entry)).sort(),
  };
}

const routeRegistry = readJson("security/route-registry.json");
const tenantCoverage = readJson("artifacts/security/tenant-coverage-latest.json");
const headerProbe = readJson("artifacts/security/header-probe-latest.json");
const depAudit = readJson("artifacts/security/dependency-audit-latest.json");

const current = {
  generatedAt: new Date().toISOString(),
  verifierVersion: "2026-03-07.2",
  routeTotal: routeRegistry.totalRoutes,
  routePaths: routeRegistry.routes.map((route) => route.route).sort(),
  tenantScopedRoutes: tenantCoverage.tenantScopedRoutes,
  tenantMissingRoutes: (tenantCoverage.missingRoutes || []).map((route) => route.route).sort(),
  tenantExemptRoutes: (tenantCoverage.exemptRoutes || []).map((route) => route.route).sort(),
  headerProbe: {
    failedChecks: headerProbe.counts?.failed || 0,
    probeableRoutes: headerProbe.coverage?.probeableRoutes || 0,
    degraded: Boolean(headerProbe.degraded),
  },
  dependencyAudit: {
    outcome: depAudit.finalOutcome,
    degraded: Boolean(depAudit.degraded),
    degradedReasons: depAudit.degradedReasons || [],
  },
};

if (!existsSync(baselinePath) || allowUpdate) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, JSON.stringify(current, null, 2));
  console.log(
    `Security drift baseline ${existsSync(baselinePath) ? "updated" : "created"}: ${path.relative(repoRoot, baselinePath)}`
  );
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const diffs = [];

const routeDiff = listDiff(baseline.routePaths, current.routePaths);
if (routeDiff.added.length || routeDiff.removed.length) {
  diffs.push(
    `route surface changed: +${routeDiff.added.length} / -${routeDiff.removed.length} (review security/route-registry.json)`
  );
  routeDiff.added.slice(0, 10).forEach((route) => diffs.push(`  added route: ${route}`));
  routeDiff.removed.slice(0, 10).forEach((route) => diffs.push(`  removed route: ${route}`));
}

const missingDiff = listDiff(baseline.tenantMissingRoutes, current.tenantMissingRoutes);
if (missingDiff.added.length || missingDiff.removed.length) {
  diffs.push(
    "tenant verification missing-route set changed (review verify-tenant coverage and exemptions)"
  );
  missingDiff.added.forEach((route) => diffs.push(`  new missing tenant coverage: ${route}`));
  missingDiff.removed.forEach((route) =>
    diffs.push(`  resolved missing tenant coverage: ${route}`)
  );
}

const exemptDiff = listDiff(baseline.tenantExemptRoutes, current.tenantExemptRoutes);
if (exemptDiff.added.length || exemptDiff.removed.length) {
  diffs.push("tenant exemption surface changed (requires security review)");
  exemptDiff.added.forEach((route) => diffs.push(`  new exemption route: ${route}`));
  exemptDiff.removed.forEach((route) => diffs.push(`  removed exemption route: ${route}`));
}

if ((baseline.headerProbe?.failedChecks || 0) !== current.headerProbe.failedChecks) {
  diffs.push(
    `header probe failures changed: baseline=${baseline.headerProbe?.failedChecks || 0} current=${current.headerProbe.failedChecks}`
  );
}

if ((baseline.headerProbe?.probeableRoutes || 0) !== current.headerProbe.probeableRoutes) {
  diffs.push(
    `header probe scope changed: baseline=${baseline.headerProbe?.probeableRoutes || 0} current=${current.headerProbe.probeableRoutes}`
  );
}

if (Boolean(baseline.headerProbe?.degraded) !== current.headerProbe.degraded) {
  diffs.push(
    `header probe degraded flag changed: baseline=${Boolean(baseline.headerProbe?.degraded)} current=${current.headerProbe.degraded}`
  );
}

if ((baseline.dependencyAudit?.outcome || "unknown") !== current.dependencyAudit.outcome) {
  diffs.push(
    `dependency audit outcome changed: baseline=${baseline.dependencyAudit?.outcome || "unknown"} current=${current.dependencyAudit.outcome}`
  );
}

if (Boolean(baseline.dependencyAudit?.degraded) !== current.dependencyAudit.degraded) {
  diffs.push(
    `dependency audit degraded flag changed: baseline=${Boolean(baseline.dependencyAudit?.degraded)} current=${current.dependencyAudit.degraded}`
  );
}

const depReasonDiff = listDiff(
  baseline.dependencyAudit?.degradedReasons || [],
  current.dependencyAudit.degradedReasons
);
if (depReasonDiff.added.length || depReasonDiff.removed.length) {
  diffs.push("dependency audit degraded reasons changed");
  depReasonDiff.added.forEach((reason) => diffs.push(`  new degraded reason: ${reason}`));
  depReasonDiff.removed.forEach((reason) => diffs.push(`  cleared degraded reason: ${reason}`));
}

if (diffs.length > 0) {
  console.error("Security drift detected:\n - " + diffs.join("\n - "));
  console.error("If intended, rerun with SECURITY_BASELINE_UPDATE=1 and commit baseline update.");
  process.exit(1);
}

console.log("✅ Security drift check passed.");
