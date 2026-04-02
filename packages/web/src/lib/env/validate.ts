/**
 * Environment Variable Validation
 *
 * Deployment guardrails for console and API surfaces.
 * Missing required groups are explicit and machine-visible.
 */

import { SUPABASE_ANON_KEY_KEYS, SUPABASE_URL_KEYS, hasConfiguredValue } from "./keys";
import { formatGroupKeys, resolveEnvGroup } from "./contract";

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

const CONSOLE_REQUIRED_GROUPS = [SUPABASE_URL_KEYS, SUPABASE_ANON_KEY_KEYS] as const;

/**
 * Validate required environment variables for console routes.
 * Returns validation result without throwing.
 */
export function validateConsoleEnv(): EnvValidationResult {
  const missing = CONSOLE_REQUIRED_GROUPS.filter((keys) => !resolveEnvGroup(keys).satisfied).map(
    (keys) => formatGroupKeys(keys)
  );

  const warnings: string[] = [];
  if (!hasConfiguredValue("DATABASE_URL")) {
    warnings.push("DATABASE_URL not set - Prisma-backed features may be unavailable");
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Assert required environment variables are present.
 */
export function assertConsoleEnv(): void {
  const validation = validateConsoleEnv();

  if (!validation.valid) {
    const errorMessage = [
      "Missing required environment variable groups:",
      ...validation.missing.map((key) => `  - ${key}`),
      "",
      "Set these in your deployment environment (Vercel for hosted builds/runs).",
      "See docs/setup/env-matrix.md for canonical ownership.",
    ].join("\n");

    throw new Error(errorMessage);
  }

  if (validation.warnings.length > 0) {
    console.warn("[Env Validation] Warnings:", validation.warnings.join(", "));
  }
}

export function isConsoleEnvConfigured(): boolean {
  return validateConsoleEnv().valid;
}
