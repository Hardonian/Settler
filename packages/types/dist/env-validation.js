"use strict";
/**
 * Environment Validation Utilities
 * Validates environment variables at startup with clear errors
 * Part of Phase 3: Environment Safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeEnv = exports.fullEnvSchema = exports.clientEnvSchema = exports.serverEnvSchema = void 0;
exports.validateServerEnv = validateServerEnv;
exports.validateClientEnv = validateClientEnv;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
/**
 * Server-side environment schema
 * These should NEVER be exposed to the client
 */
exports.serverEnvSchema = zod_1.z.object({
    // Database
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    ANON_KEY: zod_1.z.string().min(1),
    SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    // Security
    JWT_SECRET: zod_1.z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    ENCRYPTION_KEY: zod_1.z.string().min(16, "ENCRYPTION_KEY must be at least 16 characters"),
    // Redis
    REDIS_URL: zod_1.z.string().optional(),
    UPSTASH_REDIS_REST_URL: zod_1.z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: zod_1.z.string().optional(),
    // Email
    RESEND_API_KEY: zod_1.z.string().min(1).optional(),
    RESEND_FROM_EMAIL: zod_1.z.string().email().optional(),
    // Monitoring
    SENTRY_DSN: zod_1.z.string().url().optional(),
    // Stripe
    STRIPE_SECRET_KEY: zod_1.z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().startsWith("whsec_").optional(),
    // TigerBeetle (Financial Ledger)
    // Optional - graceful fallback to Postgres if not configured
    TIGERBEETLE_ENABLED: zod_1.z
        .string()
        .default("false")
        .transform((val) => val === "true")
        .pipe(zod_1.z.boolean()),
    TIGERBEETLE_ADDRESS: zod_1.z.string().default("localhost:4300"),
    TIGERBEETLE_CLUSTER_ID: zod_1.z
        .string()
        .default("0")
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().int().min(0)),
    TIGERBEETLE_TIMEOUT_MS: zod_1.z
        .string()
        .default("5000")
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().int().positive()),
    TIGERBEETLE_MAX_RETRIES: zod_1.z
        .string()
        .default("3")
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().int().min(0).max(10)),
});
/**
 * Client-side environment schema
 * These MUST be prefixed with NEXT_PUBLIC_
 */
exports.clientEnvSchema = zod_1.z.object({
    NEXT_PUBLIC_SITE_URL: zod_1.z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SUPABASE_URL: zod_1.z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: zod_1.z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: zod_1.z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: zod_1.z.string().url().optional(),
});
/**
 * Combined environment schema for full validation
 */
exports.fullEnvSchema = exports.serverEnvSchema.merge(exports.clientEnvSchema);
function formatZodErrors(issues) {
    return issues.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n");
}
/**
 * Validate server environment variables
 * Call this in server-only code (API routes, server components)
 */
function validateServerEnv() {
    const result = exports.serverEnvSchema.safeParse(process.env);
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
function validateClientEnv() {
    const result = exports.clientEnvSchema.safeParse(process.env);
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
function validateEnv() {
    const result = exports.fullEnvSchema.safeParse(process.env);
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
exports.safeEnv = new SafeEnv();
//# sourceMappingURL=env-validation.js.map