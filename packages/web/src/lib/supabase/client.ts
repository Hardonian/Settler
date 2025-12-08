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

/**
 * Get Supabase browser client for client-side operations
 * Only use in Client Components ('use client')
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // During build, these might not be available - return a mock client
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side during build - return a minimal mock
      return {} as ReturnType<typeof createBrowserClient<Database>>;
    }
    // Client-side but missing env vars - this should not happen in production
    console.warn('Supabase environment variables not set');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
