#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import {
  verifyDemoProofpack,
  type DemoProofpack,
} from "../packages/reconciliation-core/src/settlement-reconciliation.js";

async function main(): Promise<void> {
  const artifactPath = path.resolve(process.argv[2] ?? "docs/demo-output/proofpack.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Unable to read proofpack: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  const result = verifyDemoProofpack(parsed as DemoProofpack);
  if (!result.valid || !result.replayed) {
    console.error(`INVALID: ${result.errors.join("; ") || "replay did not complete"}`);
    process.exitCode = 1;
    return;
  }
  console.log(`VALID: ${artifactPath}`);
  console.log("Integrity commitment and semantic replay both verified without network access.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
