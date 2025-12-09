/**
 * Environment Variable Build Helper
 * 
 * Provides utilities to safely access environment variables during build
 * without causing build failures for runtime-only variables.
 */

/**
 * Check if we're currently in a build context
 */
export function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' && !!process.env.VERCEL) ||
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    !!process.env.VERCEL_ENV ||
    process.env.CI === 'true'
  );
}

/**
 * Build-time required environment variables
 * These are needed during the build process
 */
export const BUILD_TIME_REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
] as const;

/**
 * Runtime-only environment variables
 * These are NOT required during build but will be needed at runtime
 */
export const RUNTIME_ONLY = [
  'DB_PASSWORD',
  'ENCRYPTION_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/**
 * Safely get an environment variable
 * Returns empty string during build if variable is missing and it's runtime-only
 */
export function getEnvSafe(
  name: string,
  options: {
    required?: boolean;
    defaultValue?: string;
    buildTimeRequired?: boolean;
  } = {}
): string {
  const {
    required = false,
    defaultValue = '',
    buildTimeRequired = false,
  } = options;

  const value = process.env[name];
  const isBuild = isBuildTime();
  const isRuntimeOnly = RUNTIME_ONLY.includes(name as any);

  // During build, runtime-only variables are optional
  if (isBuild && isRuntimeOnly && !value) {
    if (required) {
      console.warn(`⚠️  Missing ${name} during build (will be required at runtime)`);
    }
    return defaultValue;
  }

  // Build-time required variables must be present during build
  if (isBuild && buildTimeRequired && !value) {
    throw new Error(`Missing build-time required variable: ${name}`);
  }

  // Runtime validation
  if (required && !value && !isBuild) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value || defaultValue;
}

/**
 * Validate build-time environment variables
 */
export function validateBuildEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check build-time required variables
  for (const name of BUILD_TIME_REQUIRED) {
    if (!process.env[name]) {
      errors.push(`Missing build-time required variable: ${name}`);
    }
  }

  // Warn about runtime-only variables (non-blocking)
  for (const name of RUNTIME_ONLY) {
    if (!process.env[name]) {
      warnings.push(`Missing runtime-only variable (will be required at runtime): ${name}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get environment variable with build-time safety
 * Use this instead of direct process.env access in code that runs during build
 */
export function getEnv(name: string, required = false): string {
  return getEnvSafe(name, {
    required,
    buildTimeRequired: BUILD_TIME_REQUIRED.includes(name as any),
  });
}
