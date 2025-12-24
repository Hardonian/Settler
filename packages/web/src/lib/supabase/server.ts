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

// Client cache to reuse connections
let cachedClient: SupabaseClient<Database> | null = null;
let clientCacheTimestamp = 0;
const CLIENT_CACHE_TTL = 60000; // 1 minute

/**
 * Create a safe mock Supabase client that handles all operations gracefully
 * Used when environment variables are missing to prevent crashes
 * 
 * CRITICAL: This mock client must match Supabase's actual API structure
 * to prevent runtime errors when methods are called on it
 */
function createSafeMockClient(): SupabaseClient<Database> {
  // Create a mock error that matches Supabase's error structure
  const mockError = {
    message: 'Supabase configuration missing',
    status: 500,
    name: 'ConfigurationError',
    details: 'Required environment variables are not configured',
    hint: 'Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
  };

  // Create mock responses that match Supabase's response structure
  const mockAuthResponse = {
    data: { user: null, session: null },
    error: mockError,
  };

  const mockQueryResponse = {
    data: null,
    error: mockError,
    count: null,
    status: 500,
    statusText: 'Configuration Error',
  };

  // Create a chainable query builder mock
  const createQueryBuilder = () => ({
    select: () => ({
      eq: () => ({
        single: async () => mockQueryResponse,
        maybeSingle: async () => mockQueryResponse,
        limit: () => ({
          order: () => ({
            maybeSingle: async () => mockQueryResponse,
          }),
          maybeSingle: async () => mockQueryResponse,
        }),
      }),
      in: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: async () => mockQueryResponse,
          }),
        }),
      }),
      order: () => ({
        limit: () => ({
          maybeSingle: async () => mockQueryResponse,
        }),
      }),
      maybeSingle: async () => mockQueryResponse,
      single: async () => mockQueryResponse,
    }),
    insert: () => ({
      select: async () => mockQueryResponse,
    }),
    update: () => ({
      eq: () => ({
        select: async () => mockQueryResponse,
      }),
      select: async () => mockQueryResponse,
    }),
    delete: () => ({
      eq: () => ({
        select: async () => mockQueryResponse,
      }),
    }),
  });

  return {
    auth: {
      getUser: async () => mockAuthResponse,
      getSession: async () => mockAuthResponse,
      signOut: async () => mockAuthResponse,
      signInWithPassword: async () => mockAuthResponse,
      signUp: async () => mockAuthResponse,
      resetPasswordForEmail: async () => mockAuthResponse,
      updateUser: async () => mockAuthResponse,
      refreshSession: async () => mockAuthResponse,
      onAuthStateChange: () => ({ 
        data: { subscription: null }, 
        error: null 
      }),
    },
    from: () => createQueryBuilder(),
    // Add other Supabase client methods that might be called
    rpc: async () => mockQueryResponse,
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: mockError }),
        download: async () => ({ data: null, error: mockError }),
        list: async () => ({ data: null, error: mockError }),
        remove: async () => ({ data: null, error: mockError }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as SupabaseClient<Database>;
}

/**
 * Get Supabase server client for authenticated requests
 * Uses cookies for session management
 * Gracefully handles errors to prevent page crashes
 * Optimized with connection reuse
 * 
 * CRITICAL: Never returns an invalid client - always returns a working client
 * that handles operations gracefully even when env vars are missing
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
    // Log error but don't crash - return a safe mock client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Supabase] Failed to get environment variables:', errorMessage);
    
    // Return a proper mock client that handles all operations gracefully
    // This prevents hard 500s while still allowing the page to render
    return createSafeMockClient();
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
    // If cookies() fails, try to create client with no-op cookie handlers
    // If that also fails, return safe mock client
    try {
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
    } catch (clientError) {
      console.error('[Supabase] Failed to create client with fallback cookies:', clientError);
      // Last resort: return safe mock client
      return createSafeMockClient();
    }
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
  // Get URL from validator
  let supabaseUrl: string;
  try {
    const env = getSupabaseEnv();
    supabaseUrl = env.url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Supabase Admin] Failed to get Supabase URL:', errorMessage);
    return createSafeMockClient();
  }
  
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseServiceRoleKey) {
    console.warn("Supabase SERVICE_ROLE_KEY not set - admin features may not work");
    // Return a proper mock client that handles operations gracefully
    return createSafeMockClient();
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
    // Return a proper mock client to prevent crashes
    // This will handle operations gracefully without crashing
    const fallbackClient = createSafeMockClient();
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
