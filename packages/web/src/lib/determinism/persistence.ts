import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { canonicalJson, stableSha256 } from '@/lib/determinism/core';
import type { RunRecord } from '@/lib/determinism/runs';

export interface ImmutableEvidenceManifest {
  runId: string;
  canonicalInputHash: string;
  canonicalInputPointer: string;
  summaryPointer: string;
  createdAt: string;
}

export interface DurableRunRecord extends RunRecord {
  immutableEvidenceManifest: ImmutableEvidenceManifest;
}

function writeImmutable(path: string, content: string): void {
  if (existsSync(path)) {
    throw new Error(`Refusing to overwrite immutable run artifact: ${path}`);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { encoding: 'utf-8', flag: 'wx' });
}

export function persistDeterministicRun(record: RunRecord, baseDir: string): DurableRunRecord {
  const runDir = resolve(baseDir, record.runId);
  const canonicalInputPath = resolve(runDir, 'canonical-input.json');
  const summaryPath = resolve(runDir, 'summary.json');
  const manifestPath = resolve(runDir, 'evidence-manifest.json');

  writeImmutable(canonicalInputPath, record.canonicalInput);

  const immutableEvidenceManifest: ImmutableEvidenceManifest = {
    runId: record.runId,
    canonicalInputHash: stableSha256(record.canonicalInput),
    canonicalInputPointer: canonicalInputPath,
    summaryPointer: summaryPath,
    createdAt: '1970-01-01T00:00:00.000Z',
  };

  writeImmutable(summaryPath, canonicalJson({ runId: record.runId, canonicalInputHash: immutableEvidenceManifest.canonicalInputHash }));
  writeImmutable(manifestPath, canonicalJson(immutableEvidenceManifest));

  return {
    ...record,
    immutableEvidenceManifest,
  };
}

export function replayDeterministicRun(runId: string, baseDir: string): DurableRunRecord {
  const runDir = resolve(baseDir, runId);
  const canonicalInputPath = resolve(runDir, 'canonical-input.json');
  const manifestPath = resolve(runDir, 'evidence-manifest.json');
  const summaryPath = resolve(runDir, 'summary.json');

  const canonicalInput = readFileSync(canonicalInputPath, 'utf-8');
  const immutableEvidenceManifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as ImmutableEvidenceManifest;

  if (stableSha256(canonicalInput) !== immutableEvidenceManifest.canonicalInputHash) {
    throw new Error(`Replay failed integrity check for ${runId}: canonical input hash mismatch.`);
  }

  return {
    runId,
    canonicalInput,
    evidenceManifest: {
      canonicalConfigPointer: `evidence://${runId}/canonical-config.json`,
      summaryPointer: `evidence://${runId}/summary.json`,
    },
    immutableEvidenceManifest: {
      ...immutableEvidenceManifest,
      canonicalInputPointer: canonicalInputPath,
      summaryPointer: summaryPath,
    },
  };
}
