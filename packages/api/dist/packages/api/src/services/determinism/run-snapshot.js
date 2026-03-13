"use strict";
/**
 * Run Snapshot Service
 *
 * Creates immutable snapshots of run state before processing begins.
 * Enables replayability and determinism verification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEngineVersion = getEngineVersion;
exports.createRunSnapshot = createRunSnapshot;
exports.getRunSnapshot = getRunSnapshot;
exports.getRunSnapshotByFingerprint = getRunSnapshotByFingerprint;
exports.updateRunSnapshotStatus = updateRunSnapshotStatus;
exports.listRunSnapshotsForJob = listRunSnapshotsForJob;
exports.checkDuplicateRun = checkDuplicateRun;
const uuid_1 = require("uuid");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const canonical_input_1 = require("./canonical-input");
/**
 * Get the current engine version (git commit hash or semver)
 */
function getEngineVersion() {
    // In production, this would be set during build
    return process.env.ENGINE_VERSION || process.env.GIT_COMMIT_HASH || '1.0.0';
}
/**
 * Create a new run snapshot
 */
async function createRunSnapshot(request) {
    const snapshotId = (0, uuid_1.v4)();
    const engineVersion = request.engine_version || getEngineVersion();
    // Compute fingerprints
    const inputFingerprint = (0, canonical_input_1.computeInputFingerprint)(request.input_batch);
    const sourceDataFingerprint = (0, canonical_input_1.computeInputFingerprint)({
        source_records: request.input_batch.source_records,
        target_records: [],
    });
    const targetDataFingerprint = (0, canonical_input_1.computeInputFingerprint)({
        source_records: [],
        target_records: request.input_batch.target_records,
    });
    const rulesetHash = (0, canonical_input_1.computeRulesetHash)(request.ruleset);
    const configSnapshot = {
        pipeline_id: request.pipeline_id,
        pipeline_version: request.pipeline_version,
        ruleset_id: request.ruleset_id,
        ruleset_version: request.ruleset_version,
        ruleset_hash: rulesetHash,
        adapter_config_hashes: request.adapter_config_hashes || {},
    };
    const runFingerprint = (0, canonical_input_1.computeRunFingerprint)(inputFingerprint, configSnapshot, engineVersion);
    const now = new Date();
    const statusTransitions = [
        {
            from: null,
            to: 'QUEUED',
            reason: 'Run created and queued for processing',
            timestamp: now,
            actor: 'system',
        },
    ];
    const snapshot = {
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
        await (0, db_1.query)(`INSERT INTO run_snapshots (
        id, tenant_id, recon_job_id, run_fingerprint, input_fingerprint,
        source_data_fingerprint, target_data_fingerprint, adapter_config_hashes,
        pipeline_id, pipeline_version, ruleset_id, ruleset_version, ruleset_hash,
        engine_version, input_record_count, status, status_transitions,
        started_at, completed_at, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`, [
            snapshot.id,
            snapshot.tenant_id,
            snapshot.recon_job_id,
            snapshot.run_fingerprint,
            snapshot.input_fingerprint,
            snapshot.source_data_fingerprint,
            snapshot.target_data_fingerprint,
            (0, canonical_input_1.stableStringify)(snapshot.adapter_config_hashes),
            snapshot.pipeline_id,
            snapshot.pipeline_version,
            snapshot.ruleset_id,
            snapshot.ruleset_version,
            snapshot.ruleset_hash,
            snapshot.engine_version,
            snapshot.input_record_count,
            snapshot.status,
            (0, canonical_input_1.stableStringify)(snapshot.status_transitions),
            snapshot.started_at,
            snapshot.completed_at,
            (0, canonical_input_1.stableStringify)(snapshot.metadata),
            snapshot.created_at,
        ]);
        (0, logger_1.logInfo)('Created run snapshot', {
            snapshotId: snapshot.id,
            runFingerprint: snapshot.run_fingerprint,
            inputRecordCount: snapshot.input_record_count,
        });
        return snapshot;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to create run snapshot', error, { request });
        throw error;
    }
}
/**
 * Get run snapshot by ID
 */
