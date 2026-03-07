#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evaluateRlsEvidence } from "./rls-evidence-lib.mjs";

const repoRoot = process.cwd();
const runId = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(repoRoot, "artifacts", "security", "rls-evidence", runId);
mkdirSync(outputDir, { recursive: true });
mkdirSync(path.join(repoRoot, "security"), { recursive: true });

const mode = process.env.SECURITY_RLS_EVIDENCE_MODE || "static-only";

let verification = null;
try {
  verification = JSON.parse(
    readFileSync(
      path.join(repoRoot, "artifacts", "security", "rls-verification-latest.json"),
      "utf8"
    )
  );
} catch {
  verification = null;
}

const evaluation = evaluateRlsEvidence({ mode, verification });

const artifact = {
  reportVersion: "2026-03-09.1",
  generatedAt: new Date().toISOString(),
  runId,
  status: evaluation.status,
  reason: evaluation.reason,
  evidenceLevel: evaluation.evidenceLevel,
  environmentConstraints: evaluation.environmentConstraints,
  nextOperatorAction: evaluation.nextOperatorAction,
  runtimeExecuted: evaluation.runtimeExecuted,
  policy: {
    mode,
  },
  testedTables: evaluation.testedTables,
  fixtures: evaluation.fixtures,
  allowDenyMatrix: evaluation.allowDenyMatrix,
  policyPresence: evaluation.policyPresence,
};

const outJson = path.join(outputDir, "rls-evidence.json");
writeFileSync(outJson, JSON.stringify(artifact, null, 2));
writeFileSync(
  path.join(repoRoot, "security", "rls-evidence.json"),
  JSON.stringify(artifact, null, 2)
);
writeFileSync(
  path.join(repoRoot, "artifacts", "security", "rls-evidence-latest.json"),
  JSON.stringify(artifact, null, 2)
);

const md = [
  "# RLS Evidence",
  `- status: ${artifact.status}`,
  `- evidenceLevel: ${artifact.evidenceLevel}`,
  `- mode: ${mode}`,
  `- runtimeExecuted: ${artifact.runtimeExecuted}`,
  `- reason: ${artifact.reason}`,
  "",
  "## Environment constraints",
  ...(artifact.environmentConstraints.length
    ? artifact.environmentConstraints.map((item) => `- ${item}`)
    : ["- none"]),
  "",
  "## Next operator action",
  ...(artifact.nextOperatorAction.length
    ? artifact.nextOperatorAction.map((item) => `- ${item}`)
    : ["- none"]),
].join("\n");

writeFileSync(path.join(outputDir, "rls-evidence.md"), md);
writeFileSync(path.join(repoRoot, "security", "rls-evidence.md"), md);

console.log(`RLS evidence artifact: ${path.relative(repoRoot, outJson)}`);
console.log(`RLS evidence status: ${artifact.status}`);

if (mode === "runtime-rls-required" && artifact.status !== "PASS") {
  process.exit(1);
}
