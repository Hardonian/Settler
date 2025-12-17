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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // During build, these might not be available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not set - some features may not work");
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
    console.error("Failed to get cookies:", error);
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
        } catch (error) {
          console.warn("Failed to get cookie:", error);
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
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // During build, these might not be available
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn("Supabase admin environment variables not set - admin features may not work");
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
    console.error("Failed to create Supabase admin client:", error);
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
