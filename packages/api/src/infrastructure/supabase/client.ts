/**
 * Supabase Client Configuration
 * 
 * Configured for:
 * - PostgreSQL database (main data)
 * - Realtime subscriptions (stream processing)
 * - pgvector extension (vector database for AI)
 * - Edge Functions (serverless compute)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || config.database.host;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

/**
 * Supabase client for database operations
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
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
export const supabaseRealtime = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for realtime events
    },
  },
});

/**
 * Helper function to execute SQL queries
 */
export async function executeSQL<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const { data, error } = await supabase.rpc('execute_sql', {
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
export async function transaction<T>(
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  // Supabase doesn't have explicit transactions in JS client
  // Use PostgreSQL transactions via RPC or direct SQL
  return await callback(supabase);
}

/**
 * Initialize Supabase extensions
 */
export async function initializeSupabaseExtensions(): Promise<void> {
  // Enable pgvector extension for vector database
  try {
    await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS vector;',
    });
  } catch {
    // Extension might already exist or not be available
    console.warn('pgvector extension not available or already enabled');
  }

  // Enable uuid-ossp extension (if not already enabled)
  try {
    await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
    });
  } catch {
    console.warn('uuid-ossp extension not available or already enabled');
  }
}
