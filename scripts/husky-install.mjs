#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();

// Skip hook installation in CI environments (GitHub Actions sets CI=true).
// Husky is a developer-only convenience; it must not break CI installs.
if (process.env.CI) {
  console.log("[husky] CI environment detected; skipping hook install.");
  process.exit(0);
}

if (!existsSync(join(repoRoot, ".git")) || !existsSync(join(repoRoot, ".husky"))) {
  console.log("[husky] Git metadata or hook directory unavailable; skipping hook install.");
  process.exit(0);
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(pnpmCommand, ["exec", "husky", "install"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.log(`[husky] ${result.error.message}; skipping hook install.`);
  process.exit(0);
}

process.exit(result.status === null ? 0 : result.status);
