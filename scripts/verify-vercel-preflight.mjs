#!/usr/bin/env node
/**
 * Vercel Build Preflight Check
 *
 * Catches repo-side issues that cause Vercel builds to fail:
 * - Missing files referenced by build scripts
 * - .vercelignore excluding required build assets
 * - Node version drift
 * - Lockfile hygiene
 *
 * Usage: node scripts/verify-vercel-preflight.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let failures = 0;
let warnings = 0;

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  failures++;
}

function warn(msg) {
  console.warn(`  WARN: ${msg}`);
  warnings++;
}

function pass(msg) {
  console.log(`  OK:   ${msg}`);
}

// ── 1. Required build-time files ──────────────────────────────────────
console.log("\n[1] Required build-time files");

const requiredFiles = [
  "packages/web/scripts/assert-build-env.mjs",
  "config/env.required.json",
  "packages/web/next.config.js",
  "prisma/schema.prisma",
  "pnpm-workspace.yaml",
  "turbo.json",
  "vercel.json",
];

for (const rel of requiredFiles) {
  const abs = resolve(ROOT, rel);
  if (existsSync(abs)) {
    pass(rel);
  } else {
    fail(`${rel} is missing`);
  }
}

// ── 2. .vercelignore safety ───────────────────────────────────────────
console.log("\n[2] .vercelignore safety");

const ignorePath = resolve(ROOT, ".vercelignore");
if (existsSync(ignorePath)) {
  const content = readFileSync(ignorePath, "utf-8");
  const lines = content.split("\n").map((l) => l.trim());

  // Check for unanchored scripts/ pattern (would exclude packages/*/scripts/)
  const dangerousScriptsPattern = lines.find(
    (l) => !l.startsWith("#") && !l.startsWith("!") && l === "scripts/"
  );
  if (dangerousScriptsPattern) {
    fail(
      '.vercelignore has unanchored "scripts/" pattern — this excludes packages/web/scripts/ too. Use "/scripts/" instead.'
    );
  } else {
    pass("No unanchored scripts/ pattern");
  }

  // Check that packages/web/scripts is not explicitly excluded
  const excludesWebScripts = lines.find(
    (l) =>
      !l.startsWith("#") &&
      !l.startsWith("!") &&
      (l.includes("packages/web/scripts") || l.includes("packages/*/scripts"))
  );
  if (excludesWebScripts) {
    fail(`.vercelignore excludes packages/web/scripts: "${excludesWebScripts}"`);
  } else {
    pass("packages/web/scripts not excluded");
  }
} else {
  warn(".vercelignore not found");
}

// ── 3. Package.json script file references ────────────────────────────
console.log("\n[3] Build script file references");

const webPkg = JSON.parse(readFileSync(resolve(ROOT, "packages/web/package.json"), "utf-8"));
const buildCmd = webPkg.scripts?.build || "";
const buildVercelCmd = webPkg.scripts?.["build:vercel"] || "";

// Extract script file references from build commands
for (const [name, cmd] of [
  ["build", buildCmd],
  ["build:vercel", buildVercelCmd],
]) {
  const match = cmd.match(/node\s+(\S+\.m?js)/);
  if (match) {
    const scriptPath = resolve(ROOT, "packages/web", match[1]);
    if (existsSync(scriptPath)) {
      pass(`packages/web scripts.${name} → ${match[1]} exists`);
    } else {
      fail(`packages/web scripts.${name} references ${match[1]} but file is missing`);
    }
  }
}

// ── 4. Node version consistency ───────────────────────────────────────
console.log("\n[4] Node version consistency");

const vercelJson = JSON.parse(readFileSync(resolve(ROOT, "vercel.json"), "utf-8"));
const vercelNodeVersion = vercelJson.nodeVersion;

const nvmrcPath = resolve(ROOT, ".nvmrc");
const nvmrcVersion = existsSync(nvmrcPath) ? readFileSync(nvmrcPath, "utf-8").trim() : null;

const rootPkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
const engineNode = rootPkg.engines?.node;

if (vercelNodeVersion) {
  pass(`vercel.json nodeVersion: ${vercelNodeVersion}`);
} else {
  warn("vercel.json missing nodeVersion — Vercel will auto-detect");
}

if (nvmrcVersion) {
  pass(`.nvmrc: ${nvmrcVersion}`);
}

if (engineNode) {
  pass(`engines.node: ${engineNode}`);
  // Check for unbounded upper range
  if (engineNode.startsWith(">=") && !engineNode.includes("<")) {
    warn(`engines.node "${engineNode}" has no upper bound — Node major drift possible`);
  }
}

// ── 5. Lockfile exists ────────────────────────────────────────────────
console.log("\n[5] Lockfile");

if (existsSync(resolve(ROOT, "pnpm-lock.yaml"))) {
  pass("pnpm-lock.yaml exists");
} else {
  fail("pnpm-lock.yaml missing — frozen-lockfile install will fail on Vercel");
}

// ── 6. Prisma schema ─────────────────────────────────────────────────
console.log("\n[6] Prisma");

const prismaSchema = resolve(ROOT, "prisma/schema.prisma");
if (existsSync(prismaSchema)) {
  pass("prisma/schema.prisma exists");
} else {
  fail("prisma/schema.prisma missing — Prisma generate will fail");
}

// ── Summary ──────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));
if (failures > 0) {
  console.error(`\nVERCEL PREFLIGHT: ${failures} failure(s), ${warnings} warning(s)`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\nVERCEL PREFLIGHT: PASSED with ${warnings} warning(s)`);
} else {
  console.log("\nVERCEL PREFLIGHT: ALL CHECKS PASSED");
}
