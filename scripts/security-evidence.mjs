#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, "security", "evidence");
mkdirSync(evidenceDir, { recursive: true });

function checksum(relPath) {
  const content = readFileSync(path.join(repoRoot, relPath));
  return createHash("sha256").update(content).digest("hex");
}

function maybeCopy(fromRel, toName, required = true) {
  const from = path.join(repoRoot, fromRel);
  const toRel = path.join("security", "evidence", toName);
  if (!existsSync(from)) return { relPath: toRel, source: fromRel, present: false, required };
  copyFileSync(from, path.join(repoRoot, toRel));
  return { relPath: toRel, source: fromRel, present: true, required };
}

function runMetadata() {
  let sha = "unknown";
  try {
    sha = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
  } catch {}
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
  maybeCopy("artifacts/security/admin-route-authz-latest.json", "admin-route-authz.json"),
  maybeCopy("artifacts/security/rls-verification-latest.json", "rls-verification.json", false),
  maybeCopy("security/dependency-triage.json", "dependency-triage.json", false),
];

const missingRequired = artifacts.filter((entry) => entry.required && !entry.present);
if (missingRequired.length > 0) {
  console.error(
    "Missing required security artifacts:\n - " +
      missingRequired.map((item) => `${item.source} -> ${item.relPath}`).join("\n - ")
  );
  process.exit(1);
}

const metadata = runMetadata();
const checksums = artifacts
  .filter((entry) => entry.present)
  .map((entry) => ({ file: entry.relPath, sha256: checksum(entry.relPath) }));

const routeRegistry = safeRead("security/evidence/route-registry.json");
const tenantCoverage = safeRead("security/evidence/tenant-coverage.json");
const crossTenant = safeRead("security/evidence/cross-tenant-results.json");
const headerProbe = safeRead("security/evidence/header-probe.json");
const depAudit = safeRead("security/evidence/dependency-audit.json");
const adminAuthz = safeRead("security/evidence/admin-route-authz.json");
const rlsVerification = safeRead("security/evidence/rls-verification.json");

const degradedChecks = {
  tenantCoverage: Boolean(tenantCoverage?.degraded),
  crossTenant: crossTenant?.status !== "passed",
  headerProbe: Boolean(headerProbe?.degraded),
  dependencyAudit: Boolean(depAudit?.degraded),
  adminAuthz: (adminAuthz?.failed || 0) > 0,
  rlsVerification: rlsVerification?.proofLevel !== "live-db-confirmed",
};

const completeness = Object.values(degradedChecks).some(Boolean) ? "partial" : "complete";

const manifest = {
  ...metadata,
  verifierVersion: "2026-03-07.3",
  completeness,
  degradedChecks,
  artifacts: artifacts.map((entry) => ({
    file: entry.relPath,
    source: entry.source,
    present: entry.present,
    required: entry.required,
  })),
  checksums,
};

writeFileSync(path.join(evidenceDir, "manifest.json"), JSON.stringify(manifest, null, 2));

const summaryJson = {
  generatedAt: metadata.timestamp,
  commitSha: metadata.commitSha,
  completeness,
  degradedChecks,
  results: {
    routeRegistryTotal: routeRegistry?.totalRoutes ?? null,
    tenantCoverage: {
      verified: tenantCoverage?.verifiedRoutes ?? null,
      tenantScoped: tenantCoverage?.tenantScopedRoutes ?? null,
      missingCount: tenantCoverage?.missingRoutes?.length ?? null,
    },
    crossTenantStatus: crossTenant?.status ?? null,
    headerProbe: {
      failedChecks: headerProbe?.counts?.failed ?? null,
      probeableRoutes: headerProbe?.coverage?.probeableRoutes ?? null,
      degraded: headerProbe?.degraded ?? null,
    },
    dependencyAudit: {
      outcome: depAudit?.finalOutcome ?? null,
      degraded: depAudit?.degraded ?? null,
      reasons: depAudit?.degradedReasons ?? null,
    },
    adminAuthz: {
      totalRoutes: adminAuthz?.totalAdminRoutes ?? null,
      failed: adminAuthz?.failed ?? null,
      warnings: adminAuthz?.warnings ?? null,
    },
    rlsVerification: {
      proofLevel: rlsVerification?.proofLevel ?? "not-captured",
      status: rlsVerification?.status ?? null,
      boundary: rlsVerification?.boundary ?? null,
    },
  },
};
writeFileSync(
  path.join(evidenceDir, "security-summary.json"),
  JSON.stringify(summaryJson, null, 2)
);

const missingArtifacts = artifacts.filter((entry) => !entry.present).map((entry) => entry.relPath);
const summary = [
  "# Security Evidence Summary",
  "",
  `- Commit SHA: ${metadata.commitSha}`,
  `- Timestamp: ${metadata.timestamp}`,
  `- CI Run ID: ${metadata.ciRunId || "n/a"}`,
  `- Audit Policy Mode: ${metadata.auditMode}`,
  `- Evidence Completeness: ${completeness}`,
  "",
  "## Snapshot",
  `- Route registry total: ${routeRegistry?.totalRoutes ?? "n/a"}`,
  `- Tenant-scoped verified: ${tenantCoverage?.verifiedRoutes ?? "n/a"}/${tenantCoverage?.tenantScopedRoutes ?? "n/a"}`,
  `- Cross-tenant test status: ${crossTenant?.status ?? "n/a"}`,
  `- Header probe failed checks: ${headerProbe?.counts?.failed ?? "n/a"}`,
  `- Dependency audit outcome: ${depAudit?.finalOutcome ?? "n/a"}`,
  `- Admin route authz failures: ${adminAuthz?.failed ?? "n/a"}`,
  `- RLS proof level: ${rlsVerification?.proofLevel ?? "not-captured"}`,
  ...(missingArtifacts.length > 0
    ? [
        "",
        "## Missing Artifacts",
        ...missingArtifacts.map((f) => `- ${f} (not present in this run)`),
      ]
    : []),
  "",
  "## Boundaries",
  "- Dependency findings are authoritative only when registry audit backend is reachable.",
  "- Route classification and tenant checks are static-analysis controls; runtime tests are still required.",
  "- Header probes cover GET-accessible routes and selected error/denial paths.",
  "- RLS is live-confirmed only when DB credentials are present and the live verification script runs.",
  "",
].join("\n");

writeFileSync(path.join(evidenceDir, "security-summary.md"), summary);
console.log(`Security evidence generated at ${path.relative(repoRoot, evidenceDir)}`);
