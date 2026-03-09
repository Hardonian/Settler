import fs from "node:fs/promises";
import { Command } from "commander";
import chalk from "chalk";
import {
  computeReconciliationHash,
  EXPORT_SCHEMA_VERSION,
  validateHashChain,
} from "../lib/export-integrity";
import { createTraceContext, withTraceHeaders } from "../lib/http";

interface ExportDocument {
  schemaVersion: string;
  run: unknown;
  matches: unknown[];
  integrity: {
    reconciliationHash: string;
    chain: Array<{
      previousHash: string | null;
      reconciliationHash: string;
      chainHash: string;
    }>;
  };
}

export const exportCommand = new Command("export").description(
  "Export reconciliation data using the portability contract"
);

exportCommand
  .requiredOption("-r, --run-id <runId>", "Reconciliation run ID")
  .option("-o, --output <file>", "Write export to file path")
  .action(async (options) => {
    const apiKey = process.env.SETTLER_API_KEY || options.parent.apiKey;
    if (!apiKey) {
      console.error(chalk.red("Error: API key required"));
      process.exit(1);
    }

    const baseUrl = (options.parent.baseUrl || "https://api.settler.io").replace(/\/$/, "");
    const url = `${baseUrl}/api/export?runId=${encodeURIComponent(options.runId)}`;

    const trace = createTraceContext();
    const response = await fetch(url, {
      headers: withTraceHeaders(
        {
          Authorization: `Bearer ${apiKey}`,
        },
        trace
      ),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(chalk.red(`Error: export request failed (${response.status}) ${body}`));
      process.exit(1);
    }

    const payload = (await response.json()) as ExportDocument;

    if (options.output) {
      await fs.writeFile(options.output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      console.log(chalk.green(`Export written to ${options.output}`));
      return;
    }

    console.log(JSON.stringify(payload, null, 2));
  });

const verifyExportCommand = new Command("verify-export")
  .description("Verify export integrity contract and deterministic hashes")
  .argument("<file>", "Path to JSON export file")
  .action(async (file) => {
    const raw = await fs.readFile(file, "utf8");
    const payload = JSON.parse(raw) as ExportDocument;

    if (payload.schemaVersion !== EXPORT_SCHEMA_VERSION) {
      console.error(
        chalk.red(
          `Schema version mismatch: expected ${EXPORT_SCHEMA_VERSION}, got ${payload.schemaVersion}`
        )
      );
      process.exit(1);
    }

    const chainResult = validateHashChain(payload.integrity.chain);
    if (!chainResult.valid) {
      console.error(chalk.red(`Hash chain validation failed at index ${chainResult.brokenIndex}`));
      process.exit(1);
    }

    const deterministicHash = computeReconciliationHash(payload.run, payload.matches);
    if (deterministicHash !== payload.integrity.reconciliationHash) {
      console.error(chalk.red("Deterministic reconciliation hash mismatch"));
      process.exit(1);
    }

    console.log(chalk.green("Export verification passed"));
    console.log(`schemaVersion=${payload.schemaVersion}`);
    console.log(`chainEntries=${payload.integrity.chain.length}`);
    console.log(`reconciliationHash=${deterministicHash}`);
  });

export { verifyExportCommand };
