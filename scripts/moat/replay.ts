import fs from "node:fs/promises";
import path from "node:path";
import { executeWithPolicy } from "../../runner/executeWithPolicy";
import { ENGINE_VERSION, runDeterministicEngine } from "./engine";

export async function replayRun(
  evidencePath: string
): Promise<{ matches: boolean; expected: string; actual: string }> {
  const evidenceRaw = await fs.readFile(evidencePath, "utf8");
  const evidence = JSON.parse(evidenceRaw) as {
    run_id: string;
    tenant_id: string;
    policy_id: string;
    run_fingerprint: string;
    artifacts: { run: string };
  };

  // Artifact paths in evidence files are RECORDINGS from whatever machine ran
  // the demo (fixtures contain e.g. C:\Users\...\run.json). Resolution must be
  // relocatable: take the recorded basename and resolve it next to the evidence
  // file, instead of trusting machine-specific absolute paths (POSIX
  // path.isAbsolute does not recognize Windows drive paths, which previously
  // produced ENOENT joins like fixtures/demo-run-1/C:\Users\...\run.json).
  const runPath = path.resolve(
    path.dirname(evidencePath),
    path.basename(evidence.artifacts.run.replace(/\\/g, "/"))
  );
  const runRaw = await fs.readFile(runPath, "utf8");
  const run = JSON.parse(runRaw) as {
    inputs: unknown;
    config: unknown;
  };

  const replayDir = path.join(path.dirname(evidencePath), "replay");
  const rerun = await executeWithPolicy({
    tenantId: evidence.tenant_id,
    actor: { role: "operator", scopes: ["reconcile:run"] },
    policyId: evidence.policy_id,
    runId: `${evidence.run_id}-replay`,
    outputDir: replayDir,
    replayCalls: 1,
    inputs: run.inputs,
    config: run.config,
    engineVersion: ENGINE_VERSION,
    engineFn: async ({ inputs, meter }: { inputs: any; meter: any }) =>
      runDeterministicEngine({ inputs, meter }),
  });

  return {
    matches: rerun.evidence.run_fingerprint === evidence.run_fingerprint,
    expected: evidence.run_fingerprint,
    actual: rerun.evidence.run_fingerprint,
  };
}
