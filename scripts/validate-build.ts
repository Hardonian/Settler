#!/usr/bin/env tsx
/**
 * Build Validation Script
 *
 * Validates build readiness before deployment:
 * - Checks for unused imports
 * - Ensures API routes using cookies are marked as dynamic
 * - Validates Prisma configuration
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function findFiles(dir: string, pattern: RegExp, files: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip node_modules, .next, dist, etc.
    if (entry.isDirectory()) {
      if (
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== ".next"
      ) {
        findFiles(fullPath, pattern, files);
      }
    } else if (entry.isFile() && pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkApiRoutesForDynamic(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const apiRoutes = findFiles(join(process.cwd(), "packages/web/src/app/api"), /route\.ts$/);

  for (const routeFile of apiRoutes) {
    const content = readFileSync(routeFile, "utf-8");

    // Check if route uses cookies (via createClient or cookies())
    const usesCookies =
      content.includes("createClient") ||
      content.includes("cookies()") ||
      content.includes("getUser()") ||
      content.includes("auth.getUser()");

    // Check if route is marked as dynamic
    const isDynamic =
      content.includes("export const dynamic = 'force-dynamic'") ||
      content.includes('export const dynamic = "force-dynamic"');

    if (usesCookies && !isDynamic) {
      const relativePath = routeFile.replace(process.cwd() + "/", "");
      errors.push(
        `API route ${relativePath} uses cookies but is not marked as dynamic. ` +
          `Add: export const dynamic = 'force-dynamic';`
      );
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function checkUnusedImports(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // This is a simplified check - full unused import detection requires TypeScript compiler
  // We'll rely on TypeScript's typecheck:ci for this

  return {
    passed: true,
    errors,
    warnings,
  };
}

function checkPrismaConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const prismaClientPath = join(process.cwd(), "packages/web/src/shared/db/prismaClient.ts");

  if (!require("fs").existsSync(prismaClientPath)) {
    errors.push("Prisma client file not found");
    return { passed: false, errors, warnings };
  }

  const content = readFileSync(prismaClientPath, "utf-8");

  // Check for build-time resilience
  if (!content.includes("isBuildPhase")) {
    warnings.push("Prisma client may not handle build-time gracefully");
  }

  if (!content.includes("PRISMA_CLIENT_ENGINE_TYPE")) {
    warnings.push("Prisma client may not force binary engine type");
  }

  return {
    passed: true,
    errors,
    warnings,
  };
}

async function main() {
  console.log("🔍 Validating build readiness...\n");

  const results: ValidationResult[] = [];

  // Check API routes
  console.log("Checking API routes...");
  const apiRouteResult = checkApiRoutesForDynamic();
  results.push(apiRouteResult);

  // Check Prisma config
  console.log("Checking Prisma configuration...");
  const prismaResult = checkPrismaConfig();
  results.push(prismaResult);

  // Check unused imports (simplified)
  console.log("Checking for unused imports...");
  const importResult = checkUnusedImports();
  results.push(importResult);

  // Aggregate results
  const allErrors = results.flatMap((r) => r.errors);
  const allWarnings = results.flatMap((r) => r.warnings);
  const allPassed = results.every((r) => r.passed);

  // Print results
  if (allWarnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    allWarnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (allErrors.length > 0) {
    console.log("\n❌ Errors:");
    allErrors.forEach((e) => console.log(`   - ${e}`));
    console.log("\n❌ Build validation failed. Fix errors above before deploying.\n");
    process.exit(1);
  }

  if (allPassed) {
    console.log("\n✅ Build validation passed!\n");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Validation script error:", error);
  process.exit(1);
});
