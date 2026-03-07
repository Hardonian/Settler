#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, "security", "evidence");
mkdirSync(evidenceDir, { recursive: true });

function checksum(relPath) {
  const fullPath = path.join(repoRoot, relPath);
  const content = readFileSync(fullPath);
  return createHash("sha256").update(content).digest("hex");
}

function maybeCopy(fromRel, toName) {
  const from = path.join(repoRoot, fromRel);
  const toRel = path.join("security", "evidence", toName);
  if (!existsSync(from)) return { relPath: toRel, present: false };
  copyFileSync(from, path.join(repoRoot, toRel));
  return { relPath: toRel, present: true };
}

function runMetadata() {
  let sha = "unknown";
  try {
    sha = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
  } catch {
    // noop
  }
  return {
    commitSha: sha,
    timestamp: new Date().toISOString(),
    ciRunId: process.env.GITHUB_RUN_ID || null,
    auditMode: process.env.SECURITY_AUDIT_MODE || "strict",
  };
}

function safeRead(rel) {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, rel), "utf8"));
  } catch {
    return null;
  }
}

const artifacts = [
  maybeCopy("security/route-registry.json", "route-registry.json"),
  maybeCopy("artifacts/security/tenant-coverage-latest.json", "tenant-coverage.json"),
  maybeCopy("artifacts/security/cross-tenant-results-latest.json", "cross-tenant-results.json"),
  maybeCopy("artifacts/security/header-probe-latest.json", "header-probe.json"),
  maybeCopy("artifacts/security/dependency-audit-latest.json", "dependency-audit.json"),
];

const metadata = runMetadata();
const checksums = artifacts
  .filter((entry) => entry.present)
  .map((entry) => ({ file: entry.relPath, sha256: checksum(entry.relPath) }));

const manifest = {
  ...metadata,
  artifacts: artifacts.map((entry) => ({ file: entry.relPath, present: entry.present })),
  checksums,
};

writeFileSync(path.join(evidenceDir, "manifest.json"), JSON.stringify(manifest, null, 2));

const routeRegistry = safeRead("security/evidence/route-registry.json");
const tenantCoverage = safeRead("security/evidence/tenant-coverage.json");
const crossTenant = safeRead("security/evidence/cross-tenant-results.json");
const headerProbe = safeRead("security/evidence/header-probe.json");
const depAudit = safeRead("security/evidence/dependency-audit.json");

const summary = `# Security Evidence Summary\n\n- Commit SHA: ${metadata.commitSha}\n- Timestamp: ${metadata.timestamp}\n- CI Run ID: ${metadata.ciRunId || "n/a"}\n- Audit Policy Mode: ${metadata.auditMode}\n\n## Snapshot\n- Route registry total: ${routeRegistry?.totalRoutes ?? "n/a"}\n- Tenant-scoped verified: ${tenantCoverage?.verifiedRoutes ?? "n/a"}/${tenantCoverage?.tenantScopedRoutes ?? "n/a"}\n- Cross-tenant test status: ${crossTenant?.status ?? "n/a"}\n- Header probe failed checks: ${headerProbe?.counts?.failed ?? "n/a"}\n- Dependency audit outcome: ${depAudit?.finalOutcome ?? "n/a"}\n`;

writeFileSync(path.join(evidenceDir, "security-summary.md"), summary);
console.log(`Security evidence generated at ${path.relative(repoRoot, evidenceDir)}`);
