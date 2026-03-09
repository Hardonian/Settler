import { Command } from "commander";
import chalk from "chalk";
import { createTraceContext, withTraceHeaders } from "../lib/http";

interface TenantIntegrityResponse {
  tenantId: string;
  checkedAt: string;
  isolationRulesActive: boolean;
  noOrphanRecords: boolean;
  noCrossTenantReferences: boolean;
  details: {
    rlsTables: Array<{ tableName: string; rowLevelSecurity: boolean; policyCount: number }>;
    orphanRecords: { jobs: number; reconciliationMatches: number };
    crossTenantReferences: { jobsToUsers: number; matchesToRuns: number };
    reconciliationIntegrity: {
      valid: boolean;
      checkedRuns: number;
      brokenRunId: string | null;
    };
  };
}

export const tenantCheckCommand = new Command("tenant-check")
  .description("Verify tenant isolation integrity constraints")
  .action(async (options) => {
    const apiKey = process.env.SETTLER_API_KEY || options.parent.apiKey;
    if (!apiKey) {
      console.error(chalk.red("Error: API key required"));
      process.exit(1);
    }

    const baseUrl = (options.parent.baseUrl || "https://api.settler.io").replace(/\/$/, "");
    const trace = createTraceContext();
    const response = await fetch(`${baseUrl}/api/v1/tenant/integrity-check`, {
      headers: withTraceHeaders(
        {
          Authorization: `Bearer ${apiKey}`,
        },
        trace
      ),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(chalk.red(`Error: tenant integrity check failed (${response.status}) ${body}`));
      process.exit(1);
    }

    const report = (await response.json()) as TenantIntegrityResponse;

    const checks = [
      ["Isolation rules active", report.isolationRulesActive],
      ["No orphan records", report.noOrphanRecords],
      ["No cross-tenant references", report.noCrossTenantReferences],
      ["Reconciliation chain valid", report.details.reconciliationIntegrity.valid],
    ] as const;

    console.log(chalk.bold(`Tenant integrity report for ${report.tenantId}`));
    console.log(`Checked at: ${report.checkedAt}`);

    for (const [label, ok] of checks) {
      const prefix = ok ? chalk.green("PASS") : chalk.red("FAIL");
      console.log(`${prefix} ${label}`);
    }

    if (!checks.every(([, ok]) => ok)) {
      console.log(chalk.yellow("\nDetails:"));
      console.log(JSON.stringify(report.details, null, 2));
      process.exit(1);
    }

    console.log(chalk.green("\nAll tenant integrity checks passed."));
  });
