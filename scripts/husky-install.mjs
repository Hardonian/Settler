#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();

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

// A non-zero exit (e.g. `pnpm exec husky` can't resolve the binary at
// prepare-time during a fresh/frozen install) must NOT fail the whole
// install/deploy. Git hooks are a local-dev convenience; CI and Vercel
// enforce their own gates. Fail soft so deploys are resilient.
if (result.status) {
  console.log(
    `[husky] hook install exited ${result.status}; skipping (non-fatal for install/deploy).`
  );
  process.exit(0);
}

process.exit(0);
