/**
 * Environment Variable Build Helper
 *
 * Provides utilities to safely access environment variables during build
 * without causing build failures for runtime-only variables.
 */

import {
  BUILD_REQUIRED_ENV_GROUPS,
  RUNTIME_REQUIRED_SERVER_KEYS,
  hasConfiguredValue,
} from "./env/keys";

/**
 * Check if we're currently in a build context
 */
export function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.NODE_ENV === "production" && !!process.env.VERCEL) ||
    process.env.SKIP_ENV_VALIDATION === "true" ||
    !!process.env.VERCEL_ENV ||
    process.env.CI === "true" ||
    process.env.CI === "1"
  );
}

/**
 * Build-time required environment variables
 * These are needed during the build process
 */
export const BUILD_TIME_REQUIRED = BUILD_REQUIRED_ENV_GROUPS.map((group) => group.keys);

/**
 * Runtime-only environment variables
 * These are NOT required during build but will be needed at runtime
 */
export const RUNTIME_ONLY = [
  "DB_PASSWORD",
  "JWT_REFRESH_SECRET",
  "JOBFORGE_INTEGRATION_ENABLED",
  "JOBFORGE_BUNDLE_EXECUTION_ENABLED",
  ...RUNTIME_REQUIRED_SERVER_KEYS,
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
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
  const { required = false, defaultValue = "", buildTimeRequired = false } = options;

  const value = process.env[name];
  const isBuild = isBuildTime();
  const isRuntimeOnly = (RUNTIME_ONLY as readonly string[]).includes(name);

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
  for (const keyGroup of BUILD_TIME_REQUIRED) {
    const hasAny = keyGroup.some((key) => hasConfiguredValue(key));
    if (!hasAny) {
      errors.push(`Missing build-time required variable: ${keyGroup.join(" or ")}`);
    }
  }

  // Warn about runtime-only variables (non-blocking)
  for (const name of RUNTIME_ONLY) {
    if (!hasConfiguredValue(name)) {
      warnings.push(`Missing runtime-only variable (will be required at runtime): ${name}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
