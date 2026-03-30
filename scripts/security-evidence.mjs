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

function maybeCopyAny(fromCandidates, toName, required = true) {
  for (const candidate of fromCandidates) {
    const copied = maybeCopy(candidate, toName, false);
    if (copied.present) {
      return { ...copied, required };
    }
  }
  return {
    relPath: path.join("security", "evidence", toName),
    source: fromCandidates.join(" | "),
    present: false,
    required,
  };
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
  maybeCopyAny(
    ["security/route-registry.json", "artifacts/security/route-registry.json"],
    "route-registry.json"
  ),
  maybeCopy("artifacts/security/tenant-coverage-latest.json", "tenant-coverage.json"),
  maybeCopy("artifacts/security/cross-tenant-results-latest.json", "cross-tenant-results.json"),
  maybeCopy("artifacts/security/header-probe-latest.json", "header-probe.json"),
  maybeCopy("artifacts/security/dependency-audit-latest.json", "dependency-audit.json"),
  maybeCopy("artifacts/security/admin-route-authz-latest.json", "admin-route-authz.json"),
  maybeCopy("artifacts/security/rls-verification-latest.json", "rls-verification.json", false),
  maybeCopy("security/dependency-triage.json", "dependency-triage.json", false),
  maybeCopy("security/dependency-evidence.json", "dependency-evidence.json", false),
  maybeCopy("security/rls-evidence.json", "rls-evidence.json", false),
  maybeCopy("security/security-verdict.json", "security-verdict.json", false),
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
const depTriage = safeRead("security/evidence/dependency-triage.json");
const depEvidence = safeRead("security/evidence/dependency-evidence.json");
const adminAuthz = safeRead("security/evidence/admin-route-authz.json");
const rlsVerification = safeRead("security/evidence/rls-verification.json");
const rlsEvidence = safeRead("security/evidence/rls-evidence.json");
const verdict = safeRead("security/evidence/security-verdict.json");

const headerBlockingFailures =
  headerProbe?.counts?.failedBlocking ?? headerProbe?.counts?.failed ?? 0;
const headerLimitedFindings = headerProbe?.counts?.limited ?? 0;

const dependencyTriageCompleteness = depTriage
  ? depTriage.triageComplete
    ? "complete"
    : depTriage.triageCompleteness?.blockedByMissingAuthenticatedInput
      ? "blocked-missing-authenticated-input"
      : "partial"
  : "not-captured";

const headerContractCompleteness = headerProbe?.degraded
  ? "degraded"
  : headerBlockingFailures > 0
    ? "incomplete-blocking-failures"
    : "enforced-contract-satisfied";

const rlsProofLevel = rlsVerification?.proofLevel ?? "not-captured";
const dependencyEvidenceStatus = depEvidence?.status ?? "not-captured";
const rlsEvidenceStatus = rlsEvidence?.status ?? "not-captured";

const releaseBlockingFindings = [
  ...(headerBlockingFailures > 0
    ? [
        {
          id: "header-contract-blocking-failures",
          class: "BLOCKING",
          detail: `${headerBlockingFailures} blocking header/CSP contract failures observed.`,
        },
      ]
    : []),
  ...(depTriage?.policy?.requireAuthenticatedDependabotExport === true &&
  depTriage?.sourceStatus?.authenticatedDependabotExportAvailable !== true
    ? [
        {
          id: "dependency-triage-authenticated-export-missing",
          class: "POLICY-DEPENDENT",
          detail: "Authenticated Dependabot export required by policy but missing.",
        },
      ]
    : []),
  ...(depAudit?.degraded
    ? [
        {
          id: "dependency-audit-degraded",
          class: "EXTERNAL-TOOLING",
          detail: `Dependency audit degraded: ${(depAudit?.degradedReasons || []).join(", ") || "unknown"}`,
        },
      ]
    : []),
  ...(rlsProofLevel !== "live-db-confirmed"
    ? [
        {
          id: "rls-live-proof-not-confirmed",
          class: "POLICY-DEPENDENT",
          detail: `RLS proof level is ${rlsProofLevel}.`,
        },
      ]
    : []),
];

const degradedChecks = {
  tenantCoverage: Boolean(tenantCoverage?.degraded),
  crossTenant: crossTenant?.status !== "passed",
  headerProbe: Boolean(headerProbe?.degraded) || headerBlockingFailures > 0,
  dependencyAudit: Boolean(depAudit?.degraded),
  dependencyTriage: dependencyTriageCompleteness !== "complete",
  adminAuthz: (adminAuthz?.failed || 0) > 0,
  rlsVerification: rlsProofLevel !== "live-db-confirmed",
};

const evidenceCompleteness = Object.values(degradedChecks).some(Boolean) ? "partial" : "complete";

const manifest = {
  ...metadata,
  verifierVersion: "2026-03-08.1",
  evidenceCompleteness,
  headerContractCompleteness,
  dependencyTriageCompleteness,
  dependencyEvidenceStatus,
  rlsProofLevel,
  rlsEvidenceStatus,
  releaseBlockingFindings,
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
  evidenceCompleteness,
  headerContractCompleteness,
  dependencyTriageCompleteness,
  dependencyEvidenceStatus,
  rlsProofLevel,
  rlsEvidenceStatus,
  releaseBlockingFindings,
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
      failedBlockingChecks: headerBlockingFailures,
      limitedFindings: headerLimitedFindings,
      probeableRoutes: headerProbe?.coverage?.probeableRoutes ?? null,
      degraded: headerProbe?.degraded ?? null,
    },
    dependencyAudit: {
      outcome: depAudit?.finalOutcome ?? null,
      degraded: depAudit?.degraded ?? null,
      reasons: depAudit?.degradedReasons ?? null,
    },
    dependencyTriage: {
      triageComplete: depTriage?.triageComplete ?? null,
      blockers: depTriage?.blockers?.length ?? null,
      blockedByMissingAuthenticatedInput:
        depTriage?.triageCompleteness?.blockedByMissingAuthenticatedInput ?? null,
    },
    dependencyEvidence: {
      status: depEvidence?.status ?? null,
      evidenceCompleteness: depEvidence?.evidenceCompleteness ?? null,
      advisoryStatus: depEvidence?.advisoryCompleteness?.status ?? null,
    },
    adminAuthz: {
      totalRoutes: adminAuthz?.totalAdminRoutes ?? null,
      failed: adminAuthz?.failed ?? null,
      warnings: adminAuthz?.warnings ?? null,
    },
    rlsVerification: {
      proofLevel: rlsProofLevel,
      status: rlsVerification?.status ?? null,
      boundary: rlsVerification?.boundary ?? null,
    },
    rlsEvidence: {
      status: rlsEvidence?.status ?? null,
      evidenceLevel: rlsEvidence?.evidenceLevel ?? null,
    },
    verdict: verdict?.overall ?? null,
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
  `- Evidence Completeness: ${evidenceCompleteness}`,
  `- Header Contract Completeness: ${headerContractCompleteness}`,
  `- Dependency Triage Completeness: ${dependencyTriageCompleteness}`,
  `- Dependency Evidence Status: ${dependencyEvidenceStatus}`,
  `- RLS Proof Level: ${rlsProofLevel}`,
  `- RLS Evidence Status: ${rlsEvidenceStatus}`,
  "",
  "## Snapshot",
  `- Route registry total: ${routeRegistry?.totalRoutes ?? "n/a"}`,
  `- Tenant-scoped verified: ${tenantCoverage?.verifiedRoutes ?? "n/a"}/${tenantCoverage?.tenantScopedRoutes ?? "n/a"}`,
  `- Cross-tenant test status: ${crossTenant?.status ?? "n/a"}`,
  `- Header probe blocking failures: ${headerBlockingFailures}`,
  `- Header probe limited findings: ${headerLimitedFindings}`,
  `- Dependency audit outcome: ${depAudit?.finalOutcome ?? "n/a"}`,
  `- Dependency triage complete: ${depTriage?.triageComplete ?? "n/a"}`,
  `- Admin route authz failures: ${adminAuthz?.failed ?? "n/a"}`,
  `- RLS proof level: ${rlsProofLevel}`,
  "",
  "## Release Blocking Findings",
  ...(releaseBlockingFindings.length
    ? releaseBlockingFindings.map((item) => `- [${item.class}] ${item.id}: ${item.detail}`)
    : ["- none"]),
  ...(missingArtifacts.length > 0
    ? [
        "",
        "## Missing Artifacts",
        ...missingArtifacts.map((f) => `- ${f} (not present in this run)`),
      ]
    : []),
  "",
  "## Boundaries",
  "- Enforced header/CSP failures are blocking; framework-limited/best-effort findings are non-blocking and explicitly labeled.",
  "- Dependency triage is complete only when authenticated Dependabot export is ingested.",
  "- Audit backend/tooling degradation is machine-visible in dependency-audit and releaseBlockingFindings.",
  "- RLS is live-confirmed only when DB credentials are present and live verification passes.",
  "",
].join("\n");

writeFileSync(path.join(evidenceDir, "security-summary.md"), summary);
console.log(`Security evidence generated at ${path.relative(repoRoot, evidenceDir)}`);
