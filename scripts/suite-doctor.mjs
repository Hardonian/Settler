#!/usr/bin/env node
/**
 * suite-doctor.mjs
 * Lightweight repo health runner.
 * - Runs common commands if they exist in package.json scripts.
 * - Exits non-zero if an existing script fails.
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

function readPkg() {
  const p = "package.json";
  if (!fs.existsSync(p)) {
    console.log("No package.json found. Nothing to check.");
    process.exit(0);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  return res.status ?? 0;
}

const pkg = readPkg();
const scripts = pkg.scripts || {};

const checks = [
  ["lint", "pnpm", ["-s", "lint"]],
  ["typecheck", "pnpm", ["-s", "typecheck"]],
  ["test", "pnpm", ["-s", "test"]],
  ["build", "pnpm", ["-s", "build"]],
];

let failed = 0;
for (const [name, cmd, args] of checks) {
  if (scripts[name]) {
    console.log(`\n==> Running: ${name}`);
    const code = run(cmd, args);
    if (code !== 0) failed = code;
  } else {
    console.log(`\n==> Skipping: ${name} (script not found)`);
  }
}

process.exit(failed);
