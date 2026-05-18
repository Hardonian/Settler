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

class ReleaseBundleVerifier {
  private repoRoot: string;
  private bundleDir: string;
  private bundleRel: string;
  private strictMode: boolean;
  private failures = 0;
  private warnings = 0;

  constructor() {
    this.repoRoot = process.cwd();
    this.bundleDir = path.join(this.repoRoot, "security", "release-bundle");
    this.bundleRel = path.relative(this.repoRoot, this.bundleDir);
    const args = process.argv.slice(2);
    this.strictMode = args.includes("--strict");
  }

  private pass(msg: string): void {
    console.info(`  [PASS] ${msg}`);
  }

  private fail(msg: string): void {
    console.error(`  [FAIL] ${msg}`);
    this.failures++;
  }

  private warn(msg: string): void {
    console.warn(`  [WARN] ${msg}`);
    this.warnings++;
  }

  private info(msg: string): void {
    console.info(`  [INFO] ${msg}`);
  }

  private sha256File(absPath: string): string {
    return createHash("sha256").update(readFileSync(absPath)).digest("hex");
  }

  private readJsonFile(absPath: string): unknown {
    try {
      return JSON.parse(readFileSync(absPath, "utf8"));
    } catch {
      return null;
    }
  }

  private verifyDirectoryExistence(): void {
    console.info("\n[verify-release-bundle] Verifying release evidence bundle");
    console.info(`[verify-release-bundle] Bundle path: ${this.bundleRel}/`);
    console.info("");

    console.info("=== Step 1: Bundle directory ===");
    if (!existsSync(this.bundleDir)) {
      this.fail(`Bundle directory does not exist: ${this.bundleRel}/`);
      console.error("[verify-release-bundle] Run 'pnpm run generate-release-bundle' first.");
      process.exit(1);
    } else {
      this.pass("Bundle directory exists");
    }

    const bundleFiles = readdirSync(this.bundleDir).filter((f) => !f.startsWith("."));
    if (bundleFiles.length === 0) {
      this.fail("Bundle directory is empty");
      process.exit(1);
    } else {
      this.info(`Bundle contains ${bundleFiles.length} files: ${bundleFiles.sort().join(", ")}`);
    }
  }

  private verifyControlFiles(): void {
    console.info("\n=== Step 2: Required control files ===");
    const requiredControlFiles = ["manifest.json", "checksums.txt"];
    for (const filename of requiredControlFiles) {
      const absPath = path.join(this.bundleDir, filename);
      if (existsSync(absPath)) {
        this.pass(`${filename} present`);
      } else {
        this.fail(`${filename} missing — bundle is incomplete or was not generated correctly`);
      }
    }

    if (this.failures > 0) {
      console.error("\n[verify-release-bundle] Cannot continue: control files missing.");
      process.exit(1);
    }
  }

