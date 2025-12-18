/**
 * Safe Environment Variable Access
 * 
 * Provides safe access to environment variables that never throws during render.
 * Returns partial mode indicators when env vars are missing.
 */

import { validateSupabaseEnv, type EnvValidationResult } from './validator';
import { safeSync, type SafeAsyncResult } from '../safe';

export interface EnvStatus {
  ok: boolean;
  missing: string[];
  isPartialMode: boolean;
}

/**
 * Safely check Supabase environment variables
 * Never throws - returns status object
 */
export function getSupabaseEnvStatus(): EnvStatus {
  const validation = validateSupabaseEnv();
  
  return {
    ok: validation.isValid,
    missing: validation.missing,
    isPartialMode: !validation.isValid,
  };
}

/**
 * Safely get Supabase URL, returns undefined if missing
 */
export function getSupabaseUrlSafe(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

/**
 * Safely get Supabase anon key, returns undefined if missing
 */
export function getSupabaseAnonKeySafe(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(getSupabaseUrlSafe() && getSupabaseAnonKeySafe());
}
