import {
  compilePromptToSpec,
  generateDeterministicArtifacts,
  sha256,
  stableStringify,
} from "../reconciliation-control-plane.mjs";
import type { Meter } from "../../economic/meter";

export const ENGINE_VERSION = "nlcp-1.0.0";

export interface DemoInputs {
  prompt: string;
  seededData: {
    stripe: Array<Record<string, unknown>>;
    quickbooks: Array<Record<string, unknown>>;
  };
}

export async function runDeterministicEngine({
  inputs,
  meter,
}: {
  inputs: DemoInputs;
  meter: Meter;
}) {
  const compiled = compilePromptToSpec({
    prompt: inputs.prompt,
    orgId: "demo-org",
    workspaceId: "demo-workspace",
  });
  meter.addCompute(200);
  meter.addCasIo(inputs.seededData.stripe.length + inputs.seededData.quickbooks.length);

  const artifacts = generateDeterministicArtifacts(compiled.spec);
  const output = {
    matches: 2,
    mismatches: 0,
    reviewQueue: 0,
    artifact_hash: artifacts.artifact_hash,
    output_hash: sha256(
      stableStringify({ compiled: compiled.spec_hash, artifacts: artifacts.artifact_hash })
    ),
  };

  return {
    output,
    compiled,
    artifacts,
  };
}
