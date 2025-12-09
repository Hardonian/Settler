/**
 * Environment Variable Validation
 * Uses envalid for type-safe environment variable validation
 */
export declare const env: Readonly<{
    NODE_ENV: "development" | "test" | "production" | "staging" | "preview";
    PORT: number;
    HOST: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_SSL: boolean;
    DB_POOL_MIN: number;
    DB_POOL_MAX: number;
    DB_CONNECTION_TIMEOUT: number;
    DB_STATEMENT_TIMEOUT: number;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_URL: string | undefined;
    REDIS_PASSWORD: string | undefined;
    REDIS_TLS: boolean;
    JWT_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    JWT_REFRESH_SECRET: string | undefined;
    ENCRYPTION_KEY: string;
    RATE_LIMIT_DEFAULT: number;
    RATE_LIMIT_WINDOW_MS: number;
    WEBHOOK_MAX_RETRIES: number;
    WEBHOOK_INITIAL_DELAY: number;
    WEBHOOK_MAX_DELAY: number;
    DATA_RETENTION_DAYS: number;
    ALLOWED_ORIGINS: string;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    LOG_SAMPLING_RATE: number;
    SERVICE_NAME: string;
    OTLP_ENDPOINT: string | undefined;
    JAEGER_ENDPOINT: string | undefined;
    SENTRY_DSN: string | undefined;
    SENTRY_ENVIRONMENT: string | undefined;
    SENTRY_TRACES_SAMPLE_RATE: number;
    ENABLE_SCHEMA_PER_TENANT: boolean;
    ENABLE_REQUEST_TIMEOUT: boolean;
    ENABLE_API_DOCS: boolean;
    DEPLOYMENT_ENV: "production" | "staging" | "local";
    TRUST_PROXY: boolean;
    SECURE_COOKIES: boolean;
    METRICS_ENABLED: boolean;
    HEALTH_CHECK_ENABLED: boolean;
} & import("envalid").CleanedEnvAccessors>;
export declare const validatedConfig: {
    nodeEnv: "development" | "test" | "production" | "staging" | "preview";
    port: number;
    host: string;
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        ssl: boolean;
        poolMin: number;
        poolMax: number;
        connectionTimeout: number;
        statementTimeout: number;
    };
    redis: {
        host: string;
        port: number;
        url: string | undefined;
        password: string | undefined;
        tls: boolean;
    };
    jwt: {
        secret: string;
        accessTokenExpiry: string;
        refreshTokenExpiry: string;
        refreshSecret: string;
    };
    encryption: {
        key: string;
    };
    rateLimiting: {
        defaultLimit: number;
        windowMs: number;
    };
    webhook: {
        maxRetries: number;
        initialDelay: number;
        maxDelay: number;
    };
    dataRetention: {
        defaultDays: number;
    };
    allowedOrigins: string[];
    logging: {
        level: "error" | "warn" | "info" | "debug";
        samplingRate: number;
    };
    observability: {
        serviceName: string;
        otlpEndpoint: string | undefined;
        jaegerEndpoint: string | undefined;
    };
    sentry: {
        dsn: string | undefined;
        environment: string;
        tracesSampleRate: number;
    };
    features: {
        enableSchemaPerTenant: boolean;
        enableRequestTimeout: boolean;
        enableApiDocs: boolean;
    };
    deployment: {
        env: "production" | "staging" | "local";
    };
    security: {
        trustProxy: boolean;
        secureCookies: boolean;
    };
    monitoring: {
        metricsEnabled: boolean;
        healthCheckEnabled: boolean;
    };
};
//# sourceMappingURL=validation.d.ts.map