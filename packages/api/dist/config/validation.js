"use strict";
/**
 * Environment Variable Validation
 * Uses envalid for type-safe environment variable validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatedConfig = exports.env = void 0;
const envalid_1 = require("envalid");
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    // Node Environment
    NODE_ENV: (0, envalid_1.str)({
        choices: ['development', 'test', 'production', 'staging', 'preview'],
        default: 'development',
    }),
    // Server Configuration
    PORT: (0, envalid_1.port)({ default: 3000 }),
    HOST: (0, envalid_1.host)({ default: '0.0.0.0' }),
    // Database Configuration
    DB_HOST: (0, envalid_1.host)({ default: 'localhost' }),
    DB_PORT: (0, envalid_1.port)({ default: 5432 }),
    DB_NAME: (0, envalid_1.str)({ default: 'settler' }),
    DB_USER: (0, envalid_1.str)({ default: 'postgres' }),
    DB_PASSWORD: (0, envalid_1.str)({ devDefault: 'postgres' }),
    DB_SSL: (0, envalid_1.bool)({ default: false }),
    DB_POOL_MIN: (0, envalid_1.num)({ default: 5 }),
    DB_POOL_MAX: (0, envalid_1.num)({ default: 20 }),
    DB_CONNECTION_TIMEOUT: (0, envalid_1.num)({ default: 2000 }),
    DB_STATEMENT_TIMEOUT: (0, envalid_1.num)({ default: 30000 }),
    // Redis Configuration
    REDIS_HOST: (0, envalid_1.host)({ default: 'localhost' }),
    REDIS_PORT: (0, envalid_1.port)({ default: 6379 }),
    REDIS_URL: (0, envalid_1.url)({ default: undefined }),
    REDIS_PASSWORD: (0, envalid_1.str)({ default: undefined }),
    REDIS_TLS: (0, envalid_1.bool)({ default: false }),
    // JWT Configuration
    JWT_SECRET: (0, envalid_1.str)({
        devDefault: 'dev-secret-change-in-production',
        desc: 'Secret key for JWT token signing',
    }),
    JWT_ACCESS_EXPIRY: (0, envalid_1.str)({ default: '15m' }),
    JWT_REFRESH_EXPIRY: (0, envalid_1.str)({ default: '7d' }),
    JWT_REFRESH_SECRET: (0, envalid_1.str)({
        devDefault: undefined,
        desc: 'Optional separate secret for refresh tokens',
    }),
    // Encryption Configuration
    ENCRYPTION_KEY: (0, envalid_1.str)({
        devDefault: 'dev-encryption-key-32-chars-long!!',
        desc: '32-byte key for AES-256-GCM encryption',
    }),
    // Rate Limiting
    RATE_LIMIT_DEFAULT: (0, envalid_1.num)({ default: 1000 }),
    RATE_LIMIT_WINDOW_MS: (0, envalid_1.num)({ default: 900000 }), // 15 minutes
    // Webhook Configuration
    WEBHOOK_MAX_RETRIES: (0, envalid_1.num)({ default: 5 }),
    WEBHOOK_INITIAL_DELAY: (0, envalid_1.num)({ default: 2000 }),
    WEBHOOK_MAX_DELAY: (0, envalid_1.num)({ default: 32000 }),
    // Data Retention
    DATA_RETENTION_DAYS: (0, envalid_1.num)({ default: 365 }),
    // CORS Configuration
    ALLOWED_ORIGINS: (0, envalid_1.str)({
        default: '*',
        desc: 'Comma-separated list of allowed origins',
    }),
    // Logging Configuration
    LOG_LEVEL: (0, envalid_1.str)({
        choices: ['error', 'warn', 'info', 'debug'],
        default: 'info',
    }),
    LOG_SAMPLING_RATE: (0, envalid_1.num)({ default: 1.0 }),
    // Observability Configuration
    SERVICE_NAME: (0, envalid_1.str)({ default: 'settler-api' }),
    OTLP_ENDPOINT: (0, envalid_1.url)({ default: undefined }),
    JAEGER_ENDPOINT: (0, envalid_1.url)({ default: undefined }),
    // Sentry Configuration
    SENTRY_DSN: (0, envalid_1.url)({ default: undefined }),
    SENTRY_ENVIRONMENT: (0, envalid_1.str)({ default: undefined }),
    SENTRY_TRACES_SAMPLE_RATE: (0, envalid_1.num)({ default: 0.1 }),
    // Feature Flags
    ENABLE_SCHEMA_PER_TENANT: (0, envalid_1.bool)({ default: false }),
    ENABLE_REQUEST_TIMEOUT: (0, envalid_1.bool)({ default: true }),
    ENABLE_API_DOCS: (0, envalid_1.bool)({ default: true }),
    // Deployment Configuration
    DEPLOYMENT_ENV: (0, envalid_1.str)({
        choices: ['local', 'staging', 'production'],
        default: 'local',
    }),
    // Security Configuration
    TRUST_PROXY: (0, envalid_1.bool)({ default: false }),
    SECURE_COOKIES: (0, envalid_1.bool)({ default: false }),
    // Monitoring Configuration
    METRICS_ENABLED: (0, envalid_1.bool)({ default: true }),
    HEALTH_CHECK_ENABLED: (0, envalid_1.bool)({ default: true }),
});
// Validate encryption key length in production and preview
if (exports.env.NODE_ENV === 'production' || exports.env.NODE_ENV === 'preview') {
    if (!exports.env.ENCRYPTION_KEY || exports.env.ENCRYPTION_KEY.length !== 32) {
        throw new Error(`ENCRYPTION_KEY must be exactly 32 characters in ${exports.env.NODE_ENV}`);
    }
    if (!exports.env.JWT_SECRET || exports.env.JWT_SECRET === 'dev-secret-change-in-production') {
        throw new Error(`JWT_SECRET must be set to a secure random value in ${exports.env.NODE_ENV}`);
    }
    if (exports.env.ALLOWED_ORIGINS === '*') {
        console.warn(`WARNING: CORS allows all origins in ${exports.env.NODE_ENV}. Consider restricting ALLOWED_ORIGINS.`);
    }
}
// Export validated config
exports.validatedConfig = {
    nodeEnv: exports.env.NODE_ENV,
    port: exports.env.PORT,
    host: exports.env.HOST,
    database: {
        host: exports.env.DB_HOST,
        port: exports.env.DB_PORT,
        name: exports.env.DB_NAME,
        user: exports.env.DB_USER,
        password: exports.env.DB_PASSWORD,
        ssl: exports.env.DB_SSL,
        poolMin: exports.env.DB_POOL_MIN,
        poolMax: exports.env.DB_POOL_MAX,
        connectionTimeout: exports.env.DB_CONNECTION_TIMEOUT,
        statementTimeout: exports.env.DB_STATEMENT_TIMEOUT,
    },
    redis: {
        host: exports.env.REDIS_HOST,
        port: exports.env.REDIS_PORT,
        url: exports.env.REDIS_URL,
        password: exports.env.REDIS_PASSWORD,
        tls: exports.env.REDIS_TLS,
    },
    jwt: {
        secret: exports.env.JWT_SECRET,
        accessTokenExpiry: exports.env.JWT_ACCESS_EXPIRY,
        refreshTokenExpiry: exports.env.JWT_REFRESH_EXPIRY,
        refreshSecret: exports.env.JWT_REFRESH_SECRET || exports.env.JWT_SECRET,
    },
    encryption: {
        key: exports.env.ENCRYPTION_KEY,
    },
    rateLimiting: {
        defaultLimit: exports.env.RATE_LIMIT_DEFAULT,
        windowMs: exports.env.RATE_LIMIT_WINDOW_MS,
    },
    webhook: {
        maxRetries: exports.env.WEBHOOK_MAX_RETRIES,
        initialDelay: exports.env.WEBHOOK_INITIAL_DELAY,
        maxDelay: exports.env.WEBHOOK_MAX_DELAY,
    },
    dataRetention: {
        defaultDays: exports.env.DATA_RETENTION_DAYS,
    },
    allowedOrigins: exports.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
    logging: {
        level: exports.env.LOG_LEVEL,
        samplingRate: exports.env.LOG_SAMPLING_RATE,
    },
    observability: {
        serviceName: exports.env.SERVICE_NAME,
        otlpEndpoint: exports.env.OTLP_ENDPOINT,
        jaegerEndpoint: exports.env.JAEGER_ENDPOINT,
    },
    sentry: {
        dsn: exports.env.SENTRY_DSN,
        environment: exports.env.SENTRY_ENVIRONMENT || exports.env.NODE_ENV,
        tracesSampleRate: exports.env.SENTRY_TRACES_SAMPLE_RATE,
    },
    features: {
        enableSchemaPerTenant: exports.env.ENABLE_SCHEMA_PER_TENANT,
        enableRequestTimeout: exports.env.ENABLE_REQUEST_TIMEOUT,
        enableApiDocs: exports.env.ENABLE_API_DOCS,
    },
    deployment: {
        env: exports.env.DEPLOYMENT_ENV,
    },
    security: {
        trustProxy: exports.env.TRUST_PROXY,
        secureCookies: exports.env.SECURE_COOKIES,
    },
    monitoring: {
        metricsEnabled: exports.env.METRICS_ENABLED,
        healthCheckEnabled: exports.env.HEALTH_CHECK_ENABLED,
    },
};
//# sourceMappingURL=validation.js.map