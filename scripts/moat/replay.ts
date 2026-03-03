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

  const runRaw = await fs.readFile(evidence.artifacts.run, "utf8");
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
