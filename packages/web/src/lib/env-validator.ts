/**
 * Environment Variable Validator
 * 
 * Validates environment variables only at runtime, not during build.
 * This prevents build failures from missing runtime-only environment variables.
 */

/**
 * Check if we're currently in a build context
 */
function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' && !!process.env.VERCEL) ||
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    !!process.env.VERCEL_ENV
  );
}

/**
 * Validate required environment variables
 * Skips validation during build time
 */
export function validateRequiredEnvVars(requiredVars: string[]): { valid: boolean; errors: string[] } {
  // Skip validation during build time
  if (isBuildTime()) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  
  for (const name of requiredVars) {
    if (!process.env[name]) {
      errors.push(`Missing required environment variable: ${name}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get environment variable safely (doesn't throw during build)
 */
export function getEnvSafe(name: string, required = false): string {
  const value = process.env[name];
  
  if (!value && required && !isBuildTime()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value || '';
}
