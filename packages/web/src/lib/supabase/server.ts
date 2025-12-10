/**
 * Supabase Server Client
 * 
 * CTO Mode: Deployment Guardrails
 * - Uses @supabase/ssr for proper SSR cookie handling
 * - Safe for use in Server Components, Server Actions, and Route Handlers
 * - NEVER expose service role key to client
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase server client for authenticated requests
 * Uses cookies for session management
 * Gracefully handles errors to prevent page crashes
 */
export async function createClient(): Promise<ReturnType<typeof createServerClient<Database>>> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // During build, these might not be available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set - some features may not work');
  }

  // Get cookie store with error handling
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (error) {
    console.error('Failed to get cookies:', error);
    // Return a client with empty cookie handlers if cookies() fails
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get() { return undefined; },
        set() { /* no-op */ },
        remove() { /* no-op */ },
      },
    });
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore.get(name)?.value;
        } catch (error) {
          console.warn('Failed to get cookie:', error);
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Get Supabase admin client (service role)
 * WARNING: Only use in Server Actions/Route Handlers, never expose to client
 * Gracefully handles errors to prevent crashes
 */
export async function createAdminClient(): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // During build, these might not be available
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Supabase admin environment variables not set - admin features may not work');
  }

  try {
    // Use regular supabase client with service role key (bypasses RLS)
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    
    return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    // Return a minimal mock client to prevent crashes
    // This will fail on actual operations but won't crash the page
    return {} as SupabaseClient<Database>;
  }
}
