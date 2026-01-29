/**
 * Environment Variable Utilities
 *
 * CTO Mode: Deployment Guardrails
 * - NEVER destructure process.env
 * - Treat all env vars as potentially undefined
 * - Throw errors early if missing (except during build for runtime-only vars)
 *
 * Uses build-time detection to skip validation for runtime-only variables during build.
 */
import { isBuildTime, RUNTIME_ONLY } from "./env-build-helper";

/**
 * Safe environment variable getter that never throws during render
 * Returns result object instead of throwing
 */
export interface EnvResult {
  ok: boolean;
  value: string;
  missing?: string[];
}

/**
 * Get environment variable safely (never throws)
 */
export function getEnvSafe(name: string, required = true): EnvResult {
  const value = process.env[name];
  const isBuild = isBuildTime();
  const isRuntimeOnly = (RUNTIME_ONLY as readonly string[]).includes(name);

  if (required && !value) {
    if (isBuild && isRuntimeOnly) {
      // Runtime-only vars are optional during build
      return { ok: true, value: "", missing: [name] };
    }

    if (!isBuild || !isRuntimeOnly) {
      return { ok: false, value: "", missing: [name] };
    }
  }

  return { ok: true, value: value ?? "" };
}

/**
 * Get environment variable with validation
 * Throws error if required variable is missing (skips during build for runtime-only vars)
 */
export function getEnv(name: string, required = true): string {
  const value = process.env[name];
  const isBuild = isBuildTime();
  const isRuntimeOnly = (RUNTIME_ONLY as readonly string[]).includes(name);
  
  // During build, runtime-only variables are optional (they'll be validated at runtime)
  if (required && !value) {
    if (isBuild && isRuntimeOnly) {
      // Runtime-only vars are optional during build - return empty string
      console.warn(`⚠️  Missing ${name} during build (will be required at runtime)`);
      return '';
    }
    
    // Build-time required vars or runtime validation
    if (!isBuild || !isRuntimeOnly) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
  
  return value ?? '';
}

    // Build-time required vars or runtime validation
    if (!isBuild || !isRuntimeOnly) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  return value || "";
}

/**
 * Get environment variable with default value
 */
export function getEnvWithDefault(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

/**
 * Get boolean environment variable
 */
export function getEnvBoolean(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Get number environment variable
 */
export function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate required environment variables for production
 * Skips validation for runtime-only variables during build time
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const isBuild = isBuildTime();

  // During build, only validate build-time required vars
  if (isBuild) {
    const buildRequired = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
    const errors: string[] = [];

    for (const name of buildRequired) {
      if (!process.env[name]) {
        errors.push(`Missing build-time required variable: ${name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  const errors: string[] = [];

  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

  for (const name of required) {
    if (!process.env[name]) {
      errors.push(`Missing required environment variable: ${name}`);
    }
  }

  // Validate JWT_SECRET length if set
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters");
  }

  // Validate ENCRYPTION_KEY length if set
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length !== 32 && encryptionKey.length !== 64) {
    errors.push("ENCRYPTION_KEY must be exactly 32 or 64 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
