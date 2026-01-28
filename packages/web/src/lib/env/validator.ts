/**
 * Environment Variable Validator
 * 
 * Validates required environment variables at build/runtime and provides
 * friendly error messages instead of silent failures.
 */

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  errors: Array<{ key: string; message: string }>;
}

/**
 * Validate required environment variables
 * Returns validation result without throwing
 */
export function validateEnv(requiredVars: string[]): EnvValidationResult {
  const missing: string[] = [];
  const errors: Array<{ key: string; message: string }> = [];

  for (const key of requiredVars) {
    const value = process.env[key];
    
    if (!value || value.trim() === '') {
      missing.push(key);
      errors.push({
        key,
        message: `Environment variable ${key} is required but not set`,
      });
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * Validate Supabase environment variables
 */
export function validateSupabaseEnv(): EnvValidationResult {
  return validateEnv([
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]);
}

/**
 * Get Supabase environment variables with validation
 * Throws if missing (for use in server components/actions)
 */
export function getSupabaseEnv(): {
  url: string;
  anonKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
    if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
    
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}`
    );
  }

  return { url, anonKey };
}

/**
 * Check if we're in a build context (where env vars might not be available)
 */
export function isBuildContext(): boolean {
  return process.env.NODE_ENV === 'production' && 
         (typeof window === 'undefined' && !process.env.VERCEL);
}
