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

const headerProbeAllSkipped =
  headerProbe?.counts?.passed === 0 &&
  headerProbe?.counts?.failed === 0 &&
  (headerProbe?.counts?.skipped ?? 0) > 0;
const headerProbeNote = headerProbeAllSkipped
  ? " (SKIPPED — no build available; not a real probe result)"
  : "";

const missingArtifacts = artifacts.filter((entry) => !entry.present).map((entry) => entry.relPath);

const summary = [
  "# Security Evidence Summary",
  "",
  `- Commit SHA: ${metadata.commitSha}`,
  `- Timestamp: ${metadata.timestamp}`,
  `- CI Run ID: ${metadata.ciRunId || "n/a"}`,
  `- Audit Policy Mode: ${metadata.auditMode}`,
  "",
  "## Snapshot",
  `- Route registry total: ${routeRegistry?.totalRoutes ?? "n/a"}`,
  `- Tenant-scoped verified: ${tenantCoverage?.verifiedRoutes ?? "n/a"}/${tenantCoverage?.tenantScopedRoutes ?? "n/a"}`,
  `- Cross-tenant test status: ${crossTenant?.status ?? "n/a"}`,
  `- Header probe failed checks: ${headerProbe?.counts?.failed ?? "n/a"}${headerProbeNote}`,
  `- Dependency audit outcome: ${depAudit?.finalOutcome ?? "n/a"}`,
  ...(missingArtifacts.length > 0
    ? ["", "## Missing Artifacts", ...missingArtifacts.map((f) => `- ${f} (not present in this run)`)]
    : []),
  "",
  "## What This Evidence Pack Proves",
  "",
  "- Route surface was discovered from the live filesystem at the commit above.",
  "- Tenant-scoped routes were checked for at least one recognized isolation control token (static presence check).",
  "- Cross-tenant runtime tests were executed against the fixture test suite (pass/fail recorded).",
  "- Security headers were probed on discoverable non-parameterized API routes (if build was available).",
  "- Dependency audit was run against the production dependency tree with the stated policy mode.",
  "- All artifact files are checksummed in manifest.json to detect post-generation tampering.",
  "",
  "## What This Evidence Pack Does Not Prove",
  "",
  "- **Not a penetration test.** No active exploitation was attempted. Static token presence does not guarantee correct runtime enforcement of tenant scoping.",
  "- **Not a full DAST scan.** Header probe covers only non-parameterized static routes reachable via GET. Parameterized routes, edge functions, and authenticated flows require separate runtime validation.",
  "- **Not a complete CVE audit.** If dependency audit backend was unavailable (network restriction, registry auth), the audit outcome is recorded as unavailable, not as clean.",
  "- **Not a confirmation of RLS enforcement.** Row-Level Security policies are documented in SECURITY_INVARIANTS.md but require a live database integration test (RUN_DB_TESTS=true) to confirm.",
  "- **OSV scanner is optional.** If osv-scanner binary was absent from the runtime image, only pnpm audit results are included. CI remains authoritative for OSV coverage.",
  "- **Admin and internal routes are exempt from tenant-scoping checks.** These routes must be validated under their own auth model; this pack does not cover them.",
  "",
].join("\n");

writeFileSync(path.join(evidenceDir, "security-summary.md"), summary);
console.log(`Security evidence generated at ${path.relative(repoRoot, evidenceDir)}`);
