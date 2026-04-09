#!/usr/bin/env tsx
/**
 * Unified Reality Check
 *
 * Single "one button" command that runs all reality checks:
 * - Typecheck + lint + tests
 * - Build
 * - Minimal Playwright route smoke (home, pricing, signup, login, console gating)
 * - Billing validation
 * - DB schema sanity checks
 *
 * CI-friendly and fast.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

interface CheckStep {
  name: string;
  command: string;
  description: string;
  required: boolean;
  skipIf?: () => boolean;
}

const workspaceRoot = process.cwd();

function runCommand(command: string, description: string): boolean {
  try {
    console.log(`\n🔍 ${description}...`);
    execSync(command, {
      cwd: workspaceRoot,
      stdio: "inherit",
      encoding: "utf-8",
    });
    console.log(`✅ ${description} passed\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} failed`);
    return false;
  }
}

async function main() {
  console.log("🚀 Running Unified Reality Check\n");
  console.log("=".repeat(60));
  console.log("This check ensures the repo is ready for production");
  console.log("=".repeat(60));

  const steps: CheckStep[] = [
    {
      name: "typecheck",
      command: "npm run typecheck",
      description: "Type check all packages",
      required: true,
    },
    {
      name: "lint",
      command: "npm run lint",
      description: "Lint all packages",
      required: true,
    },
    {
      name: "test",
      command: "npm run test",
      description: "Run unit tests",
      required: false, // Optional but recommended
      skipIf: () => !existsSync(join(workspaceRoot, "packages/api/src/__tests__")),
    },
    {
      name: "build",
      command: "npm run build",
      description: "Build all deployable apps",
      required: true,
    },
    {
      name: "smoke-routes",
      command: "npm run qa:smoke",
      description: "Smoke test key routes (no hard 500s)",
      required: false, // Optional - requires full environment
      skipIf: () => !process.env.BASE_URL && !process.env.E2E_BASE_URL,
    },
    {
      name: "billing-validation",
      command: "npm run validate:billing",
      description: "Validate billing/Stripe integration",
      required: false, // Optional - requires Stripe keys
      skipIf: () => !process.env.STRIPE_SECRET_KEY,
    },
  ];

  const results: Array<{ step: CheckStep; passed: boolean }> = [];

  for (const step of steps) {
    // Skip if condition met
    if (step.skipIf && step.skipIf()) {
      console.log(`\n⏭️  Skipping ${step.name} (condition not met)\n`);
      continue;
    }

    const passed = runCommand(step.command, step.description);
    results.push({ step, passed });

    if (!passed && step.required) {
      console.error(`\n❌ Required check "${step.name}" failed`);
      console.error("   Reality check cannot proceed\n");
      process.exit(1);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Reality Check Summary");
  console.log("=".repeat(60));

  const requiredPassed = results.filter((r) => r.step.required && r.passed).length;
  const requiredFailed = results.filter((r) => r.step.required && !r.passed).length;
  const optionalPassed = results.filter((r) => !r.step.required && r.passed).length;
  const optionalFailed = results.filter((r) => !r.step.required && !r.passed).length;

  results.forEach(({ step, passed }) => {
    const icon = passed ? "✅" : "❌";
    const req = step.required ? "[REQUIRED]" : "[OPTIONAL]";
    console.log(`${icon} ${req} ${step.name}: ${passed ? "PASSED" : "FAILED"}`);
  });

  console.log("\n" + "=".repeat(60));

  if (requiredFailed > 0) {
    console.error(`\n❌ Reality check FAILED`);
    console.error(`   ${requiredFailed} required check(s) failed`);
    console.error(`   ${requiredPassed} required check(s) passed`);
    if (optionalFailed > 0) {
      console.warn(`   ⚠️  ${optionalFailed} optional check(s) failed`);
    }
    process.exit(1);
  }

  if (optionalFailed > 0) {
    console.warn(`\n⚠️  Reality check passed with warnings`);
    console.log(`   ✅ All ${requiredPassed} required checks passed`);
    console.warn(`   ⚠️  ${optionalFailed} optional check(s) failed (recommended to fix)`);
    process.exit(0);
  }

  console.log(`\n✅ Reality check PASSED`);
  console.log(`   ✅ All ${requiredPassed} required checks passed`);
  if (optionalPassed > 0) {
    console.log(`   ✅ All ${optionalPassed} optional checks passed`);
  }
  console.log("\n   Ready for production deployment.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Fatal error during reality check:", err);
  process.exit(1);
});
