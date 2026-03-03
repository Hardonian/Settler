#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { executeWithPolicy } from "../runner/executeWithPolicy";
import { ENGINE_VERSION, runDeterministicEngine } from "./moat/engine";
import { replayRun } from "./moat/replay";

const outDir = path.resolve("examples/demo-output");
const fixtureDir = path.resolve("examples/demo-output-fixtures/demo-run-1");
const dataDir = path.resolve("examples/demo-data");

const prompt = "Reconcile Stripe against QuickBooks daily with 1% tolerance.";
const seededData = {
  stripe: [
    { id: "st_1", invoice_number: "INV-100", amount: 101.0 },
    { id: "st_2", invoice_number: "INV-101", amount: 205.75 },
  ],
  quickbooks: [
    { id: "qb_1", invoice_number: "INV-100", amount: 101.01 },
    { id: "qb_2", invoice_number: "INV-101", amount: 205.7 },
  ],
};

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, "dataset.json"), JSON.stringify(seededData, null, 2));

  const run = await executeWithPolicy({
    tenantId: "demo-tenant",
    actor: { role: "operator", scopes: ["reconcile:run"] },
    policyId: "demo.strict",
    runId: "demo-run-1",
    outputDir: outDir,
    replayCalls: 0,
    inputs: { prompt, seededData },
    config: { mode: "demo", deterministic: true },
    engineVersion: ENGINE_VERSION,
    engineFn: async ({ inputs, meter }: { inputs: any; meter: any }) =>
      runDeterministicEngine({ inputs, meter }),
  });

  await fs.writeFile(
    path.join(outDir, "run.json"),
    JSON.stringify(
      {
        inputs: { prompt, seededData },
        config: { mode: "demo", deterministic: true },
        engine_version: ENGINE_VERSION,
      },
      null,
      2
    )
  );
  await fs.writeFile(path.join(outDir, "results.json"), JSON.stringify(run.result, null, 2));

  await fs.rm(fixtureDir, { recursive: true, force: true });
  await fs.mkdir(fixtureDir, { recursive: true });
  for (const file of ["run.json", "results.json", "evidence.json"]) {
    await fs.copyFile(path.join(outDir, file), path.join(fixtureDir, file));
  }

  const replay = await replayRun(path.join(outDir, "evidence.json"));

  console.log(`Run Fingerprint: ${run.evidence.run_fingerprint}`);
  if (!replay.matches) {
    console.error(`Replay mismatch: expected=${replay.expected} actual=${replay.actual}`);
    process.exit(1);
  }
  console.log("Replay Verified: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
