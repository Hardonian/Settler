/**
 * Final Verification Script
 *
 * Runs all verification checks to ensure everything is properly configured.
 */

import { execSync } from "child_process";

const checks = [
  {
    name: "Database Migrations",
    command: "npx tsx scripts/test-setup.ts",
    env: { DATABASE_URL: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL },
  },
  {
    name: "API Routes",
    command: "npx tsx scripts/test-api-routes.ts",
    env: { DATABASE_URL: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL },
  },
  {
    name: "Integration Tests",
    command: "npx tsx scripts/integration-test.ts",
    env: { DATABASE_URL: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL },
  },
  {
    name: "Route Verification",
    command: "npx tsx scripts/verify-all-routes.ts",
    env: {},
  },
];

async function runFinalVerification() {
  console.log("🚀 Running Final Verification...\n");

  const results: Array<{ name: string; status: "pass" | "fail"; output: string }> = [];

  for (const check of checks) {
    console.log(`📋 Running: ${check.name}...`);

    try {
      const env = { ...process.env, ...check.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" };
      const output = execSync(check.command, {
        encoding: "utf-8",
        env,
        stdio: "pipe",
      });

      // Check for success indicators
      const hasSuccess =
        output.includes("✅") ||
        output.includes("passed") ||
        output.includes("complete") ||
        output.includes("OK");

      const hasError =
        output.includes("❌") && !output.includes("✅") && output.toLowerCase().includes("error");

      results.push({
        name: check.name,
        status: hasError ? "fail" : hasSuccess ? "pass" : "fail",
        output: output.split("\n").slice(-10).join("\n"), // Last 10 lines
      });

      console.log(`   ${hasError ? "❌" : "✅"} ${check.name}\n`);
    } catch (error: any) {
      const output = error.stdout?.toString() || error.message || "Unknown error";
      results.push({
        name: check.name,
        status: "fail",
        output: output.split("\n").slice(-10).join("\n"),
      });
      console.log(`   ❌ ${check.name} failed\n`);
    }
  }

  // Summary
  console.log("\n📊 Verification Summary:");
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;

  results.forEach((r) => {
    console.log(`   ${r.status === "pass" ? "✅" : "❌"} ${r.name}`);
  });

  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed === 0) {
    console.log("\n🎉 All verifications passed! System is ready.");
  } else {
    console.log("\n⚠️  Some verifications failed. Review output above.");
  }

  return failed === 0;
}

runFinalVerification().then((success) => {
  process.exit(success ? 0 : 1);
});
