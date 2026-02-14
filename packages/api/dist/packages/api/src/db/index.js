"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.queryWithTenant = queryWithTenant;
exports.assertTenantScoped = assertTenantScoped;
exports.tenantScopedQuery = tenantScopedQuery;
exports.transaction = transaction;
exports.transactionWithTenant = transactionWithTenant;
exports.initDatabase = initDatabase;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const pg_1 = require("pg");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const TenantContext_1 = require("../infrastructure/tenancy/TenantContext");
// Database connection pool with proper configuration
exports.pool = new pg_1.Pool({
    host: config_1.config.database.host,
    port: config_1.config.database.port,
    database: config_1.config.database.name,
    user: config_1.config.database.user,
    password: config_1.config.database.password,
    max: config_1.config.database.poolMax,
    min: config_1.config.database.poolMin,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: config_1.config.database.connectionTimeout,
    statement_timeout: config_1.config.database.statementTimeout,
    query_timeout: config_1.config.database.statementTimeout,
    ssl: config_1.config.database.ssl
        ? {
            rejectUnauthorized: config_1.config.nodeEnv === "production" || config_1.config.nodeEnv === "preview",
        }
        : false,
});
exports.pool.on("error", (err) => {
    (0, logger_1.logError)("Unexpected error on idle client", err);
    process.exit(-1);
});
/**
 * @deprecated WARNING: This function does NOT enforce tenant isolation!
 * It bypasses RLS policies and should only be used for:
 * - Admin/schema operations
 * - Tenant management queries (where tenant context doesn't exist yet)
 * - Migrations
 *
 * For all tenant-scoped data access, use queryWithTenant() from TenantEnforcement
 * or use the TenantScopedRepository base class.
 *
 * See docs/SECURITY_INVARIANTS.md for details.
 */
async function query(text, params) {
    // Log warning in development to help identify unscoped queries
    if (config_1.config.nodeEnv === "development") {
        console.warn(`[SECURITY WARNING] Unscoped query() called. Stack: ${new Error().stack}`);
    }
    const client = await exports.pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows;
    }
    finally {
        client.release();
    }
}
/**
 * Execute a query with mandatory tenant context
 * This is the REQUIRED way to query tenant-scoped data
 */
async function queryWithTenant(tenantId, text, params) {
    // Validate tenant ID
    if (!tenantId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
        throw new Error(`[TENANT ISOLATION VIOLATION] Invalid or missing tenantId: ${tenantId}`);
    }
    const client = await exports.pool.connect();
    try {
        // Set tenant context for RLS
        await TenantContext_1.TenantContext.setTenantContext(client, tenantId);
        const result = await client.query(text, params);
        return result.rows;
    }
    finally {
        await TenantContext_1.TenantContext.clearTenantContext(client);
        client.release();
    }
}
// ============================================================================
// TENANT-SCOPED QUERY GUARD
// ============================================================================
// Tables that MUST include tenant_id in every SELECT/UPDATE/DELETE WHERE clause.
// INSERT is excluded because tenant_id is set by DB triggers or explicitly.
const TENANT_SCOPED_TABLES = new Set([
    "users",
    "jobs",
    "executions",
    "matches",
    "unmatched",
    "reports",
    "webhooks",
    "api_keys",
    "webhook_payloads",
    "audit_logs",
    "idempotency_keys",
    "tenant_usage",
    "tenant_quota_usage",
    "normalized_transactions",
    "reconciliation_runs",
    "reconciliation_matches",
    "audit_exports",
    "alert_rules",
    "alert_history",
]);
/**
 * Asserts that a SQL query touching tenant-scoped tables includes a tenant_id filter.
 * This is a lightweight runtime guard that prevents accidental unscoped queries.
 *
 * Skipped for: DDL (CREATE/ALTER/DROP), INSERT without subselect, RETURNING-only.
 * Active for: SELECT, UPDATE, DELETE on tenant-scoped tables.
 *
 * Throws in development/test; logs a warning in production.
 */
function assertTenantScoped(sql) {
    const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
    // Skip DDL and schema operations
    if (/^(create|alter|drop|grant|revoke|set|reset|begin|commit|rollback|explain)\b/.test(normalized)) {
        return;
    }
    // Skip INSERT without subselect (INSERT VALUES is safe — tenant_id set by trigger or caller)
    if (/^insert\b/.test(normalized) && !normalized.includes("select")) {
        return;
    }
    // Determine which tenant-scoped tables are referenced
    for (const table of TENANT_SCOPED_TABLES) {
        // Match table name as a word boundary (handles "FROM users", "JOIN users", "UPDATE users")
        const tablePattern = new RegExp(`\\b${table}\\b`);
        if (!tablePattern.test(normalized)) {
            continue;
        }
        // Check if tenant_id appears in the WHERE clause
        if (!normalized.includes("tenant_id")) {
            const message = `TENANT ISOLATION VIOLATION: Query on "${table}" missing tenant_id filter. SQL: ${sql.substring(0, 200)}`;
            if (process.env.NODE_ENV === "production") {
                (0, logger_1.logWarn)(message);
            }
            else {
                throw new Error(message);
            }
        }
        // Found the table and it has tenant_id — pass
        return;
    }
}
/**
 * Tenant-scoped query helper. Use this instead of raw `query()` for all
 * application-level data access. It enforces the tenant_id guard.
 */
