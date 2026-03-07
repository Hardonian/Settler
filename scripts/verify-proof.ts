#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { buildHashChain, computeRunFingerprint, sha256, stableStringify } from "../evidence/hash";
import type { EvidenceBundle } from "../evidence/types";
import { replayRun } from "./moat/replay";

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function fail(message: string): never {
  throw new Error(`proof verification failed: ${message}`);
}

async function main() {
  const evidenceArg = process.argv[2] ?? "examples/demo-output/evidence.json";
  const evidencePath = path.resolve(evidenceArg);

  const evidence = await readJsonFile<EvidenceBundle>(evidencePath);

  const requiredArtifacts = ["run", "results", "evidence", "report"] as const;
  for (const artifactKey of requiredArtifacts) {
    const artifactPath = evidence.artifacts[artifactKey];
    if (!artifactPath) {
      fail(`missing artifacts.${artifactKey}`);
    }
    await fs.access(artifactPath);
  }

  const run = await readJsonFile<{ inputs: unknown; config: unknown }>(evidence.artifacts.run);
  const results = await readJsonFile<unknown>(evidence.artifacts.results);

  const inputHash = sha256(stableStringify(run.inputs));
  if (inputHash !== evidence.input_hash) {
    fail(`input_hash mismatch expected=${evidence.input_hash} actual=${inputHash}`);
  }

  const configHash = sha256(stableStringify(run.config));
  if (configHash !== evidence.config_hash) {
    fail(`config_hash mismatch expected=${evidence.config_hash} actual=${configHash}`);
  }

  const outputHash = sha256(stableStringify(results));
  if (outputHash !== evidence.output_hash) {
    fail(`output_hash mismatch expected=${evidence.output_hash} actual=${outputHash}`);
  }

  const expectedFingerprint = computeRunFingerprint(inputHash, configHash, outputHash);
  if (expectedFingerprint !== evidence.run_fingerprint) {
    fail(
      `run_fingerprint mismatch expected=${evidence.run_fingerprint} actual=${expectedFingerprint}`
    );
  }

  const expectedChain = buildHashChain([inputHash, configHash, outputHash, expectedFingerprint]);
  if (stableStringify(expectedChain) !== stableStringify(evidence.provenance.hash_chain)) {
    fail("provenance.hash_chain mismatch");
  }

  const replay = await replayRun(evidencePath);
  if (!replay.matches) {
    fail(`replay mismatch expected=${replay.expected} actual=${replay.actual}`);
  }

  console.log("✅ proof verification passed");
  console.log(`   evidence: ${evidencePath}`);
  console.log(`   run_fingerprint: ${evidence.run_fingerprint}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
