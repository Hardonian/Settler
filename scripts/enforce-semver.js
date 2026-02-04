#!/usr/bin/env node
/**
 * Semantic Version Enforcement Script
 *
 * Validates version bumps follow semantic versioning rules:
 * - MAJOR: Breaking changes (incompatible API changes)
 * - MINOR: New features (backward compatible)
 * - PATCH: Bug fixes (backward compatible)
 *
 * Usage:
 *   node scripts/enforce-semver.js [current-version] [new-version]
 *   node scripts/enforce-semver.js --check-commits [current-version]
 *
 * Exit codes:
 *   0 - Version bump is valid
 *   1 - Version bump violates semver rules
 *   2 - Invalid arguments
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Parse version string into components
 */
function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    raw: version,
  };
}

/**
 * Compare two versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;

  // Prerelease versions are lower than release versions
  if (va.prerelease && !vb.prerelease) return -1;
  if (!va.prerelease && vb.prerelease) return 1;
  if (va.prerelease && vb.prerelease) {
    return va.prerelease.localeCompare(vb.prerelease);
  }

  return 0;
}

/**
 * Determine version bump type
 */
function getBumpType(current, next) {
  const vc = parseVersion(current);
  const vn = parseVersion(next);

  if (vn.major !== vc.major) return "major";
  if (vn.minor !== vc.minor) return "minor";
  if (vn.patch !== vc.patch) return "patch";
  return "none";
}

/**
 * Validate that commits since last tag follow semver rules for the bump type
 */
function validateCommitsForBump(bumpType, currentVersion) {
  try {
    // Get commits since the last tag
    const lastTag = execSync(
      `git describe --tags --abbrev=0 v${currentVersion} 2>/dev/null || echo ""`,
      {
        encoding: "utf8",
      }
    ).trim();

    const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
    const commits = execSync(`git log ${range} --pretty=format:"%s"`, {
      encoding: "utf8",
    }).trim();

    if (!commits) {
      console.warn("⚠️  No commits found since last tag");
      return { valid: true, breaking: false, features: false };
    }

    const commitLines = commits.split("\n");
    const hasBreakingChange = commitLines.some(
      (msg) =>
        msg.includes("BREAKING CHANGE:") ||
        msg.includes("BREAKING-CHANGE:") ||
        msg.startsWith("feat!:") ||
        msg.startsWith("fix!:") ||
        msg.startsWith("chore!:")
    );
    const hasFeature = commitLines.some(
      (msg) => msg.startsWith("feat:") || msg.startsWith("feat(")
    );
    const hasFix = commitLines.some((msg) => msg.startsWith("fix:") || msg.startsWith("fix("));

    // Validate bump type against commit content
    const issues = [];

    if (bumpType === "patch" && hasBreakingChange) {
      issues.push("⚠️  BREAKING CHANGE detected but only PATCH bump specified");
      issues.push("   Recommendation: Use MAJOR bump for breaking changes");
    }

    if (bumpType === "patch" && hasFeature && !hasFix) {
      issues.push("⚠️  New feature detected but only PATCH bump specified");
      issues.push("   Recommendation: Use MINOR bump for new features");
    }

    if (bumpType === "minor" && hasBreakingChange) {
      issues.push("⚠️  BREAKING CHANGE detected but only MINOR bump specified");
      issues.push("   Recommendation: Use MAJOR bump for breaking changes");
    }

    if (bumpType === "major" && !hasBreakingChange && (hasFeature || hasFix)) {
      console.log("ℹ️  MAJOR bump without explicit breaking change");
      console.log("   Ensure breaking changes are documented in CHANGELOG.md");
    }

    return {
      valid: issues.length === 0,
      breaking: hasBreakingChange,
      features: hasFeature,
      fixes: hasFix,
      issues,
    };
  } catch (error) {
    console.error("Error analyzing commits:", error.message);
    return { valid: true, breaking: false, features: false, fixes: false, issues: [] };
  }
}

/**
 * Main validation logic
 */
