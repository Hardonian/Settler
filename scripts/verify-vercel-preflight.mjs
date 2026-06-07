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
  "packages/web/vercel.json",
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
const webVercelJson = JSON.parse(readFileSync(resolve(ROOT, "packages/web/vercel.json"), "utf-8"));

const unsupportedVercelKeys = ["nodeVersion"];
for (const [label, config] of [
  ["vercel.json", vercelJson],
  ["packages/web/vercel.json", webVercelJson],
]) {
  const presentUnsupportedKeys = unsupportedVercelKeys.filter((key) =>
    Object.prototype.hasOwnProperty.call(config, key)
  );
  if (presentUnsupportedKeys.length > 0) {
    fail(
      `${label} contains unsupported Vercel config key(s): ${presentUnsupportedKeys.join(
        ", "
      )}. Use package.json#engines.node for Node runtime selection.`
    );
  } else {
    pass(`${label} avoids unsupported Node runtime config keys`);
  }
}

const nvmrcPath = resolve(ROOT, ".nvmrc");
const nvmrcVersion = existsSync(nvmrcPath) ? readFileSync(nvmrcPath, "utf-8").trim() : null;

const rootPkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
const engineNode = rootPkg.engines?.node;

if (nvmrcVersion) {
  pass(`.nvmrc: ${nvmrcVersion}`);
}

if (engineNode) {
  pass(`engines.node: ${engineNode}`);
  // Check for unbounded upper range
  if (engineNode.startsWith(">=") && !engineNode.includes("<")) {
    warn(`engines.node "${engineNode}" has no upper bound — Node major drift possible`);
  }
  if (!engineNode.includes("24")) {
    fail(`engines.node "${engineNode}" does not pin Vercel to the Node 24 major contract`);
  }
} else {
  fail("package.json missing engines.node — Vercel Node runtime would auto-detect");
}

// ── 5. Vercel install command hygiene ────────────────────────────────
console.log("\n[5] Vercel install command hygiene");

const expectedPnpmVersion = rootPkg.packageManager?.replace(/^pnpm@/, "");

function checkInstallCommand(label, command) {
  if (!command) {
    fail(`${label} missing installCommand — Vercel may fall back to npm`);
    return;
  }

  if (command.includes("npx pnpm")) {
    fail(
      `${label} uses npx pnpm, which makes npm read project .npmrc and emit npm config warnings`
    );
  } else {
    pass(`${label} avoids npx pnpm`);
  }

  if (!command.includes("corepack")) {
    fail(`${label} does not bootstrap pnpm through corepack`);
  } else {
    pass(`${label} bootstraps pnpm through corepack`);
  }

  if (expectedPnpmVersion && !command.includes(`pnpm@${expectedPnpmVersion}`)) {
    fail(`${label} does not pin pnpm@${expectedPnpmVersion} from package.json#packageManager`);
  } else if (expectedPnpmVersion) {
    pass(`${label} pins pnpm@${expectedPnpmVersion}`);
  }

  if (!command.includes("--frozen-lockfile")) {
    fail(`${label} does not enforce --frozen-lockfile`);
  } else {
    pass(`${label} enforces --frozen-lockfile`);
  }
}

checkInstallCommand("vercel.json", vercelJson.installCommand);
checkInstallCommand("packages/web/vercel.json", webVercelJson.installCommand);

const npmrcContent = existsSync(resolve(ROOT, ".npmrc"))
  ? readFileSync(resolve(ROOT, ".npmrc"), "utf-8")
  : "";
const npmWarningProneKeys = [
  "package-manager",
  "lockfile",
  "prefer-frozen-lockfile",
  "optional",
  "always-auth",
  "supportedArchitectures.",
];
const activeNpmrcLines = npmrcContent
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));
let foundNpmWarningProneKey = false;
for (const key of npmWarningProneKeys) {
  const hasKey = activeNpmrcLines.some((line) => line.includes(key));
  if (hasKey) {
    foundNpmWarningProneKey = true;
    fail(`.npmrc contains npm warning-prone project config "${key}"`);
  }
}
if (!foundNpmWarningProneKey) {
  pass(".npmrc avoids known npm warning-prone pnpm-only settings");
}

// ── 6. Lockfile exists ────────────────────────────────────────────────
console.log("\n[6] Lockfile");

if (existsSync(resolve(ROOT, "pnpm-lock.yaml"))) {
  pass("pnpm-lock.yaml exists");
} else {
  fail("pnpm-lock.yaml missing — frozen-lockfile install will fail on Vercel");
}

// ── 7. Prisma schema ─────────────────────────────────────────────────
console.log("\n[7] Prisma");

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
