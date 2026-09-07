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
];
export const SERVER_ENV_KEYS = [
    "NODE_ENV",
    "DATABASE_URL",
    "ANON_KEY",
    "SERVICE_ROLE_KEY",
    "DATABASE_URL",
    "SUPABASE_DATABASE_URL",
    "DIRECT_URL",
    "JWT_SECRET",
    "ENCRYPTION_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    // TigerBeetle (Financial Ledger)
    "TIGERBEETLE_ENABLED",
    "TIGERBEETLE_ADDRESS",
    "TIGERBEETLE_CLUSTER_ID",
    "TIGERBEETLE_TIMEOUT_MS",
    "TIGERBEETLE_MAX_RETRIES",
    // External platform stack
    "SUPABASE_AUTH_ENABLED",
    "SUPABASE_ENTERPRISE_SSO_ENABLED",
    "SUPABASE_ENTERPRISE_SSO_PROVIDER_ID",
    "SUPABASE_ENTERPRISE_SSO_DOMAIN",
    "OPENFGA_ENABLED",
    "OPENFGA_API_URL",
    "OPENFGA_STORE_ID",
    "OPENFGA_MODEL_ID",
    "OPENFGA_HEALTHCHECK_URL",
    "TEMPORAL_ENABLED",
    "TEMPORAL_WORKER_ENABLED",
    "TEMPORAL_ADDRESS",
    "TEMPORAL_NAMESPACE",
    "TEMPORAL_TASK_QUEUE",
    "OTEL_ENABLED",
    "OTEL_EXPORTER_OTLP_ENDPOINT",
    "OTEL_SERVICE_NAME",
    "NANGO_ENABLED",
    "NANGO_BASE_URL",
    "NANGO_SECRET_KEY",
    "NANGO_PROVIDER_CONFIGS_JSON",
    "AIRBYTE_ENABLED",
    "AIRBYTE_BASE_URL",
    "AIRBYTE_CLIENT_ID",
    "AIRBYTE_CLIENT_SECRET",
    "AIRBYTE_API_KEY",
    "AIRBYTE_WORKSPACE_ID",
];
export const BUILD_REQUIRED_SERVER_KEYS = ["DATABASE_URL", "ANON_KEY"];
export const RUNTIME_REQUIRED_SERVER_KEYS = [
    "SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "ENCRYPTION_KEY",
];
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
    DATABASE_URL: z.string().url(),
    ANON_KEY: z.string().min(1),
    SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_DATABASE_URL: z.string().url().optional(),
    DIRECT_URL: z.string().url().optional(),
    JWT_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z
        .string()
        .refine((value) => value.length === 32 || value.length === 64, {
        message: "ENCRYPTION_KEY must be 32 or 64 characters",
    }),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
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
    SUPABASE_AUTH_ENABLED: z.string().optional(),
    SUPABASE_ENTERPRISE_SSO_ENABLED: z.string().optional(),
    SUPABASE_ENTERPRISE_SSO_PROVIDER_ID: z.string().optional(),
    SUPABASE_ENTERPRISE_SSO_DOMAIN: z.string().optional(),
    OPENFGA_ENABLED: z.string().optional(),
    OPENFGA_API_URL: z.string().url().optional(),
    OPENFGA_STORE_ID: z.string().optional(),
    OPENFGA_MODEL_ID: z.string().optional(),
    OPENFGA_HEALTHCHECK_URL: z.string().url().optional(),
    TEMPORAL_ENABLED: z.string().optional(),
    TEMPORAL_WORKER_ENABLED: z.string().optional(),
    TEMPORAL_ADDRESS: z.string().optional(),
    TEMPORAL_NAMESPACE: z.string().optional(),
    TEMPORAL_TASK_QUEUE: z.string().optional(),
    OTEL_ENABLED: z.string().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTEL_SERVICE_NAME: z.string().optional(),
    NANGO_ENABLED: z.string().optional(),
    NANGO_BASE_URL: z.string().url().optional(),
    NANGO_SECRET_KEY: z.string().optional(),
    NANGO_PROVIDER_CONFIGS_JSON: z.string().optional(),
    AIRBYTE_ENABLED: z.string().optional(),
    AIRBYTE_BASE_URL: z.string().url().optional(),
    AIRBYTE_CLIENT_ID: z.string().optional(),
    AIRBYTE_CLIENT_SECRET: z.string().optional(),
    AIRBYTE_API_KEY: z.string().optional(),
    AIRBYTE_WORKSPACE_ID: z.string().optional(),
})
    .strict()
    .superRefine((value, context) => {
    if (!value.DATABASE_URL && !value.SUPABASE_DATABASE_URL && !value.DIRECT_URL) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["DATABASE_URL"],
            message: "One of DATABASE_URL, SUPABASE_DATABASE_URL, or DIRECT_URL must be set",
        });
    }
});
const serverEnvBuildSchema = z
    .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    DATABASE_URL: z.string().url().optional(),
    SUPABASE_DATABASE_URL: z.string().url().optional(),
    DIRECT_URL: z.string().url().optional(),
    JWT_SECRET: z.string().min(32).optional(),
    ENCRYPTION_KEY: z
        .string()
        .refine((value) => value.length === 32 || value.length === 64, {
        message: "ENCRYPTION_KEY must be 32 or 64 characters",
    })
        .optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    SUPABASE_AUTH_ENABLED: z.string().optional(),
    SUPABASE_ENTERPRISE_SSO_ENABLED: z.string().optional(),
    SUPABASE_ENTERPRISE_SSO_PROVIDER_ID: z.string().optional(),
    SUPABASE_ENTERPRISE_SSO_DOMAIN: z.string().optional(),
    OPENFGA_ENABLED: z.string().optional(),
    OPENFGA_API_URL: z.string().url().optional(),
    OPENFGA_STORE_ID: z.string().optional(),
    OPENFGA_MODEL_ID: z.string().optional(),
    OPENFGA_HEALTHCHECK_URL: z.string().url().optional(),
    TEMPORAL_ENABLED: z.string().optional(),
    TEMPORAL_WORKER_ENABLED: z.string().optional(),
    TEMPORAL_ADDRESS: z.string().optional(),
    TEMPORAL_NAMESPACE: z.string().optional(),
    TEMPORAL_TASK_QUEUE: z.string().optional(),
    OTEL_ENABLED: z.string().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTEL_SERVICE_NAME: z.string().optional(),
    NANGO_ENABLED: z.string().optional(),
    NANGO_BASE_URL: z.string().url().optional(),
    NANGO_SECRET_KEY: z.string().optional(),
    NANGO_PROVIDER_CONFIGS_JSON: z.string().optional(),
    AIRBYTE_ENABLED: z.string().optional(),
    AIRBYTE_BASE_URL: z.string().url().optional(),
    AIRBYTE_CLIENT_ID: z.string().optional(),
    AIRBYTE_CLIENT_SECRET: z.string().optional(),
    AIRBYTE_API_KEY: z.string().optional(),
    AIRBYTE_WORKSPACE_ID: z.string().optional(),
})
    .strict();
