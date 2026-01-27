"use strict";
/**
 * Batch Query Utilities
 * Prevents N+1 query patterns by batching database operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchFetchUsers = batchFetchUsers;
exports.batchFetchJobs = batchFetchJobs;
exports.batchFetchTenants = batchFetchTenants;
exports.batchInsert = batchInsert;
const db_1 = require("../db");
const logger_1 = require("./logger");
/**
 * Batch fetch users by IDs
 */
async function batchFetchUsers(userIds) {
    if (userIds.length === 0) {
        return new Map();
    }
    try {
        const users = await (0, db_1.query)(`SELECT id, email, plan_type
       FROM users
       WHERE id = ANY($1::uuid[])
         AND deleted_at IS NULL`, [userIds]);
        const userMap = new Map();
        for (const user of users) {
            userMap.set(user.id, user);
        }
        return userMap;
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to batch fetch users", {
            error: error instanceof Error ? error.message : String(error),
            userIdCount: userIds.length,
        });
        return new Map();
    }
}
/**
 * Batch fetch jobs by IDs
 */
async function batchFetchJobs(jobIds) {
    if (jobIds.length === 0) {
        return new Map();
    }
    try {
        const jobs = await (0, db_1.query)(`SELECT id, user_id, name
       FROM jobs
       WHERE id = ANY($1::uuid[])`, [jobIds]);
        const jobMap = new Map();
        for (const job of jobs) {
            jobMap.set(job.id, job);
        }
        return jobMap;
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to batch fetch jobs", {
            error: error instanceof Error ? error.message : String(error),
            jobCount: jobIds.length,
        });
        return new Map();
    }
}
/**
 * Batch fetch tenants by IDs
 */
async function batchFetchTenants(tenantIds) {
    if (tenantIds.length === 0) {
        return new Map();
    }
    try {
        const tenants = await (0, db_1.query)(`SELECT id, name
       FROM tenants
       WHERE id = ANY($1::uuid[])`, [tenantIds]);
        const tenantMap = new Map();
        for (const tenant of tenants) {
            tenantMap.set(tenant.id, tenant);
        }
        return tenantMap;
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to batch fetch tenants", {
            error: error instanceof Error ? error.message : String(error),
            tenantCount: tenantIds.length,
        });
        return new Map();
    }
}
/**
 * Batch insert with conflict handling
 */
async function batchInsert(table, records, conflictColumns = []) {
    if (records.length === 0) {
        return;
    }
    try {
        if (records.length === 0)
            return;
        const firstRecord = records[0];
        if (!firstRecord)
            return;
        const columns = Object.keys(firstRecord);
        const placeholders = records
            .map((_, index) => `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(", ")})`)
            .join(", ");
        const values = records.flatMap((record) => columns.map((col) => {
            if (!record)
                return null;
            const value = record[col];
            return value === undefined ? null : value;
        }));
        let conflictClause = "";
        if (conflictColumns.length > 0) {
            conflictClause = ` ON CONFLICT (${conflictColumns.join(", ")}) DO NOTHING`;
        }
        await (0, db_1.query)(`INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders}${conflictClause}`, values);
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to batch insert", {
            error: error instanceof Error ? error.message : String(error),
            table,
            recordCount: records.length,
        });
        throw error;
    }
}
//# sourceMappingURL=batch-queries.js.map