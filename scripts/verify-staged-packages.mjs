#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function run(cmd, args, options = {}) {
  const binary =
    process.platform === "win32" && (cmd === "pnpm" || cmd === "pnpm.cmd") ? "pnpm.cmd" : cmd;
  const result = spawnSync(binary, args, {
    stdio: "inherit",
    env: { ...process.env, ...options.env },
    cwd: options.cwd ?? process.cwd(),
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function parseTier(argv) {
  const tierArg = argv.find((arg) => arg.startsWith("--tier="));
  const tier = tierArg ? tierArg.split("=")[1] : "prepush";
  if (!["precommit", "prepush"].includes(tier)) {
    console.error(`Unsupported tier '${tier}'. Use --tier=precommit|prepush`);
    process.exit(1);
  }
  return tier;
}

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf8",
  }).trim();

  if (!output) return [];
  return output.split("\n").filter(Boolean);
}

function getPackageName(packageDir) {
  const pkgPath = path.join(process.cwd(), "packages", packageDir, "package.json");
  if (!existsSync(pkgPath)) return null;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  return pkg.name;
}

const tier = parseTier(process.argv.slice(2));
const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  console.log("ℹ️ No staged files found; skipping staged package verification.");
  process.exit(0);
}

const changedPackageDirs = new Set();

for (const file of stagedFiles) {
  if (!file.startsWith("packages/")) continue;
  const [, pkgDir] = file.split("/");
  if (pkgDir) changedPackageDirs.add(pkgDir);
}

const changedPackages = Array.from(changedPackageDirs)
  .map((dir) => {
    const name = getPackageName(dir);
    return name ? { dir, name } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

if (changedPackages.length === 0) {
  console.log("ℹ️ No staged package changes detected; skipping package-scoped checks.");
  process.exit(0);
}

const filters = changedPackages.flatMap((pkg) => ["--filter", `${pkg.name}...`]);

console.log(`🔎 Staged package verify scope: ${changedPackages.map((p) => p.name).join(", ")}`);
console.log(`🔎 Verification tier: ${tier}`);

console.log("\n▶ Lint (changed packages)");
run("pnpm", ["turbo", "run", "lint", ...filters]);

if (tier === "precommit") {
  console.log(
    "\n✅ Pre-commit tier complete (staged lint only). Full typecheck/tests run in pre-push/CI."
  );
  process.exit(0);
}

console.log("\n▶ Typecheck (changed packages)");
run("pnpm", ["turbo", "run", "typecheck", ...filters]);

for (const pkg of changedPackages) {
  console.log(`\n▶ Test (${pkg.name})`);

  if (pkg.name === "@settler/web") {
    run("pnpm", ["--filter", "@settler/web", "exec", "jest", "--runInBand"], {
      env: { NODE_OPTIONS: "--max-old-space-size=2048" },
    });
    continue;
  }

  run("pnpm", ["--filter", pkg.name, "run", "test"]);
}

console.log("\n✅ Staged package verification passed.");
