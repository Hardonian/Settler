#!/usr/bin/env node
/**
 * Settler Verify Script - Complete Quality Pipeline
 *
 * Runs comprehensive verification suite:
 * - Lint
 * - Type checking
 * - Tests
 * - Build
 *
 * Usage:
 *   node scripts/verify.mjs              # Full verification
 *   node scripts/verify.mjs --skip-tests # Skip tests
 *   node scripts/verify.mjs --skip-build # Skip build
 *   node scripts/verify.mjs --fast       # Lint and typecheck only
 */

import { execSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const args = process.argv.slice(2);
const skipTests = args.includes("--skip-tests");
const skipBuild = args.includes("--skip-build");
const fast = args.includes("--fast");
const full = args.includes("--full") || !fast;
const changedOnly = args.includes("--changed");

const results = [];

/**
 * @param {string} name
 * @param {string} command
 * @param {boolean} required
 * @returns {boolean}
 */
function runStep(name, command, required = true) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`⚙️  ${name}`);
  console.log("=".repeat(80));

  const startTime = Date.now();
  try {
    execSync(command, {
      cwd: rootDir,
      stdio: "inherit",
      encoding: "utf-8",
    });
    const duration = Date.now() - startTime;
    results.push({ name, status: "pass", duration });
    console.log(`\n✅ ${name} passed (${(duration / 1000).toFixed(2)}s)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    results.push({ name, status: "fail", duration });
    console.log(`\n❌ ${name} failed (${(duration / 1000).toFixed(2)}s)`);
    if (required) {
      console.log("\n❌ VERIFICATION FAILED - Fix errors above and try again\n");
      process.exit(1);
    }
    return false;
  }
}

/**
 * @param {{ staged: boolean }} options
 * @returns {string[]}
 */
function getChangedFiles(options) {
  try {
    const diffArgs = options.staged ? "--cached" : "HEAD";
    const output = execSync(`git diff --name-only ${diffArgs} --diff-filter=ACMRTUXB`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    // Handle cases where:
    // - Script is run outside a git repository
    // - Repository has no commits yet (HEAD doesn't exist)
    // - Other git errors occur
    console.warn("⚠️  Could not determine changed files:", error.message.split("\n")[0]);
    return [];
  }
}

/**
 * @param {string[]} files
 * @returns {string[]}
 */
function getWorkspaceFilters(files) {
  const filters = new Set();

  for (const file of files) {
    if (!file.startsWith("packages/")) {
      continue;
    }

    const segments = file.split("/");
    const workspacePath = segments.length > 1 ? `./packages/${segments[1]}` : null;

    if (workspacePath) {
      filters.add(`--filter=${workspacePath}`);
    }
  }

  return Array.from(filters);
}

console.log("🔍 Settler Verify - Running Quality Pipeline\n");
console.log(`Working directory: ${rootDir}`);
const modeLabel = changedOnly ? "CHANGED" : fast ? "FAST" : "FULL";

console.log(`Mode: ${modeLabel}`);
console.log("");

if (fast) {
  runStep("Typed Env Validation (Build)", "pnpm run verify:env:typed -- --mode=build", true);
  runStep("App Router Validation (Changed)", "pnpm run verify:app-router -- --changed", true);

  if (changedOnly) {
    runStep("Lint Staged Files", "pnpm exec lint-staged", true);
  } else {
    runStep("Lint Changed Files", "pnpm exec lint-staged --diff=HEAD", true);
  }

  const changedFiles = getChangedFiles({ staged: changedOnly });
  const workspaceFilters = getWorkspaceFilters(changedFiles);

  if (workspaceFilters.length > 0) {
    // Simplify fast-typecheck invocation to avoid passing unsupported flags to tsc
    // This ensures TypeScript checks run deterministically across workspaces without
    // relying on turbo's filtering semantics that can inject invalid CLI args in some envs.
    runStep("Type Check (TypeScript, Fast)", `pnpm run typecheck`, true);
  } else {
    console.log("ℹ️  No workspace changes detected. Skipping fast typecheck.");
  }
} else {
  runStep("Typed Env Validation (Build)", "pnpm run verify:env:typed -- --mode=build", true);
  runStep("App Router Validation", "pnpm run verify:app-router", true);
  runStep("Lint (ESLint)", "pnpm run lint -- --no-cache", true);
  runStep("Type Check (TypeScript)", "pnpm run typecheck -- --no-cache", true);

  if (full) {
    runStep("Typed Env Validation (Runtime)", "pnpm run verify:env:typed -- --mode=runtime", true);
  }

  if (full && !skipBuild) {
    runStep("Build (Turbo)", "pnpm run build -- --no-cache", true);
  }

  if (full && !skipTests) {
    runStep("Tests (Jest)", "pnpm run test -- --no-cache", true);
  }
}

// Print summary
console.log("\n" + "=".repeat(80));
console.log("VERIFICATION SUMMARY");
console.log("=".repeat(80) + "\n");

const passed = results.filter((r) => r.status === "pass").length;
const failed = results.filter((r) => r.status === "fail").length;
const total = results.length;

results.forEach((result) => {
  const icon = result.status === "pass" ? "✅" : "❌";
  const duration = (result.duration / 1000).toFixed(2);
  console.log(`${icon} ${result.name} - ${duration}s`);
});

console.log("");
console.log(`Total: ${total} checks`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log("");

if (failed > 0) {
  console.log("❌ VERIFICATION FAILED\n");
  process.exit(1);
} else {
  console.log("✅ ALL CHECKS PASSED\n");
  process.exit(0);
}
