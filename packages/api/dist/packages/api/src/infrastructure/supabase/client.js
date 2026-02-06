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
exports.supabaseRealtime = exports.supabase = void 0;
exports.checkSupabaseHealth = checkSupabaseHealth;
exports.executeSQL = executeSQL;
exports.transaction = transaction;
exports.initializeSupabaseExtensions = initializeSupabaseExtensions;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../../config");
// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || config_1.config.database.host;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let pRetryModulePromise = null;
const getPRetryModule = () => {
    if (!pRetryModulePromise) {
        pRetryModulePromise = Promise.resolve().then(() => __importStar(require('p-retry')));
    }
    return pRetryModulePromise;
};
// Runtime-safe configuration check - don't crash on missing env in non-production
function createSupabaseClient() {
    if (!supabaseUrl || !supabaseKey) {
        // In production/preview, throw error
        if (config_1.config.nodeEnv === 'production' || config_1.config.nodeEnv === 'preview') {
            throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        }
        // In development, create a mock client that will fail gracefully
        // Note: Can't use logger here as it may depend on Supabase - use console for initialization only
        console.warn('⚠️  Supabase not configured. Some features may not work.');
        return (0, supabase_js_1.createClient)('https://placeholder.supabase.co', 'placeholder-key', {
            db: { schema: 'public' },
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
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
}
/**
 * Supabase client for database operations
 * Uses connection pooling for serverless environments
 * Includes retry logic for transient failures
 */
let supabaseClient = null;
exports.supabase = (() => {
    if (!supabaseClient) {
        supabaseClient = createSupabaseClient();
    }
    return supabaseClient;
})();
/**
 * Supabase Realtime client for streaming
 * Use this for real-time subscriptions (reconciliation graph updates, etc.)
 * Includes retry logic for connection failures
 */
let supabaseRealtimeClient = null;
exports.supabaseRealtime = (() => {
    if (!supabaseRealtimeClient) {
        if (!supabaseUrl || !supabaseKey) {
            // Return mock client in development if not configured
            if (config_1.config.nodeEnv !== 'production' && config_1.config.nodeEnv !== 'preview') {
                return (0, supabase_js_1.createClient)('https://placeholder.supabase.co', 'placeholder-key', {
                    db: { schema: 'public' },
                    realtime: { params: { eventsPerSecond: 10 } },
                    auth: { persistSession: false, autoRefreshToken: false },
                });
            }
            throw new Error('Missing Supabase configuration for Realtime client.');
        }
        supabaseRealtimeClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            realtime: {
                params: {
                    eventsPerSecond: 10, // Rate limit for realtime events
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }
    return supabaseRealtimeClient;
})();
/**
 * Check Supabase connection health
 */
async function checkSupabaseHealth() {
    const start = Date.now();
    try {
        // Simple health check - try to query a system table
        const { error } = await exports.supabase.from('_health_check').select('1').limit(1).single();
        // If table doesn't exist, try a simple RPC call
        if (error && error.code === 'PGRST116') {
            // Table doesn't exist, try a simple query
            const { error: rpcError } = await exports.supabase.rpc('version');
            if (rpcError) {
                return {
                    healthy: false,
                    latency: Date.now() - start,
                    error: rpcError.message,
                };
            }
        }
        else if (error && error.code !== 'PGRST116') {
            return {
                healthy: false,
                latency: Date.now() - start,
                error: error.message,
            };
        }
        return {
            healthy: true,
            latency: Date.now() - start,
        };
    }
    catch (error) {
        return {
            healthy: false,
            latency: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Helper function to execute SQL queries with retry logic
 */
async function executeSQL(query, params) {
    const pRetryModule = await getPRetryModule();
    const pRetry = pRetryModule.default;
    const { AbortError } = pRetryModule;
    return pRetry(async () => {
        const { data, error } = await exports.supabase.rpc('execute_sql', {
            query_text: query,
            query_params: params || [],
        });
        if (error) {
            // Retry on transient errors
            if (error.message.includes('connection') ||
                error.message.includes('timeout') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT')) {
                throw new Error(`Transient Supabase error: ${error.message}`);
            }
            // Don't retry on permanent errors (syntax errors, etc.)
            throw new AbortError(`SQL execution failed: ${error.message}`);
        }
        return data || [];
    }, {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        onFailedAttempt: (error) => {
            // Note: Can't use logger here as it may depend on Supabase - use console for initialization only
            console.warn(`Supabase query retry attempt ${error.attemptNumber}: ${error.message}`);
        },
    });
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
 * Initialize Supabase extensions with retry logic
 */
async function initializeSupabaseExtensions() {
    const pRetryModule = await getPRetryModule();
    const pRetry = pRetryModule.default;
    try {
        await pRetry(async () => {
            // Enable pgvector extension for vector database
            try {
                await exports.supabase.rpc('exec_sql', {
                    sql: 'CREATE EXTENSION IF NOT EXISTS vector;',
                });
            }
            catch {
                // Extension might already exist or not be available
                // Note: Can't use logger here as it may depend on Supabase - use console for initialization only
                console.warn('pgvector extension not available or already enabled');
            }
            // Enable uuid-ossp extension (if not already enabled)
            try {
                await exports.supabase.rpc('exec_sql', {
                    sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
                });
            }
            catch {
                // Note: Can't use logger here as it may depend on Supabase - use console for initialization only
                console.warn('uuid-ossp extension not available or already enabled');
            }
        }, {
            retries: 3,
            minTimeout: 1000,
            maxTimeout: 5000,
            onFailedAttempt: (error) => {
                // Note: Can't use logger here as it may depend on Supabase - use console for initialization only
                console.warn(`Supabase extension initialization retry ${error.attemptNumber}: ${error.message}`);
            },
        });
    }
    catch (error) {
        // Note: Can't use logger here as it may depend on Supabase - use console for initialization only
        console.warn('Failed to initialize Supabase extensions after retries:', error);
        // Don't throw - extensions may already exist
    }
}
//# sourceMappingURL=client.js.map