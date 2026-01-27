"use strict";
/**
 * Concurrency Protection
 *
 * Ensures only one sync runs per (tenant_id, connector_id) at a time
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.acquireSyncLock = acquireSyncLock;
exports.releaseSyncLock = releaseSyncLock;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Acquire lock for sync (using PostgreSQL advisory locks)
 */
async function acquireSyncLock(tenantId, connectorId, supabaseUrl, supabaseServiceKey) {
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    try {
        // Use PostgreSQL advisory lock
        // Hash tenant_id and connector_id to create unique lock key
        const lockKey = `tenant:${tenantId}:connector:${connectorId}`;
        const lockHash = Buffer.from(lockKey).readUInt32BE(0);
        // Try to acquire lock (non-blocking)
        const { data, error } = await supabase.rpc("pg_try_advisory_lock", {
            lock_id: lockHash,
        });
        if (error) {
            return { acquired: false, error: error.message };
        }
        const lockIdString = String(lockHash);
        return {
            acquired: Boolean(data),
            lockId: lockIdString,
        };
    }
    catch (error) {
        return {
            acquired: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Release lock for sync
 */
async function releaseSyncLock(lockId, supabaseUrl, supabaseServiceKey) {
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    try {
        await supabase.rpc("pg_advisory_unlock", {
            lock_id: parseInt(lockId, 10),
        });
    }
    catch (error) {
        // Lock will expire automatically
        console.warn("Failed to release lock:", error);
    }
}
//# sourceMappingURL=concurrency-protection.js.map