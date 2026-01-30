/**
 * Centralized Environment Variable Schema
 * Single source of truth for all env vars with runtime validation
 * Based on ENV MATRIX from Technical Readiness Discovery Report
 */

import { z } from "zod";

/**
 * Build-Time Variables
 * Required during Next.js build process
 */
const buildEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PHASE: z.string().optional(),
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
});

/**
 * Critical Client Variables
 * Required for application to function
 */
const criticalClientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("https://settler.dev")
    .describe("Public site URL for metadata and canonical links"),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .describe("Application URL for API calls and redirects"),

  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine((url) => url.includes("supabase"), {
      message: "Must be a valid Supabase URL",
    })
    .describe("Supabase project URL"),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20)
    .describe("Supabase anonymous key (public, for client-side access)"),
});

/**
 * Server-Side Secrets
 * Required for server operations, never exposed to client
 */
const serverSecretsSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20)
    .describe("Supabase service role key for admin operations"),

  DATABASE_URL: z
    .string()
    .refine((url) => url.startsWith("postgresql://") || url.startsWith("postgres://"), {
      message: "Must be a valid PostgreSQL connection string",
    })
    .describe("Direct PostgreSQL connection string"),

  JWT_SECRET: z
    .string()
    .min(32)
    .default("dev-secret-change-in-production-min-32-chars")
    .describe("Secret for signing JWT tokens"),

  ENCRYPTION_KEY: z
    .string()
    .length(32)
    .default("dev-encryption-key-32-chars-!!!")
    .describe("32-character key for data encryption"),
});

/**
 * Billing & Payments (Optional with graceful degradation)
 */
const billingEnvSchema = z.object({
  STRIPE_SECRET_KEY: z
    .string()
    .refine((key) => key.startsWith("sk_"), {
      message: "Must be a valid Stripe secret key",
    })
    .optional()
    .describe("Stripe secret key for payment processing"),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .refine((secret) => secret.startsWith("whsec_"), {
      message: "Must be a valid Stripe webhook secret",
    })
    .optional()
    .describe("Stripe webhook signature verification secret"),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .refine((key) => key.startsWith("pk_"), {
      message: "Must be a valid Stripe publishable key",
    })
    .optional()
    .describe("Stripe publishable key for client-side checkout"),
});

/**
 * Email & Notifications (Optional)
 */
const emailEnvSchema = z.object({
  RESEND_API_KEY: z
    .string()
    .optional()
    .describe("Resend API key for transactional emails"),

  RESEND_FROM_EMAIL: z
    .string()
    .email()
    .default("noreply@settler.dev")
    .describe("From email address for transactional emails"),
});

/**
 * Monitoring & Observability (Optional)
 */
const monitoringEnvSchema = z.object({
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .describe("Sentry DSN for error tracking"),

  NEXT_PUBLIC_ENABLE_SENTRY: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true")
    .describe("Enable Sentry on client-side"),

  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

/**
 * Redis & Caching (Optional with fallbacks)
 */
const cacheEnvSchema = z.object({
  REDIS_URL: z
    .string()
    .default("redis://localhost:6379")
    .describe("Redis connection URL for job queues and caching"),

  UPSTASH_REDIS_REST_URL: z
    .string()
    .url()
    .optional()
    .describe("Upstash Redis REST URL for serverless Redis"),

  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .optional()
    .describe("Upstash Redis REST token"),
});

/**
 * AI & External Services (Optional)
 */
const externalServicesSchema = z.object({
  OPENAI_API_KEY: z
    .string()
    .optional()
    .describe("OpenAI API key for AI features"),

  BUILDER_API_KEY: z
    .string()
    .optional()
    .describe("Builder.io API key for visual page builder"),

  NEXT_PUBLIC_BUILDER_PUBLIC_KEY: z
    .string()
    .optional()
    .describe("Builder.io public key for client-side"),
});

/**
 * Full Environment Schema
 * Combines all sub-schemas
 */
export const envSchema = buildEnvSchema
  .merge(criticalClientEnvSchema)
  .merge(serverSecretsSchema)
  .merge(billingEnvSchema)
  .merge(emailEnvSchema)
  .merge(monitoringEnvSchema)
  .merge(cacheEnvSchema)
  .merge(externalServicesSchema);

export type Env = z.infer<typeof envSchema>;

/**
 * Client-Safe Environment Schema
 * Only variables prefixed with NEXT_PUBLIC_ can be accessed on client
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: envSchema.shape.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_APP_URL: envSchema.shape.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: envSchema.shape.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: envSchema.shape.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: envSchema.shape.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ENABLE_SENTRY: envSchema.shape.NEXT_PUBLIC_ENABLE_SENTRY,
  NEXT_PUBLIC_BUILDER_PUBLIC_KEY: envSchema.shape.NEXT_PUBLIC_BUILDER_PUBLIC_KEY,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate environment variables
 * Returns parsed and typed environment object
 */
export function validateEnv(): Env {
  const isBuildTime =
    process.env.NEXT_PHASE?.includes("build") ||
    (process.env.VERCEL === "1" && !process.env.VERCEL_ENV);

  try {
    const parsed = envSchema.parse(process.env);

    if (!isBuildTime) {
      console.log("✅ Environment validation passed");
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join(".");
        return `  - ${path}: ${err.message}`;
      });

      if (isBuildTime) {
        console.warn("⚠️  Environment variables not fully available during build:");
        console.warn(errors.join("\n"));
        // During build, return partial env with defaults
        return envSchema.parse({
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || "development",
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://settler.dev",
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        });
      } else {
        console.error("❌ Environment validation failed:");
        console.error(errors.join("\n"));
        throw new Error("Invalid environment variables");
      }
    }
    throw error;
  }
}

/**
 * Check if billing is enabled
 * Billing requires both Stripe keys to be set
 */
export function isBillingEnabled(env: Env): boolean {
  return !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

/**
 * Check if email is enabled
 */
export function isEmailEnabled(env: Env): boolean {
  return !!env.RESEND_API_KEY;
}

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(env: Env): boolean {
  return !!(env.SENTRY_DSN && env.NEXT_PUBLIC_ENABLE_SENTRY);
}