function validateVersionBump(current, next) {
  try {
    const vc = parseVersion(current);
    const vn = parseVersion(next);

    // Check if version actually changed
    if (current === next) {
      return { valid: false, error: "New version must be different from current version" };
    }

    // Check that version is increasing
    if (compareVersions(next, current) <= 0) {
      return {
        valid: false,
        error: `New version (${next}) must be greater than current (${current})`,
      };
    }

    const bumpType = getBumpType(current, next);

    // Validate only one component changed at a time (except for prerelease)
    let changes = 0;
    if (vn.major !== vc.major) changes++;
    if (vn.minor !== vc.minor) changes++;
    if (vn.patch !== vc.patch) changes++;

    if (changes > 1 && !vn.prerelease) {
      return {
        valid: false,
        error: `Invalid bump: multiple version components changed (${current} → ${next})`,
        recommendation: "Change only one component at a time: major, minor, or patch",
      };
    }

    // Validate commits against bump type
    const commitValidation = validateCommitsForBump(bumpType, current);

    return {
      valid: commitValidation.valid,
      bumpType,
      current: vc,
      next: vn,
      ...commitValidation,
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Print validation results
 */
function printResults(result) {
  if (!result.valid) {
    console.error("❌ Semantic Versioning Validation Failed");
    console.error("");
    if (result.error) {
      console.error(`Error: ${result.error}`);
    }
    if (result.issues && result.issues.length > 0) {
      console.error("Issues:");
      result.issues.forEach((issue) => console.error(`  ${issue}`));
    }
    if (result.recommendation) {
      console.error(`Recommendation: ${result.recommendation}`);
    }
    return 1;
  }

  console.log("✅ Semantic Versioning Validation Passed");
  console.log("");
  console.log(`Bump Type: ${result.bumpType.toUpperCase()}`);
  console.log(`Version: ${result.current.raw} → ${result.next.raw}`);
  console.log("");

  if (result.breaking) {
    console.log("⚠️  Contains breaking changes");
  }
  if (result.features) {
    console.log("✓ Contains new features");
  }
  if (result.fixes) {
    console.log("✓ Contains bug fixes");
  }

  return 0;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log("Semantic Version Enforcement Script");
    console.log("");
    console.log("Usage:");
    console.log("  node enforce-semver.js [current-version] [new-version]");
    console.log("  node enforce-semver.js --check-commits [current-version]");
    console.log("");
    console.log("Examples:");
    console.log("  node enforce-semver.js 1.0.0 1.0.1   # Patch bump");
    console.log("  node enforce-semver.js 1.0.0 1.1.0   # Minor bump");
    console.log("  node enforce-semver.js 1.0.0 2.0.0   # Major bump");
    console.log("");
    console.log("Exit codes:");
    console.log("  0 - Version bump is valid");
    console.log("  1 - Version bump violates semver rules");
    console.log("  2 - Invalid arguments");
    process.exit(0);
  }

  // Check commits mode
  if (args[0] === "--check-commits") {
    const version = args[1] || getCurrentVersion();
    const result = validateCommitsForBump("unknown", version);

    console.log("Commit Analysis");
    console.log("===============");
    console.log(`Version: ${version}`);
    console.log("");
    console.log(`Breaking changes: ${result.breaking ? "YES" : "No"}`);
    console.log(`New features: ${result.features ? "YES" : "No"}`);
    console.log(`Bug fixes: ${result.fixes ? "YES" : "No"}`);
    console.log("");

    if (result.issues.length > 0) {
      console.log("Warnings:");
      result.issues.forEach((issue) => console.log(`  ${issue}`));
    }

    process.exit(result.valid ? 0 : 1);
  }

  // Validate version bump
  if (args.length !== 2) {
    console.error("Error: Requires exactly 2 arguments (current and new version)");
    console.error("Use --help for usage information");
    process.exit(2);
  }

  const [current, next] = args;
  const result = validateVersionBump(current, next);
  const exitCode = printResults(result);
  process.exit(exitCode);
}

/**
 * Get current version from package.json
 */
function getCurrentVersion() {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return packageJson.version;
  } catch (error) {
    console.error("Error reading package.json:", error.message);
    return "0.0.0";
  }
}

// Run main
if (require.main === module) {
  main();
}

module.exports = {
  parseVersion,
  compareVersions,
  getBumpType,
  validateVersionBump,
};
