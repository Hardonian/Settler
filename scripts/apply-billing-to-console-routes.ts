#!/usr/bin/env tsx
/**
 * Apply Billing Enforcement to All Console Routes
 *
 * Systematically adds billing gates to console routes that don't have them.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { glob } from "glob";

const API_DIR = join(process.cwd(), "packages/web/src/app/api/console");

interface RouteInfo {
  path: string;
  hasBilling: boolean;
  hasAuth: boolean;
  needsBilling: boolean;
}

function checkRoute(filePath: string): RouteInfo {
  const content = readFileSync(filePath, "utf-8");

  const hasBilling =
    content.includes("withUniversalBillingGate") ||
    content.includes("requireActiveSubscription") ||
    content.includes("withBillingEnforcement") ||
    content.includes("publicRoute") ||
    content.includes("freeRoute");

  const hasAuth = content.includes("requireAuth");

  // Routes that need billing: all console routes except health checks
  const needsBilling = !filePath.includes("health") && !hasBilling;

  return {
    path: filePath.replace(process.cwd(), ""),
    hasBilling,
    hasAuth,
    needsBilling,
  };
}

function addBillingGate(filePath: string): void {
  const content = readFileSync(filePath, "utf-8");

  // Skip if already has billing
  if (
    content.includes("withUniversalBillingGate") ||
    content.includes("publicRoute") ||
    content.includes("freeRoute")
  ) {
    return;
  }

  // Add import
  let newContent = content;
  if (!content.includes("from '@/middleware/billing-gate-universal'")) {
    // Find last import statement
    const importRegex = /^import .+ from ['"].+['"];$/gm;
    const imports = content.match(importRegex) || [];
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);

    if (lastImportIndex !== -1) {
      const afterLastImport = content.indexOf("\n", lastImportIndex) + 1;
      newContent =
        content.substring(0, afterLastImport) +
        "import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';\n" +
        content.substring(afterLastImport);
    }
  }

  // Wrap export functions
  const exportRegex = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g;
  let match;
  const matches: Array<{ name: string; index: number }> = [];

  while ((match = exportRegex.exec(newContent)) !== null) {
    matches.push({ name: match[2], index: match.index });
  }

  // Wrap each function (in reverse order to maintain indices)
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

    // Wrap it - fix function declaration syntax
    // Remove "export async function" and replace with async function
    const funcDefFixed = funcDef
      .replace(/export\s+async\s+function\s+(\w+)/, "async function $1")
      .replace(/export\s+function\s+(\w+)/, "function $1");

    const wrapped = `export const ${funcName} = withUniversalBillingGate(${funcDefFixed}, { feature: '${funcName} API' });`;
    newContent = newContent.substring(0, funcStart) + wrapped + newContent.substring(funcEnd);
  }

  writeFileSync(filePath, newContent, "utf-8");
}

async function main() {
  console.log("🔒 Applying billing enforcement to console routes...\n");

  const routeFiles = await glob("**/route.ts", {
    cwd: API_DIR,
    absolute: true,
    ignore: ["**/*.backup", "**/health/**"],
  });

  console.log(`Found ${routeFiles.length} console route files\n`);

  const results: RouteInfo[] = [];
  let updated = 0;

  for (const file of routeFiles) {
    const info = checkRoute(file);
    results.push(info);

    if (info.needsBilling) {
      console.log(`🔒 Adding billing to: ${info.path}`);
      try {
        addBillingGate(file);
        updated++;
        console.log(`   ✅ Updated\n`);
      } catch (error) {
        console.error(`   ❌ Failed: ${error}\n`);
      }
    }
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`Total routes: ${results.length}`);
  console.log(`Already have billing: ${results.filter((r) => r.hasBilling).length}`);
  console.log(`Updated: ${updated}`);
  console.log(
    `Still need billing: ${results.filter((r) => r.needsBilling && !r.hasBilling).length}\n`
  );
}

main().catch(console.error);
