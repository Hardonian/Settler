"use strict";
/**
 * Database Migration Runner
 *
 * Runs all database migrations in order:
 * 1. 001-initial-schema.sql - Core schema
 * 2. 002-strategic-initiatives.sql - Strategic features (graph, AI, etc.)
 * 3. 003-canonical-data-model.sql - Canonical data model
 *
 * Supports both PostgreSQL (via pg) and Supabase
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const pg_1 = require("pg");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Execute SQL migration file
 */
async function executeMigration(migrationPath, migrationName, useSupabase) {
    const result = {
        migration: migrationName,
        success: false,
        statementsExecuted: 0,
    };
    try {
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        // Split by semicolon, but preserve function bodies and other multi-statement constructs
        const statements = migrationSQL
            .split(/;(?![^$]*\$\$)/) // Split on semicolon, but not inside $$ blocks
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        (0, logger_1.logInfo)(`Running migration: ${migrationName}`, { statements: statements.length });
        // Use PostgreSQL pool (works for both Supabase and regular PostgreSQL)
        // Supabase is PostgreSQL, so we can use pg directly
        // Priority: DATABASE_URL > Supabase connection string > config-based connection
        let connectionString = process.env.DATABASE_URL;
        if (!connectionString && useSupabase) {
            // Try to construct Supabase connection string
            // Supabase provides direct database connection via DATABASE_URL or we can construct it
            if (process.env.SUPABASE_DB_PASSWORD) {
                // Extract host from SUPABASE_URL (format: https://project-id.supabase.co)
                const supabaseUrl = process.env.SUPABASE_URL || '';
                const hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
                const host = hostMatch
                    ? `${hostMatch[1]}.supabase.co`
                    : config_1.config.database.host;
                connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${host}:${config_1.config.database.port || 5432}/postgres`;
            }
            else {
                // Fallback to config-based connection
                connectionString = `postgresql://${config_1.config.database.user}:${config_1.config.database.password}@${config_1.config.database.host}:${config_1.config.database.port}/${config_1.config.database.name}`;
            }
        }
        if (!connectionString) {
            // Fallback to config-based connection
            connectionString = `postgresql://${config_1.config.database.user}:${config_1.config.database.password}@${config_1.config.database.host}:${config_1.config.database.port}/${config_1.config.database.name}`;
        }
        const pool = new pg_1.Pool({
            connectionString: connectionString,
            ssl: config_1.config.database.ssl || useSupabase ? {
                rejectUnauthorized: config_1.config.nodeEnv === 'production' || config_1.config.nodeEnv === 'preview',
            } : false,
        });
        for (const statement of statements) {
            if (statement.trim() && !statement.trim().startsWith('--')) {
                try {
                    await pool.query(statement);
                    result.statementsExecuted++;
                }
                catch (error) {
                    // Ignore "already exists" errors (idempotent migration)
                    if (error.message.includes('already exists') ||
                        error.message.includes('duplicate') ||
                        error.message.includes('already enabled') ||
                        error.message.includes('does not exist') && error.message.includes('DROP')) {
                        (0, logger_1.logWarn)(`Migration warning (ignored): ${error.message}`);
                        continue;
                    }
                    throw error;
                }
            }
        }
        await pool.end();
        result.success = true;
        (0, logger_1.logInfo)(`Migration completed: ${migrationName}`, { statements: result.statementsExecuted });
    }
    catch (error) {
        result.error = error.message;
        (0, logger_1.logError)(`Migration failed: ${migrationName}`, error);
        throw error;
    }
    return result;
}
/**
 * Initialize Supabase extensions
 */
async function initializeSupabaseExtensions() {
    try {
        (0, logger_1.logInfo)('Initializing Supabase extensions...');
        // Try to use Supabase RPC if available
        const extensions = [
            { name: 'uuid-ossp', sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' },
            { name: 'pgcrypto', sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";' },
            { name: 'vector', sql: 'CREATE EXTENSION IF NOT EXISTS vector;' },
        ];
        // Use direct PostgreSQL connection for extensions
        // Use same connection string logic as migrations
        let connectionString = process.env.DATABASE_URL;
        const useSupabase = !!process.env.SUPABASE_URL;
        if (!connectionString && useSupabase) {
            if (process.env.SUPABASE_DB_PASSWORD) {
                const supabaseUrl = process.env.SUPABASE_URL || '';
                const hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
                const host = hostMatch
                    ? `${hostMatch[1]}.supabase.co`
                    : config_1.config.database.host;
                connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${host}:${config_1.config.database.port || 5432}/postgres`;
            }
            else {
                connectionString = `postgresql://${config_1.config.database.user}:${config_1.config.database.password}@${config_1.config.database.host}:${config_1.config.database.port}/${config_1.config.database.name}`;
            }
        }
        if (!connectionString) {
            connectionString = `postgresql://${config_1.config.database.user}:${config_1.config.database.password}@${config_1.config.database.host}:${config_1.config.database.port}/${config_1.config.database.name}`;
        }
        const pool = new pg_1.Pool({
            connectionString: connectionString,
            ssl: config_1.config.database.ssl || useSupabase ? {
                rejectUnauthorized: config_1.config.nodeEnv === 'production' || config_1.config.nodeEnv === 'preview',
            } : false,
        });
        for (const ext of extensions) {
            try {
                await pool.query(ext.sql);
                (0, logger_1.logInfo)(`Extension enabled: ${ext.name}`);
            }
            catch (error) {
                if (error.message.includes('already exists') ||
                    error.message.includes('permission denied')) {
                    (0, logger_1.logWarn)(`Extension ${ext.name}: ${error.message}`);
                }
                else {
                    (0, logger_1.logError)(`Failed to enable extension ${ext.name}`, error);
                }
            }
        }
        await pool.end();
    }
    catch (error) {
        (0, logger_1.logWarn)('Supabase extension initialization warning', error);
        // Don't fail if extensions can't be initialized
    }
}
/**
 * Run all migrations in order
 */
async function runMigrations() {
    const results = [];
    const useSupabase = !!process.env.SUPABASE_URL;
    (0, logger_1.logInfo)('Starting database migrations...', { useSupabase });
    // Initialize Supabase extensions if using Supabase
    if (useSupabase) {
        await initializeSupabaseExtensions();
    }
    // Migration files in order
    const migrations = [
        '001-initial-schema.sql',
        '002-strategic-initiatives.sql',
        '003-canonical-data-model.sql',
    ];
    const migrationsDir = path.join(__dirname, 'migrations');
    for (const migrationFile of migrations) {
        const migrationPath = path.join(migrationsDir, migrationFile);
        try {
            const result = await executeMigration(migrationPath, migrationFile, useSupabase);
            results.push(result);
            if (!result.success) {
                (0, logger_1.logError)(`Migration ${migrationFile} failed, stopping migration process`);
                break;
            }
        }
        catch (error) {
            results.push({
                migration: migrationFile,
                success: false,
                error: error.message,
                statementsExecuted: 0,
            });
            (0, logger_1.logError)(`Migration ${migrationFile} failed`, error);
            throw error;
        }
    }
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    (0, logger_1.logInfo)('Migration process completed', {
        total: results.length,
        successful: successCount,
        failed: failCount,
    });
    return results;
}
/**
 * CLI entry point
 */
if (require.main === module) {
    runMigrations()
        .then((results) => {
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            console.error('Some migrations failed:');
            failed.forEach(r => console.error(`  - ${r.migration}: ${r.error}`));
            process.exit(1);
        }
        else {
            console.log('All migrations completed successfully');
            process.exit(0);
        }
    })
        .catch((error) => {
        console.error('Migration process failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate.js.map