function isBuildTime() {
    return (process.env.NEXT_PHASE === "phase-production-build" ||
        (process.env.NODE_ENV === "production" && !!process.env.VERCEL) ||
        process.env.SKIP_ENV_VALIDATION === "true" ||
        !!process.env.VERCEL_ENV ||
        process.env.CI === "true" ||
        process.env.CI === "1");
}
function formatZodErrors(error) {
    return error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "env";
        return `${path}: ${issue.message}`;
    });
}
function pickEnv(input, keys) {
    return keys.reduce((accumulator, key) => {
        accumulator[key] = input[key];
        return accumulator;
    }, {});
}
export function validateClientEnv(input = process.env, mode = "runtime") {
    const buildTime = mode === "build" || isBuildTime();
    const schema = buildTime ? clientEnvSchema.partial() : clientEnvSchema;
    const result = schema.safeParse(pickEnv(input, CLIENT_ENV_KEYS));
    if (!result.success) {
        return {
            valid: false,
            errors: formatZodErrors(result.error),
            warnings: [],
        };
    }
    if (buildTime) {
        const missingClientKeys = CLIENT_ENV_KEYS.filter((key) => !input[key]);
        if (missingClientKeys.length > 0) {
            return {
                valid: true,
                errors: [],
                warnings: missingClientKeys.map((key) => `${key} is required at runtime`),
            };
        }
    }
    return {
        valid: true,
        errors: [],
        warnings: [],
    };
}
export function validateServerEnv(mode, input = process.env) {
    const buildTime = mode === "build";
    const allowMissingBuildKeys = buildTime && (input.SKIP_ENV_VALIDATION === "true" || input.CI === "true" || input.CI === "1");
    const schema = buildTime ? serverEnvBuildSchema : serverEnvSchema;
    const result = schema.safeParse(pickEnv(input, SERVER_ENV_KEYS));
    if (!result.success) {
        return {
            valid: false,
            errors: formatZodErrors(result.error),
            warnings: [],
        };
    }
    if (buildTime) {
        const missingBuildKeys = BUILD_REQUIRED_SERVER_KEYS.filter((key) => !input[key]);
        if (missingBuildKeys.length > 0) {
            return {
                valid: true,
                errors: [],
                warnings: missingBuildKeys.map((key) => allowMissingBuildKeys
                    ? `${key} is required at runtime`
                    : `${key} is required during build`),
            };
        }
        const missingRuntimeKeys = RUNTIME_REQUIRED_SERVER_KEYS.filter((key) => !input[key]);
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
export function validateEnvScopes() {
    const errors = [];
    const warnings = [];
    for (const key of CLIENT_ENV_KEYS) {
        if (!key.startsWith("NEXT_PUBLIC_")) {
            errors.push(`Client env key ${key} must start with NEXT_PUBLIC_`);
        }
    }
    for (const key of SERVER_ENV_KEYS) {
        if (key.startsWith("NEXT_PUBLIC_")) {
            errors.push(`Server env key ${key} must not start with NEXT_PUBLIC_`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
//# sourceMappingURL=typed-env.js.map