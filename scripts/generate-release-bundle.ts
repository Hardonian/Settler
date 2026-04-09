#!/usr/bin/env tsx
/**
 * generate-release-bundle.ts
 *
 * Produces a deterministic release evidence bundle at security/release-bundle/.
 *
 * The bundle captures:
 *   - All security verification artifacts from the current run
 *   - A provenance manifest linking artifacts to commit + CI run
 *   - SHA256 checksums of every file in the bundle
 *   - Build environment metadata
 *   - Aggregated verification results
 *
 * Exits non-zero if any required artifact is missing.
 *
 * Usage:
 *   pnpm run generate-release-bundle
 *   BUNDLE_REQUIRE_COMPLETE=1 pnpm run generate-release-bundle  (fail on partial)
 */

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const BUNDLE_SCHEMA_VERSION = "1.0";
const BUNDLE_TYPE = "release-evidence";

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, "security", "evidence");
const bundleDir = path.join(repoRoot, "security", "release-bundle");

mkdirSync(bundleDir, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256File(absPath: string): string {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex");
}

function sha256String(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function safeReadJson(absPath: string): unknown {
  try {
    return JSON.parse(readFileSync(absPath, "utf8"));
  } catch {
    return null;
  }
}

function runCommand(cmd: string): string {
  try {
    return execSync(cmd, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Environment metadata
// ---------------------------------------------------------------------------

function collectGitMetadata(): {
  commitSha: string;
  branch: string;
  tag: string | null;
  ref: string;
} {
  const commitSha = runCommand("git rev-parse HEAD");
  const ref =
    process.env.GITHUB_REF ??
    runCommand("git symbolic-ref HEAD 2>/dev/null || git rev-parse --short HEAD");
  const branch =
    process.env.GITHUB_HEAD_REF ??
    process.env.GITHUB_REF_NAME ??
    runCommand("git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown");
  const tag = process.env.GITHUB_REF?.startsWith("refs/tags/")
    ? process.env.GITHUB_REF.replace("refs/tags/", "")
    : runCommand("git describe --exact-match --tags HEAD 2>/dev/null || echo ''") || null;

  return { commitSha, branch, tag: tag || null, ref };
}

function collectCIMetadata(): {
  runId: string | null;
  runUrl: string | null;
  workflowName: string | null;
  actor: string | null;
  repository: string | null;
  eventName: string | null;
  runAttempt: string | null;
} {
  const runId = process.env.GITHUB_RUN_ID ?? null;
  const repository = process.env.GITHUB_REPOSITORY ?? null;
  const runUrl =
    runId && repository ? `https://github.com/${repository}/actions/runs/${runId}` : null;

  return {
    runId,
    runUrl,
    workflowName: process.env.GITHUB_WORKFLOW ?? null,
    actor: process.env.GITHUB_ACTOR ?? null,
    repository,
    eventName: process.env.GITHUB_EVENT_NAME ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  };
}

function collectBuildEnvironment(): {
  nodeVersion: string;
  pnpmVersion: string;
  platform: string;
  arch: string;
} {
  return {
    nodeVersion: process.version,
    pnpmVersion: runCommand("pnpm --version 2>/dev/null || echo unknown"),
    platform: process.platform,
    arch: process.arch,
  };
}

// ---------------------------------------------------------------------------
// Artifact collection
// ---------------------------------------------------------------------------

interface ArtifactEntry {
  bundleFile: string; // filename within the bundle
  sourcePath: string; // absolute path to source
  sourceRel: string; // source path relative to repo root
  required: boolean;
  present: boolean;
}

function collectArtifact(sourceRel: string, bundleFile: string, required = true): ArtifactEntry {
  const sourcePath = path.join(repoRoot, sourceRel);
  const present = existsSync(sourcePath);
  if (present) {
    copyFileSync(sourcePath, path.join(bundleDir, bundleFile));
  }
  return { bundleFile, sourcePath, sourceRel, required, present };
}

// ---------------------------------------------------------------------------
// Verification result aggregation
// ---------------------------------------------------------------------------

function aggregateVerificationResults(artifacts: ArtifactEntry[]): {
  overallStatus: "pass" | "partial" | "fail";
  completeness: "complete" | "partial";
  degradedChecks: Record<string, boolean>;
  checks: Record<string, unknown>;
} {
  function readBundle(filename: string): unknown {
    const p = path.join(bundleDir, filename);
    return existsSync(p) ? safeReadJson(p) : null;
  }

  const routeRegistry = readBundle("route-registry.json") as Record<string, unknown> | null;
  const tenantCoverage = readBundle("tenant-coverage.json") as Record<string, unknown> | null;
  const crossTenant = readBundle("cross-tenant-results.json") as Record<string, unknown> | null;
  const headerProbe = readBundle("header-probe.json") as Record<string, unknown> | null;
  const depAudit = readBundle("dependency-audit.json") as Record<string, unknown> | null;

  const degradedChecks: Record<string, boolean> = {
    tenantCoverage: Boolean((tenantCoverage as Record<string, unknown>)?.degraded),
    crossTenant: (crossTenant as Record<string, unknown>)?.status !== "passed",
    headerProbe: Boolean((headerProbe as Record<string, unknown>)?.degraded),
    dependencyAudit: Boolean((depAudit as Record<string, unknown>)?.degraded),
  };

  const anyDegraded = Object.values(degradedChecks).some(Boolean);
  const missingRequired = artifacts.filter((a) => a.required && !a.present);
  const completeness: "complete" | "partial" =
    anyDegraded || missingRequired.length > 0 ? "partial" : "complete";

  // Determine cross-tenant status
  const crossTenantStatus =
    ((crossTenant as Record<string, unknown>)?.status as string | null) ?? null;
  const crossTenantPassed = crossTenantStatus === "passed";

  const overallStatus: "pass" | "partial" | "fail" =
    missingRequired.length > 0
      ? "fail"
      : anyDegraded
        ? "partial"
        : crossTenantPassed
          ? "pass"
          : "fail";

  const checks: Record<string, unknown> = {
    routeRegistry: routeRegistry
      ? {
          status: "pass",
          totalRoutes: (routeRegistry as Record<string, unknown>).totalRoutes ?? null,
          generatedAt: (routeRegistry as Record<string, unknown>).generatedAt ?? null,
        }
      : { status: "missing" },

    tenantCoverage: tenantCoverage
      ? {
          status: degradedChecks.tenantCoverage ? "degraded" : "pass",
          verified: (tenantCoverage as Record<string, unknown>).verifiedRoutes ?? null,
          tenantScoped: (tenantCoverage as Record<string, unknown>).tenantScopedRoutes ?? null,
          missingCount:
            ((tenantCoverage as Record<string, unknown>).missingRoutes as unknown[])?.length ?? 0,
          degraded: degradedChecks.tenantCoverage,
        }
      : { status: "missing" },

    crossTenant: crossTenant
      ? {
          status: crossTenantPassed ? "pass" : "fail",
          exitCode: (crossTenant as Record<string, unknown>).exitCode ?? null,
          degraded: degradedChecks.crossTenant,
        }
      : { status: "missing" },

    headerProbe: headerProbe
      ? {
          status: degradedChecks.headerProbe ? "degraded" : "pass",
          failedChecks:
            ((headerProbe as Record<string, unknown>).counts as Record<string, number>)?.failed ??
            null,
          probeableRoutes:
            ((headerProbe as Record<string, unknown>).coverage as Record<string, number>)
              ?.probeableRoutes ?? null,
          degraded: degradedChecks.headerProbe,
          degradedReasons: (headerProbe as Record<string, unknown>).degradedReasons ?? null,
        }
      : { status: "missing" },

    dependencyAudit: depAudit
      ? {
          status: degradedChecks.dependencyAudit ? "degraded" : "pass",
          outcome: (depAudit as Record<string, unknown>).finalOutcome ?? null,
          degraded: degradedChecks.dependencyAudit,
          degradedReasons: (depAudit as Record<string, unknown>).degradedReasons ?? null,
          findings: (depAudit as Record<string, unknown>).findingsSummary ?? null,
        }
      : { status: "missing" },
  };

  return { overallStatus, completeness, degradedChecks, checks };
}

// ---------------------------------------------------------------------------
// Checksum generation
// ---------------------------------------------------------------------------

// Control files that must never appear in the manifest.checksums map.
// - manifest.json cannot contain its own hash (circular dependency)
// - checksums.txt cannot contain its own hash (circular dependency)
// Both are verified separately by the verifier using checksums.txt itself.
const CONTROL_FILES = new Set(["manifest.json", "checksums.txt"]);

function computeBundleDataChecksums(): Array<{ file: string; sha256: string }> {
  const files = readdirSync(bundleDir)
    .filter((f) => !f.startsWith(".") && !CONTROL_FILES.has(f))
    .sort();

  return files.map((filename) => ({
    file: filename,
    sha256: sha256File(path.join(bundleDir, filename)),
  }));
}

function computeAllBundleChecksums(): Array<{ file: string; sha256: string }> {
  const files = readdirSync(bundleDir)
    .filter((f) => !f.startsWith(".") && f !== "checksums.txt")
    .sort();

  return files.map((filename) => ({
    file: filename,
    sha256: sha256File(path.join(bundleDir, filename)),
  }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("[generate-release-bundle] Starting release evidence bundle generation");

// Step 1: Collect artifacts from security/evidence/
const artifacts: ArtifactEntry[] = [
  collectArtifact("security/evidence/route-registry.json", "route-registry.json", true),
  collectArtifact("security/evidence/tenant-coverage.json", "tenant-coverage.json", true),
  collectArtifact("security/evidence/cross-tenant-results.json", "cross-tenant-results.json", true),
  collectArtifact("security/evidence/header-probe.json", "header-probe.json", true),
  collectArtifact("security/evidence/dependency-audit.json", "dependency-audit.json", true),
  collectArtifact("security/evidence/security-summary.md", "security-summary.md", false),
];

// Check for missing required artifacts
const missingRequired = artifacts.filter((a) => a.required && !a.present);
if (missingRequired.length > 0) {
  console.error("[generate-release-bundle] FATAL: Missing required security artifacts:");
  for (const a of missingRequired) {
    console.error(`  - ${a.sourceRel} (required)`);
  }
  console.error(
    "[generate-release-bundle] Run 'pnpm run security:evidence' first to produce these artifacts."
  );
  process.exit(1);
}

// Step 2: Collect metadata
const generatedAt = new Date().toISOString();
const gitMeta = collectGitMetadata();
const ciMeta = collectCIMetadata();
const buildEnv = collectBuildEnvironment();

// Step 3: Aggregate verification results
const { overallStatus, completeness, degradedChecks, checks } =
  aggregateVerificationResults(artifacts);

// Step 4: Write build-metadata.json
const buildMetadata = {
  generatedAt,
  bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
  environment: buildEnv,
  git: gitMeta,
  ci: ciMeta,
};

writeFileSync(path.join(bundleDir, "build-metadata.json"), JSON.stringify(buildMetadata, null, 2));

// Step 5: Write verification-results.json
const verificationResults = {
  generatedAt,
  commitSha: gitMeta.commitSha,
  ciRunId: ciMeta.runId,
  overallStatus,
  completeness,
  degradedChecks,
  checks,
  missingRequiredArtifacts: missingRequired.map((a) => a.sourceRel),
};

writeFileSync(
  path.join(bundleDir, "verification-results.json"),
  JSON.stringify(verificationResults, null, 2)
);

// Step 6: Compute checksums of DATA files only.
// manifest.json and checksums.txt are excluded here — they cannot contain their
// own hashes (circular dependency). The verifier cross-checks via checksums.txt.
const checksumEntries = computeBundleDataChecksums();

const checksumMap: Record<string, string> = {};
for (const entry of checksumEntries) {
  checksumMap[entry.file] = entry.sha256;
}

// Step 7: Build manifest.json
const manifest = {
  schemaVersion: BUNDLE_SCHEMA_VERSION,
  bundleType: BUNDLE_TYPE,
  generatedAt,
  git: gitMeta,
  ci: ciMeta,
  environment: buildEnv,
  policy: {
    auditMode: process.env.SECURITY_AUDIT_MODE ?? "strict",
    headerProbeStrict: process.env.SECURITY_HEADER_PROBE_STRICT === "1",
    headerProbeAllowDegraded: process.env.SECURITY_HEADER_PROBE_ALLOW_DEGRADED === "1",
    requireComplete: process.env.BUNDLE_REQUIRE_COMPLETE === "1",
  },
  completeness,
  overallStatus,
  degradedChecks,
  artifacts: artifacts.map((a) => ({
    bundleFile: a.bundleFile,
    source: a.sourceRel,
    required: a.required,
    present: a.present,
    sha256: a.present ? (checksumMap[a.bundleFile] ?? null) : null,
  })),
  checksumAlgorithm: "sha256",
  checksums: checksumMap,
};

const manifestContent = JSON.stringify(manifest, null, 2);
const manifestPath = path.join(bundleDir, "manifest.json");
writeFileSync(manifestPath, manifestContent);

// Step 8: Recompute checksums including manifest.json (but still excluding checksums.txt itself)
const allChecksums = computeAllBundleChecksums();

// Step 9: Write checksums.txt in standard sha256sum format
// Files are relative to bundle root so `cd security/release-bundle && sha256sum -c checksums.txt` works
const checksumsTxtLines = allChecksums
  .filter((e) => e.file !== "checksums.txt") // exclude self
  .map((e) => `${e.sha256}  ${e.file}`);

const checksumsTxtContent = checksumsTxtLines.join("\n") + "\n";
writeFileSync(path.join(bundleDir, "checksums.txt"), checksumsTxtContent);

// Step 10: Fail if BUNDLE_REQUIRE_COMPLETE=1 and completeness is partial
if (process.env.BUNDLE_REQUIRE_COMPLETE === "1" && completeness !== "complete") {
  console.error(
    "[generate-release-bundle] FATAL: BUNDLE_REQUIRE_COMPLETE=1 but bundle completeness is 'partial'."
  );
  console.error("[generate-release-bundle] Degraded checks:");
  for (const [key, val] of Object.entries(degradedChecks)) {
    if (val) console.error(`  - ${key}: degraded`);
  }
  process.exit(1);
}

// Done
const bundleRel = path.relative(repoRoot, bundleDir);
console.log(`[generate-release-bundle] Bundle written to: ${bundleRel}/`);
console.log(`[generate-release-bundle] Commit:      ${gitMeta.commitSha}`);
console.log(`[generate-release-bundle] Branch/Tag:  ${gitMeta.tag ?? gitMeta.branch}`);
console.log(`[generate-release-bundle] CI Run:      ${ciMeta.runId ?? "local (not CI)"}`);
console.log(`[generate-release-bundle] Completeness: ${completeness}`);
console.log(`[generate-release-bundle] Overall status: ${overallStatus}`);
if (completeness !== "complete") {
  const degraded = Object.entries(degradedChecks)
    .filter(([, v]) => v)
    .map(([k]) => k);
  console.warn(`[generate-release-bundle] Degraded checks: ${degraded.join(", ")}`);
}
console.log(`[generate-release-bundle] Artifacts: ${allChecksums.length} files checksummed`);
console.log("[generate-release-bundle] Done.");
