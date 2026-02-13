#!/usr/bin/env node

import { spawnSync } from "child_process";

const rootDir = process.cwd();
const checks = [
  ["Lint", ["run", "lint"]],
  ["Globals CSS import order", ["run", "verify:globals-css-import-order"]],
  ["Route boundaries smoke", ["run", "verify:route-boundaries"]],
  ["Offline prerender harness", ["run", "test:web:offline-harness"]],
  ["Middleware /app gating tests", ["run", "test:web:middleware-gating"]],
  ["Typecheck", ["run", "typecheck"]],
  ["Docs parity", ["run", "verify:docs"]],
  ["Build", ["run", "build"]],
  ["Audit (high/critical threshold)", ["audit", "--audit-level=high", "--prod"]],
];

const args = new Set(process.argv.slice(2));
if (args.has("--skip-audit")) {
  checks.pop();
}

const failures = [];

for (const [name, pnpmArgs] of checks) {
  console.log(`\n▶ ${name}`);
  const result = spawnSync("pnpm", pnpmArgs, {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf-8",
    env: process.env,
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  const auditOutput = `${result.stdout ?? ""}
${result.stderr ?? ""}`;
  const auditNetworkFailure =
    name.startsWith("Audit") &&
    (auditOutput.includes("ERR_PNPM_AUDIT_BAD_RESPONSE") ||
      auditOutput.includes("ERR_PNPM_FETCH") ||
      auditOutput.includes("Forbidden"));

  if (auditNetworkFailure && process.env.CI_STRICT_AUDIT !== "1") {
    console.warn(
      "⚠️  Audit endpoint unavailable; treating as warning (set CI_STRICT_AUDIT=1 to fail)."
    );
    continue;
  }

  if (result.status !== 0) {
    failures.push(name);
  }
}

if (failures.length > 0) {
  console.error(`\n❌ verify failed: ${failures.join(", ")}`);
  process.exit(1);
}

const includesAudit = !args.has("--skip-audit");
console.log(
  `\n✅ verify passed: lint + typecheck + docs + build${includesAudit ? " + audit" : ""}`
);
