/** @jest-environment node */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { persistDeterministicRun, replayDeterministicRun } from "@/lib/determinism/persistence";
import { createDeterministicRun } from "@/lib/determinism/runs";

describe("deterministic run persistence contract", () => {
  it("persists immutable evidence manifests and replays with byte-equivalent canonical inputs", () => {
    const workspace = mkdtempSync(join(tmpdir(), "settler-run-contract-"));

    const input = {
      tenantId: "tenant_abc",
      pipeline: "nightly-recon",
      config: {
        sources: ["bank", "card"],
        toleranceCents: 1,
        asOf: "2026-02-25",
      },
    };

    const run = createDeterministicRun(input);
    const persisted = persistDeterministicRun(run, workspace);
    const replayed = replayDeterministicRun(run.runId, workspace);

    expect(replayed.runId).toBe(persisted.runId);
    expect(replayed.canonicalInput).toBe(persisted.canonicalInput);
    expect(replayed.immutableEvidenceManifest.canonicalInputHash).toBe(
      persisted.immutableEvidenceManifest.canonicalInputHash
    );

    rmSync(workspace, { recursive: true, force: true });
  });

  it("rejects attempts to overwrite immutable run artifacts", () => {
    const workspace = mkdtempSync(join(tmpdir(), "settler-run-contract-"));

    const run = createDeterministicRun({
      tenantId: "tenant_immutable",
      pipeline: "daily-recon",
      config: { sources: ["bank"] },
    });

    persistDeterministicRun(run, workspace);

    expect(() => persistDeterministicRun(run, workspace)).toThrow(
      "Refusing to overwrite immutable run artifact"
    );

    rmSync(workspace, { recursive: true, force: true });
  });
});
