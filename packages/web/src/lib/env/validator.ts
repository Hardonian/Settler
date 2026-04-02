/**
 * Environment Variable Validator
 *
 * Validates required environment variables at build/runtime and provides
 * friendly error messages instead of silent failures.
 *
 * Scale-Readiness: Centralized env access prevents silent failures at scale
 * and makes configuration auditing trivial.
 */

import { SUPABASE_ANON_KEY_KEYS, SUPABASE_URL_KEYS } from "./keys";
import { formatGroupKeys, resolveEnvGroup } from "./contract";

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  errors: Array<{ key: string; message: string }>;
}

/**
 * Typed environment configuration
 * Use this instead of direct process.env access to get:
 * - Type safety
 * - Clear missing var errors
 * - Single source of truth
 */
export interface AppEnv {
  // Node environment
  nodeEnv: "development" | "production" | "test";

  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };

  // Database
  database: {
    url: string;
    directUrl?: string;
  };

  // Public URLs
  public: {
    appUrl: string;
    aiasStudioUrl: string;
  };

  // Runtime
  runtime?: "nodejs" | "edge";

  // Vercel (optional)
  vercel?: boolean;
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

    if (!value || value.trim() === "") {
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
  const requiredGroups = [SUPABASE_URL_KEYS, SUPABASE_ANON_KEY_KEYS] as const;
  const missing = requiredGroups
    .filter((group) => !resolveEnvGroup(group).satisfied)
    .map((group) => formatGroupKeys(group));

  return {
    isValid: missing.length === 0,
    missing,
    errors: missing.map((key) => ({
      key,
      message: `Environment variable ${key} is required but not set`,
    })),
  };
}

/**
 * Get Supabase environment variables with validation
 * Throws if missing (for use in server components/actions)
 */
export function getSupabaseEnv(): {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
    if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY");

    throw new Error(`Missing required Supabase environment variables: ${missing.join(", ")}`);
  }

  return {
    url,
    anonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Get database URL with fallbacks
 * Throws if not found
 */
export function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL;

  if (!url) {
    throw new Error(
      "Missing database URL. Set one of: DATABASE_URL, SUPABASE_DATABASE_URL, or DIRECT_URL"
    );
  }

  return url;
}

/**
 * Get complete validated environment configuration
 * Prefer this over direct process.env access
 */
export function getEnv(): AppEnv {
  const supabase = getSupabaseEnv();

  return {
    nodeEnv: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
    supabase,
    database: {
      url: getDatabaseUrl(),
      directUrl: process.env.DIRECT_URL,
    },
    public: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      aiasStudioUrl: process.env.NEXT_PUBLIC_AIAS_STUDIO_URL || "https://aias.studio",
    },
    runtime: process.env.NEXT_RUNTIME as "nodejs" | "edge" | undefined,
    vercel: !!process.env.VERCEL,
  };
}

/**
 * Get environment variable with typed fallback
 * Use for optional vars that should have a default
 */
export function getEnvVar<T extends string>(key: string, fallback: T): string {
  return process.env[key] || fallback;
}

/**
 * Get required environment variable
 * Throws if missing - use for critical runtime config
 */
export function requireEnvVar(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Check if we're in a build context (where env vars might not be available)
 */
export function isBuildContext(): boolean {
  return (
    process.env.NODE_ENV === "production" && typeof window === "undefined" && !process.env.VERCEL
  );
}
