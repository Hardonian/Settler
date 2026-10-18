/**
 * Settler CLI Recovery Command
 *
 * Manages autonomous Revenue OS dispute claim packets and fee overcharge recovery.
 */

import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { createTraceContext, withTraceHeaders } from "../lib/http";

export const recoveryCommand = new Command("recovery").description(
  "Revenue OS autonomous discrepancy recovery and processor dispute generation"
);

recoveryCommand
  .command("list")
  .description("List active dispute claims and recovery packages for a tenant")
  .option("-t, --tenant-id <tenantId>", "Tenant ID", "00000000-0000-0000-0000-000000000000")
  .action(async (options: { tenantId: string }, cmd: Command) => {
    const parentOpts = cmd.optsWithGlobals();
    const baseUrl = (
      parentOpts.baseUrl ||
      process.env.SETTLER_API_URL ||
      "http://localhost:4000"
    ).replace(/\/$/, "");
    const apiKey = parentOpts.apiKey || process.env.SETTLER_API_KEY || "local-dev-key";

    console.log(chalk.blue(`Fetching active recovery claims for tenant ${options.tenantId}...`));

    try {
      const trace = createTraceContext(options.tenantId);
      const res = await fetch(`${baseUrl}/api/v2/recovery/claims?tenantId=${options.tenantId}`, {
        headers: withTraceHeaders(
          {
            Authorization: `Bearer ${apiKey}`,
          },
          trace
        ),
      });

      if (res.ok) {
        const body = (await res.json()) as any;
        console.log(chalk.green(`\nFound ${body.claimsCount} active recovery claims:`));
        for (const claim of body.claims) {
          const formatted = (claim.totalClaimAmountMinorUnits / 100).toFixed(2);
          console.log(
            ` - [${chalk.cyan(claim.id)}] ${chalk.bold(claim.claimType)} (${claim.processorName}): ${claim.currency} ${formatted} (${claim.status})`
          );
        }
      } else {
        const err = await res.text();
        console.error(chalk.red(`Failed to fetch recovery claims: ${err}`));
        process.exitCode = 1;
      }
    } catch (err: any) {
      console.error(chalk.red(`Error connecting to Settler API: ${err.message}`));
      process.exitCode = 1;
    }
  });

recoveryCommand
  .command("export")
  .description("Export a verified processor dispute filing package with CSV line items")
  .requiredOption("-c, --claim-id <claimId>", "Claim ID to export")
  .option("-t, --tenant-id <tenantId>", "Tenant ID", "00000000-0000-0000-0000-000000000000")
  .option("-o, --out <outPath>", "Output JSON file path")
  .action(async (options: { claimId: string; tenantId: string; out?: string }, cmd: Command) => {
    const parentOpts = cmd.optsWithGlobals();
    const baseUrl = (
      parentOpts.baseUrl ||
      process.env.SETTLER_API_URL ||
      "http://localhost:4000"
    ).replace(/\/$/, "");
    const apiKey = parentOpts.apiKey || process.env.SETTLER_API_KEY || "local-dev-key";

    console.log(chalk.blue(`Exporting dispute bundle for claim ${options.claimId}...`));

    try {
      const trace = createTraceContext(options.tenantId);
      const res = await fetch(
        `${baseUrl}/api/v2/recovery/claims/${encodeURIComponent(options.claimId)}/export?tenantId=${options.tenantId}`,
        {
          method: "POST",
          headers: withTraceHeaders(
            {
              Authorization: `Bearer ${apiKey}`,
            },
            trace
          ),
        }
      );

      if (res.ok) {
        const body = (await res.json()) as any;
        const bundle = body.bundle;
        const outTarget = options.out ?? `dispute-package-${options.claimId}.json`;
        const resolvedPath = path.resolve(process.cwd(), outTarget);

        fs.writeFileSync(resolvedPath, JSON.stringify(bundle, null, 2), "utf8");
        console.log(chalk.green(`\nDispute package exported successfully to:`));
        console.log(chalk.bold(` ${resolvedPath}`));
        console.log(
          ` Canonical Proof Hash: ${chalk.cyan(bundle.formattedFilingPayload.canonicalHash)}`
        );
      } else {
        const err = await res.text();
        console.error(chalk.red(`Failed to export recovery claim bundle: ${err}`));
        process.exitCode = 1;
      }
    } catch (err: any) {
      console.error(chalk.red(`Error exporting claim bundle: ${err.message}`));
      process.exitCode = 1;
    }
  });
