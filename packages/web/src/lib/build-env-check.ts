/**
 * Build-time environment variable check
 * Prevents build failures from missing runtime-only environment variables
 */

/**
 * Check if we're currently in a build context
 */
export function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' && process.env.VERCEL) ||
    process.env.CI === 'true' ||
    !!process.env.VERCEL_ENV
  );
}

/**
 * Safely get environment variable during build
 * Returns empty string during build if variable is missing
 */
export function getEnvSafe(name: string, required = false): string {
  const value = process.env[name];
  
  if (!value && isBuildTime() && required) {
    // During build, return empty string instead of throwing
    // Runtime validation will catch missing required vars
    console.warn(`⚠️  Missing ${name} during build (will be required at runtime)`);
    return '';
  }
  
  if (required && !value && !isBuildTime()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value || '';
}
