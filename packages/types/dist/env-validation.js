/**
 * Environment Validation Utilities
 * Validates environment variables at startup with clear errors
 * Part of Phase 3: Environment Safety
 */
import { z } from "zod";
/**
 * Server-side environment schema
 * These should NEVER be exposed to the client
 */
export const serverEnvSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    ANON_KEY: z.string().min(1),
    SERVICE_ROLE_KEY: z.string().min(1),
    // Security
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    ENCRYPTION_KEY: z.string().min(16, "ENCRYPTION_KEY must be at least 16 characters"),
    // Redis
    REDIS_URL: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    // Email
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    // Monitoring
    SENTRY_DSN: z.string().url().optional(),
    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    // TigerBeetle (Financial Ledger)
    // Optional - graceful fallback to Postgres if not configured
    TIGERBEETLE_ENABLED: z
        .string()
        .default("false")
        .transform((val) => val === "true")
        .pipe(z.boolean()),
    TIGERBEETLE_ADDRESS: z.string().default("localhost:4300"),
    TIGERBEETLE_CLUSTER_ID: z
        .string()
        .default("0")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(0)),
    TIGERBEETLE_TIMEOUT_MS: z
        .string()
        .default("5000")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().positive()),
    TIGERBEETLE_MAX_RETRIES: z
        .string()
        .default("3")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(0).max(10)),
});
/**
 * Client-side environment schema
 * These MUST be prefixed with NEXT_PUBLIC_
 */
export const clientEnvSchema = z.object({
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});
/**
 * Combined environment schema for full validation
 */
export const fullEnvSchema = serverEnvSchema.merge(clientEnvSchema);
function formatZodErrors(issues) {
    return issues.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n");
}
/**
 * Validate server environment variables
 * Call this in server-only code (API routes, server components)
 */
export function validateServerEnv() {
    const result = serverEnvSchema.safeParse(process.env);
    if (!result.success) {
        const errors = formatZodErrors(result.error.issues);
        throw new Error(`Server environment validation failed:\n${errors}`);
    }
    return result.data;
}
/**
 * Validate client environment variables
 * Call this in client-side entry points
 */
export function validateClientEnv() {
    const result = clientEnvSchema.safeParse(process.env);
    if (!result.success) {
        const errors = formatZodErrors(result.error.issues);
        throw new Error(`Client environment validation failed:\n${errors}`);
    }
    return result.data;
}
/**
 * Validate all environment variables
 * Use this for comprehensive validation at startup
 */
export function validateEnv() {
    const result = fullEnvSchema.safeParse(process.env);
    if (!result.success) {
        const errors = formatZodErrors(result.error.issues);
        throw new Error(`Environment validation failed:\n${errors}`);
    }
    return result.data;
}
/**
 * Safe environment accessor that validates on first access
 */
class SafeEnv {
    cachedServerEnv = null;
    cachedClientEnv = null;
    get server() {
        if (!this.cachedServerEnv) {
            this.cachedServerEnv = validateServerEnv();
        }
        return this.cachedServerEnv;
    }
    get client() {
        if (!this.cachedClientEnv) {
            this.cachedClientEnv = validateClientEnv();
        }
        return this.cachedClientEnv;
    }
    get(key, defaultValue) {
        return process.env[key] ?? defaultValue;
    }
    /**
     * Check if running on server
     */
    get isServer() {
        return (typeof globalThis !== "undefined" &&
            typeof globalThis.window === "undefined");
    }
    /**
     * Check if running on client
     */
    get isClient() {
        return (typeof globalThis !== "undefined" &&
            typeof globalThis.window !== "undefined");
    }
}
export const safeEnv = new SafeEnv();
//# sourceMappingURL=env-validation.js.map