import { createHash } from "node:crypto";

export type DivergenceSource = "connector_output" | "policy_change" | "artifact_mutation";

export interface ReplayStep {
  id: string;
  index: number;
  name: string;
  status: "ok" | "diverged";
  durationMs: number;
  originalResult: Record<string, unknown>;
  replayResult: Record<string, unknown>;
  originalStateSnapshot: Record<string, unknown>;
  replayStateSnapshot: Record<string, unknown>;
  artifactPointer: string;
  replayArtifactPointer: string;
  divergenceSources: DivergenceSource[];
}

export interface ReplayDiffEntry {
  path: string;
  original: unknown;
  replay: unknown;
  source: DivergenceSource;
}

export interface ReplayLabReport {
  executionId: string;
  replayRunId: string;
  deterministic: boolean;
  summary: {
    totalSteps: number;
    divergedSteps: number;
    divergenceSources: Record<DivergenceSource, number>;
  };
  timeline: ReplayStep[];
  diff: {
    originalFingerprint: string;
    replayFingerprint: string;
    entries: ReplayDiffEntry[];
  };
  controls: {
    currentStep: number;
    breakpoints: number[];
    inspectableStepIds: string[];
  };
}

const STEP_NAMES = ["ingest", "normalize", "policy-evaluate", "match", "settle", "publish"];

function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function seededInt(seed: string, min: number, max: number): number {
  const value = Number.parseInt(seed.slice(0, 8), 16);
  const span = max - min + 1;
  return min + (value % span);
}

function seedRecord(executionId: string, step: string, salt: string): Record<string, unknown> {
  const seed = hash(`${executionId}:${step}:${salt}`);
  return {
    checksum: seed.slice(0, 12),
    records: seededInt(seed.slice(4), 100, 200),
    amountCents: seededInt(seed.slice(8), 20_000, 80_000),
    currency: "USD",
  };
}

function seedState(
  executionId: string,
  step: string,
  phase: "original" | "replay"
): Record<string, unknown> {
  const seed = hash(`${executionId}:${step}:${phase}:state`);
  return {
    watermark: seed.slice(0, 10),
    queueDepth: seededInt(seed.slice(10), 0, 9),
    retries: seededInt(seed.slice(16), 0, 2),
  };
}

function applyDeterministicReplayMutation(step: ReplayStep, executionId: string): ReplayStep {
  const seed = hash(`${executionId}:${step.id}:divergence`);
  const mode = seededInt(seed, 0, 9);

  if (mode < 7) {
    return step;
  }

  const replayStep: ReplayStep = {
    ...step,
    status: "diverged",
    replayResult: { ...step.replayResult },
    replayStateSnapshot: { ...step.replayStateSnapshot },
    divergenceSources: [],
  };

  if (mode === 7) {
    replayStep.divergenceSources.push("connector_output");
    replayStep.replayResult.records = ((step.replayResult.records as number) ?? 0) + 3;
    replayStep.replayResult.checksum = `${step.replayResult.checksum}-drift`;
  } else if (mode === 8) {
    replayStep.divergenceSources.push("policy_change");
    replayStep.replayStateSnapshot.watermark = `${step.replayStateSnapshot.watermark}-policy-v2`;
    replayStep.replayResult.amountCents = ((step.replayResult.amountCents as number) ?? 0) + 125;
  } else {
    replayStep.divergenceSources.push("artifact_mutation");
    replayStep.replayArtifactPointer = `${step.replayArtifactPointer}?mutated=true`;
  }

  return replayStep;
}

function diffStep(step: ReplayStep): ReplayDiffEntry[] {
  if (step.status !== "diverged" || step.divergenceSources.length === 0) {
    return [];
  }

  const source: DivergenceSource = step.divergenceSources[0] ?? "connector_output";
  const entries: ReplayDiffEntry[] = [];

  const keys = new Set([
    ...Object.keys(step.originalResult),
    ...Object.keys(step.replayResult),
    ...Object.keys(step.originalStateSnapshot),
    ...Object.keys(step.replayStateSnapshot),
  ]);

  for (const key of keys) {
    const originalResult = step.originalResult[key];
    const replayResult = step.replayResult[key];

    if (typeof originalResult !== "undefined" || typeof replayResult !== "undefined") {
      if (JSON.stringify(originalResult) !== JSON.stringify(replayResult)) {
        entries.push({
          path: `${step.id}.result.${key}`,
          original: originalResult,
          replay: replayResult,
          source,
        });
      }
    }

    const originalState = step.originalStateSnapshot[key];
    const replayState = step.replayStateSnapshot[key];
    if (typeof originalState !== "undefined" || typeof replayState !== "undefined") {
      if (JSON.stringify(originalState) !== JSON.stringify(replayState)) {
        entries.push({
          path: `${step.id}.state.${key}`,
          original: originalState,
          replay: replayState,
          source,
        });
      }
    }
  }

  if (step.artifactPointer !== step.replayArtifactPointer) {
    entries.push({
      path: `${step.id}.artifactPointer`,
      original: step.artifactPointer,
      replay: step.replayArtifactPointer,
      source,
    });
  }

  return entries;
}

export function buildReplayLabReport(executionId: string): ReplayLabReport {
  const timeline = STEP_NAMES.map((name, index) => {
    const id = `step-${index + 1}-${name}`;
    const base: ReplayStep = {
      id,
      index,
      name,
      status: "ok",
      durationMs: seededInt(hash(`${executionId}:${name}:duration`), 60, 460),
      originalResult: seedRecord(executionId, name, "original"),
      replayResult: seedRecord(executionId, name, "original"),
      originalStateSnapshot: seedState(executionId, name, "original"),
      replayStateSnapshot: seedState(executionId, name, "original"),
      artifactPointer: `evidence://${executionId}/${name}/artifact.json`,
      replayArtifactPointer: `evidence://${executionId}-replay/${name}/artifact.json`,
      divergenceSources: [],
    };

    return applyDeterministicReplayMutation(base, executionId);
  });

  const diffEntries = timeline.flatMap(diffStep);
  const sourceCounters: Record<DivergenceSource, number> = {
    connector_output: 0,
    policy_change: 0,
    artifact_mutation: 0,
  };

  for (const step of timeline) {
    for (const source of step.divergenceSources) {
      sourceCounters[source] += 1;
    }
  }

  const originalFingerprint = hash(
    JSON.stringify(
      timeline.map((step) => [
        step.id,
        step.originalResult,
        step.originalStateSnapshot,
        step.artifactPointer,
      ])
    )
  );
  const replayFingerprint = hash(
    JSON.stringify(
      timeline.map((step) => [
        step.id,
        step.replayResult,
        step.replayStateSnapshot,
        step.replayArtifactPointer,
      ])
    )
  );

  const divergedStepIndexes = timeline
    .filter((step) => step.status === "diverged")
    .map((step) => step.index);

  return {
    executionId,
    replayRunId: `${executionId}-replay`,
    deterministic: diffEntries.length === 0,
    summary: {
      totalSteps: timeline.length,
      divergedSteps: divergedStepIndexes.length,
      divergenceSources: sourceCounters,
    },
    timeline,
    diff: {
      originalFingerprint,
      replayFingerprint,
      entries: diffEntries,
    },
    controls: {
      currentStep: 0,
      breakpoints: divergedStepIndexes,
      inspectableStepIds: timeline.map((step) => step.id),
    },
  };
}
