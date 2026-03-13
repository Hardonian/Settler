"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeReplay = executeReplay;
exports.generateDiffReport = generateDiffReport;
exports.listReplays = listReplays;
const uuid_1 = require("uuid");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const node_crypto_1 = require("node:crypto");
const canonical_input_1 = require("./canonical-input");
const run_snapshot_1 = require("./run-snapshot");
const deterministic_matcher_1 = require("./deterministic-matcher");
const execution_orchestrator_1 = require("./execution-orchestrator");
/**
 * Execute replay
 */
async function executeReplay(request) {
    const replayRunId = (0, uuid_1.v4)();
    const startTime = Date.now();
    try {
        (0, logger_1.logInfo)('Starting replay', {
            originalRunId: request.original_run_id,
            replayRunId,
        });
        // Get original snapshot
        const snapshot = await (0, run_snapshot_1.getRunSnapshot)(request.original_run_id);
        if (!snapshot) {
            throw new Error(`Snapshot not found: ${request.original_run_id}`);
        }
        // Create replay snapshot (references original)
        const replaySnapshot = await createReplaySnapshot(snapshot, replayRunId);
        // Log start
        await (0, execution_orchestrator_1.logExecutionStep)(replaySnapshot.id, request.tenant_id, 0, 'REPLAY_START', `Starting replay of run ${request.original_run_id}`, { original_run_id: request.original_run_id, replay_run_id: replayRunId });
        // Load original data (in production, would fetch from source)
        const { sourceRecords, targetRecords } = await loadOriginalData(snapshot);
        // Load original rules
        const rules = await loadOriginalRules(snapshot);
        // Run matching with deterministic engine
        const engine = new deterministic_matcher_1.DeterministicMatchingEngine({
            snapshot: replaySnapshot,
            source_records: sourceRecords,
            target_records: targetRecords,
            rules,
            tenant_id: request.tenant_id,
        });
        const result = await engine.execute();
        // Compare with original
        const comparison = await compareResults(request.original_run_id, replayRunId, result.matches);
        const replayDuration = Date.now() - startTime;
        // Log completion
        await (0, execution_orchestrator_1.logExecutionStep)(replaySnapshot.id, request.tenant_id, 999, 'REPLAY_COMPLETE', `Replay complete: ${comparison.matches_identical ? 'IDENTICAL' : 'DIFFERENT'}`, {
            matches_identical: comparison.matches_identical,
            match_count_match: comparison.match_count_match,
            duration_ms: replayDuration,
        }, replayDuration);
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        (0, logger_1.logError)('Replay failed', error, { originalRunId: request.original_run_id, replayRunId });
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
async function createReplaySnapshot(originalSnapshot, replayRunId) {
    // In production, would create a new snapshot that references the original
    return {
        ...originalSnapshot,
        id: replayRunId,
        status: 'RUNNING',
        status_transitions: [
            ...originalSnapshot.status_transitions,
            {
                from: originalSnapshot.status,
                to: 'RUNNING',
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
async function loadOriginalData(snapshot) {
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
async function loadOriginalRules(snapshot) {
    // In production, would load from ruleset stored in snapshot
    return [];
}
/**
 * Compare results between original and replay
 */
async function compareResults(originalRunId, replayRunId, replayMatches) {
    // Get original match count
    const originalMatches = await (0, db_1.query)(`SELECT COUNT(*) as count FROM deterministic_match_results WHERE snapshot_id = $1`, [originalRunId]);
    const originalCount = originalMatches[0]?.count || 0;
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
    const mismatches = [];
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
async function computeMatchFingerprint(runId) {
    const matches = await (0, db_1.query)(`SELECT stable_match_id, left_record_id, right_record_id, confidence_score
     FROM deterministic_match_results
     WHERE snapshot_id = $1
     ORDER BY stable_match_id ASC`, [runId]);
    const fingerprintData = matches.map((m) => ({
        stable_match_id: m.stable_match_id,
        left_record_id: m.left_record_id,
        right_record_id: m.right_record_id,
        confidence_score: m.confidence_score,
    }));
    return (0, node_crypto_1.createHash)('sha256')
        .update((0, canonical_input_1.stableStringify)(fingerprintData))
        .digest('hex');
}
/**
 * Compute fingerprint from results
 */
function computeMatchFingerprintFromResults(matches) {
    const fingerprintData = matches
        .sort((a, b) => a.stable_match_id.localeCompare(b.stable_match_id))
        .map(m => ({
        stable_match_id: m.stable_match_id,
        left_record_id: m.left_record_id,
        right_record_id: m.right_record_id,
        confidence_score: m.confidence_score,
    }));
    return (0, node_crypto_1.createHash)('sha256')
        .update((0, canonical_input_1.stableStringify)(fingerprintData))
        .digest('hex');
}
/**
 * Get match ordering
 */
async function getMatchOrdering(runId) {
    const matches = await (0, db_1.query)(`SELECT stable_match_id FROM deterministic_match_results WHERE snapshot_id = $1`, [runId]);
    return matches.map(m => m.stable_match_id);
}
/**
 * Compare score breakdowns
 */
async function compareScoreBreakdowns(runId, replayMatches) {
    // This is a simplified check - in production would compare detailed breakdowns
    return true;
}
/**
 * Generate diff report
 */
async function generateDiffReport(originalRunId, replayRunId) {
    const replayResult = await executeReplay({
        original_run_id: originalRunId,
        tenant_id: '', // Would be extracted from context
    });
    const recommendations = [];
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
async function listReplays(originalRunId) {
    // Would query a replay history table
    return [];
}
//# sourceMappingURL=replay-service.js.map