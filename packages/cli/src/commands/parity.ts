import { Command } from "commander";
import chalk from "chalk";
import { createTraceContext, withTraceHeaders } from "../lib/http";

export const parityCommand = new Command("parity").description(
  "TigerBeetle dual-ledger parity invariant monitor and verification operations"
);

parityCommand
  .command("verify")
  .description("Evaluate dual-ledger invariants and generate a signed cryptographic parity proof")
  .option("-t, --tenant-id <tenantId>", "Tenant ID", "00000000-0000-0000-0000-000000000000")
  .option("-v, --volume <volumeCents>", "Expected relational matched volume in cents")
  .action(async (options: { tenantId: string; volume?: string }, cmd: Command) => {
    const parentOpts = cmd.optsWithGlobals();
    const baseUrl = (
      parentOpts.baseUrl ||
      process.env.SETTLER_API_URL ||
      "http://localhost:4000"
    ).replace(/\/$/, "");
    const apiKey = parentOpts.apiKey || process.env.SETTLER_API_KEY || "local-dev-key";

    console.log(
      chalk.blue(`Evaluating TigerBeetle dual-ledger invariants for tenant ${options.tenantId}...`)
    );

    try {
      const trace = createTraceContext(options.tenantId);
      const res = await fetch(`${baseUrl}/api/v2/ledger/parity/verify`, {
        method: "POST",
        headers: withTraceHeaders(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          trace
        ),
        body: JSON.stringify({
          tenantId: options.tenantId,
          relationalMatchedVolumeCents: options.volume ? options.volume : undefined,
        }),
      });

      const body: any = await res.json();
      if (!res.ok) {
        console.error(
          chalk.red(`Invariant verification failed (${res.status}):`),
          body?.error || body
        );
        process.exit(1);
      }

      const proof = body.data;
      console.log(chalk.green("\nDual-Ledger Invariant Verification Completed:"));
      console.log(`  Proof ID:           ${chalk.cyan(proof.proofId)}`);
      console.log(`  Epoch:              ${chalk.yellow(proof.epoch)}`);
      console.log(
        `  Double-Entry State: ${
          proof.isBalanced ? chalk.green("BALANCED (Zero-Sum)") : chalk.red("IMBALANCED")
        }`
      );
      console.log(
        `  Drift State:        ${
          proof.driftDetected
            ? chalk.red(
                `DRIFT DETECTED (${proof.driftMagnitudeCents} cents, ${proof.driftRootCause})`
              )
            : chalk.green("IN PARITY (Zero Drift)")
        }`
      );
      console.log(`  Posted Debits:      ${proof.tigerbeetlePostedDebitCents} cents`);
      console.log(`  Posted Credits:     ${proof.tigerbeetlePostedCreditCents} cents`);
      console.log(`  Pending Debits:     ${proof.tigerbeetlePendingDebitCents} cents`);
      console.log(`  Pending Credits:    ${proof.tigerbeetlePendingCreditCents} cents`);
      console.log(`  Epoch Merkle Root:  ${chalk.magenta(proof.epochMerkleRoot)}`);
      console.log(`  Proof Signature:    ${chalk.gray(proof.signature)}`);
    } catch (err) {
      console.error(chalk.red("Error calling parity verify endpoint:"), err);
      process.exit(1);
    }
  });

parityCommand
  .command("status")
  .description("Fetch current dual-ledger parity telemetry and historical proofs")
  .option("-t, --tenant-id <tenantId>", "Tenant ID", "00000000-0000-0000-0000-000000000000")
  .action(async (options: { tenantId: string }, cmd: Command) => {
    const parentOpts = cmd.optsWithGlobals();
    const baseUrl = (
      parentOpts.baseUrl ||
      process.env.SETTLER_API_URL ||
      "http://localhost:4000"
    ).replace(/\/$/, "");
    const apiKey = parentOpts.apiKey || process.env.SETTLER_API_KEY || "local-dev-key";

    try {
      const trace = createTraceContext(options.tenantId);
      const res = await fetch(
        `${baseUrl}/api/v2/ledger/parity/status?tenantId=${options.tenantId}`,
        {
          headers: withTraceHeaders(
            {
              Authorization: `Bearer ${apiKey}`,
            },
            trace
          ),
        }
      );

      const body: any = await res.json();
      if (!res.ok) {
        console.error(
          chalk.red(`Failed to fetch parity status (${res.status}):`),
          body?.error || body
        );
        process.exit(1);
      }

      const data = body.data;
      console.log(chalk.green(`\nTigerBeetle Dual-Ledger Status for Tenant: ${options.tenantId}`));
      console.log(
        `  Health:             ${data.healthy ? chalk.green("HEALTHY") : chalk.red("DRIFT DETECTED")}`
      );
      console.log(`  Accounts Indexed:   ${data.accountCount}`);
      console.log(`  Last Verified At:   ${data.lastVerifiedAt ?? "Never"}`);
      if (data.latestProof) {
        console.log(`  Latest Epoch:       ${chalk.yellow(data.latestProof.epoch)}`);
        console.log(`  Latest Merkle Root: ${chalk.cyan(data.latestProof.epochMerkleRoot)}`);
      }
    } catch (err) {
      console.error(chalk.red("Error fetching parity status:"), err);
      process.exit(1);
    }
  });
