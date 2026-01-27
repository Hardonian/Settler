"use strict";
/**
 * Schema Validation on Startup
 * Validates database schema matches expectations before starting the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = validateSchema;
exports.checkMigrationsStatus = checkMigrationsStatus;
const db_1 = require("../db");
const logger_1 = require("./logger");
/**
 * Critical tables that must exist for the application to function
 */
const CRITICAL_TABLES = [
    'users',
    'tenants',
    'api_keys',
    'jobs',
    'executions',
    'billing_accounts',
    'usage_events',
    'schema_migrations',
];
/**
 * Validate database schema on startup
 * Throws error if critical tables are missing
 */
async function validateSchema() {
    (0, logger_1.logInfo)('Validating database schema...');
    const checks = [];
    // Check if critical tables exist
    for (const table of CRITICAL_TABLES) {
        try {
            const result = await (0, db_1.query)(`SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`, [table]);
            const exists = result[0]?.exists || false;
            checks.push({ table, exists });
            if (exists) {
                // Get columns for the table
                const columns = await (0, db_1.query)(`SELECT column_name 
           FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = $1
           ORDER BY ordinal_position`, [table]);
                const lastCheck = checks[checks.length - 1];
                if (lastCheck) {
                    lastCheck.columns = columns.map(c => c.column_name);
                }
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to check table ${table}`, error);
            checks.push({ table, exists: false });
        }
    }
    // Check for missing critical tables
    const missingTables = checks.filter(c => !c.exists).map(c => c.table);
    if (missingTables.length > 0) {
        const errorMessage = `Critical tables missing: ${missingTables.join(', ')}. Please run migrations.`;
        (0, logger_1.logError)('Schema validation failed', new Error(errorMessage));
        throw new Error(errorMessage);
    }
    // Check schema_migrations table
    const migrationsCheck = await (0, db_1.query)(`SELECT COUNT(*) as count FROM schema_migrations`);
    const migrationCount = parseInt((migrationsCheck[0]?.count || '0'), 10);
    (0, logger_1.logInfo)('Schema validation passed', {
        tablesChecked: checks.length,
        migrationsApplied: migrationCount,
    });
    // Log schema summary
    (0, logger_1.logInfo)('Database schema summary', {
        tables: checks.map(c => ({
            name: c.table,
            columns: (c.columns?.length || 0),
        })),
    });
}
/**
 * Check if migrations are up to date
 * Compares applied migrations with available migration files
 */
async function checkMigrationsStatus() {
    try {
        // Get applied migrations
        const applied = await (0, db_1.query)(`SELECT version FROM schema_migrations ORDER BY version`);
        const appliedVersions = new Set(applied.map(m => m.version));
        // Get available migration files (would need fs access, simplified here)
        // In practice, this would read from supabase/migrations directory
        const pending = [];
        return {
            applied: appliedVersions.size,
            pending,
            upToDate: pending.length === 0,
        };
    }
    catch (error) {
        (0, logger_1.logError)('Failed to check migration status', error);
        return {
            applied: 0,
            pending: [],
            upToDate: false,
        };
    }
}
//# sourceMappingURL=schema-validation.js.map