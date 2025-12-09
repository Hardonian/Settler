"use strict";
/**
 * Supabase Client Configuration
 *
 * Configured for:
 * - PostgreSQL database (main data)
 * - Realtime subscriptions (stream processing)
 * - pgvector extension (vector database for AI)
 * - Edge Functions (serverless compute)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseRealtime = exports.supabase = void 0;
exports.executeSQL = executeSQL;
exports.transaction = transaction;
exports.initializeSupabaseExtensions = initializeSupabaseExtensions;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../../config");
// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || config_1.config.database.host;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}
/**
 * Supabase client for database operations
 */
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side, no session persistence needed
    },
    db: {
        schema: 'public',
    },
    global: {
        headers: {
            'x-client-info': 'settler-api@1.0.0',
        },
    },
});
/**
 * Supabase Realtime client for streaming
 * Use this for real-time subscriptions (reconciliation graph updates, etc.)
 */
exports.supabaseRealtime = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    realtime: {
        params: {
            eventsPerSecond: 10, // Rate limit for realtime events
        },
    },
});
/**
 * Helper function to execute SQL queries
 */
async function executeSQL(query, params) {
    const { data, error } = await exports.supabase.rpc('execute_sql', {
        query_text: query,
        query_params: params || [],
    });
    if (error) {
        throw new Error(`SQL execution failed: ${error.message}`);
    }
    return data || [];
}
/**
 * Helper function for transactions
 */
async function transaction(callback) {
    // Supabase doesn't have explicit transactions in JS client
    // Use PostgreSQL transactions via RPC or direct SQL
    return await callback(exports.supabase);
}
/**
 * Initialize Supabase extensions
 */
async function initializeSupabaseExtensions() {
    // Enable pgvector extension for vector database
    try {
        await exports.supabase.rpc('exec_sql', {
            sql: 'CREATE EXTENSION IF NOT EXISTS vector;',
        });
    }
    catch {
        // Extension might already exist or not be available
        console.warn('pgvector extension not available or already enabled');
    }
    // Enable uuid-ossp extension (if not already enabled)
    try {
        await exports.supabase.rpc('exec_sql', {
            sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
        });
    }
    catch {
        console.warn('uuid-ossp extension not available or already enabled');
    }
}
//# sourceMappingURL=client.js.map