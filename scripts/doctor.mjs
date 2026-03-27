#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const rootDir = process.cwd();
const args = new Set(process.argv.slice(2));
const mode = process.env.NODE_ENV === "production" || args.has("--prod") ? "production" : "local";
const jsonMode = args.has("--json");
const skipKernelHealth = args.has("--skip-kernel-health");
const includePipeline = args.has("--include-pipeline");
const firstRun = args.has("--first-run");

/** @typedef {'PASS'|'DEGRADED'|'FAIL'} CheckStatus */

/** @type {Array<{subsystem:string,status:CheckStatus,message:string,remediation:string}>} */
const checks = [];

function addCheck(subsystem, status, message, remediation = "None") {
  checks.push({ subsystem, status, message, remediation });
}

function loadEnv() {
  const loaded = [];
  [
    ".env",
    ".env.local",
    ".env.production",
    path.join("packages", "web", ".env.local"),
    path.join("packages", "api", ".env.local"),
  ].forEach((file) => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
      loaded.push(file);
    }
  });

  addCheck(
    "env.sources",
    loaded.length > 0 ? "PASS" : "DEGRADED",
    loaded.length > 0
      ? `Loaded env files: ${loaded.join(", ")}`
      : "No local env files found; only shell-exported variables are available",
    "Create .env.local from .env.local.example or run commands with doppler run -- <command>."
  );
}

function hasEnv(key) {
  return Boolean(process.env[key] && process.env[key].trim());
}

function run(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  });
}

function checkToolchain() {
  const nodeMajor = Number(process.versions.node.split(".")[0] ?? 0);
  addCheck(
    "toolchain.node",
    nodeMajor >= 24 ? "PASS" : "FAIL",
    `Node ${process.version} detected`,
    "Use Node 24.x (see .nvmrc/.node-version and package.json engines)."
  );

  const pnpm = run("pnpm", ["--version"]);
  addCheck(
    "toolchain.pnpm",
    pnpm.status === 0 ? "PASS" : "FAIL",
    pnpm.status === 0 ? `pnpm ${pnpm.stdout.trim()} detected` : "pnpm not available in PATH",
    "Enable corepack and install pnpm 10.13.1+."
  );
}

function checkLocalEnvBootstrap() {
  if (mode !== "local") return;

  const envLocalPath = path.join(rootDir, ".env.local");
  const envTemplatePath = path.join(rootDir, ".env.local.example");

  if (!fs.existsSync(envLocalPath) && fs.existsSync(envTemplatePath)) {
    addCheck(
      "env.bootstrap",
      "DEGRADED",
      ".env.local not found; first-run env bootstrap has not been completed",
      "Run: cp .env.local.example .env.local (root) or use doppler run -- <command> to inject secrets."
    );
  }
}

function checkEnvPresence() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
  ];

  for (const name of required) {
    addCheck(
      `env.${name}`,
      hasEnv(name) ? "PASS" : "FAIL",
      hasEnv(name) ? `${name} is configured` : `${name} is missing`,
      `Set ${name} in shell/.env.local (root or package) or run via doppler run -- <command>.`
    );
  }

  const hasDb = hasEnv("DATABASE_URL") || hasEnv("SUPABASE_DATABASE_URL") || hasEnv("DIRECT_URL");
  addCheck(
    "env.database",
    hasDb ? "PASS" : "FAIL",
    hasDb ? "At least one database DSN is configured" : "No database DSN configured",
    "Set DATABASE_URL (or SUPABASE_DATABASE_URL / DIRECT_URL) in .env.local before API/web smoke checks."
  );

  if (mode === "production") {
    const prodRequired = ["SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "ENCRYPTION_KEY"];
    for (const name of prodRequired) {
      addCheck(
        `env.${name}`,
        hasEnv(name) ? "PASS" : "FAIL",
        hasEnv(name) ? `${name} is configured` : `${name} is missing for production mode`,
        `Set ${name} before production deploy.`
      );
    }
  }

  const stripeKeys = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  ];
  const stripeEnabled = stripeKeys.some(hasEnv);
  addCheck(
    "env.billing",
    stripeEnabled ? "PASS" : "DEGRADED",
    stripeEnabled ? "Billing keys detected" : "Billing disabled (Stripe keys not set)",
    "Set Stripe keys to enable billing workflows."
  );
}

function checkConfigShape() {
  const urlLike = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "NEXT_PUBLIC_API_URL"];
  for (const key of urlLike) {
    if (!hasEnv(key)) {
      addCheck(`config.${key}`, "DEGRADED", `${key} not set; URL shape skipped`, `Set ${key}.`);
      continue;
    }

    let valid = true;
    try {
      const value = process.env[key];

      new URL(value);
    } catch {
      valid = false;
    }

    addCheck(
      `config.${key}`,
      valid ? "PASS" : "FAIL",
      valid ? `${key} URL shape is valid` : `${key} is not a valid URL`,
      `Set ${key} to a valid https:// URL.`
    );
  }
}

