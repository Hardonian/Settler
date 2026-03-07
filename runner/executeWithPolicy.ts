import path from "node:path";
import { z } from "zod";
import { Meter } from "../economic/meter";
import { emitEvidenceBundle } from "../evidence/emit";
import { buildHashChain, computeRunFingerprint, sha256, stableStringify } from "../evidence/hash";
import type { EvidenceBundle } from "../evidence/types";
import { compilePolicy } from "../policies/compile";
import { getPolicy } from "../policies";
import type { ExecutionPlan } from "./plan";
import { FileEventBackbone } from "./eventBackbone";

const requestSchema = z.object({
  tenantId: z.string().min(1),
  actor: z.object({
    role: z.string().optional(),
    scopes: z.array(z.string()).default([]),
  }),
  policyId: z.string().min(1),
  runId: z.string().min(1),
  outputDir: z.string().min(1),
  replayCalls: z.number().int().nonnegative().default(0),
  inputs: z.unknown(),
  config: z.unknown(),
  engineVersion: z.string().min(1),
  engineFn: z.function().args(z.any()).returns(z.promise(z.any())),
});

export async function executeWithPolicy(input: z.input<typeof requestSchema>): Promise<{
  result: unknown;
  evidence: EvidenceBundle;
  plan: ExecutionPlan;
}> {
  const req = requestSchema.parse(input);
  const backbone = new FileEventBackbone();
  await backbone.append({
    tenantId: req.tenantId,
    runId: req.runId,
    type: "workflow.triggered",
    payload: { policy_id: req.policyId },
  });
  const policy = getPolicy(req.policyId);
  const enforcement = compilePolicy(policy, {
    tenantId: req.tenantId,
    actorRole: req.actor.role,
    actorScopes: req.actor.scopes,
    replayCalls: req.replayCalls,
  });

  const plan: ExecutionPlan = {
    enforcement,
    runId: req.runId,
    outputDir: req.outputDir,
  };

  const meter = new Meter(enforcement.budgets);
  meter.addCompute(10);
  meter.declareMemory(256);
  meter.addCasIo(2);
  if (req.replayCalls > 0) meter.addReplayCall();

  const inputHash = sha256(stableStringify(req.inputs));
  const configHash = sha256(stableStringify(req.config));
  await backbone.append({
    tenantId: req.tenantId,
    runId: req.runId,
    type: "worker.lease.acquired",
    payload: { actor_role: req.actor.role ?? "unknown" },
  });

  await backbone.append({
    tenantId: req.tenantId,
    runId: req.runId,
    type: "execution.started",
    payload: { input_hash: inputHash, config_hash: configHash },
  });

  try {
    const result = await req.engineFn({ inputs: req.inputs, config: req.config, meter });
    const outputHash = sha256(stableStringify(result));
    const runFingerprint = computeRunFingerprint(inputHash, configHash, outputHash);
    const createdAt = new Date().toISOString();

    const artifacts = {
      run: path.join(req.outputDir, "run.json"),
      results: path.join(req.outputDir, "results.json"),
      evidence: path.join(req.outputDir, "evidence.json"),
      report: path.join(req.outputDir, "report.html"),
    };

    await backbone.append({
      tenantId: req.tenantId,
      runId: req.runId,
      type: "state.persisted",
      payload: { output_hash: outputHash },
    });

    const evidence: EvidenceBundle = {
      run_id: req.runId,
      created_at: createdAt,
      tenant_id: req.tenantId,
      policy_id: enforcement.policyId,
      policy_hash: enforcement.policyHash,
      policy_version: enforcement.policyVersion,
      engine_version: req.engineVersion,
      input_hash: inputHash,
      config_hash: configHash,
      output_hash: outputHash,
      run_fingerprint: runFingerprint,
      metrics: meter.snapshot(),
      provenance: {
        hash_chain: buildHashChain([inputHash, configHash, outputHash, runFingerprint]),
        summary: "input->config->output->fingerprint",
      },
      artifacts,
      metadata: {
        retention_days: enforcement.metadata.retentionDays,
        replay_required: enforcement.replayRequired,
        evidence_level: enforcement.evidenceLevel,
      },
    };

    await emitEvidenceBundle(req.outputDir, evidence);

    await backbone.append({
      tenantId: req.tenantId,
      runId: req.runId,
      type: "proof.artifact.generated",
      payload: { evidence_path: artifacts.evidence, report_path: artifacts.report },
    });

    await backbone.append({
      tenantId: req.tenantId,
      runId: req.runId,
      type: "execution.completed",
      payload: { run_fingerprint: runFingerprint },
    });

    return { result, evidence, plan };
  } catch (error) {
    await backbone.append({
      tenantId: req.tenantId,
      runId: req.runId,
      type: "execution.failed",
      payload: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
