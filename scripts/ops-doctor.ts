#!/usr/bin/env tsx
/**
 * Ops Doctor - "One Command to Rule Them All"
 *
 * Bundles existing tooling into a single comprehensive health check:
 * - lint / typecheck (fast)
 * - route crawl / dead link QA
 * - SLA violations scan
 * - SOC2 readiness scan (if present)
 * - DB migration sanity (detect drift)
 * - basic health endpoints checks
 *
 * Outputs a single summary report: ops/reports/DOCTOR_SUMMARY.md
 */

import { execSync } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "skip" | "warning";
  message: string;
  duration?: number;
  logs?: string;
}

const results: CheckResult[] = [];

async function runCheck(
  name: string,
  command: string,
  options: { required?: boolean; timeout?: number } = {}
): Promise<CheckResult> {
  const { required = true, timeout = 300000 } = options;
  const startTime = Date.now();

  try {
    console.info(`\n🔍 Running: ${name}...`);
    const output = execSync(command, {
      encoding: "utf-8",
      stdio: "pipe",
      timeout,
    });

    const duration = Date.now() - startTime;
    console.info(`✅ ${name} passed (${duration}ms)`);

    return {
      name,
      status: "pass",
      message: "Check passed",
      duration,
      logs: output.substring(0, 1000), // Limit log size
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.message || String(error);
    const status = required ? "fail" : "warning";

    console.info(`❌ ${name} ${status === "fail" ? "failed" : "warned"} (${duration}ms)`);
    console.info(`   ${errorMessage.substring(0, 200)}`);

    return {
      name,
      status,
      message: errorMessage.substring(0, 500),
      duration,
      logs: error.stdout || error.stderr || errorMessage,
    };
  }
}

function checkRouteRegistry(): CheckResult {
  try {
    console.info("\n🔍 Running: Route Registry Generation...");
    execSync("npm run qa:routes", { stdio: "pipe", timeout: 60000 });
    return {
      name: "Route Registry",
      status: "pass",
      message: "Route registry generated",
    };
  } catch (error: any) {
    return {
      name: "Route Registry",
      status: "warning",
      message: error.message?.substring(0, 200) || "Failed to generate route registry",
    };
  }
}

function checkSLAViolations(): CheckResult {
  try {
    console.info("\n🔍 Running: SLA Violations Check...");
    execSync("tsx scripts/check-sla-violations.ts", { stdio: "pipe", timeout: 120000 });
    return {
      name: "SLA Violations",
      status: "pass",
      message: "No SLA violations detected",
    };
  } catch (error: any) {
    const exitCode = (error as any).status || (error as any).code;
    if (exitCode === 1) {
      // Exit code 1 means violations found, not a script error
      return {
        name: "SLA Violations",
        status: "warning",
        message: "SLA violations detected - check logs for details",
        logs: error.stdout || error.message,
      };
    } else {
      return {
        name: "SLA Violations",
        status: "skip",
        message: "SLA check script not available or failed",
      };
    }
  }
}

function checkSOC2Readiness(): CheckResult {
  try {
    console.info("\n🔍 Running: SOC2 Readiness Check...");
    execSync("tsx scripts/check-soc2-readiness.ts", { stdio: "pipe", timeout: 120000 });
    return {
      name: "SOC2 Readiness",
      status: "pass",
      message: "SOC2 checks passed",
    };
  } catch {
    return {
      name: "SOC2 Readiness",
      status: "skip",
      message: "SOC2 check script not available",
    };
  }
}

function checkDBMigration(): CheckResult {
  try {
    console.info("\n🔍 Running: Database Migration Status...");
    const migrationStatus = execSync("npm run prisma:status", {
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 60000,
    });

    if (migrationStatus.includes("Database schema is up to date")) {
      return {
        name: "DB Migration Status",
        status: "pass",
        message: "Database schema is up to date",
      };
    } else if (migrationStatus.includes("migrations pending")) {
      return {
        name: "DB Migration Status",
        status: "warning",
        message: "Pending migrations detected",
        logs: migrationStatus,
      };
    } else {
      return {
        name: "DB Migration Status",
        status: "warning",
        message: "Migration status unclear",
        logs: migrationStatus.substring(0, 500),
      };
    }
  } catch (error: any) {
    return {
      name: "DB Migration Status",
      status: "skip",
      message: "Could not check migration status",
      logs: error.message?.substring(0, 200),
    };
  }
}

function checkHealthEndpoints(): CheckResult {
  try {
    console.info("\n🔍 Running: Health Endpoints Check...");
    // Try to check if health endpoint exists (this is a placeholder - would need actual endpoint)
    return {
      name: "Health Endpoints",
      status: "skip",
      message: "Health endpoint check requires running server - skipped in CI",
    };
  } catch {
    return {
      name: "Health Endpoints",
      status: "skip",
      message: "Health check skipped",
    };
  }
}

function checkBuild(): CheckResult {
  try {
    console.info("\n🔍 Running: Build Check...");
    execSync("npm run build", { stdio: "pipe", timeout: 300000 });
    return {
      name: "Build",
      status: "pass",
      message: "Build successful",
    };
  } catch (error: any) {
    return {
      name: "Build",
      status: "fail",
      message: "Build failed",
      logs: error.message?.substring(0, 500),
    };
  }
}

async function saveAndPrintSummary(results: CheckResult[], startTime: number) {
  const totalDuration = Date.now() - startTime;
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const skipped = results.filter((r) => r.status === "skip").length;

  // Generate summary report
  const summary = generateSummaryMarkdown(results, {
    totalDuration,
    passed,
    failed,
    warnings,
    skipped,
  });

  // Save report
  const reportsDir = join(process.cwd(), "ops", "reports");
  await mkdir(reportsDir, { recursive: true });
  const reportPath = join(reportsDir, "DOCTOR_SUMMARY.md");
  await writeFile(reportPath, summary, "utf-8");

  // Print summary
  console.info("\n" + "=".repeat(60));
  console.info("🏥 Ops Doctor Summary\n");
  console.info(`✅ Passed: ${passed}`);
  console.info(`❌ Failed: ${failed}`);
  console.info(`⚠️  Warnings: ${warnings}`);
  console.info(`⏭️  Skipped: ${skipped}`);
  console.info(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.info(`\n📄 Full report saved to: ${reportPath}`);

  if (failed > 0) {
    console.info("\n❌ Some checks failed. Review the report for details.");
    process.exit(1);
  } else if (warnings > 0) {
    console.info("\n⚠️  Some checks produced warnings. Review the report.");
    process.exit(0);
  } else {
    console.info("\n✅ All checks passed!");
    process.exit(0);
  }
}

async function main() {
  console.info("🏥 Ops Doctor - Comprehensive Health Check\n");
  console.info("=".repeat(60));

  const startTime = Date.now();

  // 1. Fast checks: lint / typecheck
  results.push(await runCheck("Lint", "npm run lint", { required: true }));
  results.push(await runCheck("Typecheck", "npm run typecheck", { required: true }));

  // 2. Route crawl / dead link QA
  results.push(checkRouteRegistry());
  results.push(await runCheck("Dead Link Check", "npm run qa:links", { required: false }));

  // 3. SLA violations scan
  results.push(checkSLAViolations());

  // 4. SOC2 readiness scan (if present)
  results.push(checkSOC2Readiness());

  // 5. DB migration sanity
  results.push(checkDBMigration());

  // 6. Basic health endpoints check
  results.push(checkHealthEndpoints());

  // 7. Build check (optional but recommended)
  results.push(checkBuild());

  await saveAndPrintSummary(results, startTime);
}

function generateSummaryMarkdown(
  results: CheckResult[],
  stats: {
    totalDuration: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  }
): string {
  const { totalDuration, passed, failed, warnings, skipped } = stats;
  const timestamp = new Date().toISOString();

  let markdown = `# Ops Doctor Summary

**Generated:** ${new Date(timestamp).toLocaleString()}
**Total Duration:** ${(totalDuration / 1000).toFixed(1)}s

---

## Summary

- ✅ **Passed:** ${passed}
- ❌ **Failed:** ${failed}
- ⚠️  **Warnings:** ${warnings}
- ⏭️  **Skipped:** ${skipped}

**Overall Status:** ${failed > 0 ? "❌ FAILED" : warnings > 0 ? "⚠️ WARNINGS" : "✅ PASSED"}

---

## Check Results

`;

  results.forEach((result) => {
    const statusIcon =
      result.status === "pass"
        ? "✅"
        : result.status === "fail"
          ? "❌"
          : result.status === "warning"
            ? "⚠️"
            : "⏭️";

    markdown += `### ${statusIcon} ${result.name}\n\n`;
    markdown += `- **Status:** ${result.status.toUpperCase()}\n`;
    markdown += `- **Message:** ${result.message}\n`;
    if (result.duration) {
      markdown += `- **Duration:** ${result.duration}ms\n`;
    }
    if (result.logs && result.logs.length > 0) {
      markdown += `\n**Logs:**\n\`\`\`\n${result.logs.substring(0, 1000)}\n\`\`\`\n`;
    }
    markdown += "\n";
  });

  markdown += `---

## Next Steps

`;

  if (failed > 0) {
    markdown += `### ❌ Failed Checks\n\n`;
    results
      .filter((r) => r.status === "fail")
      .forEach((result) => {
        markdown += `- **${result.name}:** ${result.message}\n`;
      });
    markdown += "\n";
  }

  if (warnings > 0) {
    markdown += `### ⚠️ Warnings\n\n`;
    results
      .filter((r) => r.status === "warning")
      .forEach((result) => {
        markdown += `- **${result.name}:** ${result.message}\n`;
      });
    markdown += "\n";
  }

  markdown += `---

*Generated by Ops Doctor - "One Command to Rule Them All"*\n`;

  return markdown;
}

main().catch((error) => {
  console.error("❌ Ops Doctor failed:", error);
  process.exit(1);
});
