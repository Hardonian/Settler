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
export declare const serverEnvSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    JWT_SECRET: z.ZodString;
    ENCRYPTION_KEY: z.ZodString;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    UPSTASH_REDIS_REST_URL: z.ZodOptional<z.ZodString>;
    UPSTASH_REDIS_REST_TOKEN: z.ZodOptional<z.ZodString>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    RESEND_FROM_EMAIL: z.ZodOptional<z.ZodString>;
    SENTRY_DSN: z.ZodOptional<z.ZodString>;
    STRIPE_SECRET_KEY: z.ZodOptional<z.ZodString>;
    STRIPE_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    TIGERBEETLE_ENABLED: z.ZodPipeline<z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>, z.ZodBoolean>;
    TIGERBEETLE_ADDRESS: z.ZodDefault<z.ZodString>;
    TIGERBEETLE_CLUSTER_ID: z.ZodPipeline<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>, z.ZodNumber>;
    TIGERBEETLE_TIMEOUT_MS: z.ZodPipeline<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>, z.ZodNumber>;
    TIGERBEETLE_MAX_RETRIES: z.ZodPipeline<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    TIGERBEETLE_ENABLED: boolean;
    TIGERBEETLE_ADDRESS: string;
    TIGERBEETLE_CLUSTER_ID: number;
    TIGERBEETLE_TIMEOUT_MS: number;
    TIGERBEETLE_MAX_RETRIES: number;
    REDIS_URL?: string | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM_EMAIL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
}, {
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    REDIS_URL?: string | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM_EMAIL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    TIGERBEETLE_ENABLED?: string | undefined;
    TIGERBEETLE_ADDRESS?: string | undefined;
    TIGERBEETLE_CLUSTER_ID?: string | undefined;
    TIGERBEETLE_TIMEOUT_MS?: string | undefined;
    TIGERBEETLE_MAX_RETRIES?: string | undefined;
}>;
/**
 * Client-side environment schema
 * These MUST be prefixed with NEXT_PUBLIC_
 */
export declare const clientEnvSchema: z.ZodObject<{
    NEXT_PUBLIC_SITE_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_SUPABASE_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.ZodString;
    NEXT_PUBLIC_SENTRY_DSN: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_APP_URL: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NEXT_PUBLIC_SENTRY_DSN?: string | undefined;
    NEXT_PUBLIC_APP_URL?: string | undefined;
}, {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NEXT_PUBLIC_SITE_URL?: string | undefined;
    NEXT_PUBLIC_SENTRY_DSN?: string | undefined;
    NEXT_PUBLIC_APP_URL?: string | undefined;
}>;
/**
 * Combined environment schema for full validation
 */
export declare const fullEnvSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    JWT_SECRET: z.ZodString;
    ENCRYPTION_KEY: z.ZodString;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    UPSTASH_REDIS_REST_URL: z.ZodOptional<z.ZodString>;
    UPSTASH_REDIS_REST_TOKEN: z.ZodOptional<z.ZodString>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    RESEND_FROM_EMAIL: z.ZodOptional<z.ZodString>;
    SENTRY_DSN: z.ZodOptional<z.ZodString>;
    STRIPE_SECRET_KEY: z.ZodOptional<z.ZodString>;
    STRIPE_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    TIGERBEETLE_ENABLED: z.ZodPipeline<z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>, z.ZodBoolean>;
    TIGERBEETLE_ADDRESS: z.ZodDefault<z.ZodString>;
    TIGERBEETLE_CLUSTER_ID: z.ZodPipeline<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>, z.ZodNumber>;
    TIGERBEETLE_TIMEOUT_MS: z.ZodPipeline<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>, z.ZodNumber>;
    TIGERBEETLE_MAX_RETRIES: z.ZodPipeline<z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>, z.ZodNumber>;
} & {
    NEXT_PUBLIC_SITE_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_SUPABASE_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.ZodString;
    NEXT_PUBLIC_SENTRY_DSN: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_APP_URL: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    TIGERBEETLE_ENABLED: boolean;
    TIGERBEETLE_ADDRESS: string;
    TIGERBEETLE_CLUSTER_ID: number;
    TIGERBEETLE_TIMEOUT_MS: number;
    TIGERBEETLE_MAX_RETRIES: number;
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    REDIS_URL?: string | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM_EMAIL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    NEXT_PUBLIC_SENTRY_DSN?: string | undefined;
    NEXT_PUBLIC_APP_URL?: string | undefined;
}, {
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    REDIS_URL?: string | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM_EMAIL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    TIGERBEETLE_ENABLED?: string | undefined;
    TIGERBEETLE_ADDRESS?: string | undefined;
    TIGERBEETLE_CLUSTER_ID?: string | undefined;
    TIGERBEETLE_TIMEOUT_MS?: string | undefined;
    TIGERBEETLE_MAX_RETRIES?: string | undefined;
    NEXT_PUBLIC_SITE_URL?: string | undefined;
    NEXT_PUBLIC_SENTRY_DSN?: string | undefined;
    NEXT_PUBLIC_APP_URL?: string | undefined;
}>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type FullEnv = z.infer<typeof fullEnvSchema>;
/**
 * Validate server environment variables
 * Call this in server-only code (API routes, server components)
 */
export declare function validateServerEnv(): ServerEnv;
/**
 * Validate client environment variables
 * Call this in client-side entry points
 */
export declare function validateClientEnv(): ClientEnv;
/**
 * Validate all environment variables
 * Use this for comprehensive validation at startup
 */
export declare function validateEnv(): FullEnv;
/**
 * Safe environment accessor that validates on first access
 */
declare class SafeEnv {
    private cachedServerEnv;
    private cachedClientEnv;
    get server(): ServerEnv;
    get client(): ClientEnv;
    /**
     * Get a specific environment variable with optional default
     */
    get<K extends keyof ServerEnv>(key: K): ServerEnv[K];
    get<K extends keyof ClientEnv>(key: K): ClientEnv[K];
    get(key: string, defaultValue?: string): string | undefined;
    /**
     * Check if running on server
     */
    get isServer(): boolean;
    /**
     * Check if running on client
     */
    get isClient(): boolean;
}
export declare const safeEnv: SafeEnv;
export {};
//# sourceMappingURL=env-validation.d.ts.map