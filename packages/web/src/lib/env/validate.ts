/**
 * Environment Variable Validation
 * 
 * CTO Mode: Deployment Guardrails
 * - Validates required environment variables at startup
 * - Provides clear error messages for missing configuration
 * - Prevents cryptic crashes from missing env vars
 */

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate required environment variables for console routes
 * Returns validation result without throwing
 */
export function validateConsoleEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Required for Supabase auth
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    missing.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    missing.push('SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Optional but recommended
  if (!process.env.DATABASE_URL) {
    warnings.push('DATABASE_URL not set - Prisma features may not work');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Assert required environment variables are present
 * Throws with clear error message if validation fails
 */
export function assertConsoleEnv(): void {
  const validation = validateConsoleEnv();
  
  if (!validation.valid) {
    const errorMessage = [
      'Missing required environment variables:',
      ...validation.missing.map((key) => `  - ${key}`),
      '',
      'Please set these variables in your .env file or deployment environment.',
      'See .env.template for required configuration.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  if (validation.warnings.length > 0) {
    console.warn('[Env Validation] Warnings:', validation.warnings.join(', '));
  }
}

/**
 * Check if environment is properly configured for console routes
 * Returns boolean without throwing
 */
export function isConsoleEnvConfigured(): boolean {
  return validateConsoleEnv().valid;
}
