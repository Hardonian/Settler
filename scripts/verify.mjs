#!/usr/bin/env node
import { spawnSync } from "child_process";

const checks = [
  ["Lint", ["run", "lint"]],
  ["Typecheck", ["run", "typecheck"]],
  ["Build", ["run", "build"]],
  ["Tests", ["run", "test:ci:verify"]],
  ["Claims lint", ["run", "verify:claims"]],
  ["Boundary enforcement", ["run", "verify:boundaries"]],
  ["Route smoke", ["run", "verify:routes"]],
];

const failures = [];
for (const [name, args] of checks) {
  console.log(`\n▶ ${name}`);
  const result = spawnSync("pnpm", args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) failures.push(name);
}

if (failures.length) {
  console.error(`\n❌ verify failed: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\n✅ verify passed: lint + typecheck + build + test + claims + boundaries + routes");
