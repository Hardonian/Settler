#!/usr/bin/env tsx
/**
 * Apply Billing Enforcement to ALL Routes
 *
 * Systematically adds billing gates to all routes that need them.
 * Categorizes routes as: public, free, or paid.
 */

import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";
import { join } from "path";

const API_DIR = join(process.cwd(), "packages/web/src/app/api");

// Routes that should be PUBLIC (no billing)
const PUBLIC_PATTERNS = [
  "/api/status",
  "/api/status/health",
  "/api/public",
  "/api/v1/route", // Base API info
  "/api/docs/openapi",
  "/api/oss/stats",
  "/api/health",
];

// Routes that should be FREE (usage-limited, no subscription)
const FREE_PATTERNS = [
  "/api/v1/convert", // Utility conversion
];

// Routes that are CRON/INTERNAL (no billing, but should be secured)
const INTERNAL_PATTERNS = ["/api/cron/", "/api/internal/"];

function isPublicRoute(filePath: string): boolean {
  const relativePath = filePath.replace(API_DIR, "").replace("/route.ts", "");
  return PUBLIC_PATTERNS.some((pattern) => relativePath.includes(pattern.replace("/api", "")));
}

function isFreeRoute(filePath: string): boolean {
  const relativePath = filePath.replace(API_DIR, "").replace("/route.ts", "");
  return FREE_PATTERNS.some((pattern) => relativePath.includes(pattern.replace("/api", "")));
}

function isInternalRoute(filePath: string): boolean {
  const relativePath = filePath.replace(API_DIR, "").replace("/route.ts", "");
  return INTERNAL_PATTERNS.some((pattern) => relativePath.includes(pattern.replace("/api", "")));
}

function hasBillingEnforcement(content: string): boolean {
  return (
    content.includes("withUniversalBillingGate") ||
    content.includes("requireActiveSubscription") ||
    content.includes("withBillingEnforcement") ||
    content.includes("withSubscriptionGate") ||
    content.includes("publicRoute") ||
    content.includes("freeRoute")
  );
}

function addBillingGate(filePath: string, isPublic: boolean, isFree: boolean): void {
  const content = readFileSync(filePath, "utf-8");

  if (hasBillingEnforcement(content)) {
    return; // Already has enforcement
  }

  let wrapper: string;
  let importStatement: string;

  if (isPublic) {
    wrapper = "publicRoute";
    importStatement = "import { publicRoute } from '@/middleware/billing-gate-universal';";
  } else if (isFree) {
    wrapper = "freeRoute";
    importStatement = "import { freeRoute } from '@/middleware/billing-gate-universal';";
  } else {
    wrapper = "withUniversalBillingGate";
    importStatement =
      "import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';";
  }

  // Add import
  let newContent = content;
  if (!content.includes(importStatement)) {
    const lastImportMatch = content.match(/^import .+ from ['"].+['"];$/gm);
    if (lastImportMatch && lastImportMatch.length > 0) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const afterLastImport = content.indexOf("\n", lastImportIndex) + 1;
      newContent =
        content.substring(0, afterLastImport) +
        importStatement +
        "\n" +
        content.substring(afterLastImport);
    } else {
      // No imports found, add at top
      newContent = importStatement + "\n\n" + content;
    }
  }

  // Wrap export functions
  const exportRegex = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g;
  const matches: Array<{ name: string; index: number; fullMatch: string }> = [];
  let match;

  while ((match = exportRegex.exec(newContent)) !== null) {
    matches.push({
      name: match[2],
      index: match.index,
      fullMatch: match[0],
    });
  }

  // Wrap each function (in reverse order)
  for (let i = matches.length - 1; i >= 0; i--) {
    const funcMatch = matches[i];
    const funcStart = funcMatch.index;
    const funcName = funcMatch.name;

    // Find function end
    const funcBodyStart = newContent.indexOf("{", funcStart);
    let braceCount = 1;
    let pos = funcBodyStart + 1;
    while (braceCount > 0 && pos < newContent.length) {
      if (newContent[pos] === "{") braceCount++;
      if (newContent[pos] === "}") braceCount--;
      pos++;
    }

    const funcEnd = pos;
    const funcDef = newContent.substring(funcStart, funcEnd);

    // Fix function declaration
    const funcDefFixed = funcDef
      .replace(/export\s+async\s+function\s+(\w+)/, "async function $1")
      .replace(/export\s+function\s+(\w+)/, "function $1");

    // Wrap it
    const wrapped =
      isPublic || isFree
        ? `export const ${funcName} = ${wrapper}(${funcDefFixed});`
        : `export const ${funcName} = ${wrapper}(${funcDefFixed}, { feature: '${funcName} API' });`;

    newContent = newContent.substring(0, funcStart) + wrapped + newContent.substring(funcEnd);
  }

  writeFileSync(filePath, newContent, "utf-8");
}

async function main() {
  console.log("🔒 Applying billing enforcement to ALL routes...\n");

  const routeFiles = await glob("**/route.ts", {
    cwd: API_DIR,
    absolute: true,
    ignore: ["**/*.backup"],
  });

  console.log(`Found ${routeFiles.length} route files\n`);

  let updated = 0;
  let skipped = 0;
  let publicCount = 0;
  let freeCount = 0;
  let paidCount = 0;

  for (const file of routeFiles) {
    const isPublic = isPublicRoute(file);
    const isFree = isFreeRoute(file);
    const isInternal = isInternalRoute(file);

    const content = readFileSync(file, "utf-8");

    if (hasBillingEnforcement(content)) {
      skipped++;
      continue;
    }

    // Skip internal routes (they should be secured differently)
    if (isInternal) {
      skipped++;
      continue;
    }

    try {
      addBillingGate(file, isPublic, isFree);
      updated++;

      if (isPublic) {
        publicCount++;
        console.log(`🌐 Public: ${file.replace(API_DIR, "")}`);
      } else if (isFree) {
        freeCount++;
        console.log(`🆓 Free: ${file.replace(API_DIR, "")}`);
      } else {
        paidCount++;
        console.log(`💰 Paid: ${file.replace(API_DIR, "")}`);
      }
    } catch (error) {
      console.error(`❌ Failed: ${file.replace(API_DIR, "")} - ${error}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`Total routes: ${routeFiles.length}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`   🌐 Public: ${publicCount}`);
  console.log(`   🆓 Free: ${freeCount}`);
  console.log(`   💰 Paid: ${paidCount}`);
  console.log(`⏭️  Skipped (already has enforcement): ${skipped}\n`);
}

main().catch(console.error);
