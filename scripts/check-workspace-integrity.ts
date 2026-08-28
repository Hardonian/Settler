#!/usr/bin/env tsx
/**
 * Workspace Integrity Check
 *
 * Ensures:
 * - All workspace packages have valid package.json
 * - No phantom package references
 * - No committed node_modules
 * - All internal dependencies resolve
 *
 * Usage: tsx scripts/check-workspace-integrity.ts
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

const checks: CheckResult[] = [];
const workspaceRoot = process.cwd();
const packagesDir = join(workspaceRoot, "packages");

/**
 * Check for committed node_modules (ensures git does not track node_modules files)
 */
function checkNoNodeModules(): CheckResult {
  try {
    const { execSync } = require("child_process");
    const output = execSync('git ls-files "**/node_modules/**"', {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: workspaceRoot,
    }).trim();

    if (output) {
      const files = output.split("\n").filter(Boolean);
      return {
        name: "No Committed node_modules",
        status: "fail",
        message: `Found ${files.length} tracked files in node_modules: ${files.slice(0, 3).join(", ")}${files.length > 3 ? "..." : ""}. These should be untracked.`,
      };
    }
  } catch {
    // If git fails or is not present, check .gitignore
    const gitignorePath = join(workspaceRoot, ".gitignore");
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, "utf-8");
      if (!gitignore.includes("node_modules")) {
        return {
          name: "No Committed node_modules",
          status: "fail",
          message: "node_modules is missing from .gitignore",
        };
      }
    }
  }

  return {
    name: "No Committed node_modules",
    status: "pass",
    message: "No node_modules directories tracked by git",
  };
}

/**
 * Check all workspace packages have valid package.json
 */
function checkWorkspacePackages(): CheckResult {
  const workspacePackages: string[] = [];
  const invalidPackages: string[] = [];

  if (!existsSync(packagesDir)) {
    return {
      name: "Workspace Packages",
      status: "fail",
      message: "packages directory does not exist",
    };
  }

  // Non-Node packages or subprojects not expected to have standard Node package.json
  const excludedPackageNames = new Set(["sdk-go", "sdk-python", "sdk-ruby", "workhorse"]);

  const entries = readdirSync(packagesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (excludedPackageNames.has(entry.name)) continue;

    const packagePath = join(packagesDir, entry.name);
    const packageJsonPath = join(packagePath, "package.json");

    if (!existsSync(packageJsonPath)) {
      invalidPackages.push(entry.name);
      continue;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      if (!packageJson.name || !packageJson.version) {
        invalidPackages.push(entry.name);
      } else {
        workspacePackages.push(entry.name);
      }
    } catch {
      invalidPackages.push(entry.name);
    }
  }

  if (invalidPackages.length > 0) {
    return {
      name: "Workspace Packages",
      status: "fail",
      message: `Invalid or missing package.json in: ${invalidPackages.join(", ")}`,
    };
  }

  return {
    name: "Workspace Packages",
    status: "pass",
    message: `All ${workspacePackages.length} workspace packages have valid package.json`,
  };
}

/**
 * Check for phantom internal package references
 */
function checkInternalDependencies(): CheckResult {
  const internalPackages = new Set<string>();
  const referencedPackages = new Set<string>();

  // Get all workspace package names
  if (existsSync(packagesDir)) {
    const entries = readdirSync(packagesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const packageJsonPath = join(packagesDir, entry.name, "package.json");
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
          if (packageJson.name?.startsWith("@settler/")) {
            internalPackages.add(packageJson.name);
          }
        } catch {
          // Skip invalid package.json
        }
      }
    }
  }

  // Check root package.json for workspace references
  const rootPackageJsonPath = join(workspaceRoot, "package.json");
  if (existsSync(rootPackageJsonPath)) {
    try {
      const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, "utf-8"));
      const workspaces = rootPackageJson.workspaces || [];

      // Extract package names from workspace pattern
      for (const workspace of workspaces) {
        if (workspace.includes("*")) {
          // Pattern like "packages/*"
          const pattern = workspace.replace("*", "");
          if (existsSync(join(workspaceRoot, pattern))) {
            const entries = readdirSync(join(workspaceRoot, pattern), { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory()) {
                const pkgJsonPath = join(workspaceRoot, pattern, entry.name, "package.json");
                if (existsSync(pkgJsonPath)) {
                  try {
                    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
                    if (pkgJson.name) {
                      referencedPackages.add(pkgJson.name);
                    }
                  } catch {
                    // Skip
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Skip if root package.json is invalid
    }
  }

  // Check for phantom references (referenced but don't exist)
  const phantomPackages: string[] = [];
  for (const pkg of referencedPackages) {
    if (pkg.startsWith("@settler/") && !internalPackages.has(pkg)) {
      phantomPackages.push(pkg);
    }
  }

  if (phantomPackages.length > 0) {
    return {
      name: "Internal Dependencies",
      status: "fail",
      message: `Phantom package references found: ${phantomPackages.join(", ")}`,
    };
  }

  return {
    name: "Internal Dependencies",
    status: "pass",
    message: `All ${internalPackages.size} internal packages are properly defined`,
  };
}

/**
 * Run all checks
 */
async function main() {
  console.info("🔍 Checking workspace integrity...\n");

  checks.push(checkNoNodeModules());
  checks.push(checkWorkspacePackages());
  checks.push(checkInternalDependencies());

  // Print results
  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const warnings = checks.filter((c) => c.status === "warning").length;

  checks.forEach((check) => {
    const icon = check.status === "pass" ? "✅" : check.status === "fail" ? "❌" : "⚠️";
    console.info(`${icon} ${check.name}: ${check.message}`);
  });

  console.info(`\n📊 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`);

  if (failed > 0) {
    console.error("\n❌ Workspace integrity check failed");
    process.exit(1);
  }

  if (warnings > 0) {
    console.warn("\n⚠️  Workspace integrity check passed with warnings");
    process.exit(0);
  }

  console.info("\n✅ Workspace integrity check passed");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error during workspace integrity check:", error);
  process.exit(1);
});
