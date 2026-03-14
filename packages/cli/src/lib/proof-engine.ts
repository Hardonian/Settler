import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { canonicalHash } from "../../../../packages/hash/canonical_hash";

export interface RecordedStep {
  stepId: string;
  transition: string;
  toolOutput: unknown;
  stateHash: string;
}

export interface Proofpack {
  schemaVersion: "2026-03-13";
  execution_id: string;
  input_hash: string;
  policy_hash: string;
  workflow_hash: string;
  tool_call_hashes: string[];
  state_hash: string;
  CAS_references: string[];
  timestamp: string;
  signature: string;
  deterministic_score: number;
  replay_equivalence: boolean;
  trace: RecordedStep[];
}

export function signProofpack(pack: Omit<Proofpack, "signature">): string {
  const key = process.env.REQUIEM_PROOF_KEY ?? "requiem-dev-key";
  return createHash("blake2s256")
    .update(`${canonicalHash(pack)}:${key}`)
    .digest("hex");
}

export function verifyProofpack(pack: Proofpack): { valid: boolean; reason?: string } {
  const { signature, ...unsigned } = pack;
  const expected = signProofpack(unsigned);
  if (expected !== signature) return { valid: false, reason: "signature_mismatch" };
  const replayStateHash = canonicalHash(pack.trace.map((s) => s.stateHash));
  if (replayStateHash !== pack.workflow_hash)
    return { valid: false, reason: "workflow_hash_mismatch" };
  return { valid: true };
}

export async function loadProofpackByExecutionId(executionId: string): Promise<Proofpack> {
  const file = path.join(process.cwd(), "proofpacks", executionId, "proofpack.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as Proofpack;
}

export async function writeProofpack(pack: Proofpack): Promise<string> {
  const dir = path.join(process.cwd(), "proofpacks", pack.execution_id);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "proofpack.json");
  await fs.writeFile(file, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  await fs.mkdir(path.join(process.cwd(), "proofpacks", "latest"), { recursive: true });
  await fs.writeFile(
    path.join(process.cwd(), "proofpacks", "latest", "proofpack.json"),
    `${JSON.stringify(pack, null, 2)}\n`,
    "utf8"
  );
  return file;
}

export function runDeterministicExecution(seed: string): {
  input: unknown;
  policy: unknown;
  trace: RecordedStep[];
  cas: string[];
} {
  const input = { seed, records: [1, 2, 3], tenant: "tenant-redacted" };
  const policy = { name: "default-allow", version: 1, rules: ["allow:read", "allow:replay"] };
  const trace: RecordedStep[] = [];
  let state: unknown = { ...input, status: "start" };
  const transitions = ["ingest", "policy_eval", "tool_exec", "settle", "finalize"];
  for (const transition of transitions) {
    state = { state, transition, ok: true };
    trace.push({
      stepId: `${seed}-${transition}`,
      transition,
      toolOutput: { transition, echoedSeed: seed },
      stateHash: canonicalHash(state),
    });
  }
  const cas = trace.map((s) => `cas://${s.stateHash}`);
  return { input, policy, trace, cas };
}

export function buildProofpack(executionId: string): Proofpack {
  const runA = runDeterministicExecution(executionId);
  const runB = runDeterministicExecution(executionId);
  const replayEquivalence = canonicalHash(runA.trace) === canonicalHash(runB.trace);
  const deterministic_score = replayEquivalence ? 1 : 0;
  const unsigned: Omit<Proofpack, "signature"> = {
    schemaVersion: "2026-03-13",
    execution_id: executionId,
    input_hash: canonicalHash(runA.input),
    policy_hash: canonicalHash(runA.policy),
    workflow_hash: canonicalHash(runA.trace.map((s) => s.stateHash)),
    tool_call_hashes: runA.trace.map((s) => canonicalHash(s.toolOutput)),
    state_hash: runA.trace.at(-1)?.stateHash ?? canonicalHash(null),
    CAS_references: runA.cas,
    timestamp: new Date().toISOString(),
    deterministic_score,
    replay_equivalence: replayEquivalence,
    trace: runA.trace,
  };
  return { ...unsigned, signature: signProofpack(unsigned) };
}

export default {
  buildProofpack,
  verifyProofpack,
  writeProofpack,
  loadProofpackByExecutionId,
  runDeterministicExecution,
  signProofpack,
};
