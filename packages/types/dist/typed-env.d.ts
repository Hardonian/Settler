/**
 * Typed Environment Validation
 *
 * Provides server/client-safe schemas and validation helpers.
 * Use build/runtime modes to avoid failing builds on runtime-only variables.
 */
import { z } from "zod";
export declare const CLIENT_ENV_KEYS: readonly ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SENTRY_DSN"];
export declare const SERVER_ENV_KEYS: readonly ["NODE_ENV", "DATABASE_URL", "ANON_KEY", "SERVICE_ROLE_KEY", "DATABASE_URL", "SUPABASE_DATABASE_URL", "DIRECT_URL", "JWT_SECRET", "ENCRYPTION_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "TIGERBEETLE_ENABLED", "TIGERBEETLE_ADDRESS", "TIGERBEETLE_CLUSTER_ID", "TIGERBEETLE_TIMEOUT_MS", "TIGERBEETLE_MAX_RETRIES", "SUPABASE_AUTH_ENABLED", "SUPABASE_ENTERPRISE_SSO_ENABLED", "SUPABASE_ENTERPRISE_SSO_PROVIDER_ID", "SUPABASE_ENTERPRISE_SSO_DOMAIN", "OPENFGA_ENABLED", "OPENFGA_API_URL", "OPENFGA_STORE_ID", "OPENFGA_MODEL_ID", "OPENFGA_HEALTHCHECK_URL", "TEMPORAL_ENABLED", "TEMPORAL_WORKER_ENABLED", "TEMPORAL_ADDRESS", "TEMPORAL_NAMESPACE", "TEMPORAL_TASK_QUEUE", "OTEL_ENABLED", "OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_SERVICE_NAME", "NANGO_ENABLED", "NANGO_BASE_URL", "NANGO_SECRET_KEY", "NANGO_PROVIDER_CONFIGS_JSON", "AIRBYTE_ENABLED", "AIRBYTE_BASE_URL", "AIRBYTE_CLIENT_ID", "AIRBYTE_CLIENT_SECRET", "AIRBYTE_API_KEY", "AIRBYTE_WORKSPACE_ID"];
export declare const BUILD_REQUIRED_SERVER_KEYS: readonly ["DATABASE_URL", "ANON_KEY"];
export declare const RUNTIME_REQUIRED_SERVER_KEYS: readonly ["SERVICE_ROLE_KEY", "JWT_SECRET", "ENCRYPTION_KEY"];
export type ClientEnvKey = (typeof CLIENT_ENV_KEYS)[number];
export type ServerEnvKey = (typeof SERVER_ENV_KEYS)[number];
declare const clientEnvSchema: z.ZodObject<{
    NEXT_PUBLIC_SITE_URL: z.ZodString;
    NEXT_PUBLIC_APP_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.ZodString;
    NEXT_PUBLIC_SENTRY_DSN: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const serverEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
    }>>;
    DATABASE_URL: z.ZodString;
    ANON_KEY: z.ZodString;
    SERVICE_ROLE_KEY: z.ZodString;
    SUPABASE_DATABASE_URL: z.ZodOptional<z.ZodString>;
    DIRECT_URL: z.ZodOptional<z.ZodString>;
    JWT_SECRET: z.ZodString;
    ENCRYPTION_KEY: z.ZodString;
    STRIPE_SECRET_KEY: z.ZodOptional<z.ZodString>;
    STRIPE_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    RESEND_FROM_EMAIL: z.ZodOptional<z.ZodString>;
    TIGERBEETLE_ENABLED: z.ZodPipe<z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>>, z.ZodBoolean>;
    TIGERBEETLE_ADDRESS: z.ZodDefault<z.ZodString>;
    TIGERBEETLE_CLUSTER_ID: z.ZodPipe<z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>, z.ZodNumber>;
    TIGERBEETLE_TIMEOUT_MS: z.ZodPipe<z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>, z.ZodNumber>;
    TIGERBEETLE_MAX_RETRIES: z.ZodPipe<z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>, z.ZodNumber>;
    SUPABASE_AUTH_ENABLED: z.ZodOptional<z.ZodString>;
    SUPABASE_ENTERPRISE_SSO_ENABLED: z.ZodOptional<z.ZodString>;
    SUPABASE_ENTERPRISE_SSO_PROVIDER_ID: z.ZodOptional<z.ZodString>;
    SUPABASE_ENTERPRISE_SSO_DOMAIN: z.ZodOptional<z.ZodString>;
    OPENFGA_ENABLED: z.ZodOptional<z.ZodString>;
    OPENFGA_API_URL: z.ZodOptional<z.ZodString>;
    OPENFGA_STORE_ID: z.ZodOptional<z.ZodString>;
    OPENFGA_MODEL_ID: z.ZodOptional<z.ZodString>;
    OPENFGA_HEALTHCHECK_URL: z.ZodOptional<z.ZodString>;
    TEMPORAL_ENABLED: z.ZodOptional<z.ZodString>;
    TEMPORAL_WORKER_ENABLED: z.ZodOptional<z.ZodString>;
    TEMPORAL_ADDRESS: z.ZodOptional<z.ZodString>;
    TEMPORAL_NAMESPACE: z.ZodOptional<z.ZodString>;
    TEMPORAL_TASK_QUEUE: z.ZodOptional<z.ZodString>;
    OTEL_ENABLED: z.ZodOptional<z.ZodString>;
    OTEL_EXPORTER_OTLP_ENDPOINT: z.ZodOptional<z.ZodString>;
    OTEL_SERVICE_NAME: z.ZodOptional<z.ZodString>;
    NANGO_ENABLED: z.ZodOptional<z.ZodString>;
    NANGO_BASE_URL: z.ZodOptional<z.ZodString>;
    NANGO_SECRET_KEY: z.ZodOptional<z.ZodString>;
    NANGO_PROVIDER_CONFIGS_JSON: z.ZodOptional<z.ZodString>;
    AIRBYTE_ENABLED: z.ZodOptional<z.ZodString>;
    AIRBYTE_BASE_URL: z.ZodOptional<z.ZodString>;
    AIRBYTE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    AIRBYTE_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    AIRBYTE_API_KEY: z.ZodOptional<z.ZodString>;
    AIRBYTE_WORKSPACE_ID: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
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