async function getRunSnapshot(snapshotId) {
    try {
        const results = await (0, db_1.query)(`SELECT * FROM run_snapshots WHERE id = $1`, [snapshotId]);
        const row = results[0];
        if (!row) {
            return null;
        }
        return mapRowToSnapshot(row);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get run snapshot', error, { snapshotId });
        throw error;
    }
}
/**
 * Get run snapshot by fingerprint
 */
async function getRunSnapshotByFingerprint(tenantId, runFingerprint) {
    try {
        const results = await (0, db_1.query)(`SELECT * FROM run_snapshots 
       WHERE tenant_id = $1 AND run_fingerprint = $2
       ORDER BY created_at DESC
       LIMIT 1`, [tenantId, runFingerprint]);
        const row = results[0];
        if (!row) {
            return null;
        }
        return mapRowToSnapshot(row);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get run snapshot by fingerprint', error, { tenantId, runFingerprint });
        throw error;
    }
}
/**
 * Update run snapshot status
 */
async function updateRunSnapshotStatus(snapshotId, newStatus, reason, actor = 'system', actorUserId) {
    try {
        // Get current snapshot
        const snapshot = await getRunSnapshot(snapshotId);
        if (!snapshot) {
            throw new Error(`Run snapshot not found: ${snapshotId}`);
        }
        // Validate status transition
        if (!isValidTransition(snapshot.status, newStatus)) {
            throw new Error(`Invalid status transition from ${snapshot.status} to ${newStatus}`);
        }
        // Add transition record
        const transition = {
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
        await (0, db_1.query)(`UPDATE run_snapshots 
       SET status = $1, status_transitions = $2, completed_at = $3, updated_at = NOW()
       WHERE id = $4`, [newStatus, (0, canonical_input_1.stableStringify)(updatedTransitions), completedAt, snapshotId]);
        (0, logger_1.logInfo)('Updated run snapshot status', {
            snapshotId,
            from: snapshot.status,
            to: newStatus,
            reason,
        });
    }
    catch (error) {
        (0, logger_1.logError)('Failed to update run snapshot status', error, { snapshotId, newStatus });
        throw error;
    }
}
/**
 * List run snapshots for a job
 */
async function listRunSnapshotsForJob(reconJobId, tenantId, limit = 50) {
    try {
        const results = await (0, db_1.query)(`SELECT * FROM run_snapshots 
       WHERE recon_job_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC
       LIMIT $3`, [reconJobId, tenantId, limit]);
        return results.map(mapRowToSnapshot);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to list run snapshots for job', error, { reconJobId, tenantId });
        throw error;
    }
}
/**
 * Check if a run with the same fingerprint already exists
 */
async function checkDuplicateRun(tenantId, runFingerprint) {
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to check duplicate run', error, { tenantId, runFingerprint });
        throw error;
    }
}
/**
 * Validate status transition
 */
function isValidTransition(from, to) {
    const validTransitions = {
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
function mapRowToSnapshot(row) {
    return {
        id: row.id,
        tenant_id: row.tenant_id,
        recon_job_id: row.recon_job_id,
        run_fingerprint: row.run_fingerprint,
        input_fingerprint: row.input_fingerprint,
        source_data_fingerprint: row.source_data_fingerprint,
        target_data_fingerprint: row.target_data_fingerprint,
        adapter_config_hashes: parseJsonField(row.adapter_config_hashes, {}),
        pipeline_id: row.pipeline_id,
        pipeline_version: row.pipeline_version,
        ruleset_id: row.ruleset_id,
        ruleset_version: row.ruleset_version,
        ruleset_hash: row.ruleset_hash,
        engine_version: row.engine_version,
        input_record_count: row.input_record_count,
        status: row.status,
        status_transitions: parseJsonField(row.status_transitions, []),
        started_at: row.started_at,
        completed_at: row.completed_at,
        metadata: parseJsonField(row.metadata, {}),
        created_at: row.created_at,
    };
}
/**
 * Parse JSON field safely
 */
function parseJsonField(value, defaultValue) {
    if (!value)
        return defaultValue;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return defaultValue;
        }
    }
    return value;
}
//# sourceMappingURL=run-snapshot.js.map