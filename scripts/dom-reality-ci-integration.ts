/**
 * DOM Reality CI Integration Helper
 *
 * Provides utilities for CI/CD integration and automated reporting.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { ReportSummary } from "./dom-reality-types";

/**
 * Check if critical issues exist in reports
 */
export function checkCriticalIssues(reportsDir: string): {
  hasCriticalIssues: boolean;
  criticalCount: number;
  summary?: ReportSummary;
} {
  const summaryPath = join(reportsDir, "summary.json");

  if (!existsSync(summaryPath)) {
    return {
      hasCriticalIssues: false,
      criticalCount: 0,
    };
  }

  try {
    const summaryContent = readFileSync(summaryPath, "utf-8");
    const summary = JSON.parse(summaryContent) as ReportSummary;

    return {
      hasCriticalIssues: summary.criticalIssues > 0,
      criticalCount: summary.criticalIssues,
      summary,
    };
  } catch (error) {
    console.error("Failed to read summary:", error);
    return {
      hasCriticalIssues: false,
      criticalCount: 0,
    };
  }
}

/**
 * Generate CI-friendly output
 */
export function generateCIOutput(reportsDir: string): string {
  const check = checkCriticalIssues(reportsDir);

  let output = "## DOM Reality Check Results\n\n";

  if (check.summary) {
    output += `- **Routes Inspected**: ${check.summary.totalRoutes}\n`;
    output += `- **Critical Issues**: ${check.summary.criticalIssues}\n`;
    output += `- **Warnings**: ${check.summary.warnings}\n\n`;

    if (check.summary.criticalIssues > 0) {
      output += "### ⚠️ Critical Issues Found\n\n";
      output += "Please review and fix critical issues before merging.\n\n";

      // List routes with critical issues
      const routesWithIssues = check.summary.routes.filter((r) => r.criticalIssues > 0);

      if (routesWithIssues.length > 0) {
        output += "**Routes with critical issues:**\n";
        routesWithIssues.forEach((route) => {
          output += `- ${route.route}: ${route.criticalIssues} critical issue(s)\n`;
        });
        output += "\n";
      }
    } else {
      output += "### ✅ No Critical Issues\n\n";
      output += "All DOM reality checks passed!\n\n";
    }
  } else {
    output += "⚠️ No summary report found. Run `npm run qa:dom-reality:inspect` first.\n\n";
  }

  output += `\n📊 Full report: \`test-results/dom-reality-reports/DOM_REALITY_REPORT.html\`\n`;

  return output;
}

/**
 * Exit with appropriate code based on critical issues
 */
export function exitWithCode(reportsDir: string): void {
  const check = checkCriticalIssues(reportsDir);

  if (check.hasCriticalIssues) {
    console.error(`❌ Found ${check.criticalCount} critical DOM reality issue(s)`);
    process.exit(1);
  } else {
    console.log("✅ No critical DOM reality issues found");
    process.exit(0);
  }
}

// CLI entry point
if (require.main === module) {
  const reportsDir = process.argv[2] || join(process.cwd(), "test-results", "dom-reality-reports");
  const action = process.argv[3] || "check";

  switch (action) {
    case "check":
      const check = checkCriticalIssues(reportsDir);
      console.log(JSON.stringify(check, null, 2));
      break;
    case "output":
      console.log(generateCIOutput(reportsDir));
      break;
    case "exit":
      exitWithCode(reportsDir);
      break;
    default:
      console.error(`Unknown action: ${action}`);
      console.log("Usage: dom-reality-ci-integration.ts [reportsDir] [check|output|exit]");
      process.exit(1);
  }
}
