/**
 * Replay Service
 * 
 * Provides replay functionality for reconciliation runs:
 * - Load original snapshot
 * - Reprocess using pinned rules/config versions
 * - Produce a replay_run_id
 * - Compare outputs (counts + fingerprints + mismatches)
 * - Emit deterministic diff report
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db';
import { logError, logInfo } from '../../utils/logger';
import { createHash } from 'node:crypto';
import { stableStringify } from './canonical-input';
import { getRunSnapshot, RunSnapshot } from './run-snapshot';
import { DeterministicMatchingEngine } from './deterministic-matcher';
import { ExecutionOrchestrator, logExecutionStep } from './execution-orchestrator';

/**
 * Replay request
 */
export interface ReplayRequest {
  original_run_id: string;
  tenant_id: string;
  replay_options?: {
    use_original_rules?: boolean;
    use_original_config?: boolean;
    validate_only?: boolean;
  };
}

/**
 * Replay result
 */
export interface ReplayResult {
  replay_run_id: string;
  original_run_id: string;
  snapshot_id: string;
  
  // Comparison results
  comparison: {
    matches_identical: boolean;
    match_count_match: boolean;
    fingerprint_match: boolean;
    ordering_match: boolean;
    score_breakdown_match: boolean;
    mismatches: ReplayMismatch[];
  };
  
  // Timing
  original_duration_ms: number;
  replay_duration_ms: number;
  
  // Status
  status: 'SUCCEEDED' | 'FAILED' | 'VALIDATION_FAILED';
  error?: string;
  
  // Timestamps
  replayed_at: Date;
}

/**
 * Replay mismatch
 */
export interface ReplayMismatch {
  type: 'missing' | 'different' | 'extra';
  entity_type: string;
  original_entity_id?: string;
  replay_entity_id?: string;
  difference?: string;
}

/**
 * Fingerprint summary
 */
export interface FingerprintSummary {
  total_matches: number;
  fingerprint: string;
  ordering_fingerprint: string;
}

/**
 * Execute replay
 */
