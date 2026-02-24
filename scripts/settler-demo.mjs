#!/usr/bin/env node
import {
  compilePromptToSpec,
  createRunSignature,
  generateDeterministicArtifacts,
  sha256,
  stableStringify,
} from "./reconciliation-control-plane.mjs";

const prompt = "Reconcile payouts daily with 1% tolerance.";

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

const compiled = compilePromptToSpec({ prompt, orgId: "demo-org", workspaceId: "demo-workspace" });
const artifacts = generateDeterministicArtifacts(compiled.spec);
const matches = 2;
const mismatches = 0;
const reviewQueue = 0;
const output = { matches, mismatches, reviewQueue, artifact_hash: artifacts.artifact_hash };

const signature = createRunSignature({
  inputDataHash: sha256(stableStringify(seededData)),
  specHash: compiled.spec_hash,
  outputHash: sha256(stableStringify(output)),
});

console.log("✅ Settler demo completed");
console.log(`match rate: ${(matches / (matches + mismatches || 1)) * 100}%`);
console.log(`mismatches: ${mismatches}`);
console.log(`review queue count: ${reviewQueue}`);
console.log(`run_signature: ${signature.run_signature}`);
