/**
 * Environment Variable Validation
 * Uses envalid for type-safe environment variable validation
 */

import { cleanEnv, str, num, url, bool, host, port } from 'envalid';

export const env = cleanEnv(process.env, {
  // Node Environment
  NODE_ENV: str({ 
    choices: ['development', 'test', 'production', 'staging', 'preview'],
    default: 'development',
  }),

  // Server Configuration
  PORT: port({ default: 3000 }),
  HOST: host({ default: '0.0.0.0' }),
  
  // Database Configuration
  DB_HOST: host({ default: 'localhost' }),
  DB_PORT: port({ default: 5432 }),
  DB_NAME: str({ default: 'settler' }),
  DB_USER: str({ default: 'postgres' }),
  DB_PASSWORD: str({ devDefault: 'postgres' }),
  DB_SSL: bool({ default: false }),
  DB_POOL_MIN: num({ default: 5 }),
  DB_POOL_MAX: num({ default: 20 }),
  DB_CONNECTION_TIMEOUT: num({ default: 2000 }),
  DB_STATEMENT_TIMEOUT: num({ default: 30000 }),
  
  // Redis Configuration
  REDIS_HOST: host({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_URL: url({ default: undefined }),
  REDIS_PASSWORD: str({ default: undefined }),
  REDIS_TLS: bool({ default: false }),
  
  // JWT Configuration
  JWT_SECRET: str({ 
    devDefault: 'dev-secret-change-in-production',
    desc: 'Secret key for JWT token signing',
  }),
  JWT_ACCESS_EXPIRY: str({ default: '15m' }),
  JWT_REFRESH_EXPIRY: str({ default: '7d' }),
  JWT_REFRESH_SECRET: str({ 
    devDefault: undefined,
    desc: 'Optional separate secret for refresh tokens',
  }),
  
  // Encryption Configuration
  ENCRYPTION_KEY: str({ 
    devDefault: 'dev-encryption-key-32-chars-long!!',
    desc: '32-byte key for AES-256-GCM encryption',
  }),
  
  // Rate Limiting
  RATE_LIMIT_DEFAULT: num({ default: 1000 }),
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }), // 15 minutes
  
  // Webhook Configuration
  WEBHOOK_MAX_RETRIES: num({ default: 5 }),
  WEBHOOK_INITIAL_DELAY: num({ default: 2000 }),
  WEBHOOK_MAX_DELAY: num({ default: 32000 }),
  
  // Data Retention
  DATA_RETENTION_DAYS: num({ default: 365 }),
  
  // CORS Configuration
  ALLOWED_ORIGINS: str({ 
    default: '*',
    desc: 'Comma-separated list of allowed origins',
  }),
  
  // Logging Configuration
  LOG_LEVEL: str({ 
    choices: ['error', 'warn', 'info', 'debug'],
    default: 'info',
  }),
  LOG_SAMPLING_RATE: num({ default: 1.0 }),
  
  // Observability Configuration
  SERVICE_NAME: str({ default: 'settler-api' }),
  OTLP_ENDPOINT: url({ default: undefined }),
  JAEGER_ENDPOINT: url({ default: undefined }),
  
  // Sentry Configuration
  SENTRY_DSN: url({ default: undefined }),
  SENTRY_ENVIRONMENT: str({ default: undefined }),
  SENTRY_TRACES_SAMPLE_RATE: num({ default: 0.1 }),
  
  // Feature Flags
  ENABLE_SCHEMA_PER_TENANT: bool({ default: false }),
  ENABLE_REQUEST_TIMEOUT: bool({ default: true }),
  ENABLE_API_DOCS: bool({ default: true }),
  
  // Deployment Configuration
  DEPLOYMENT_ENV: str({ 
    choices: ['local', 'staging', 'production'],
    default: 'local',
  }),
  
  // Security Configuration
  TRUST_PROXY: bool({ default: false }),
  SECURE_COOKIES: bool({ default: false }),
  
  // Monitoring Configuration
  METRICS_ENABLED: bool({ default: true }),
  HEALTH_CHECK_ENABLED: bool({ default: true }),
});

// Validate encryption key length in production and preview
if (env.NODE_ENV === 'production' || env.NODE_ENV === 'preview') {
  if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 characters in ${env.NODE_ENV}`);
  }
  
  if (!env.JWT_SECRET || env.JWT_SECRET === 'dev-secret-change-in-production') {
    throw new Error(`JWT_SECRET must be set to a secure random value in ${env.NODE_ENV}`);
  }
  
  if (env.ALLOWED_ORIGINS === '*') {
    console.warn(`WARNING: CORS allows all origins in ${env.NODE_ENV}. Consider restricting ALLOWED_ORIGINS.`);
  }
}

// Export validated config
export const validatedConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
    poolMin: env.DB_POOL_MIN,
    poolMax: env.DB_POOL_MAX,
    connectionTimeout: env.DB_CONNECTION_TIMEOUT,
    statementTimeout: env.DB_STATEMENT_TIMEOUT,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    tls: env.REDIS_TLS,
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessTokenExpiry: env.JWT_ACCESS_EXPIRY,
    refreshTokenExpiry: env.JWT_REFRESH_EXPIRY,
    refreshSecret: env.JWT_REFRESH_SECRET || env.JWT_SECRET,
  },
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
  rateLimiting: {
    defaultLimit: env.RATE_LIMIT_DEFAULT,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  },
  webhook: {
    maxRetries: env.WEBHOOK_MAX_RETRIES,
    initialDelay: env.WEBHOOK_INITIAL_DELAY,
    maxDelay: env.WEBHOOK_MAX_DELAY,
  },
  dataRetention: {
    defaultDays: env.DATA_RETENTION_DAYS,
  },
  allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
  logging: {
    level: env.LOG_LEVEL,
    samplingRate: env.LOG_SAMPLING_RATE,
  },
  observability: {
    serviceName: env.SERVICE_NAME,
    otlpEndpoint: env.OTLP_ENDPOINT,
    jaegerEndpoint: env.JAEGER_ENDPOINT,
  },
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  },
  features: {
    enableSchemaPerTenant: env.ENABLE_SCHEMA_PER_TENANT,
    enableRequestTimeout: env.ENABLE_REQUEST_TIMEOUT,
    enableApiDocs: env.ENABLE_API_DOCS,
  },
  deployment: {
    env: env.DEPLOYMENT_ENV,
  },
  security: {
    trustProxy: env.TRUST_PROXY,
    secureCookies: env.SECURE_COOKIES,
  },
  monitoring: {
    metricsEnabled: env.METRICS_ENABLED,
    healthCheckEnabled: env.HEALTH_CHECK_ENABLED,
  },
};
