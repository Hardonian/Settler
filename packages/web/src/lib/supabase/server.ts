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

/**
 * Get Supabase server client for authenticated requests
 * Uses cookies for session management
 */
export async function createClient() {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const cookieStore = await cookies();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // During build, these might not be available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set - some features may not work');
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
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
 */
export async function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // During build, these might not be available
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Supabase admin environment variables not set - admin features may not work');
  }

  // Use regular supabase client with service role key (bypasses RLS)
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
