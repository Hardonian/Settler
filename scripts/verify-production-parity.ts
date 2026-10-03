#!/usr/bin/env tsx
/**
 * Production Parity Verification
 *
 * Master script that runs all verification checks:
 * 1. Schema introspection
 * 2. Frontend-backend contract mapping
 * 3. Edge functions verification
 * 4. Pipe dream signal detection
 *
 * This is the single command to verify that Settler.dev is production-ready.
 */

import { execSync } from "child_process";
import * as path from "path";

const scripts = [
  {
    name: "Production Schema Introspection",
    script: "scripts/introspect-production-schema.ts",
    // Required whenever DATABASE_URL is configured; cleanly skipped when it is
    // not (CI without DB secrets). A failure with env present is a real failure.
    required: true,
    skipIf: () => !process.env.DATABASE_URL,
  },
  {
    name: "Frontend-Backend Contract Mapping",
    script: "scripts/map-frontend-backend-contracts.ts",
    required: true,
  },
  {
    name: "Edge Functions Verification",
    script: "scripts/verify-edge-functions.ts",
    required: true,
  },
  {
    name: "Pipe Dream Signal Detection",
    script: "scripts/find-pipe-dream-signals.ts",
    required: true,
  },
];

async function main() {
  console.log("🔍 Running Production Parity Verification...\n");

  const results: Array<{ name: string; success: boolean; error?: string; skipped?: boolean }> = [];

  for (const { name, script, required, skipIf } of scripts) {
    if (skipIf?.()) {
      results.push({ name, success: true, skipped: true });
      console.warn(`⏭️  ${name} skipped (prerequisites not configured)`);
      continue;
    }
    console.log(`\n📋 ${name}...`);
    try {
      execSync(`npx tsx ${script}`, {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      });
      results.push({ name, success: true });
      console.log(`✅ ${name} completed`);
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      results.push({ name, success: false, error: errorMsg });

      if (required) {
        console.error(`❌ ${name} failed (required)`);
        process.exit(1);
      } else {
        console.warn(`⚠️  ${name} failed (optional)`);
      }
    }
  }

  console.log("\n📊 Verification Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const result of results) {
    const icon = result.skipped ? "⏭️" : result.success ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.skipped) {
      console.log("   Skipped: prerequisites not configured (not counted as a pass)");
    }
  }

  const anyFailed = results.some((r) => !r.success);
  const skippedCount = results.filter((r) => r.skipped).length;

  if (anyFailed) {
    console.log("\n❌ Some verifications failed");
    process.exit(1);
  }
  console.log(
    `\n✅ All required verifications passed${skippedCount ? ` (${skippedCount} skipped: prerequisites not configured)` : ""}!`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
