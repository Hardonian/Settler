#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const rootDir = process.cwd();
const flags = new Set(process.argv.slice(2));
const groupResults = new Map();

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf-8",
    ...options,
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    status: result.status ?? 1,
  };
}

function addResult(group, name, ok, detail, hint = "") {
  if (!groupResults.has(group)) groupResults.set(group, []);
  groupResults.get(group).push({ name, ok, detail, hint });
}

function loadEnvFiles() {
  [".env.local", ".env"].forEach((filename) => {
    const fullPath = path.join(rootDir, filename);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: false });
    }
  });
}

function checkToolchain() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
  const pnpmVersion = runCommand("pnpm", ["--version"]);
  addResult(
    "toolchain",
    "Package manager",
    pnpmVersion.ok,
    pnpmVersion.ok
      ? `pnpm ${pnpmVersion.stdout} (expected ${packageJson.packageManager})`
      : "pnpm is not available in PATH",
    "Run: corepack enable && corepack prepare pnpm@10.13.1 --activate"
  );

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const minNode = 24;
  addResult(
    "toolchain",
    "Node runtime",
    nodeMajor >= minNode,
    `Node ${process.version} detected`,
    `Use Node ${minNode}.x to match .nvmrc and Vercel`
  );

  const isMonorepo = fs.existsSync(path.join(rootDir, "pnpm-workspace.yaml"));
  addResult(
    "toolchain",
    "Repository mode",
    true,
    isMonorepo ? "Monorepo (pnpm workspaces)" : "Single package"
  );
}

function checkEnv() {
  loadEnvFiles();

  const scopeResult = runCommand("pnpm", ["run", "verify:env:typed", "--", "--mode=build"]);
  addResult(
    "env",
    "Typed env schema (build)",
    scopeResult.ok,
    scopeResult.ok
      ? "typed env schema loaded for build mode"
      : scopeResult.stderr.split("\n").slice(-6).join("\n")
  );

  const modes = ["build", "runtime"];
  for (const mode of modes) {
    const result = runCommand("pnpm", ["run", "verify:env:typed", "--", `--mode=${mode}`]);
    addResult(
      "env",
      `Typed env validation (${mode})`,
      result.ok,
      result.ok
        ? "validated without leaking secret values"
        : result.stderr.split("\n").slice(-6).join("\n")
    );
  }
}

function checkNextVercel() {
  const nextConfigPath = path.join(rootDir, "packages/web/next.config.js");
  addResult(
    "config",
    "Next config exists",
    fs.existsSync(nextConfigPath),
    fs.existsSync(nextConfigPath) ? "packages/web/next.config.js found" : "Missing Next.js config"
  );

  const vercelPath = path.join(rootDir, "vercel.json");
  if (fs.existsSync(vercelPath)) {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));
    const parity = vercelConfig.buildCommand === "pnpm --filter @settler/web... build";
    addResult(
      "config",
      "Vercel build parity",
      parity,
      `buildCommand=${vercelConfig.buildCommand ?? "undefined"}`,
      "Expected: pnpm --filter @settler/web... build"
    );
  }

  const tsConfigCheck = runCommand("pnpm", ["exec", "tsc", "--showConfig", "-p", "tsconfig.json"]);
  addResult(
    "config",
    "TypeScript config loads",
    tsConfigCheck.ok,
    tsConfigCheck.ok ? "tsconfig.json parsed by tsc" : tsConfigCheck.stderr.split("\n")[0],
    "Fix TypeScript configuration parsing errors before CI"
  );

  const eslintCheck = runCommand("pnpm", [
    "exec",
    "eslint",
    "--print-config",
    "packages/web/src/app/page.tsx",
  ]);
  addResult(
    "config",
    "ESLint config loads",
    eslintCheck.ok,
    eslintCheck.ok ? "ESLint config resolved" : eslintCheck.stderr.split("\n")[0],
    "Fix eslint config/module resolution issues"
  );
}

function checkAssetsAndSafety() {
  const publicPath = path.join(rootDir, "packages/web/public");
  addResult(
    "assets",
    "public assets directory",
    fs.existsSync(publicPath),
    fs.existsSync(publicPath) ? "packages/web/public exists" : "Missing packages/web/public"
  );

  const hard500Scan = runCommand("rg", [
    "status:\\s*500",
    "packages/web/src/app/api",
    "-g",
    "*.ts",
    "-g",
    "!**/admin/**",
    "-g",
    "!**/internal/**",
  ]);

  addResult(
    "runtime-safety",
    "No hard-500 responses in user API routes",
    hard500Scan.status === 1,
    hard500Scan.status === 1
      ? "No direct status: 500 matches"
      : hard500Scan.stdout || hard500Scan.stderr,
    "Return graceful errors with canonical envelope instead of hard 500"
  );
}

function runStagedChecks() {
  const checks = [
    ["pipeline", "lint", ["run", "lint"]],
    ["pipeline", "typecheck", ["run", "typecheck"]],
    ["pipeline", "build", ["run", "build"]],
  ];

  const hasTestScript = runCommand("pnpm", ["run", "test", "--help"]).ok;
  if (hasTestScript) {
    if (process.env.DOCTOR_INCLUDE_TESTS === "1") {
      checks.splice(2, 0, ["pipeline", "test", ["run", "test"]]);
    } else {
      addResult("pipeline", "test", true, "skipped (set DOCTOR_INCLUDE_TESTS=1 to include tests)");
    }
  }

  for (const [group, label, args] of checks) {
    const res = runCommand("pnpm", args, { timeout: 12 * 60 * 1000 });
    addResult(
      group,
      label,
      res.ok,
      res.ok ? "passed" : res.stderr.split("\n").slice(-8).join("\n")
    );
  }
}

function printSummary() {
  let hasFailure = false;
  console.log("🩺 Settler doctor\n");

  for (const [group, items] of groupResults.entries()) {
    console.log(`## ${group}`);
    for (const item of items) {
      const icon = item.ok ? "✅" : "❌";
      console.log(`${icon} ${item.name}: ${item.detail}`);
      if (!item.ok && item.hint) {
        console.log(`   ↳ ${item.hint}`);
      }
      hasFailure ||= !item.ok;
    }
    console.log("");
  }

  if (hasFailure) {
    console.error("❌ doctor failed with grouped errors above.");
    process.exit(1);
  }

  console.log("✅ doctor passed.");
}

checkToolchain();
checkEnv();
checkNextVercel();
checkAssetsAndSafety();
if (!flags.has("--skip-pipeline")) {
  runStagedChecks();
} else {
  addResult("pipeline", "staged checks", true, "skipped via --skip-pipeline");
}
printSummary();
