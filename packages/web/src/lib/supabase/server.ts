/**
 * Supabase Server Client - Optimized
 *
 * CTO Mode: Deployment Guardrails
 * - Uses @supabase/ssr for proper SSR cookie handling
 * - Safe for use in Server Components, Server Actions, and Route Handlers
 * - NEVER expose service role key to client
 * - Optimized with connection reuse and error recovery
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env/validator";
import { safeLogger } from "@/lib/observability/safe-logger";

// Client cache to reuse connections
let cachedClient: SupabaseClient<Database> | null = null;
let clientCacheTimestamp = 0;
const CLIENT_CACHE_TTL = 60000; // 1 minute

/**
 * Get Supabase server client for authenticated requests
 * Uses cookies for session management
 * Gracefully handles errors to prevent page crashes
 * Optimized with connection reuse
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  // Use validator to get env vars with proper error handling
  let supabaseUrl: string;
  let supabaseAnonKey: string;
  
  try {
    const env = getSupabaseEnv();
    supabaseUrl = env.url;
    supabaseAnonKey = env.anonKey;
  } catch (error) {
    // Log error but don't crash - return a safe fallback client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await safeLogger.error('[Supabase] Failed to get environment variables', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return a proper mock client that won't throw on method calls
    // This prevents hard 500s while still allowing the page to render
    return {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: 'Supabase not configured', status: 500 },
        }),
      },
    } as unknown as SupabaseClient<Database>;
  }

  // Reuse cached client if available and fresh
  const now = Date.now();
  if (cachedClient && now - clientCacheTimestamp < CLIENT_CACHE_TTL) {
    return cachedClient;
  }

  // Get cookie store with error handling
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (error) {
    await safeLogger.error('[Supabase] Failed to get cookies', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return a client with empty cookie handlers if cookies() fails
    const fallbackClient = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get() {
          return undefined;
        },
        set() {
          /* no-op */
        },
        remove() {
          /* no-op */
        },
      },
    }) as SupabaseClient<Database>;
    
    cachedClient = fallbackClient;
    clientCacheTimestamp = now;
    return fallbackClient;
  }

  const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore.get(name)?.value;
        } catch {
          // Silently fail - cookie access is optional
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  }) as SupabaseClient<Database>;

  // Cache the client
  cachedClient = client;
  clientCacheTimestamp = now;

  return client;
}

/**
 * Get Supabase admin client (service role)
 * WARNING: Only use in Server Actions/Route Handlers, never expose to client
 * Gracefully handles errors to prevent crashes
 * Optimized with connection reuse
 */
let cachedAdminClient: SupabaseClient<Database> | null = null;
let adminClientCacheTimestamp = 0;

export async function createAdminClient(): Promise<SupabaseClient<Database>> {
  // Get URL from validator
  let supabaseUrl: string;
  try {
    const env = getSupabaseEnv();
    supabaseUrl = env.url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await safeLogger.error('[Supabase Admin] Failed to get Supabase URL', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {} as SupabaseClient<Database>;
  }
  
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseServiceRoleKey) {
    await safeLogger.warn('[Supabase Admin] SERVICE_ROLE_KEY not set - admin features may not work');
    // Return a minimal mock client that will fail gracefully
    return {} as SupabaseClient<Database>;
  }

  // Reuse cached admin client if available and fresh
  const now = Date.now();
  if (cachedAdminClient && now - adminClientCacheTimestamp < CLIENT_CACHE_TTL) {
    return cachedAdminClient;
  }

  try {
    // Use regular supabase client with service role key (bypasses RLS)
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");

    const adminClient = createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Optimize connection settings
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'settler-web-admin',
        },
      },
    });

    // Cache the admin client
    cachedAdminClient = adminClient;
    adminClientCacheTimestamp = now;

    return adminClient;
  } catch (error) {
    await safeLogger.error('[Supabase Admin] Failed to create admin client', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return a minimal mock client to prevent crashes
    // This will fail on actual operations but won't crash the page
    const fallbackClient = {} as SupabaseClient<Database>;
    cachedAdminClient = fallbackClient;
    adminClientCacheTimestamp = now;
    return fallbackClient;
  }
}

/**
 * Clear client cache (useful for testing or when credentials change)
 */
export function clearSupabaseCache(): void {
  cachedClient = null;
  cachedAdminClient = null;
  clientCacheTimestamp = 0;
  adminClientCacheTimestamp = 0;
}
