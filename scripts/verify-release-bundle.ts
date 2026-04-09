#!/usr/bin/env tsx
/**
 * verify-release-bundle.ts
 *
 * Verifies the integrity of the release evidence bundle at security/release-bundle/.
 *
 * Verification steps:
 *   1. Checks that the bundle directory exists and is non-empty
 *   2. Checks that manifest.json and checksums.txt are present
 *   3. Recomputes SHA256 for every file listed in checksums.txt
 *   4. Compares recomputed hashes to recorded hashes (detects tampering)
 *   5. Verifies that manifest.json checksums match recomputed values
 *   6. Checks manifest schema version and required fields
 *   7. Reports all required artifacts and their presence
 *   8. Reports completeness and degraded checks
 *
 * Exits 0 on successful verification.
 * Exits 1 on any integrity failure, missing file, or checksum mismatch.
 *
 * Usage:
 *   pnpm run verify-release-bundle
 *   pnpm run verify-release-bundle -- --strict   (also fail on partial completeness)
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const repoRoot = process.cwd();
const bundleDir = path.join(repoRoot, "security", "release-bundle");
const bundleRel = path.relative(repoRoot, bundleDir);

const args = process.argv.slice(2);
const strictMode = args.includes("--strict");

let failures = 0;
let warnings = 0;

function pass(msg: string): void {
  console.log(`  [PASS] ${msg}`);
}

function fail(msg: string): void {
  console.error(`  [FAIL] ${msg}`);
  failures++;
}

function warn(msg: string): void {
  console.warn(`  [WARN] ${msg}`);
  warnings++;
}

function info(msg: string): void {
  console.log(`  [INFO] ${msg}`);
}

function sha256File(absPath: string): string {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex");
}

function readJsonFile(absPath: string): unknown {
  try {
    return JSON.parse(readFileSync(absPath, "utf8"));
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Step 1: Bundle directory existence
// ---------------------------------------------------------------------------

console.log("\n[verify-release-bundle] Verifying release evidence bundle");
console.log(`[verify-release-bundle] Bundle path: ${bundleRel}/`);
console.log("");

console.log("=== Step 1: Bundle directory ===");
if (!existsSync(bundleDir)) {
  fail(`Bundle directory does not exist: ${bundleRel}/`);
  console.error("[verify-release-bundle] Run 'pnpm run generate-release-bundle' first.");
  process.exit(1);
} else {
  pass("Bundle directory exists");
}

const bundleFiles = readdirSync(bundleDir).filter((f) => !f.startsWith("."));
if (bundleFiles.length === 0) {
  fail("Bundle directory is empty");
  process.exit(1);
} else {
  info(`Bundle contains ${bundleFiles.length} files: ${bundleFiles.sort().join(", ")}`);
}

// ---------------------------------------------------------------------------
// Step 2: Required control files
// ---------------------------------------------------------------------------

console.log("\n=== Step 2: Required control files ===");
const requiredControlFiles = ["manifest.json", "checksums.txt"];
for (const filename of requiredControlFiles) {
  const absPath = path.join(bundleDir, filename);
  if (existsSync(absPath)) {
    pass(`${filename} present`);
  } else {
    fail(`${filename} missing — bundle is incomplete or was not generated correctly`);
  }
}

if (failures > 0) {
  console.error("\n[verify-release-bundle] Cannot continue: control files missing.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 3: Recompute checksums from checksums.txt
// ---------------------------------------------------------------------------

console.log("\n=== Step 3: Checksum verification ===");

const checksumsTxtPath = path.join(bundleDir, "checksums.txt");
const checksumsTxt = readFileSync(checksumsTxtPath, "utf8");
const checksumLines = checksumsTxt
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

const recordedChecksums: Record<string, string> = {};
for (const line of checksumLines) {
  // Standard sha256sum format: "<hash>  <filename>"
  const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/);
  if (!match) {
    fail(`Malformed line in checksums.txt: ${JSON.stringify(line)}`);
    continue;
  }
  const [, hash, filename] = match;
  recordedChecksums[filename] = hash;
}

info(`checksums.txt lists ${Object.keys(recordedChecksums).length} files`);

let checksumMismatches = 0;
for (const [filename, recordedHash] of Object.entries(recordedChecksums)) {
  const absPath = path.join(bundleDir, filename);
  if (!existsSync(absPath)) {
    fail(`File listed in checksums.txt not found in bundle: ${filename}`);
    checksumMismatches++;
    continue;
  }
  const actualHash = sha256File(absPath);
  if (actualHash === recordedHash) {
    pass(`${filename}: SHA256 matches`);
  } else {
    fail(
      `${filename}: SHA256 MISMATCH\n    recorded: ${recordedHash}\n    actual:   ${actualHash}`
    );
    checksumMismatches++;
  }
}

// Also check manifest.json (not in checksums.txt, but check against manifest.checksums)
const manifestAbsPath = path.join(bundleDir, "manifest.json");
const manifestActualHash = sha256File(manifestAbsPath);
info(`manifest.json SHA256: ${manifestActualHash}`);

// ---------------------------------------------------------------------------
// Step 4: Manifest integrity
// ---------------------------------------------------------------------------

console.log("\n=== Step 4: Manifest integrity ===");

const manifest = readJsonFile(manifestAbsPath) as Record<string, unknown> | null;
if (!manifest) {
  fail("manifest.json is not valid JSON or could not be read");
  process.exit(1);
}

// Required top-level fields
const requiredManifestFields = [
  "schemaVersion",
  "bundleType",
  "generatedAt",
  "git",
  "completeness",
  "overallStatus",
  "degradedChecks",
  "artifacts",
  "checksumAlgorithm",
  "checksums",
];

for (const field of requiredManifestFields) {
  if (field in manifest) {
    pass(`manifest.json has field: ${field}`);
  } else {
    fail(`manifest.json missing required field: ${field}`);
  }
}

// Schema version check
const schemaVersion = manifest.schemaVersion as string | undefined;
if (schemaVersion !== "1.0") {
  warn(`manifest.json schemaVersion is '${schemaVersion}', expected '1.0'`);
}

// Bundle type check
if (manifest.bundleType !== "release-evidence") {
  fail(`manifest.json bundleType is '${manifest.bundleType}', expected 'release-evidence'`);
}

// Git metadata
const git = manifest.git as Record<string, unknown> | undefined;
if (git?.commitSha && typeof git.commitSha === "string" && git.commitSha !== "unknown") {
  pass(`manifest.json commit SHA present: ${git.commitSha}`);
} else {
  warn("manifest.json commit SHA is missing or unknown");
}

// CI linkage
const ci = manifest.ci as Record<string, unknown> | undefined;
if (ci?.runId) {
  pass(`manifest.json CI run ID present: ${ci.runId}`);
} else {
  warn("manifest.json CI run ID is null — bundle was generated locally, not in CI");
}

// Verify manifest.checksums match our recomputed values
console.log("\n=== Step 5: Cross-reference manifest.checksums vs recomputed ===");

const manifestChecksums = manifest.checksums as Record<string, string> | undefined;
if (!manifestChecksums || typeof manifestChecksums !== "object") {
  fail("manifest.json checksums field is missing or not an object");
} else {
  for (const [filename, recordedHash] of Object.entries(manifestChecksums)) {
    const absPath = path.join(bundleDir, filename);
    if (!existsSync(absPath)) {
      fail(`manifest.checksums references missing file: ${filename}`);
      continue;
    }
    const actualHash = sha256File(absPath);
    if (actualHash === recordedHash) {
      pass(`manifest.checksums[${filename}] matches recomputed hash`);
    } else {
      fail(
        `manifest.checksums[${filename}] MISMATCH\n    manifest: ${recordedHash}\n    actual:   ${actualHash}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Step 6: Required artifact presence
// ---------------------------------------------------------------------------

console.log("\n=== Step 6: Required artifact presence ===");

const artifacts = manifest.artifacts as
  | Array<{
      bundleFile: string;
      required: boolean;
      present: boolean;
      sha256: string | null;
    }>
  | undefined;

if (!Array.isArray(artifacts)) {
  fail("manifest.json artifacts field is missing or not an array");
} else {
  for (const artifact of artifacts) {
    const absPath = path.join(bundleDir, artifact.bundleFile);
    const actuallyPresent = existsSync(absPath);

    if (artifact.required && !actuallyPresent) {
      fail(`Required artifact missing: ${artifact.bundleFile}`);
    } else if (artifact.required && actuallyPresent) {
      pass(`Required artifact present: ${artifact.bundleFile}`);
    } else if (!artifact.required && !actuallyPresent) {
      info(`Optional artifact absent: ${artifact.bundleFile}`);
    } else {
      info(`Optional artifact present: ${artifact.bundleFile}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 7: Completeness and degraded checks
// ---------------------------------------------------------------------------

console.log("\n=== Step 7: Completeness and verification status ===");

const completeness = manifest.completeness as string | undefined;
const overallStatus = manifest.overallStatus as string | undefined;
const degradedChecks = manifest.degradedChecks as Record<string, boolean> | undefined;

info(`Completeness: ${completeness ?? "unknown"}`);
info(`Overall status: ${overallStatus ?? "unknown"}`);

if (completeness === "complete") {
  pass("Bundle is complete — no degraded checks");
} else if (completeness === "partial") {
  warn("Bundle is partial — some checks ran in degraded mode");
  if (degradedChecks) {
    for (const [check, isDegraded] of Object.entries(degradedChecks)) {
      if (isDegraded) {
        warn(`  Degraded check: ${check}`);
      }
    }
  }
  if (strictMode) {
    fail("--strict mode: bundle completeness is 'partial', treating as failure");
  }
} else {
  warn(`Unknown completeness value: ${completeness}`);
}

if (overallStatus === "fail") {
  fail("Bundle overall status is 'fail' — required checks did not pass");
} else if (overallStatus === "partial") {
  warn("Bundle overall status is 'partial' — some checks degraded");
} else if (overallStatus === "pass") {
  pass("Bundle overall status: pass");
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n=== Verification Summary ===");
console.log(`  Failures: ${failures}`);
console.log(`  Warnings: ${warnings}`);

if (failures > 0) {
  console.error(`\n[verify-release-bundle] FAILED: ${failures} failure(s) detected.`);
  console.error("[verify-release-bundle] The release evidence bundle has integrity issues.");
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n[verify-release-bundle] PASSED with ${warnings} warning(s).`);
  console.warn("[verify-release-bundle] Bundle integrity is verified. Review warnings above.");
} else {
  console.log(
    "\n[verify-release-bundle] PASSED: Bundle integrity verified. No failures, no warnings."
  );
}
