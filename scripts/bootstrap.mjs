#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();

function run(command, args, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n❌ ${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

function copyIfMissing(from, to) {
  const src = path.join(root, from);
  const dest = path.join(root, to);
  if (!fs.existsSync(src) || fs.existsSync(dest)) {
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`📝 Created ${to} from ${from}`);
}

console.log("🚀 Settler bootstrap (first-run)");
copyIfMissing(".env.local.example", ".env.local");

run("pnpm", ["install"], "Install dependencies");
run("pnpm", ["run", "repo-integrity"], "Validate monorepo contract");
run("pnpm", ["run", "verify:setup"], "Check local prerequisites and degraded-state blockers");
run("pnpm", ["run", "doctor", "--", "--skip-pipeline", "--first-run"], "Run first-run doctor");

console.log("\n✅ Bootstrap completed. Next commands:");
console.log("   pnpm run demo     # guided deterministic demo");
console.log("   pnpm run dev:stack # web + api local stack");
console.log("   pnpm run dev:teardown # stop local processes started by dev:stack");
console.log("   pnpm run demo:reset # clear demo fixtures before next eval pass");
