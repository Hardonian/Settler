/**
 * Supabase Client Client
 * 
 * CTO Mode: Deployment Guardrails
 * - Safe for use in Client Components only
 * - Uses browser cookies for session management
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';
import { validateSupabaseEnv } from '@/lib/env/validator';

/**
 * Get Supabase browser client for client-side operations
 * Only use in Client Components ('use client')
 */
export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // During build, these might not be available - return a mock client
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side during build - return a minimal mock
      return {} as ReturnType<typeof createBrowserClient<Database>>;
    }
    // Client-side but missing env vars - log error once (gracefully)
    const validation = validateSupabaseEnv();
    if (!validation.isValid && typeof window !== 'undefined') {
      // Use safe logger - don't throw
      safeLogger.error('[Supabase Client] Missing environment variables', {
        missing: validation.missing,
      }).catch(() => {
        // Silently fail if logging fails
      });
    }
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
