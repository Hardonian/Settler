#!/usr/bin/env node
/**
 * suite-doctor.mjs
 *
 * Phase 10 — CI & Verify Stabilization
 *
 * Comprehensive repo health runner. Checks:
 *   - dependencies (node_modules, pnpm lockfile)
 *   - Prisma (schema + generate)
 *   - env vars (presence of required vars)
 *   - repo state (git status clean)
 *   - verify scripts (lint, typecheck, build)
 *
 * Usage:
 *   node scripts/suite-doctor.mjs
 *   node scripts/suite-doctor.mjs --fast        # skip heavy checks (test, build)
 *   node scripts/suite-doctor.mjs --json        # machine-readable output
 *   node scripts/suite-doctor.mjs --check deps  # run a specific check group
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync, execSync } from "node:child_process";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    fast: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    check: { type: "string" }, // specific check group
  },
  strict: false,
});

const FAST = Boolean(args.fast);
const JSON_OUTPUT = Boolean(args.json);
const ONLY_CHECK = args.check;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readPkg() {
  const p = "package.json";
  if (!fs.existsSync(p)) {
    console.error("No package.json found.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function run(cmd, cliArgs) {
  const res = spawnSync(cmd, cliArgs, {
    stdio: JSON_OUTPUT ? "pipe" : "inherit",
    shell: process.platform === "win32",
  });
  return { status: res.status ?? 0, stdout: String(res.stdout ?? ""), stderr: String(res.stderr ?? "") };
}

function checkExists(filePath) {
  return fs.existsSync(filePath);
}

// ---------------------------------------------------------------------------
// Check groups
// ---------------------------------------------------------------------------

const results = [];

function record(name, status, message) {
  results.push({ name, status, message: message ?? "" });
  if (!JSON_OUTPUT) {
    const icon = status === "ok" ? "✅" : status === "warn" ? "⚠️" : "❌";
    console.log(`${icon}  ${name}${message ? `: ${message}` : ""}`);
  }
}

// ---- DEPENDENCIES ----------------------------------------------------------

function checkDependencies() {
  if (!checkExists("node_modules")) {
    record("node_modules", "fail", "Missing. Run: pnpm install");
    return;
  }
  record("node_modules", "ok");

  if (!checkExists("pnpm-lock.yaml")) {
    record("pnpm-lock.yaml", "warn", "Lockfile missing — run pnpm install to regenerate");
  } else {
    record("pnpm-lock.yaml", "ok");
  }
}

// ---- PRISMA ----------------------------------------------------------------

function checkPrisma() {
  const schemaPath = path.join("prisma", "schema.prisma");
  if (!checkExists(schemaPath)) {
    record("prisma/schema.prisma", "warn", "Schema not found (may not be required in this environment)");
    return;
  }
  record("prisma/schema.prisma", "ok");

  // Check Prisma client is generated
  const prismaClientPath = path.join("node_modules", ".prisma", "client");
  if (!checkExists(prismaClientPath)) {
    record("prisma-client", "warn", "Prisma client not generated. Run: pnpm prisma:generate");
  } else {
    record("prisma-client", "ok");
  }
}

// ---- ENV VARS --------------------------------------------------------------

const REQUIRED_ENV_VARS_FOR_BUILD = [
  // These can be placeholders in CI — we just check they're declared in .env.example
];

function checkEnvVars() {
  const examplePath = ".env.example";
  if (!checkExists(examplePath)) {
    record("env.example", "warn", ".env.example missing — developers cannot discover required vars");
    return;
  }
  record("env.example", "ok");

  // Warn if no .env or NODE_ENV is not set
  const hasEnv = checkExists(".env") || checkExists(".env.local");
  if (!hasEnv && process.env.NODE_ENV !== "production" && process.env.CI !== "true") {
    record("env-file", "warn", "No .env or .env.local found (acceptable in CI with injected vars)");
  } else {
    record("env-file", "ok");
  }
}

// ---- REPO STATE ------------------------------------------------------------

function checkRepoState() {
  try {
    const gitStatus = execSync("git status --porcelain", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
    if (gitStatus.length > 0) {
      record("git-status", "warn", `Uncommitted changes (${gitStatus.split("\n").length} files)`);
    } else {
      record("git-status", "ok", "Clean working tree");
    }
  } catch {
    record("git-status", "warn", "git not available or not a git repo");
  }

  try {
    const branch = execSync("git branch --show-current", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
    record("git-branch", "ok", branch || "detached HEAD");
  } catch {
    record("git-branch", "warn", "Could not determine git branch");
  }
}

// ---- VERIFY SCRIPTS --------------------------------------------------------

function checkVerifyScripts(pkg) {
  const scripts = pkg.scripts ?? {};

  const criticalScripts = FAST
    ? ["lint", "typecheck"]
    : ["lint", "typecheck", "build"];

  for (const name of criticalScripts) {
    if (!scripts[name]) {
      record(`script:${name}`, "warn", `Script '${name}' not in package.json`);
      continue;
    }
    if (!JSON_OUTPUT) console.log(`\n==> Running: pnpm ${name}`);
    const { status } = run("pnpm", ["-s", name]);
    record(`script:${name}`, status === 0 ? "ok" : "fail", status !== 0 ? `Exit ${status}` : undefined);
  }
}

// ---- ARCHITECTURE DOCS -----------------------------------------------------

function checkArchitectureDocs() {
  const expectedDocs = [
    "docs/architecture/repo-health.md",
    "docs/architecture/route-map.md",
  ];
  for (const doc of expectedDocs) {
    if (checkExists(doc)) {
      record(`doc:${path.basename(doc)}`, "ok");
    } else {
      record(`doc:${path.basename(doc)}`, "warn", `Missing: ${doc}`);
    }
  }
}

// ---- BENCHMARK HARNESS -----------------------------------------------------

function checkBenchmarkHarness() {
  if (checkExists("scripts/benchmark-harness.ts")) {
    record("benchmark-harness", "ok");
  } else {
    record("benchmark-harness", "warn", "scripts/benchmark-harness.ts missing");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const pkg = readPkg();

if (!JSON_OUTPUT) {
  console.log("╔══════════════════════════════════════╗");
  console.log("║        Settler Suite Doctor          ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`Mode: ${FAST ? "fast" : "full"}${ONLY_CHECK ? ` | check: ${ONLY_CHECK}` : ""}`);
  console.log();
}

const allGroups = {
  deps: checkDependencies,
  prisma: checkPrisma,
  env: checkEnvVars,
  repo: checkRepoState,
  verify: () => checkVerifyScripts(pkg),
  docs: checkArchitectureDocs,
  benchmark: checkBenchmarkHarness,
};

if (ONLY_CHECK) {
  const fn = allGroups[ONLY_CHECK];
  if (!fn) {
    console.error(`Unknown check group: ${ONLY_CHECK}`);
    console.error(`Available: ${Object.keys(allGroups).join(", ")}`);
    process.exit(1);
  }
  fn();
} else {
  for (const [, fn] of Object.entries(allGroups)) {
    fn();
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const failed = results.filter((r) => r.status === "fail").length;
const warned = results.filter((r) => r.status === "warn").length;
const passed = results.filter((r) => r.status === "ok").length;

if (JSON_OUTPUT) {
  process.stdout.write(JSON.stringify({ passed, warned, failed, results }, null, 2) + "\n");
} else {
  console.log();
  console.log("══════════════════════════════════════");
  console.log(`Suite Doctor: ${passed} passed, ${warned} warnings, ${failed} failed`);
  if (failed > 0) {
    console.log("❌ One or more checks FAILED. Fix before continuing.");
  } else if (warned > 0) {
    console.log("⚠️  Warnings present. Review before production deploy.");
  } else {
    console.log("✅ All checks passed.");
  }
}

process.exit(failed > 0 ? 1 : 0);
