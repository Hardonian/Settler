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
export declare const supabase: SupabaseClient;
export declare const supabaseRealtime: SupabaseClient;
/**
 * Check Supabase connection health
 */
export declare function checkSupabaseHealth(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
}>;
/**
 * Helper function to execute SQL queries with retry logic
 */
export declare function executeSQL<T = any>(query: string, params?: any[]): Promise<T[]>;
/**
 * Helper function for transactions
 */
export declare function transaction<T>(callback: (client: SupabaseClient) => Promise<T>): Promise<T>;
/**
 * Initialize Supabase extensions with retry logic
 */
export declare function initializeSupabaseExtensions(): Promise<void>;
//# sourceMappingURL=client.d.ts.map