  private verifyChecksumsTxt(): void {
    console.info("\n=== Step 3: Checksum verification ===");

    const checksumsTxtPath = path.join(this.bundleDir, "checksums.txt");
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
        this.fail(`Malformed line in checksums.txt: ${JSON.stringify(line)}`);
        continue;
      }
      const [, hash, filename] = match;
      recordedChecksums[filename] = hash;
    }

    this.info(`checksums.txt lists ${Object.keys(recordedChecksums).length} files`);

    for (const [filename, recordedHash] of Object.entries(recordedChecksums)) {
      const absPath = path.join(this.bundleDir, filename);
      if (!existsSync(absPath)) {
        this.fail(`File listed in checksums.txt not found in bundle: ${filename}`);
        continue;
      }
      const actualHash = this.sha256File(absPath);
      if (actualHash === recordedHash) {
        this.pass(`${filename}: SHA256 matches`);
      } else {
        this.fail(
          `${filename}: SHA256 MISMATCH\n    recorded: ${recordedHash}\n    actual:   ${actualHash}`
        );
      }
    }

    // Also check manifest.json (not in checksums.txt, but check against manifest.checksums)
    const manifestAbsPath = path.join(this.bundleDir, "manifest.json");
    const manifestActualHash = this.sha256File(manifestAbsPath);
    this.info(`manifest.json SHA256: ${manifestActualHash}`);
  }

  private verifyManifestIntegrity(manifestAbsPath: string): Record<string, unknown> {
    console.info("\n=== Step 4: Manifest integrity ===");

    const manifest = this.readJsonFile(manifestAbsPath) as Record<string, unknown> | null;
    if (!manifest) {
      this.fail("manifest.json is not valid JSON or could not be read");
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
        this.pass(`manifest.json has field: ${field}`);
      } else {
        this.fail(`manifest.json missing required field: ${field}`);
      }
    }

    // Schema version check
    const schemaVersion = manifest.schemaVersion as string | undefined;
    if (schemaVersion !== "1.0") {
      this.warn(`manifest.json schemaVersion is '${schemaVersion}', expected '1.0'`);
    }

    // Bundle type check
    if (manifest.bundleType !== "release-evidence") {
      this.fail(
        `manifest.json bundleType is '${manifest.bundleType}', expected 'release-evidence'`
      );
    }

    // Git metadata
    const git = manifest.git as Record<string, unknown> | undefined;
    if (git?.commitSha && typeof git.commitSha === "string" && git.commitSha !== "unknown") {
      this.pass(`manifest.json commit SHA present: ${git.commitSha}`);
    } else {
      this.warn("manifest.json commit SHA is missing or unknown");
    }

    // CI linkage
    const ci = manifest.ci as Record<string, unknown> | undefined;
    if (ci?.runId) {
      this.pass(`manifest.json CI run ID present: ${ci.runId}`);
    } else {
      this.warn("manifest.json CI run ID is null — bundle was generated locally, not in CI");
    }
    return manifest;
  }

  private verifyManifestChecksums(manifest: Record<string, unknown>): void {
    console.info("\n=== Step 5: Cross-reference manifest.checksums vs recomputed ===");

    const manifestChecksums = manifest.checksums as Record<string, string> | undefined;
    if (!manifestChecksums || typeof manifestChecksums !== "object") {
      this.fail("manifest.json checksums field is missing or not an object");
    } else {
      for (const [filename, recordedHash] of Object.entries(manifestChecksums)) {
        const absPath = path.join(this.bundleDir, filename);
        if (!existsSync(absPath)) {
          this.fail(`manifest.checksums references missing file: ${filename}`);
          continue;
        }
        const actualHash = this.sha256File(absPath);
        if (actualHash === recordedHash) {
          this.pass(`manifest.checksums[${filename}] matches recomputed hash`);
        } else {
          this.fail(
            `manifest.checksums[${filename}] MISMATCH\n    manifest: ${recordedHash}\n    actual:   ${actualHash}`
          );
        }
      }
    }
  }

  private verifyArtifactPresence(manifest: Record<string, unknown>): void {
    console.info("\n=== Step 6: Required artifact presence ===");

    const artifacts = manifest.artifacts as
      | Array<{
          bundleFile: string;
          required: boolean;
          present: boolean;
          sha256: string | null;
        }>
      | undefined;

    if (!Array.isArray(artifacts)) {
      this.fail("manifest.json artifacts field is missing or not an array");
    } else {
      for (const artifact of artifacts) {
        const absPath = path.join(this.bundleDir, artifact.bundleFile);
        const actuallyPresent = existsSync(absPath);

        if (artifact.required && !actuallyPresent) {
          this.fail(`Required artifact missing: ${artifact.bundleFile}`);
        } else if (artifact.required && actuallyPresent) {
          this.pass(`Required artifact present: ${artifact.bundleFile}`);
        } else if (!artifact.required && !actuallyPresent) {
          this.info(`Optional artifact absent: ${artifact.bundleFile}`);
        } else {
          this.info(`Optional artifact present: ${artifact.bundleFile}`);
        }
      }
    }
  }

  private verifyCompleteness(manifest: Record<string, unknown>): void {
    console.info("\n=== Step 7: Completeness and verification status ===");

    const completeness = manifest.completeness as string | undefined;
    const overallStatus = manifest.overallStatus as string | undefined;
    const degradedChecks = manifest.degradedChecks as Record<string, boolean> | undefined;

    this.info(`Completeness: ${completeness ?? "unknown"}`);
    this.info(`Overall status: ${overallStatus ?? "unknown"}`);

    if (completeness === "complete") {
      this.pass("Bundle is complete — no degraded checks");
    } else if (completeness === "partial") {
      this.warn("Bundle is partial — some checks ran in degraded mode");
      if (degradedChecks) {
        for (const [check, isDegraded] of Object.entries(degradedChecks)) {
          if (isDegraded) {
            this.warn(`  Degraded check: ${check}`);
          }
        }
      }
      if (this.strictMode) {
        this.fail("--strict mode: bundle completeness is 'partial', treating as failure");
      }
    } else {
      this.warn(`Unknown completeness value: ${completeness}`);
    }

    if (overallStatus === "fail") {
      this.fail("Bundle overall status is 'fail' — required checks did not pass");
    } else if (overallStatus === "partial") {
      this.warn("Bundle overall status is 'partial' — some checks degraded");
    } else if (overallStatus === "pass") {
      this.pass("Bundle overall status: pass");
    }
  }

  public verify(): void {
    this.verifyDirectoryExistence();
    this.verifyControlFiles();
    this.verifyChecksumsTxt();

    const manifestAbsPath = path.join(this.bundleDir, "manifest.json");
    const manifest = this.verifyManifestIntegrity(manifestAbsPath);
    this.verifyManifestChecksums(manifest);
    this.verifyArtifactPresence(manifest);
    this.verifyCompleteness(manifest);

    console.info("\n=== Verification Summary ===");
    console.info(`  Failures: ${this.failures}`);
    console.info(`  Warnings: ${this.warnings}`);

    if (this.failures > 0) {
      console.error(`\n[verify-release-bundle] FAILED: ${this.failures} failure(s) detected.`);
      console.error("[verify-release-bundle] The release evidence bundle has integrity issues.");
      process.exit(1);
    } else if (this.warnings > 0) {
      console.warn(`\n[verify-release-bundle] PASSED with ${this.warnings} warning(s).`);
      console.warn("[verify-release-bundle] Bundle integrity is verified. Review warnings above.");
    } else {
      console.info(
        "\n[verify-release-bundle] PASSED: Bundle integrity verified. No failures, no warnings."
      );
    }
  }
}

new ReleaseBundleVerifier().verify();
