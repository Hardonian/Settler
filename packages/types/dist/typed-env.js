"use strict";
/**
 * Typed Environment Validation
 *
 * Provides server/client-safe schemas and validation helpers.
 * Use build/runtime modes to avoid failing builds on runtime-only variables.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUNTIME_REQUIRED_SERVER_KEYS = exports.BUILD_REQUIRED_SERVER_KEYS = exports.SERVER_ENV_KEYS = exports.CLIENT_ENV_KEYS = void 0;
exports.validateClientEnv = validateClientEnv;
exports.validateServerEnv = validateServerEnv;
exports.validateEnvScopes = validateEnvScopes;
const zod_1 = require("zod");
exports.CLIENT_ENV_KEYS = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
];
exports.SERVER_ENV_KEYS = [
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
];
exports.BUILD_REQUIRED_SERVER_KEYS = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
exports.RUNTIME_REQUIRED_SERVER_KEYS = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "ENCRYPTION_KEY",
];
const clientEnvSchema = zod_1.z
    .object({
    NEXT_PUBLIC_SITE_URL: zod_1.z.string().url(),
    NEXT_PUBLIC_APP_URL: zod_1.z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: zod_1.z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: zod_1.z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: zod_1.z.string().url().optional(),
})
    .strict();
const serverEnvSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    DATABASE_URL: zod_1.z.string().url().optional(),
    SUPABASE_DATABASE_URL: zod_1.z.string().url().optional(),
    DIRECT_URL: zod_1.z.string().url().optional(),
    JWT_SECRET: zod_1.z.string().min(32),
    ENCRYPTION_KEY: zod_1.z
        .string()
        .refine((value) => value.length === 32 || value.length === 64, {
        message: "ENCRYPTION_KEY must be 32 or 64 characters",
    }),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    RESEND_API_KEY: zod_1.z.string().optional(),
    RESEND_FROM_EMAIL: zod_1.z.string().email().optional(),
})
    .strict()
    .superRefine((value, context) => {
    if (!value.DATABASE_URL && !value.SUPABASE_DATABASE_URL && !value.DIRECT_URL) {
        context.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["DATABASE_URL"],
            message: "One of DATABASE_URL, SUPABASE_DATABASE_URL, or DIRECT_URL must be set",
        });
    }
});
const serverEnvBuildSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    SUPABASE_URL: zod_1.z.string().url().optional(),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1).optional(),
    DATABASE_URL: zod_1.z.string().url().optional(),
    SUPABASE_DATABASE_URL: zod_1.z.string().url().optional(),
    DIRECT_URL: zod_1.z.string().url().optional(),
    JWT_SECRET: zod_1.z.string().min(32).optional(),
    ENCRYPTION_KEY: zod_1.z
        .string()
        .refine((value) => value.length === 32 || value.length === 64, {
        message: "ENCRYPTION_KEY must be 32 or 64 characters",
    })
        .optional(),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    RESEND_API_KEY: zod_1.z.string().optional(),
    RESEND_FROM_EMAIL: zod_1.z.string().email().optional(),
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
function validateClientEnv(input = process.env, mode = "runtime") {
    const buildTime = mode === "build" || isBuildTime();
    const schema = buildTime ? clientEnvSchema.partial() : clientEnvSchema;
    const result = schema.safeParse(pickEnv(input, exports.CLIENT_ENV_KEYS));
    if (!result.success) {
        return {
            valid: false,
            errors: formatZodErrors(result.error),
            warnings: [],
        };
    }
    if (buildTime) {
        const missingClientKeys = exports.CLIENT_ENV_KEYS.filter((key) => !input[key]);
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
function validateServerEnv(mode, input = process.env) {
    const buildTime = mode === "build";
    const allowMissingBuildKeys = buildTime &&
        (input.SKIP_ENV_VALIDATION === "true" || input.CI === "true" || input.CI === "1");
    const schema = buildTime ? serverEnvBuildSchema : serverEnvSchema;
    const result = schema.safeParse(pickEnv(input, exports.SERVER_ENV_KEYS));
    if (!result.success) {
        return {
            valid: false,
            errors: formatZodErrors(result.error),
            warnings: [],
        };
    }
    if (buildTime) {
        const missingBuildKeys = exports.BUILD_REQUIRED_SERVER_KEYS.filter((key) => !input[key]);
        if (missingBuildKeys.length > 0) {
            return {
                valid: true,
                errors: [],
                warnings: missingBuildKeys.map((key) => allowMissingBuildKeys ? `${key} is required at runtime` : `${key} is required during build`),
            };
        }
        const missingRuntimeKeys = exports.RUNTIME_REQUIRED_SERVER_KEYS.filter((key) => !input[key]);
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
function validateEnvScopes() {
    const errors = [];
    const warnings = [];
    for (const key of exports.CLIENT_ENV_KEYS) {
        if (!key.startsWith("NEXT_PUBLIC_")) {
            errors.push(`Client env key ${key} must start with NEXT_PUBLIC_`);
        }
    }
    for (const key of exports.SERVER_ENV_KEYS) {
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