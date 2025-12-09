/**
 * Supabase Client Configuration
 *
 * Configured for:
 * - PostgreSQL database (main data)
 * - Realtime subscriptions (stream processing)
 * - pgvector extension (vector database for AI)
 * - Edge Functions (serverless compute)
 */
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Supabase client for database operations
 */
export declare const supabase: SupabaseClient;
/**
 * Supabase Realtime client for streaming
 * Use this for real-time subscriptions (reconciliation graph updates, etc.)
 */
export declare const supabaseRealtime: SupabaseClient<any, "public", "public", any, any>;
/**
 * Helper function to execute SQL queries
 */
export declare function executeSQL<T = any>(query: string, params?: any[]): Promise<T[]>;
/**
 * Helper function for transactions
 */
export declare function transaction<T>(callback: (client: SupabaseClient) => Promise<T>): Promise<T>;
/**
 * Initialize Supabase extensions
 */
export declare function initializeSupabaseExtensions(): Promise<void>;
//# sourceMappingURL=client.d.ts.map