/**
 * Typed Environment Validation
 *
 * Provides server/client-safe schemas and validation helpers.
 * Use build/runtime modes to avoid failing builds on runtime-only variables.
 */

import { z } from "zod";

export const CLIENT_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
] as const;

export const SERVER_ENV_KEYS = [
  "NODE_ENV",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SUPABASE_DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const;

export const BUILD_REQUIRED_SERVER_KEYS = ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const;

export const RUNTIME_REQUIRED_SERVER_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
] as const;

export type ClientEnvKey = (typeof CLIENT_ENV_KEYS)[number];
export type ServerEnvKey = (typeof SERVER_ENV_KEYS)[number];

const clientEnvSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  })
  .strict();

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    DATABASE_URL: z.string().url().optional(),
    SUPABASE_DATABASE_URL: z.string().url().optional(),
    DIRECT_URL: z.string().url().optional(),
    JWT_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z
      .string()
      .refine((value: string) => value.length === 32 || value.length === 64, {
        message: "ENCRYPTION_KEY must be 32 or 64 characters",
      }),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
  })
  .strict()
  .superRefine((value: Record<string, string | undefined>, context: z.RefinementCtx) => {
    if (!value.DATABASE_URL && !value.SUPABASE_DATABASE_URL && !value.DIRECT_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "One of DATABASE_URL, SUPABASE_DATABASE_URL, or DIRECT_URL must be set",
      });
    }
  });

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue: z.ZodIssue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "env";
    return `${path}: ${issue.message}`;
  });
}

function pickEnv(
  input: NodeJS.ProcessEnv,
  keys: readonly string[]
): Record<string, string | undefined> {
  return keys.reduce<Record<string, string | undefined>>(
    (accumulator: Record<string, string | undefined>, key: string) => {
      accumulator[key] = input[key];
      return accumulator;
    },
    {}
  );
}

/**
 * Validate client environment variables.
 */
export function validateClientEnv(input: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const result = clientEnvSchema.safeParse(pickEnv(input, CLIENT_ENV_KEYS));
  if (!result.success) {
    return {
      valid: false,
      errors: formatZodErrors(result.error),
      warnings: [],
    };
  }

  return {
    valid: true,
    errors: [],
    warnings: [],
  };
}

/**
 * Validate server environment variables.
 */
export function validateServerEnv(
  mode: "build" | "runtime",
  input: NodeJS.ProcessEnv = process.env
): EnvValidationResult {
  const runtimeOptionalKeys: Partial<Record<ServerEnvKey, true>> = {
    SUPABASE_SERVICE_ROLE_KEY: true,
    JWT_SECRET: true,
    ENCRYPTION_KEY: true,
    STRIPE_SECRET_KEY: true,
    STRIPE_WEBHOOK_SECRET: true,
    RESEND_API_KEY: true,
    RESEND_FROM_EMAIL: true,
    DATABASE_URL: true,
    SUPABASE_DATABASE_URL: true,
    DIRECT_URL: true,
  };

  // partial() with refinements can throw in some runtimes. Fall back gracefully.
  // Use any to accommodate dynamic partial schemas which may differ in shape
  // between build/runtime modes due to optional keys and refinements
  let schema: any;
  if (mode === "build") {
    try {
      // Attempt to allow runtime-optional keys during build via partial
      schema = serverEnvSchema.partial(runtimeOptionalKeys);
    } catch (err) {
      // Fallback to full schema if partial() is not supported due to refinements
      schema = serverEnvSchema;
    }
  } else {
    schema = serverEnvSchema;
  }
  const result = (schema as any).safeParse(pickEnv(input, SERVER_ENV_KEYS));

  if (!result.success) {
    return {
      valid: false,
      errors: formatZodErrors(result.error),
      warnings: [],
    };
  }

  if (mode === "build") {
    const missingBuildKeys = BUILD_REQUIRED_SERVER_KEYS.filter(
      (key: (typeof BUILD_REQUIRED_SERVER_KEYS)[number]) => !input[key]
    );
    if (missingBuildKeys.length > 0) {
      return {
        valid: false,
        errors: missingBuildKeys.map((key) => `${key} is required during build`),
        warnings: [],
      };
    }

    const missingRuntimeKeys = RUNTIME_REQUIRED_SERVER_KEYS.filter(
      (key: (typeof RUNTIME_REQUIRED_SERVER_KEYS)[number]) => !input[key]
    );
    if (missingRuntimeKeys.length > 0) {
      return {
        valid: true,
        errors: [],
        warnings: missingRuntimeKeys.map((key) => `${key} is required at runtime`),
      };
    }
  }

  return {
    valid: true,
    errors: [],
    warnings: [],
  };
}

/**
 * Parse and return client environment variables.
 */
export function parseClientEnv(input: NodeJS.ProcessEnv = process.env): ClientEnv {
  return clientEnvSchema.parse(pickEnv(input, CLIENT_ENV_KEYS));
}

/**
 * Parse and return server environment variables.
 */
export function parseServerEnv(
  mode: "build" | "runtime",
  input: NodeJS.ProcessEnv = process.env
): ServerEnv {
  const runtimeOptionalKeys: Partial<Record<ServerEnvKey, true>> = {
    SUPABASE_SERVICE_ROLE_KEY: true,
    JWT_SECRET: true,
    ENCRYPTION_KEY: true,
    STRIPE_SECRET_KEY: true,
    STRIPE_WEBHOOK_SECRET: true,
    RESEND_API_KEY: true,
    RESEND_FROM_EMAIL: true,
    DATABASE_URL: true,
    SUPABASE_DATABASE_URL: true,
    DIRECT_URL: true,
  };

  // partial() with refinements can throw in some runtimes. Fall back gracefully.
  let schema: any;
  if (mode === "build") {
    try {
      schema = (serverEnvSchema as any).partial(runtimeOptionalKeys);
    } catch {
      schema = serverEnvSchema;
    }
  } else {
    schema = serverEnvSchema;
  }
  const result = (schema as any).parse(pickEnv(input, SERVER_ENV_KEYS));
  // Cast to ServerEnv - in runtime mode all required fields are validated
  return result as ServerEnv;
}

/**
 * Validate environment variable scopes for client/server separation.
 */
export function validateEnvScopes(): EnvValidationResult {
  const errors: string[] = [];

  for (const key of CLIENT_ENV_KEYS) {
    if (!key.startsWith("NEXT_PUBLIC_")) {
      errors.push(`Client env var ${key} must start with NEXT_PUBLIC_`);
    }
  }

  for (const key of SERVER_ENV_KEYS) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      errors.push(`Server env var ${key} must not start with NEXT_PUBLIC_`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}
