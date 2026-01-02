/**
 * Safe Supabase Query Wrapper
 * 
 * Provides a type-safe wrapper around Supabase queries that:
 * - Never throws (returns { data, error } instead)
 * - Handles RLS errors gracefully
 * - Handles missing tables gracefully
 * - Logs errors appropriately
 * - Returns empty/default values on failure
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { safeLogger } from '@/lib/observability/safe-logger';

export interface SafeQueryResult<T> {
  data: T | null;
  error: string | null;
  isEmpty: boolean;
}

/**
 * Execute a Supabase query safely, never throwing
 * 
 * @param queryFn - Function that returns a Supabase query promise
 * @param defaultValue - Default value to return on error (default: null)
 * @returns Safe result with data, error, and isEmpty flag
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  defaultValue: T | null = null
): Promise<SafeQueryResult<T>> {
  try {
    const result = await queryFn();
    
    // Check for Supabase errors
    if (result.error) {
      const error = result.error;
      const errorCode = error.code || '';
      const errorMessage = error.message || 'Unknown error';
      
      // Handle specific error cases gracefully
      if (
        errorCode === '42P01' || // Table does not exist
        errorMessage.includes('does not exist') ||
        errorMessage.includes('relation') && errorMessage.includes('does not exist')
      ) {
        await safeLogger.debug('[SafeQuery] Table does not exist, returning empty result', { table });
        return {
          data: defaultValue,
          error: null, // Don't treat missing table as error
          isEmpty: true,
        };
      }
      
      // RLS permission denied - expected for some queries
      if (
        errorCode === '42501' || // Insufficient privilege
        errorCode === 'PGRST301' || // PostgREST RLS error
        errorMessage.includes('permission denied') ||
        errorMessage.includes('RLS')
      ) {
        await safeLogger.debug('[SafeQuery] Permission denied by RLS, returning empty result', { table });
        return {
          data: defaultValue,
          error: null, // RLS blocks are expected, not errors
          isEmpty: true,
        };
      }
      
      // No rows returned - not an error
      if (
        errorCode === 'PGRST116' ||
        errorMessage.includes('No rows returned')
      ) {
        return {
          data: defaultValue,
          error: null,
          isEmpty: true,
        };
      }
      
      // Other errors - log but return default
      await safeLogger.error('[SafeQuery] Query error', {
        code: errorCode,
        message: errorMessage,
      });
      
      return {
        data: defaultValue,
        error: errorMessage,
        isEmpty: true,
      };
    }
    
    // Success - check if data is empty
    const isEmpty = result.data === null || 
                   (Array.isArray(result.data) && result.data.length === 0) ||
                   (typeof result.data === 'object' && Object.keys(result.data).length === 0);
    
    return {
      data: result.data ?? defaultValue,
      error: null,
      isEmpty,
    };
  } catch (error) {
    // Unexpected error - log but don't throw
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await safeLogger.error('[SafeQuery] Unexpected error', {
      table,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      data: defaultValue,
      error: errorMessage,
      isEmpty: true,
    };
  }
}

/**
 * Execute a Supabase RPC call safely
 */
export async function safeRpc<T>(
  supabase: SupabaseClient<any>,
  rpcName: string,
  params?: Record<string, any>,
  defaultValue: T | null = null
): Promise<SafeQueryResult<T>> {
  return safeQuery(
    async () => {
      const result = await supabase.rpc(rpcName, params);
      return {
        data: result.data as T | null,
        error: result.error,
      };
    },
    defaultValue
  );
}

/**
 * Execute a Supabase select query safely
 */
export async function safeSelect<T>(
  queryBuilder: { select: (columns: string) => any },
  columns: string,
  defaultValue: T | null = null
): Promise<SafeQueryResult<T>> {
  return safeQuery(
    async () => {
      const result = await queryBuilder.select(columns);
      return {
        data: result.data as T | null,
        error: result.error,
      };
    },
    defaultValue
  );
}