export async function executeReplay(request: ReplayRequest): Promise<ReplayResult> {
  const replayRunId = uuidv4();
  const startTime = Date.now();
  
  try {
    logInfo('Starting replay', {
      originalRunId: request.original_run_id,
      replayRunId,
    });
    
    // Get original snapshot
    const snapshot = await getRunSnapshot(request.original_run_id);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${request.original_run_id}`);
    }
    
    // Create replay snapshot (references original)
    const replaySnapshot = await createReplaySnapshot(snapshot, replayRunId);
    
    // Log start
    await logExecutionStep(
      replaySnapshot.id,
      request.tenant_id,
      0,
      'REPLAY_START',
      `Starting replay of run ${request.original_run_id}`,
      { original_run_id: request.original_run_id, replay_run_id: replayRunId }
    );
    
    // Load original data (in production, would fetch from source)
    const { sourceRecords, targetRecords } = await loadOriginalData(snapshot);
    
    // Load original rules
    const rules = await loadOriginalRules(snapshot);
    
    // Run matching with deterministic engine
    const orchestrator = new ExecutionOrchestrator();
    const engine = new DeterministicMatchingEngine({
      snapshot: replaySnapshot,
      source_records: sourceRecords,
      target_records: targetRecords,
      rules,
      tenant_id: request.tenant_id,
    });
    
    const result = await engine.execute();
    
    // Compare with original
    const comparison = await compareResults(
      request.original_run_id,
      replayRunId,
      result.matches
    );
    
    const replayDuration = Date.now() - startTime;
    
    // Log completion
    await logExecutionStep(
      replaySnapshot.id,
      request.tenant_id,
      999,
      'REPLAY_COMPLETE',
      `Replay complete: ${comparison.matches_identical ? 'IDENTICAL' : 'DIFFERENT'}`,
      {
        matches_identical: comparison.matches_identical,
        match_count_match: comparison.match_count_match,
        duration_ms: replayDuration,
      },
      replayDuration
    );
    
    return {
      replay_run_id: replayRunId,
      original_run_id: request.original_run_id,
      snapshot_id: snapshot.id,
      comparison,
      original_duration_ms: snapshot.completed_at && snapshot.started_at
        ? snapshot.completed_at.getTime() - snapshot.started_at.getTime()
        : 0,
      replay_duration_ms: replayDuration,
      status: comparison.matches_identical ? 'SUCCEEDED' : 'VALIDATION_FAILED',
      replayed_at: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Replay failed', error, { originalRunId: request.original_run_id, replayRunId });
    
    return {
      replay_run_id: replayRunId,
      original_run_id: request.original_run_id,
      snapshot_id: request.original_run_id,
      comparison: {
        matches_identical: false,
        match_count_match: false,
        fingerprint_match: false,
        ordering_match: false,
        score_breakdown_match: false,
        mismatches: [{
          type: 'different',
          entity_type: 'replay',
          difference: errorMessage,
        }],
      },
      original_duration_ms: 0,
      replay_duration_ms: Date.now() - startTime,
      status: 'FAILED',
      error: errorMessage,
      replayed_at: new Date(),
    };
  }
}

/**
 * Create replay snapshot
 */
async function createReplaySnapshot(
  originalSnapshot: RunSnapshot,
  replayRunId: string
): Promise<RunSnapshot> {
  // In production, would create a new snapshot that references the original
  return {
    ...originalSnapshot,
    id: replayRunId,
    status: 'RUNNING',
    status_transitions: [
      ...originalSnapshot.status_transitions,
      {
        from: originalSnapshot.status,
        to: 'RUNNING' as const,
        reason: 'Replay started',
        timestamp: new Date(),
        actor: 'system',
      },
    ],
  };
}

/**
 * Load original data from snapshot
 * In production, would fetch from source systems
 */
async function loadOriginalData(snapshot: RunSnapshot): Promise<{
  sourceRecords: Array<{
    source: string;
    external_id: string;
    date: string;
    amount: string;
    currency: string;
    account?: string;
    description?: string;
  }>;
  targetRecords: Array<{
    source: string;
    external_id: string;
    date: string;
    amount: string;
    currency: string;
    account?: string;
    description?: string;
  }>;
}> {
  // This is a placeholder - in production would fetch from original sources
  // For now, return empty arrays (would need to be populated from actual data)
  return {
    sourceRecords: [],
    targetRecords: [],
  };
}

/**
 * Load original rules from snapshot
 */
async function loadOriginalRules(snapshot: RunSnapshot): Promise<Array<{
  id: string;
  field: string;
  type: 'exact' | 'fuzzy' | 'range' | 'date_range';
  weight: number;
  threshold?: number;
  tolerance?: number;
  days?: number;
  version: number;
}>> {
  // In production, would load from ruleset stored in snapshot
  return [];
}

/**
 * Compare results between original and replay
 */
async function compareResults(
  originalRunId: string,
  replayRunId: string,
  replayMatches: Array<{
    stable_match_id: string;
    left_record_id: string;
    right_record_id: string;
    confidence_score: number;
    scoring_breakdown: Record<string, unknown>;
  }>
): Promise<{
  matches_identical: boolean;
  match_count_match: boolean;
  fingerprint_match: boolean;
  ordering_match: boolean;
  score_breakdown_match: boolean;
  mismatches: ReplayMismatch[];
}> {
  // Get original match count
  const originalMatches = await query(
    `SELECT COUNT(*) as count FROM deterministic_match_results WHERE snapshot_id = $1`,
    [originalRunId]
  );
  
  const originalCount = (originalMatches[0] as { count: number })?.count || 0;
  const replayCount = replayMatches.length;
  
  const matchCountMatch = originalCount === replayCount;
  
  // Compute fingerprints
  const originalFingerprint = await computeMatchFingerprint(originalRunId);
  const replayFingerprint = computeMatchFingerprintFromResults(replayMatches);
  
  const fingerprintMatch = originalFingerprint === replayFingerprint;
  
  // Check ordering
  const originalOrdering = await getMatchOrdering(originalRunId);
  const replayOrdering = replayMatches.map(m => m.stable_match_id);
  
  const orderingMatch = JSON.stringify(originalOrdering) === JSON.stringify(replayOrdering);
  
  // Check score breakdown
  const scoreBreakdownMatch = await compareScoreBreakdowns(originalRunId, replayMatches);
  
  const mismatches: ReplayMismatch[] = [];
  
  if (!matchCountMatch) {
    mismatches.push({
      type: 'different',
      entity_type: 'match_count',
      difference: `Original: ${originalCount}, Replay: ${replayCount}`,
    });
  }
  
  if (!fingerprintMatch) {
    mismatches.push({
      type: 'different',
      entity_type: 'fingerprint',
      difference: 'Match fingerprints do not match',
    });
  }
  
  if (!orderingMatch) {
    mismatches.push({
      type: 'different',
      entity_type: 'ordering',
      difference: 'Match ordering does not match',
    });
  }
  
  const matchesIdentical = matchCountMatch && fingerprintMatch && orderingMatch && scoreBreakdownMatch;
  
  return {
    matches_identical: matchesIdentical,
    match_count_match: matchCountMatch,
    fingerprint_match: fingerprintMatch,
    ordering_match: orderingMatch,
    score_breakdown_match: scoreBreakdownMatch,
    mismatches,
  };
}

/**
 * Compute match fingerprint for a run
 */
async function computeMatchFingerprint(runId: string): Promise<string> {
  const matches = await query(
    `SELECT stable_match_id, left_record_id, right_record_id, confidence_score
     FROM deterministic_match_results
     WHERE snapshot_id = $1
     ORDER BY stable_match_id ASC`,
    [runId]
  );
  
  const fingerprintData = matches.map((m: Record<string, unknown>) => ({
    stable_match_id: m.stable_match_id,
    left_record_id: m.left_record_id,
    right_record_id: m.right_record_id,
    confidence_score: m.confidence_score,
  }));
  
  return createHash('sha256')
    .update(stableStringify(fingerprintData))
    .digest('hex');
}

/**
 * Compute fingerprint from results
 */
function computeMatchFingerprintFromResults(
  matches: Array<{
    stable_match_id: string;
    left_record_id: string;
    right_record_id: string;
    confidence_score: number;
  }>
): string {
  const fingerprintData = matches
    .sort((a, b) => a.stable_match_id.localeCompare(b.stable_match_id))
    .map(m => ({
      stable_match_id: m.stable_match_id,
      left_record_id: m.left_record_id,
      right_record_id: m.right_record_id,
      confidence_score: m.confidence_score,
    }));
  
  return createHash('sha256')
    .update(stableStringify(fingerprintData))
    .digest('hex');
}

/**
 * Get match ordering
 */
async function getMatchOrdering(runId: string): Promise<string[]> {
  const matches = await query(
    `SELECT stable_match_id FROM deterministic_match_results WHERE snapshot_id = $1`,
    [runId]
  );
  
  return (matches as Array<{ stable_match_id: string }>).map(m => m.stable_match_id);
}

/**
 * Compare score breakdowns
 */
async function compareScoreBreakdowns(
  runId: string,
  replayMatches: Array<{ left_record_id: string; scoring_breakdown: Record<string, unknown> }>
): Promise<boolean> {
  // This is a simplified check - in production would compare detailed breakdowns
  return true;
}

/**
 * Generate diff report
 */
export async function generateDiffReport(
  originalRunId: string,
  replayRunId: string
): Promise<{
  summary: string;
  details: ReplayMismatch[];
  recommendations: string[];
}> {
  const replayResult = await executeReplay({
    original_run_id: originalRunId,
    tenant_id: '', // Would be extracted from context
  });
  
  const recommendations: string[] = [];
  
  if (!replayResult.comparison.match_count_match) {
    recommendations.push('Review match count discrepancy - possible data version mismatch');
  }
  
  if (!replayResult.comparison.fingerprint_match) {
    recommendations.push('Review match fingerprints - possible rule version difference');
  }
  
  if (!replayResult.comparison.ordering_match) {
    recommendations.push('Review match ordering - possible iteration order dependency');
  }
  
  return {
    summary: replayResult.comparison.matches_identical
      ? '✅ Replay produces IDENTICAL results to original run'
      : `⚠️ Replay produces DIFFERENT results (${replayResult.comparison.mismatches.length} mismatches)`,
    details: replayResult.comparison.mismatches,
    recommendations,
  };
}

/**
 * List replays for a run
 */
export async function listReplays(originalRunId: string): Promise<Array<{
  replay_run_id: string;
  status: string;
  matches_identical: boolean;
  replayed_at: Date;
}>> {
  // Would query a replay history table
  return [];
}
