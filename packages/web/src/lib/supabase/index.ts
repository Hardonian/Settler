/**
 * Supabase Client Exports
 *
 * Canonical clients for the entire application.
 * Import from here to ensure consistent connection pooling,
 * error handling, and caching across the codebase.
 *
 * Server-side usage:
 *   import { createClient, createAdminClient } from '@/lib/supabase';
 *
 * Client-side usage:
 *   import { createBrowserClient } from '@/lib/supabase';
 */

export { createClient, createAdminClient, clearSupabaseCache } from "./server";

export { createClient as createBrowserClient } from "./client";
