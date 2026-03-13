/**
 * Typed Environment Validation
 *
 * Provides server/client-safe schemas and validation helpers.
 * Use build/runtime modes to avoid failing builds on runtime-only variables.
 */
import { z } from "zod";
export declare const CLIENT_ENV_KEYS: readonly ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SENTRY_DSN"];
export declare const SERVER_ENV_KEYS: readonly ["NODE_ENV", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "SUPABASE_DATABASE_URL", "DIRECT_URL", "JWT_SECRET", "ENCRYPTION_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "RESEND_API_KEY", "RESEND_FROM_EMAIL"];
export declare const BUILD_REQUIRED_SERVER_KEYS: readonly ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
export declare const RUNTIME_REQUIRED_SERVER_KEYS: readonly ["SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "ENCRYPTION_KEY"];
export type ClientEnvKey = (typeof CLIENT_ENV_KEYS)[number];
export type ServerEnvKey = (typeof SERVER_ENV_KEYS)[number];
declare const clientEnvSchema: z.ZodObject<{
    NEXT_PUBLIC_SITE_URL: z.ZodString;
    NEXT_PUBLIC_APP_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.ZodString;
    NEXT_PUBLIC_SENTRY_DSN: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_SENTRY_DSN?: string | undefined;
}, {
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_SENTRY_DSN?: string | undefined;
}>;
declare const serverEnvSchema: z.ZodEffects<z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    SUPABASE_DATABASE_URL: z.ZodOptional<z.ZodString>;
    DIRECT_URL: z.ZodOptional<z.ZodString>;
    JWT_SECRET: z.ZodString;
    ENCRYPTION_KEY: z.ZodEffects<z.ZodString, string, string>;
    STRIPE_SECRET_KEY: z.ZodOptional<z.ZodString>;
    STRIPE_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    RESEND_FROM_EMAIL: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM_EMAIL?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    SUPABASE_DATABASE_URL?: string | undefined;
    DIRECT_URL?: string | undefined;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    DATABASE_URL?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM_EMAIL?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    SUPABASE_DATABASE_URL?: string | undefined;
    DIRECT_URL?: string | undefined;
}>, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM_EMAIL?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    SUPABASE_DATABASE_URL?: string | undefined;
    DIRECT_URL?: string | undefined;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    DATABASE_URL?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM_EMAIL?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    SUPABASE_DATABASE_URL?: string | undefined;
    DIRECT_URL?: string | undefined;
}>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export interface EnvValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare function validateClientEnv(input?: NodeJS.ProcessEnv, mode?: "build" | "runtime"): EnvValidationResult;
export declare function validateServerEnv(mode: "build" | "runtime", input?: NodeJS.ProcessEnv): EnvValidationResult;
export declare function validateEnvScopes(): EnvValidationResult;
export {};
//# sourceMappingURL=typed-env.d.ts.map