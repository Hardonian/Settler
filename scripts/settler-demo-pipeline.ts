#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";

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
const serviceLogPath = path.resolve("examples/demo-output/dev-stack.log");

function runCommand(command: string, args: string[], step: string) {
  console.log(`\n▶ ${step}`);
  const actualCommand = command === "pnpm" ? "npx" : command;
  const actualArgs = command === "pnpm" ? ["pnpm", ...args] : args;
  const result = spawnSync(actualCommand, actualArgs, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error(`Step failed (${step}): ${command} ${args.join(" ")}`);
  }
}

function runCommandAllowFailure(command: string, args: string[], step: string): boolean {
  console.log(`\n▶ ${step}`);
  const actualCommand = command === "pnpm" ? "npx" : command;
  const actualArgs = command === "pnpm" ? ["pnpm", ...args] : args;
  const result = spawnSync(actualCommand, actualArgs, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (result.status !== 0) {
    console.warn(`⚠️ ${step} failed; continuing with non-blocking demo path.`);
    return false;
  }
  return true;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(700);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

async function startServices(): Promise<{ started: boolean; note: string }> {
  const webOpen = await isPortOpen(3000);
  const apiOpen = await isPortOpen(4000);

  if (webOpen && apiOpen) {
    return { started: true, note: "Detected existing services on :3000 and :4000." };
  }

  const child = spawn("npx", ["pnpm", "run", "dev:stack"], {
    env: process.env,
    stdio: "ignore",
    detached: true,
    shell: true,
  });

  child.unref();
  await fs.mkdir(path.dirname(serviceLogPath), { recursive: true });
  await fs.writeFile(
    serviceLogPath,
    `Started detached dev stack PID=${child.pid ?? "unknown"} at ${new Date().toISOString()}\n`
  );

  return {
    started: true,
    note: `Started detached dev stack (PID ${child.pid ?? "unknown"}).`,
  };
}

async function main() {
  console.log("\n▶ Settler demo bootstrap pipeline\n");

  console.log("1) Verify environment");
  runCommand("pnpm", ["run", "doctor", "--", "--skip-pipeline", "--first-run"], "Doctor checks");

  console.log("2) Run migrations");
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL not set; migration step skipped.");
  } else {
    runCommandAllowFailure("pnpm", ["exec", "prisma", "migrate", "deploy"], "Prisma migrations");
  }

  console.log("3) Load demo dataset");
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

  console.log("4) Start services");
  const serviceState = await startServices();
  console.log(`   ${serviceState.note}`);

  console.log("5) Run reconciliation simulation");
  runCommand("pnpm", ["run", "demo"], "Deterministic reconciliation demo");

  console.log("6) Generate alert stream artifacts + replay");
  const results = await readJson<Record<string, unknown>>(path.join(outDir, "results.json"));
  const runEnvelope = await readJson<Record<string, unknown>>(path.join(outDir, "run.json"));

  const output = (results.output ?? {}) as Record<string, unknown>;
  const matched = Number(output.matches ?? 0);
  const mismatches = Number(output.mismatches ?? 0);
  const reviewQueue = Number(output.reviewQueue ?? 0);
  const totalRecords = matched + mismatches + reviewQueue;
  const matchRate = totalRecords > 0 ? (matched / totalRecords) * 100 : 0;

  const alerts: DemoAlert[] = [
    {
      id: "match-rate-drop",
      severity: "warning",
      type: "match_rate_drop",
      message: `Synthetic anomaly: match rate dropped to ${Math.min(matchRate, 94.5).toFixed(2)}%.`,
      triggeredAt: new Date().toISOString(),
    },
    {
      id: "api-error-spike",
      severity: "critical",
      type: "api_error_spike",
      message: "Synthetic API error spike triggered for operator demo.",
      triggeredAt: new Date().toISOString(),
    },
  ];

  runCommand(
    "pnpm",
    ["exec", "tsx", "scripts/settler-replay.ts", "examples/demo-output/evidence.json"],
    "Replay verification"
  );

  await fs.writeFile(
    demoArtifactsPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        steps: [
          "verify environment",
          "run migrations",
          "load dataset",
          "start services",
          "run reconciliation simulation",
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

  console.log("\n✅ Demo bootstrap complete.");
  console.log("\nNext steps:");
  console.log("- Run Explorer:      http://localhost:3000/app/runs");
  console.log("- Truth Explorer:    http://localhost:3000/app/proofs");
  console.log("- Alerts:            http://localhost:3000/app/alerts");
  console.log("- Replay Lab:        http://localhost:3000/app/replay");
  console.log("- Policy Lab check:  pnpm simulate:settler");
  console.log(`\nArtifacts: ${demoArtifactsPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
