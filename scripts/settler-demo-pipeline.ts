#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

interface DemoAlert {
  id: string;
  severity: "warning" | "critical";
  type: "reconciliation_failed" | "match_rate_drop" | "api_error_spike";
  message: string;
  triggeredAt: string;
}

const outDir = path.resolve("examples/demo-output");
const demoArtifactsPath = path.join(outDir, "operator-demo-artifacts.json");
const seededDatasetPath = path.resolve("examples/demo-data/dataset.json");

function runCommand(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function main() {
  console.log("\n▶ Settler operator demo pipeline\n");
  console.log("1) Load dataset");
  const seededData = {
    stripe: [
      { id: "st_1", invoice_number: "INV-100", amount: 101.0 },
      { id: "st_2", invoice_number: "INV-101", amount: 205.75 },
      { id: "st_3", invoice_number: "INV-102", amount: 310.25 },
    ],
    quickbooks: [
      { id: "qb_1", invoice_number: "INV-100", amount: 101.01 },
      { id: "qb_2", invoice_number: "INV-101", amount: 205.7 },
      { id: "qb_3", invoice_number: "INV-102", amount: 299.0 },
    ],
  };
  await fs.mkdir(path.dirname(seededDatasetPath), { recursive: true });
  await fs.writeFile(seededDatasetPath, JSON.stringify(seededData, null, 2));

  console.log("2) Execute reconciliation run");
  runCommand("pnpm", ["run", "demo"]);

  console.log("3) Trigger anomaly + generate alert stream artifacts");
  const results = await readJson<Record<string, unknown>>(path.join(outDir, "results.json"));
  const runEnvelope = await readJson<Record<string, unknown>>(path.join(outDir, "run.json"));

  const output = (results.output ?? {}) as Record<string, unknown>;
  const matched = Number(output.matches ?? 0);
  const mismatches = Number(output.mismatches ?? 0);
  const reviewQueue = Number(output.reviewQueue ?? 0);
  const totalRecords = matched + mismatches + reviewQueue;
  const matchRate = totalRecords > 0 ? (matched / totalRecords) * 100 : 0;

  const alerts: DemoAlert[] = [];
  const simulatedMatchRate = Math.min(matchRate, 94.5);
  alerts.push({
    id: "match-rate-drop",
    severity: "warning",
    type: "match_rate_drop",
    message: `Synthetic anomaly: match rate dropped to ${simulatedMatchRate.toFixed(2)}%.`,
    triggeredAt: new Date().toISOString(),
  });

  alerts.push({
    id: "api-error-spike",
    severity: "critical",
    type: "api_error_spike",
    message: "Synthetic API error spike triggered for operator demo.",
    triggeredAt: new Date().toISOString(),
  });

  console.log("4) Show alert feed");
  for (const alert of alerts) {
    console.log(`   [${alert.severity.toUpperCase()}] ${alert.type} :: ${alert.message}`);
  }

  console.log("5) Inspect run");
  console.log(`   runId: ${String(runEnvelope.runId ?? "demo-run-1")}`);
  console.log(`   recordsProcessed: ${totalRecords}`);
  console.log(`   matchRate: ${matchRate.toFixed(2)}%`);

  console.log("6) Replay run");
  runCommand("pnpm", [
    "exec",
    "tsx",
    "scripts/settler-replay.ts",
    "examples/demo-output/evidence.json",
  ]);

  await fs.writeFile(
    demoArtifactsPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        steps: [
          "load dataset",
          "execute reconciliation",
          "trigger anomaly",
          "show alert",
          "inspect run",
          "replay run",
        ],
        run: {
          runId: String(runEnvelope.runId ?? "demo-run-1"),
          recordsProcessed: totalRecords,
          matchRate,
        },
        alerts,
      },
      null,
      2
    )
  );

  console.log(`\n✅ Demo artifacts saved: ${demoArtifactsPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
