#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...options.env },
    cwd: options.cwd ?? process.cwd(),
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
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
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  return pkg.name;
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  console.log("ℹ️ No staged files found; skipping staged package verification.");
  process.exit(0);
}

const changedPackageDirs = new Set();

for (const file of stagedFiles) {
  if (file.startsWith("packages/")) {
    const [, pkgDir] = file.split("/");
    if (pkgDir) changedPackageDirs.add(pkgDir);
    continue;
  }
}

const changedPackages = Array.from(changedPackageDirs)
  .map((dir) => ({ dir, name: getPackageName(dir) }))
  .sort((a, b) => a.name.localeCompare(b.name));

if (changedPackages.length === 0) {
  console.log("ℹ️ No staged package changes detected; skipping package-scoped checks.");
  process.exit(0);
}

const filters = changedPackages.flatMap((pkg) => ["--filter", `${pkg.name}...`]);

console.log(`🔎 Staged package verify scope: ${changedPackages.map((p) => p.name).join(", ")}`);

console.log("\n▶ Lint (changed packages)");
run("pnpm", ["turbo", "run", "lint", ...filters]);

console.log("\n▶ Typecheck (changed packages)");
run("pnpm", ["turbo", "run", "typecheck", ...filters]);

for (const pkg of changedPackages) {
  console.log(`\n▶ Test (${pkg.name})`);

  if (pkg.name === "@settler/web") {
    run("pnpm", ["--filter", "@settler/web", "exec", "jest", "--maxWorkers=50%"], {
      env: { NODE_OPTIONS: "--max-old-space-size=4096" },
    });
    continue;
  }

  run("pnpm", ["--filter", pkg.name, "run", "test"]);
}

console.log("\n✅ Staged package verification passed.");
