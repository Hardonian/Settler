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

// Runtime-safe configuration check - don't crash on missing env in non-production
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    // In production/preview, throw error
    if (config.nodeEnv === 'production' || config.nodeEnv === 'preview') {
      throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    // In development, create a mock client that will fail gracefully
    console.warn('⚠️  Supabase not configured. Some features may not work.');
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      db: { schema: 'public' },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return createClient(supabaseUrl, supabaseKey, {
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
let supabaseClient: SupabaseClient | null = null;
export const supabase: SupabaseClient = (() => {
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
let supabaseRealtimeClient: SupabaseClient | null = null;
export const supabaseRealtime: SupabaseClient = (() => {
  if (!supabaseRealtimeClient) {
    if (!supabaseUrl || !supabaseKey) {
      // Return mock client in development if not configured
      if (config.nodeEnv !== 'production' && config.nodeEnv !== 'preview') {
        return createClient('https://placeholder.supabase.co', 'placeholder-key', {
          db: { schema: 'public' },
          realtime: { params: { eventsPerSecond: 10 } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
      }
      throw new Error('Missing Supabase configuration for Realtime client.');
    }
    supabaseRealtimeClient = createClient(supabaseUrl, supabaseKey, {
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
export async function checkSupabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    // Simple health check - try to query a system table
    const { error } = await supabase.from('_health_check').select('1').limit(1).single();
    
    // If table doesn't exist, try a simple RPC call
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, try a simple query
      const { error: rpcError } = await supabase.rpc('version');
      if (rpcError) {
        return {
          healthy: false,
          latency: Date.now() - start,
          error: rpcError.message,
        };
      }
    } else if (error && error.code !== 'PGRST116') {
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
  } catch (error: unknown) {
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
export async function executeSQL<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const pRetry = require('p-retry');
  
  return pRetry(
    async () => {
      const { data, error } = await supabase.rpc('execute_sql', {
        query_text: query,
        query_params: params || [],
      });

      if (error) {
        // Retry on transient errors
        if (
          error.message.includes('connection') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT')
        ) {
          throw new Error(`Transient Supabase error: ${error.message}`);
        }
        // Don't retry on permanent errors (syntax errors, etc.)
        throw new pRetry.AbortError(`SQL execution failed: ${error.message}`);
      }

      return data || [];
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      onFailedAttempt: (error: { attemptNumber: number; message: string }) => {
        console.warn(`Supabase query retry attempt ${error.attemptNumber}: ${error.message}`);
      },
    }
  );
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
 * Initialize Supabase extensions with retry logic
 */
export async function initializeSupabaseExtensions(): Promise<void> {
  const pRetry = require('p-retry');
  
  try {
    await pRetry(
      async () => {
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
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        onFailedAttempt: (error: { attemptNumber: number; message: string }) => {
          console.warn(`Supabase extension initialization retry ${error.attemptNumber}: ${error.message}`);
        },
      }
    );
  } catch (error) {
    console.warn('Failed to initialize Supabase extensions after retries:', error);
    // Don't throw - extensions may already exist
  }
}