function checkWorkspaceIntegrity() {
  const requiredFiles = [
    "package.json",
    "pnpm-workspace.yaml",
    "packages/web/package.json",
    "packages/api/package.json",
    "scripts/kernel-health.ts",
    "scripts/verify-setup.ts",
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(rootDir, file));
    addCheck(
      `workspace.${file}`,
      exists ? "PASS" : "FAIL",
      exists ? `${file} present` : `${file} missing`,
      `Restore ${file}; command surface requires it.`
    );
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const scripts = pkg.scripts ?? {};
  const wired =
    typeof scripts["settler:doctor"] === "string" && scripts["settler:doctor"].length > 0;
  addCheck(
    "workspace.command.settler:doctor",
    wired ? "PASS" : "FAIL",
    wired ? `settler:doctor -> ${scripts["settler:doctor"]}` : "settler:doctor script missing",
    "Add a settler:doctor script in root package.json."
  );
}

function checkKernel() {
  const kernelEnabled =
    ["1", "true", "yes", "on"].includes((process.env.SETTLER_KERNEL_ENABLED ?? "").toLowerCase()) &&
    !["1", "true", "yes", "on"].includes((process.env.SETTLER_DISABLE_KERNEL ?? "").toLowerCase());

  if (!kernelEnabled) {
    addCheck(
      "kernel.mode",
      "DEGRADED",
      "Kernel disabled; TypeScript fallback mode active",
      "Set SETTLER_KERNEL_ENABLED=1 and configure kernel binary to enable kernel path."
    );
    return;
  }

  const health = run("pnpm", ["run", "--silent", "kernel:health"]);
  const ok = health.status === 0;
  addCheck(
    "kernel.health",
    ok ? "PASS" : "FAIL",
    ok ? "kernel:health command succeeded" : "kernel:health command failed",
    "Run pnpm run kernel:health and resolve reported startup/handshake errors."
  );
}

function checkPipelineOptional() {
  if (!includePipeline) {
    addCheck(
      "pipeline",
      "DEGRADED",
      "Pipeline checks skipped (use --include-pipeline to execute lint/typecheck/build)",
      "Run: pnpm run settler:doctor -- --include-pipeline"
    );
    return;
  }

  for (const [label, command] of [
    ["lint", ["run", "lint"]],
    ["typecheck", ["run", "typecheck"]],
    ["build", ["run", "build"]],
  ]) {
    const res = run("pnpm", command, { timeout: 12 * 60 * 1000 });
    addCheck(
      `pipeline.${label}`,
      res.status === 0 ? "PASS" : "FAIL",
      res.status === 0 ? `${label} passed` : `${label} failed`,
      `Run pnpm ${command.join(" ")} and resolve the failing package.`
    );
  }
}

function computeSummary() {
  const hasFail = checks.some((item) => item.status === "FAIL");
  const hasDegraded = checks.some((item) => item.status === "DEGRADED");
  if (hasFail) return "FAIL";
  if (hasDegraded) return "DEGRADED";
  return "PASS";
}

function printHuman(summary) {
  console.log("🩺 Settler Doctor");
  console.log(`mode=${mode}`);
  console.log(`summary=${summary}`);
  if (firstRun) {
    console.log("first_run=true (strict env/setup diagnostics enabled)");
  }
  console.log("");

  for (const check of checks) {
    const icon = check.status === "PASS" ? "✅" : check.status === "DEGRADED" ? "⚠️" : "❌";
    console.log(`${icon} [${check.status}] ${check.subsystem}`);
    console.log(`   ${check.message}`);
    console.log(`   remediation: ${check.remediation}`);
  }
}

function printJson(summary) {
  console.log(
    JSON.stringify(
      {
        tool: "settler:doctor",
        mode,
        summary,
        checks,
      },
      null,
      2
    )
  );
}

function main() {
  loadEnv();
  checkToolchain();
  checkLocalEnvBootstrap();
  checkEnvPresence();
  checkConfigShape();
  checkWorkspaceIntegrity();
  if (!skipKernelHealth) {
    checkKernel();
  } else {
    addCheck(
      "kernel.health",
      "DEGRADED",
      "Kernel health skipped via --skip-kernel-health",
      "Run pnpm run kernel:health before launch."
    );
  }
  checkPipelineOptional();

  const summary = computeSummary();
  if (jsonMode) printJson(summary);
  else printHuman(summary);

  process.exit(summary === "FAIL" ? 1 : 0);
}

main();
