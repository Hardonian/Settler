#!/usr/bin/env tsx
/**
 * Canonical Production Check
 *
 * Single source of truth for production readiness.
 * MUST execute in order:
 * 1. repo-integrity (workspace/package validation)
 * 2. lint (all packages)
 * 3. typecheck (all packages)
 * 4. build (all deployable apps)
 * 5. smoke tests (no hard 500s)
 *
 * If a package exists, it must be validated - even if not deployed.
 *
 * Usage: tsx scripts/check-production-readiness.ts
 */

import { execSync } from "child_process";

interface CheckStep {
  name: string;
  command: string;
  description: string;
  required: boolean;
}

const workspaceRoot = process.cwd();

/**
 * Run a command and return success status
 */
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

/**
 * Canonical production check
 */
async function checkProduction(): Promise<void> {
  console.log("🚀 Running Canonical Production Check\n");
  console.log("=".repeat(60));
  console.log("This check ensures the repo is ready for production deployment");
  console.log("=".repeat(60));

  const steps: CheckStep[] = [
    {
      name: "repo-integrity",
      command: "tsx scripts/repo-integrity.ts",
      description: "Repository integrity (workspaces, packages, scripts)",
      required: true,
    },
    {
      name: "lint",
      command: "pnpm run lint",
      description: "Lint all packages",
      required: true,
    },
    {
      name: "typecheck",
      command: "pnpm run typecheck",
      description: "Type check all packages",
      required: true,
    },
    {
      name: "build",
      command: "pnpm run build",
      description: "Build all deployable apps",
      required: true,
    },
    {
      name: "verify-setup",
      command: "pnpm run verify:setup",
      description: "Setup and configuration verification",
      required: true,
    },
    {
      name: "vercel-parity",
      command: "tsx scripts/vercel-parity.ts",
      description: "Vercel build parity verification",
      required: true,
    },
    {
      name: "smoke-test",
      command: "pnpm run test:smoke",
      description: "Smoke tests (no hard 500s)",
      required: false, // Optional but recommended
    },
  ];

  const results: Array<{ step: CheckStep; passed: boolean }> = [];

  // Execute all steps in order
  for (const step of steps) {
    const passed = runCommand(step.command, step.description);
    results.push({ step, passed });

    if (!passed && step.required) {
      console.error(`\n❌ Required check "${step.name}" failed`);
      console.error("   Production check cannot proceed\n");
      process.exit(1);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Production Check Summary");
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
    console.error(`\n❌ Production check FAILED`);
    console.error(`   ${requiredFailed} required check(s) failed`);
    console.error(`   ${requiredPassed} required check(s) passed`);
    if (optionalFailed > 0) {
      console.warn(`   ⚠️  ${optionalFailed} optional check(s) failed`);
    }
    console.error("\n   CI will block merge until these issues are resolved.\n");
    process.exit(1);
  }

  if (optionalFailed > 0) {
    console.warn(`\n⚠️  Production check passed with warnings`);
    console.log(`   ✅ All ${requiredPassed} required checks passed`);
    console.warn(`   ⚠️  ${optionalFailed} optional check(s) failed (recommended to fix)`);
    console.log("\n   Merge allowed, but consider fixing warnings.\n");
    process.exit(0);
  }

  console.log(`\n✅ Production check PASSED`);
  console.log(`   ✅ All ${requiredPassed} required checks passed`);
  if (optionalPassed > 0) {
    console.log(`   ✅ All ${optionalPassed} optional checks passed`);
  }
  console.log("\n   Ready for production deployment.\n");
  process.exit(0);
}

/**
 * Main execution
 */
async function main() {
  try {
    await checkProduction();
  } catch (error) {
    console.error("\n❌ Fatal error during production check:", error);
    process.exit(1);
  }
}

main();
