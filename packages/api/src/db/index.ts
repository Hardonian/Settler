import fs from "node:fs";
import path from "node:path";
import { Pool, PoolClient } from "pg";

/** Re-export so Prisma adapter wiring shares the same `Pool` type identity as this module. */
export { Pool, PoolClient };
import { config } from "../config";
import { logError, logWarn } from "../utils/logger";
import { TenantContext } from "../infrastructure/tenancy/TenantContext";

// Database connection pool with proper configuration
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: config.database.poolMax,
  min: config.database.poolMin,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: config.database.connectionTimeout,
  statement_timeout: config.database.statementTimeout,
  query_timeout: config.database.statementTimeout,
  ssl: config.database.ssl
    ? { rejectUnauthorized: config.database.sslRejectUnauthorized !== false }
    : false,
});

pool.on("error", (err) => {
  logError("Unexpected error on idle client", err);
  process.exit(-1);
});

// Helper function to execute queries
type QueryParam = string | number | boolean | null | Date | string[];

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
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: QueryParam[]
): Promise<T[]> {
  // Log warning in development to help identify unscoped queries
  if (config.nodeEnv === "development") {
    console.warn(`[SECURITY WARNING] Unscoped query() called. Stack: ${new Error().stack}`);
  }

  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Execute a query with mandatory tenant context
 * This is the REQUIRED way to query tenant-scoped data
 */
export async function queryWithTenant<T = Record<string, unknown>>(
  tenantId: string,
  text: string,
  params?: QueryParam[]
): Promise<T[]> {
  // Validate tenant ID
  if (
    !tenantId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)
  ) {
    throw new Error(`[TENANT ISOLATION VIOLATION] Invalid or missing tenantId: ${tenantId}`);
  }

  // Runtime assertion to prevent unscoped tenant-table access.
  assertTenantScoped(text);

  const client = await pool.connect();
  try {
    // Set tenant context for RLS
    await TenantContext.setTenantContext(client, tenantId);
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    await TenantContext.clearTenantContext(client);
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
  "operator_runtime_events",
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
export function assertTenantScoped(sql: string): void {
  const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

  // Skip DDL and schema operations
  if (
    /^(create|alter|drop|grant|revoke|set|reset|begin|commit|rollback|explain)\b/.test(normalized)
  ) {
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
        logWarn(message);
      } else {
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
export async function tenantScopedQuery<T = Record<string, unknown>>(
  text: string,
  params?: QueryParam[]
): Promise<T[]> {
  assertTenantScoped(text);
  return query<T>(text, params);
}

// Transaction helper
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction with mandatory tenant context
 * This is the REQUIRED way to execute tenant-scoped transactions
 */
export async function transactionWithTenant<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  // Validate tenant ID
  if (
    !tenantId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)
  ) {
    throw new Error(`[TENANT ISOLATION VIOLATION] Invalid or missing tenantId: ${tenantId}`);
  }

  const client = await pool.connect();
  try {
    await TenantContext.setTenantContext(client, tenantId);
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await TenantContext.clearTenantContext(client);
    client.release();
  }
}

// Initialize database schema
export async function initDatabase(): Promise<void> {
  const migrationModule = await import("./migrate").catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    logWarn("Migration runner failed, falling back to basic schema", { message });
    return null;
  });

  if (migrationModule?.runMigrations) {
    try {
      // Run all migrations in order
      await migrationModule.runMigrations();
      return;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logWarn("Migration runner failed, falling back to basic schema", { message });
    }
  }

  // Fallback to basic schema if migration runner fails
  // Run consolidated initial schema migration
  const migrationPath = path.join(__dirname, "migrations", "001-initial-schema.sql");
  if (fs.existsSync(migrationPath)) {
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(";").filter((s: string) => s.trim().length > 0);
    for (const statement of statements) {
      if (statement.trim() && !statement.trim().startsWith("--")) {
        try {
          await query(statement);
        } catch (error: unknown) {
          // Ignore "already exists" errors (idempotent migration)
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            !errorMessage.includes("already exists") &&
            !errorMessage.includes("duplicate") &&
            !errorMessage.includes("already enabled")
          ) {
            logWarn("Migration warning", { errorMessage });
          }
        }
      }
    }
  } else {
    // Legacy custom migrations have been replaced by Prisma.
    // Use Prisma for database schema management:
    //   npx prisma migrate deploy
    //   npx prisma db push
    logWarn(
      "No legacy migration files found. Database schema is now managed via Prisma. " +
        "Run 'npx prisma migrate deploy' or 'npx prisma db push' to set up the database.",
      { migrationPath }
    );
  }
}