async function tenantScopedQuery(text, params) {
    assertTenantScoped(text);
    return query(text, params);
}
// Transaction helper
async function transaction(callback) {
    const client = await exports.pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Execute a transaction with mandatory tenant context
 * This is the REQUIRED way to execute tenant-scoped transactions
 */
async function transactionWithTenant(tenantId, callback) {
    // Validate tenant ID
    if (!tenantId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
        throw new Error(`[TENANT ISOLATION VIOLATION] Invalid or missing tenantId: ${tenantId}`);
    }
    const client = await exports.pool.connect();
    try {
        await TenantContext_1.TenantContext.setTenantContext(client, tenantId);
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        await TenantContext_1.TenantContext.clearTenantContext(client);
        client.release();
    }
}
// Initialize database schema
async function initDatabase() {
    const migrationModule = await Promise.resolve().then(() => __importStar(require("./migrate"))).catch((error) => {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, logger_1.logWarn)("Migration runner failed, falling back to basic schema", { message });
        return null;
    });
    if (migrationModule?.runMigrations) {
        try {
            // Run all migrations in order
            await migrationModule.runMigrations();
            return;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            (0, logger_1.logWarn)("Migration runner failed, falling back to basic schema", { message });
        }
    }
    // Fallback to basic schema if migration runner fails
    // Run consolidated initial schema migration
    const migrationPath = node_path_1.default.join(__dirname, "migrations", "001-initial-schema.sql");
    if (node_fs_1.default.existsSync(migrationPath)) {
        const migrationSQL = node_fs_1.default.readFileSync(migrationPath, "utf8");
        // Split by semicolon and execute each statement
        const statements = migrationSQL.split(";").filter((s) => s.trim().length > 0);
        for (const statement of statements) {
            if (statement.trim() && !statement.trim().startsWith("--")) {
                try {
                    await query(statement);
                }
                catch (error) {
                    // Ignore "already exists" errors (idempotent migration)
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    if (!errorMessage.includes("already exists") &&
                        !errorMessage.includes("duplicate") &&
                        !errorMessage.includes("already enabled")) {
                        (0, logger_1.logWarn)("Migration warning", { errorMessage });
                    }
                }
            }
        }
    }
    else {
        // Fallback: create basic tables if migration file doesn't exist
        await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'developer',
      data_residency_region VARCHAR(10) DEFAULT 'us',
      data_retention_days INTEGER DEFAULT 365,
      deleted_at TIMESTAMP,
      deletion_scheduled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tenant_id, email)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_prefix VARCHAR(20) NOT NULL,
      key_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      scopes TEXT[] DEFAULT ARRAY['jobs:read', 'jobs:write', 'reports:read'],
      rate_limit INTEGER DEFAULT 1000,
      ip_whitelist TEXT[],
      revoked_at TIMESTAMP,
      expires_at TIMESTAMP,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at);

    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      source_adapter VARCHAR(100) NOT NULL,
      source_config_encrypted TEXT NOT NULL,
      target_adapter VARCHAR(100) NOT NULL,
      target_config_encrypted TEXT NOT NULL,
      rules JSONB NOT NULL,
      schedule VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(user_id) WHERE status = 'active';

    CREATE TABLE IF NOT EXISTS executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'running',
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      error TEXT,
      summary JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_executions_job_id ON executions(job_id);
    CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

    CREATE TABLE IF NOT EXISTS matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      source_id VARCHAR(255) NOT NULL,
      target_id VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2),
      currency VARCHAR(10),
      confidence DECIMAL(3, 2),
      matched_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_matches_job_id ON matches(job_id);
    CREATE INDEX IF NOT EXISTS idx_matches_execution_id ON matches(execution_id);
    CREATE INDEX IF NOT EXISTS idx_matches_source_id ON matches(source_id);
    CREATE INDEX IF NOT EXISTS idx_matches_target_id ON matches(target_id);
    CREATE INDEX IF NOT EXISTS idx_matches_job_status ON matches(job_id, confidence);

    CREATE TABLE IF NOT EXISTS unmatched (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      source_id VARCHAR(255),
      target_id VARCHAR(255),
      amount DECIMAL(10, 2),
      currency VARCHAR(10),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_unmatched_job_id ON unmatched(job_id);
    CREATE INDEX IF NOT EXISTS idx_unmatched_execution_id ON unmatched(execution_id);

    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
      date_range_start TIMESTAMP,
      date_range_end TIMESTAMP,
      summary JSONB NOT NULL,
      generated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reports_job_id ON reports(job_id);
    CREATE INDEX IF NOT EXISTS idx_reports_execution_id ON reports(execution_id);

    CREATE TABLE IF NOT EXISTS webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url VARCHAR(2048) NOT NULL,
      events TEXT[] NOT NULL,
      secret VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
    CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);

    CREATE TABLE IF NOT EXISTS webhook_payloads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      adapter VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL,
      signature VARCHAR(255),
      received_at TIMESTAMP DEFAULT NOW(),
      processed BOOLEAN DEFAULT FALSE,
      processed_at TIMESTAMP,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_payloads_adapter ON webhook_payloads(adapter);
    CREATE INDEX IF NOT EXISTS idx_webhook_payloads_processed ON webhook_payloads(processed, received_at);

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
      url VARCHAR(2048) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(50),
      status_code INTEGER,
      response_body TEXT,
      attempts INTEGER DEFAULT 0,
      next_retry_at TIMESTAMP,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'failed';

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event VARCHAR(100) NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
      ip VARCHAR(45),
      user_agent TEXT,
      method VARCHAR(10),
      path VARCHAR(500),
      status_code INTEGER,
      metadata JSONB,
      timestamp TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key VARCHAR(255) NOT NULL,
      response JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_user_key ON idempotency_keys(user_id, key);
    CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

    CREATE TABLE IF NOT EXISTS webhook_configs (
      adapter VARCHAR(100) PRIMARY KEY,
      secret VARCHAR(255) NOT NULL,
      signature_algorithm VARCHAR(50) DEFAULT 'hmac-sha256',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    `);
    }
}
//# sourceMappingURL=index.js.map