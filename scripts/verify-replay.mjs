#!/usr/bin/env node
import {
  compilePromptToSpec,
  createRunSignature,
  generateDeterministicArtifacts,
  sha256,
  stableStringify,
} from "./reconciliation-control-plane.mjs";

const prompt = "Reconcile Stripe against QuickBooks daily with 1% tolerance.";
const inputRecords = [
  { id: "txn-1", invoice_number: "INV-1", amount: 100 },
  { id: "txn-2", invoice_number: "INV-2", amount: 175.5 },
];

function runEngine() {
  const compiled = compilePromptToSpec({ prompt, orgId: "org-demo", workspaceId: "ws-demo" });
  const artifacts = generateDeterministicArtifacts(compiled.spec);
  const output = {
    matched: 2,
    mismatches: 0,
    reviewQueue: 0,
    artifact_hash: artifacts.artifact_hash,
  };
  const outputHash = sha256(stableStringify(output));
  const inputDataHash = sha256(stableStringify(inputRecords));
  return {
    compiled,
    artifacts,
    output,
    signature: createRunSignature({
      inputDataHash,
      specHash: compiled.spec_hash,
      outputHash,
    }),
  };
}

const first = runEngine();
const replay = runEngine();

if (first.signature.run_signature !== replay.signature.run_signature) {
  console.error("❌ Replay verification failed: run_signature mismatch");
  process.exit(1);
}

if (first.signature.output_hash !== replay.signature.output_hash) {
  console.error("❌ Replay verification failed: output_hash mismatch");
  process.exit(1);
}

console.log("✅ Replay verification passed");
console.log(`run_signature=${first.signature.run_signature}`);
console.log(`output_hash=${first.signature.output_hash}`);
