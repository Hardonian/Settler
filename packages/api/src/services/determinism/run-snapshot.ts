/**
 * Run Snapshot Service
 * 
 * Creates immutable snapshots of run state before processing begins.
 * Enables replayability and determinism verification.
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db';
import { logError, logInfo } from '../../utils/logger';
import {
  computeInputFingerprint,
  computeRulesetHash,
  computeRunFingerprint,
  ConfigSnapshot,
  InputBatch,
  stableStringify,
} from './canonical-input';

/**
 * Run status transitions
 */
export type RunStatus = 
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Status transition with reason
 */
export interface StatusTransition {
  from: RunStatus | null;
  to: RunStatus;
  reason: string;
  timestamp: Date;
  actor: 'system' | 'human';
  actor_user_id?: string;
}

/**
 * Run snapshot record
 */
export interface RunSnapshot {
  id: string;
  tenant_id: string;
  recon_job_id: string;
  run_fingerprint: string;
  input_fingerprint: string;
  source_data_fingerprint: string;
  target_data_fingerprint: string;
  adapter_config_hashes: Record<string, string>;
  pipeline_id: string;
  pipeline_version: string;
  ruleset_id: string;
  ruleset_version: string;
  ruleset_hash: string;
  engine_version: string;
  input_record_count: number;
  status: RunStatus;
  status_transitions: StatusTransition[];
  started_at: Date;
  completed_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

/**
 * Create run snapshot request
 */
export interface CreateRunSnapshotRequest {
  tenant_id: string;
  recon_job_id: string;
  pipeline_id: string;
  pipeline_version: string;
  ruleset_id: string;
  ruleset_version: string;
  ruleset: unknown;
  input_batch: InputBatch;
  adapter_config_hashes?: Record<string, string>;
  engine_version?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get the current engine version (git commit hash or semver)
 */
export function getEngineVersion(): string {
  // In production, this would be set during build
  return process.env.ENGINE_VERSION || process.env.GIT_COMMIT_HASH || '1.0.0';
}

/**
 * Create a new run snapshot
 */
export async function createRunSnapshot(request: CreateRunSnapshotRequest): Promise<RunSnapshot> {
  const snapshotId = uuidv4();
  const engineVersion = request.engine_version || getEngineVersion();
  
  // Compute fingerprints
  const inputFingerprint = computeInputFingerprint(request.input_batch);
  const sourceDataFingerprint = computeInputFingerprint({
    source_records: request.input_batch.source_records,
    target_records: [],
  });
  const targetDataFingerprint = computeInputFingerprint({
    source_records: [],
    target_records: request.input_batch.target_records,
  });
  const rulesetHash = computeRulesetHash(request.ruleset);
  
  const configSnapshot: ConfigSnapshot = {
    pipeline_id: request.pipeline_id,
    pipeline_version: request.pipeline_version,
    ruleset_id: request.ruleset_id,
    ruleset_version: request.ruleset_version,
    ruleset_hash: rulesetHash,
    adapter_config_hashes: request.adapter_config_hashes || {},
  };
  
  const runFingerprint = computeRunFingerprint(inputFingerprint, configSnapshot, engineVersion);
  
  const now = new Date();
  const statusTransitions: StatusTransition[] = [
    {
      from: null,
      to: 'QUEUED',
      reason: 'Run created and queued for processing',
      timestamp: now,
      actor: 'system',
    },
  ];
  
  const snapshot: RunSnapshot = {
    id: snapshotId,
    tenant_id: request.tenant_id,
    recon_job_id: request.recon_job_id,
    run_fingerprint: runFingerprint,
    input_fingerprint: inputFingerprint,
    source_data_fingerprint: sourceDataFingerprint,
    target_data_fingerprint: targetDataFingerprint,
    adapter_config_hashes: request.adapter_config_hashes || {},
    pipeline_id: request.pipeline_id,
    pipeline_version: request.pipeline_version,
    ruleset_id: request.ruleset_id,
    ruleset_version: request.ruleset_version,
    ruleset_hash: rulesetHash,
    engine_version: engineVersion,
    input_record_count: request.input_batch.source_records.length + request.input_batch.target_records.length,
    status: 'QUEUED',
    status_transitions: statusTransitions,
    started_at: now,
    completed_at: null,
    metadata: request.metadata || {},
    created_at: now,
  };
  
  try {
    await query(
      `INSERT INTO run_snapshots (
        id, tenant_id, recon_job_id, run_fingerprint, input_fingerprint,
        source_data_fingerprint, target_data_fingerprint, adapter_config_hashes,
        pipeline_id, pipeline_version, ruleset_id, ruleset_version, ruleset_hash,
        engine_version, input_record_count, status, status_transitions,
        started_at, completed_at, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        snapshot.id,
        snapshot.tenant_id,
        snapshot.recon_job_id,
        snapshot.run_fingerprint,
        snapshot.input_fingerprint,
        snapshot.source_data_fingerprint,
        snapshot.target_data_fingerprint,
        stableStringify(snapshot.adapter_config_hashes),
        snapshot.pipeline_id,
        snapshot.pipeline_version,
        snapshot.ruleset_id,
        snapshot.ruleset_version,
        snapshot.ruleset_hash,
        snapshot.engine_version,
        snapshot.input_record_count,
        snapshot.status,
        stableStringify(snapshot.status_transitions),
        snapshot.started_at,
        snapshot.completed_at,
        stableStringify(snapshot.metadata),
        snapshot.created_at,
      ]
    );
    
    logInfo('Created run snapshot', {
      snapshotId: snapshot.id,
      runFingerprint: snapshot.run_fingerprint,
      inputRecordCount: snapshot.input_record_count,
    });
    
    return snapshot;
  } catch (error) {
    logError('Failed to create run snapshot', error, { request });
    throw error;
  }
}

/**
 * Get run snapshot by ID
 */
export async function getRunSnapshot(snapshotId: string): Promise<RunSnapshot | null> {
  try {
    const results = await query(
      `SELECT * FROM run_snapshots WHERE id = $1`,
      [snapshotId]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    return mapRowToSnapshot(results[0]);
  } catch (error) {
    logError('Failed to get run snapshot', error, { snapshotId });
    throw error;
  }
}

/**
 * Get run snapshot by fingerprint
 */
export async function getRunSnapshotByFingerprint(
  tenantId: string,
  runFingerprint: string
): Promise<RunSnapshot | null> {
  try {
    const results = await query(
      `SELECT * FROM run_snapshots 
       WHERE tenant_id = $1 AND run_fingerprint = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId, runFingerprint]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    return mapRowToSnapshot(results[0]);
  } catch (error) {
    logError('Failed to get run snapshot by fingerprint', error, { tenantId, runFingerprint });
    throw error;
  }
}

/**
 * Update run snapshot status
 */
export async function updateRunSnapshotStatus(
  snapshotId: string,
  newStatus: RunStatus,
  reason: string,
  actor: 'system' | 'human' = 'system',
  actorUserId?: string
): Promise<void> {
  try {
    // Get current snapshot
    const snapshot = await getRunSnapshot(snapshotId);
    if (!snapshot) {
      throw new Error(`Run snapshot not found: ${snapshotId}`);
    }
    
    // Validate status transition
    if (!isValidTransition(snapshot.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${snapshot.status} to ${newStatus}`
      );
    }
    
    // Add transition record
    const transition: StatusTransition = {
      from: snapshot.status,
      to: newStatus,
      reason,
      timestamp: new Date(),
      actor,
      actor_user_id: actorUserId,
    };
    
    const updatedTransitions = [...snapshot.status_transitions, transition];
    
    // Update database
    const completedAt = newStatus === 'SUCCEEDED' || newStatus === 'FAILED' || newStatus === 'CANCELLED'
      ? new Date()
      : null;
    
    await query(
      `UPDATE run_snapshots 
       SET status = $1, status_transitions = $2, completed_at = $3, updated_at = NOW()
       WHERE id = $4`,
      [newStatus, stableStringify(updatedTransitions), completedAt, snapshotId]
    );
    
    logInfo('Updated run snapshot status', {
      snapshotId,
      from: snapshot.status,
      to: newStatus,
      reason,
    });
  } catch (error) {
    logError('Failed to update run snapshot status', error, { snapshotId, newStatus });
    throw error;
  }
}

/**
 * List run snapshots for a job
 */
export async function listRunSnapshotsForJob(
  reconJobId: string,
  tenantId: string,
  limit: number = 50
): Promise<RunSnapshot[]> {
  try {
    const results = await query(
      `SELECT * FROM run_snapshots 
       WHERE recon_job_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [reconJobId, tenantId, limit]
    );
    
    return results.map(mapRowToSnapshot);
  } catch (error) {
    logError('Failed to list run snapshots for job', error, { reconJobId, tenantId });
    throw error;
  }
}

/**
 * Check if a run with the same fingerprint already exists
 */
export async function checkDuplicateRun(
  tenantId: string,
  runFingerprint: string
): Promise<{ exists: boolean; snapshotId?: string; status?: RunStatus }> {
  try {
    const existing = await getRunSnapshotByFingerprint(tenantId, runFingerprint);
    
    if (existing) {
      return {
        exists: true,
        snapshotId: existing.id,
        status: existing.status,
      };
    }
    
    return { exists: false };
  } catch (error) {
    logError('Failed to check duplicate run', error, { tenantId, runFingerprint });
    throw error;
  }
}

/**
 * Validate status transition
 */
function isValidTransition(from: RunStatus, to: RunStatus): boolean {
  const validTransitions: Record<RunStatus, RunStatus[]> = {
    'QUEUED': ['RUNNING', 'CANCELLED'],
    'RUNNING': ['SUCCEEDED', 'FAILED', 'CANCELLED'],
    'SUCCEEDED': [], // Terminal state
    'FAILED': ['QUEUED'], // Can retry
    'CANCELLED': ['QUEUED'], // Can restart
  };
  
  return validTransitions[from]?.includes(to) ?? false;
}

/**
 * Map database row to RunSnapshot
 */
function mapRowToSnapshot(row: Record<string, unknown>): RunSnapshot {
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    recon_job_id: row.recon_job_id as string,
    run_fingerprint: row.run_fingerprint as string,
    input_fingerprint: row.input_fingerprint as string,
    source_data_fingerprint: row.source_data_fingerprint as string,
    target_data_fingerprint: row.target_data_fingerprint as string,
    adapter_config_hashes: parseJsonField(row.adapter_config_hashes, {}),
    pipeline_id: row.pipeline_id as string,
    pipeline_version: row.pipeline_version as string,
    ruleset_id: row.ruleset_id as string,
    ruleset_version: row.ruleset_version as string,
    ruleset_hash: row.ruleset_hash as string,
    engine_version: row.engine_version as string,
    input_record_count: row.input_record_count as number,
    status: row.status as RunStatus,
    status_transitions: parseJsonField(row.status_transitions, []),
    started_at: row.started_at as Date,
    completed_at: row.completed_at as Date | null,
    metadata: parseJsonField(row.metadata, {}),
    created_at: row.created_at as Date,
  };
}

/**
 * Parse JSON field safely
 */
function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (!value) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value as T;
}
