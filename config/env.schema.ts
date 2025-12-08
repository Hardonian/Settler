/**
 * Environment Variable Schema
 * 
 * Canonical specification of all environment variables used across the Settler platform.
 * This schema is used for validation, documentation, and CI/CD checks.
 * 
 * Categories:
 * - Core: Required for application boot
 * - Database: PostgreSQL/Supabase configuration
 * - Redis: Upstash Redis configuration
 * - Security: JWT, encryption, API keys
 * - Observability: Sentry, OpenTelemetry
 * - Feature Flags: Toggle features
 * - Third-party: External service integrations
 * - CI/CD: GitHub Actions, Vercel deployment
 */

export interface EnvVarSpec {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'port' | 'host' | 'email';
  required: boolean;
  scope: 'build-time' | 'runtime' | 'both' | 'ci-only';
  exposure: 'server-only' | 'client' | 'public' | 'ci-only';
  criticality: 'required-for-boot' | 'required-for-feature' | 'optional' | 'feature-flag';
  environments: ('local' | 'development' | 'preview' | 'staging' | 'production')[];
  defaultValue?: string | number | boolean;
  format?: string; // Expected format description (e.g., "HTTPS URL", "Bearer token", "32 chars")
  validator?: (value: string) => boolean;
  secret: boolean; // Whether this contains sensitive data
  platforms: ('github' | 'vercel' | 'supabase' | 'sentry' | 'local' | 'docker')[];
  notes?: string;
}

export const ENV_VAR_SCHEMA: EnvVarSpec[] = [
  // ============================================================================
  // CORE CONFIGURATION
  // ============================================================================
  {
    name: 'NODE_ENV',
    description: 'Node.js environment mode',
    type: 'string',
    required: true,
    scope: 'both',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['local', 'development', 'preview', 'staging', 'production'],
    defaultValue: 'development',
    format: 'development | test | production | staging',
    secret: false,
    platforms: ['github', 'vercel', 'local', 'docker'],
  },
  {
    name: 'DEPLOYMENT_ENV',
    description: 'Deployment environment identifier',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['local', 'development', 'preview', 'staging', 'production'],
    defaultValue: 'local',
    format: 'local | staging | production',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'PORT',
    description: 'Server port number',
    type: 'port',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['local', 'development', 'preview', 'staging', 'production'],
    defaultValue: 3000,
    secret: false,
    platforms: ['github', 'vercel', 'local', 'docker'],
  },
  {
    name: 'HOST',
    description: 'Server host address',
    type: 'host',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['local', 'development'],
    defaultValue: '0.0.0.0',
    secret: false,
    platforms: ['local', 'docker'],
  },

  // ============================================================================
  // DATABASE CONFIGURATION (Supabase/PostgreSQL)
  // ============================================================================
  {
    name: 'SUPABASE_URL',
    description: 'Supabase project URL',
    type: 'url',
    required: true,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'HTTPS URL (https://your-project.supabase.co)',
    secret: false,
    platforms: ['github', 'vercel', 'supabase', 'local'],
    notes: 'Required for Supabase integration. Falls back to DB_HOST if not set.',
  },
  {
    name: 'SUPABASE_ANON_KEY',
    description: 'Supabase anonymous/public key',
    type: 'string',
    required: true,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'JWT token (eyJ...)',
    secret: true,
    platforms: ['github', 'vercel', 'supabase', 'local'],
    notes: 'Public key safe for client-side use. Server uses service role key for admin operations.',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (admin access)',
    type: 'string',
    required: true,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-feature',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'JWT token (eyJ...)',
    secret: true,
    platforms: ['github', 'vercel', 'supabase', 'local'],
    notes: 'NEVER expose to client. Required for admin operations, RLS bypass, Edge Functions.',
  },
  {
    name: 'SUPABASE_REALTIME_EVENTS_PER_SECOND',
    description: 'Rate limit for Supabase Realtime events',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 10,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'DB_HOST',
    description: 'PostgreSQL host (fallback if Supabase not used)',
    type: 'host',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['local', 'development'],
    defaultValue: 'localhost',
    secret: false,
    platforms: ['local', 'docker'],
    notes: 'Fallback when SUPABASE_URL not set. Used for local development.',
  },
  {
    name: 'DB_PORT',
    description: 'PostgreSQL port',
    type: 'port',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['local', 'development'],
    defaultValue: 5432,
    secret: false,
    platforms: ['local', 'docker'],
  },
  {
    name: 'DB_NAME',
    description: 'PostgreSQL database name',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['local', 'development'],
    defaultValue: 'settler',
    secret: false,
    platforms: ['local', 'docker'],
  },
  {
    name: 'DB_USER',
    description: 'PostgreSQL username',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['local', 'development'],
    defaultValue: 'postgres',
    secret: false,
    platforms: ['local', 'docker'],
  },
  {
    name: 'DB_PASSWORD',
    description: 'PostgreSQL password',
    type: 'string',
    required: true,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['local', 'development', 'preview', 'staging', 'production'],
    format: 'Min 8 characters',
    secret: true,
    platforms: ['github', 'vercel', 'local', 'docker'],
    validator: (v) => v.length >= 8,
  },
  {
    name: 'DB_SSL',
    description: 'Enable SSL for PostgreSQL connection',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: false,
    secret: false,
    platforms: ['github', 'vercel'],
  },
  {
    name: 'DB_POOL_MIN',
    description: 'Minimum database connection pool size',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 5,
    secret: false,
    platforms: ['github', 'vercel'],
  },
  {
    name: 'DB_POOL_MAX',
    description: 'Maximum database connection pool size',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 20,
    secret: false,
    platforms: ['github', 'vercel'],
  },
  {
    name: 'DB_CONNECTION_TIMEOUT',
    description: 'Database connection timeout (ms)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 2000,
    secret: false,
    platforms: ['github', 'vercel'],
  },
  {
    name: 'DB_STATEMENT_TIMEOUT',
    description: 'Database statement timeout (ms)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 30000,
    secret: false,
    platforms: ['github', 'vercel'],
  },
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL connection string (alternative to individual DB_* vars)',
    type: 'url',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'postgresql://user:password@host:port/database',
    secret: true,
    platforms: ['github', 'vercel'],
    notes: 'Alternative to DB_HOST/DB_USER/DB_PASSWORD. Takes precedence if set.',
  },

  // ============================================================================
  // REDIS CONFIGURATION (Upstash)
  // ============================================================================
  {
    name: 'UPSTASH_REDIS_REST_URL',
    description: 'Upstash Redis REST API URL',
    type: 'url',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-feature',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'HTTPS URL (https://your-redis.upstash.io)',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
    notes: 'Required for serverless Redis. Falls back to REDIS_URL or local Redis if not set.',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    description: 'Upstash Redis REST API token',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-feature',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'Bearer token',
    secret: true,
    platforms: ['github', 'vercel', 'local'],
    notes: 'Required with UPSTASH_REDIS_REST_URL. Falls back to REDIS_TOKEN if not set.',
  },
  {
    name: 'REDIS_URL',
    description: 'Redis connection URL (fallback)',
    type: 'url',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['local', 'development'],
    format: 'redis://host:port or redis://:password@host:port',
    secret: true,
    platforms: ['github', 'vercel', 'local', 'docker'],
    notes: 'Fallback if Upstash not configured. Used for local development.',
  },
  {
    name: 'REDIS_TOKEN',
    description: 'Redis token (fallback, used with REDIS_URL)',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['local', 'development'],
    format: 'Bearer token',
    secret: true,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'REDIS_HOST',
    description: 'Redis host (local fallback)',
    type: 'host',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['local', 'development'],
    defaultValue: 'localhost',
    secret: false,
    platforms: ['local', 'docker'],
  },
  {
    name: 'REDIS_PORT',
    description: 'Redis port (local fallback)',
    type: 'port',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['local', 'development'],
    defaultValue: 6379,
    secret: false,
    platforms: ['local', 'docker'],
  },
  {
    name: 'REDIS_PASSWORD',
    description: 'Redis password (local fallback)',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['local', 'development'],
    secret: true,
    platforms: ['local', 'docker'],
  },
  {
    name: 'REDIS_TLS',
    description: 'Enable TLS for Redis connection',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: false,
    secret: false,
    platforms: ['github', 'vercel'],
  },
  {
    name: 'REDIS_DB',
    description: 'Redis database number (local fallback)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['local', 'development'],
    defaultValue: 0,
    secret: false,
    platforms: ['local', 'docker'],
  },
  {
    name: 'REDIS_CACHE_TTL',
    description: 'Default Redis cache TTL (seconds)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 3600,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'REDIS_RECONCILIATION_TTL',
    description: 'Reconciliation result cache TTL (seconds)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 300,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },

  // ============================================================================
  // SECURITY & AUTHENTICATION
  // ============================================================================
  {
    name: 'JWT_SECRET',
    description: 'JWT token signing secret',
    type: 'string',
    required: true,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'Min 32 characters',
    secret: true,
    platforms: ['github', 'vercel', 'local', 'docker'],
    validator: (v) => v.length >= 32 && v !== 'dev-secret-change-in-production',
  },
  {
    name: 'JWT_ACCESS_EXPIRY',
    description: 'JWT access token expiry',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: '15m',
    format: 'Time string (e.g., 15m, 1h, 7d)',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'JWT_REFRESH_EXPIRY',
    description: 'JWT refresh token expiry',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: '7d',
    format: 'Time string (e.g., 15m, 1h, 7d)',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'JWT_REFRESH_SECRET',
    description: 'JWT refresh token signing secret (optional, falls back to JWT_SECRET)',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'Min 32 characters',
    secret: true,
    platforms: ['github', 'vercel', 'local'],
    validator: (v) => v.length >= 32,
  },
  {
    name: 'ENCRYPTION_KEY',
    description: 'AES-256-GCM encryption key',
    type: 'string',
    required: true,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-boot',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'Exactly 32 characters',
    secret: true,
    platforms: ['github', 'vercel', 'local', 'docker'],
    validator: (v) => v.length === 32 || v.length === 64,
  },
  {
    name: 'ALLOWED_ORIGINS',
    description: 'CORS allowed origins (comma-separated)',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: '*',
    format: 'Comma-separated URLs or *',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
    notes: 'Warning: * allows all origins. Restrict in production.',
  },
  {
    name: 'TRUST_PROXY',
    description: 'Trust proxy headers (for reverse proxies)',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['preview', 'staging', 'production'],
    defaultValue: false,
    secret: false,
    platforms: ['github', 'vercel'],
    notes: 'Set to true when behind Vercel, Cloudflare, or other reverse proxies.',
  },
  {
    name: 'SECURE_COOKIES',
    description: 'Enable secure cookie flags',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['preview', 'staging', 'production'],
    defaultValue: false,
    secret: false,
    platforms: ['github', 'vercel'],
    notes: 'Set to true in production (HTTPS only).',
  },

  // ============================================================================
  // OBSERVABILITY (Sentry)
  // ============================================================================
  {
    name: 'SENTRY_DSN',
    description: 'Sentry DSN for error tracking',
    type: 'url',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'HTTPS URL (https://key@sentry.io/project-id)',
    secret: true,
    platforms: ['github', 'vercel', 'sentry', 'local'],
    notes: 'Optional but recommended for production error tracking.',
  },
  {
    name: 'SENTRY_ENVIRONMENT',
    description: 'Sentry environment identifier',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'Environment name (e.g., production, staging)',
    secret: false,
    platforms: ['github', 'vercel', 'sentry', 'local'],
    notes: 'Defaults to NODE_ENV if not set.',
  },
  {
    name: 'SENTRY_TRACES_SAMPLE_RATE',
    description: 'Sentry performance tracing sample rate',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 0.1,
    format: 'Number between 0 and 1',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
    notes: '0.1 = 10% of transactions traced. Lower in production to reduce overhead.',
  },
  {
    name: 'SENTRY_ENABLE_DEV',
    description: 'Enable Sentry in development mode',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['local', 'development'],
    defaultValue: false,
    secret: false,
    platforms: ['local'],
    notes: 'Set to true to enable Sentry even when NODE_ENV=development.',
  },
  {
    name: 'SERVICE_NAME',
    description: 'Service name for observability',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 'settler-api',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'OTLP_ENDPOINT',
    description: 'OpenTelemetry OTLP endpoint',
    type: 'url',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'HTTPS URL',
    secret: false,
    platforms: ['github', 'vercel'],
    notes: 'Optional OpenTelemetry endpoint for distributed tracing.',
  },
  {
    name: 'JAEGER_ENDPOINT',
    description: 'Jaeger tracing endpoint',
    type: 'url',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'HTTPS URL',
    secret: false,
    platforms: ['github', 'vercel'],
    notes: 'Optional Jaeger endpoint for distributed tracing.',
  },

  // ============================================================================
  // LOGGING & MONITORING
  // ============================================================================
  {
    name: 'LOG_LEVEL',
    description: 'Logging level',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 'info',
    format: 'error | warn | info | debug',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'LOG_SAMPLING_RATE',
    description: 'Log sampling rate (0-1)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 1.0,
    format: 'Number between 0 and 1',
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'METRICS_ENABLED',
    description: 'Enable Prometheus metrics endpoint',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: true,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'HEALTH_CHECK_ENABLED',
    description: 'Enable health check endpoint',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: true,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },

  // ============================================================================
  // RATE LIMITING & PERFORMANCE
  // ============================================================================
  {
    name: 'RATE_LIMIT_DEFAULT',
    description: 'Default rate limit (requests per window)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 1000,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'RATE_LIMIT_WINDOW_MS',
    description: 'Rate limit window duration (milliseconds)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 900000,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
    notes: '900000ms = 15 minutes',
  },

  // ============================================================================
  // WEBHOOK CONFIGURATION
  // ============================================================================
  {
    name: 'WEBHOOK_MAX_RETRIES',
    description: 'Maximum webhook retry attempts',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 5,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'WEBHOOK_INITIAL_DELAY',
    description: 'Initial webhook retry delay (ms)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 2000,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'WEBHOOK_MAX_DELAY',
    description: 'Maximum webhook retry delay (ms)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 32000,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },

  // ============================================================================
  // DATA RETENTION
  // ============================================================================
  {
    name: 'DATA_RETENTION_DAYS',
    description: 'Default data retention period (days)',
    type: 'number',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: 365,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },

  // ============================================================================
  // FEATURE FLAGS
  // ============================================================================
  {
    name: 'ENABLE_SCHEMA_PER_TENANT',
    description: 'Enable schema-per-tenant multi-tenancy',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'feature-flag',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: false,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'ENABLE_REQUEST_TIMEOUT',
    description: 'Enable request timeout middleware',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'feature-flag',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: true,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },
  {
    name: 'ENABLE_API_DOCS',
    description: 'Enable OpenAPI documentation endpoint',
    type: 'boolean',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'feature-flag',
    environments: ['development', 'preview', 'staging', 'production'],
    defaultValue: true,
    secret: false,
    platforms: ['github', 'vercel', 'local'],
  },

  // ============================================================================
  // THIRD-PARTY INTEGRATIONS (Adapter Configs)
  // ============================================================================
  {
    name: 'STRIPE_SECRET_KEY',
    description: 'Stripe secret key (for Stripe adapter)',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-feature',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'sk_test_... or sk_live_...',
    secret: true,
    platforms: ['github', 'vercel', 'local'],
    notes: 'Required only if using Stripe adapter. Set per-job in config, not globally.',
  },
  {
    name: 'SHOPIFY_API_KEY',
    description: 'Shopify API key (for Shopify adapter)',
    type: 'string',
    required: false,
    scope: 'runtime',
    exposure: 'server-only',
    criticality: 'required-for-feature',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'Shopify API key',
    secret: true,
    platforms: ['github', 'vercel', 'local'],
    notes: 'Required only if using Shopify adapter. Set per-job in config, not globally.',
  },

  // ============================================================================
  // CI/CD CONFIGURATION
  // ============================================================================
  {
    name: 'VERCEL_TOKEN',
    description: 'Vercel deployment token',
    type: 'string',
    required: false,
    scope: 'ci-only',
    exposure: 'ci-only',
    criticality: 'required-for-feature',
    environments: ['preview', 'production'],
    format: 'Vercel API token',
    secret: true,
    platforms: ['github'],
    notes: 'GitHub Actions secret. Used for Vercel deployments.',
  },
  {
    name: 'VERCEL_ORG_ID',
    description: 'Vercel organization ID',
    type: 'string',
    required: false,
    scope: 'ci-only',
    exposure: 'ci-only',
    criticality: 'required-for-feature',
    environments: ['preview', 'production'],
    format: 'Vercel org ID',
    secret: false,
    platforms: ['github'],
    notes: 'GitHub Actions secret. Used for Vercel deployments.',
  },
  {
    name: 'VERCEL_PROJECT_ID',
    description: 'Vercel project ID',
    type: 'string',
    required: false,
    scope: 'ci-only',
    exposure: 'ci-only',
    criticality: 'required-for-feature',
    environments: ['preview', 'production'],
    format: 'Vercel project ID',
    secret: false,
    platforms: ['github'],
    notes: 'GitHub Actions secret. Used for Vercel deployments.',
  },
  {
    name: 'SNYK_TOKEN',
    description: 'Snyk security scanning token',
    type: 'string',
    required: false,
    scope: 'ci-only',
    exposure: 'ci-only',
    criticality: 'optional',
    environments: ['development', 'preview', 'staging', 'production'],
    format: 'Snyk API token',
    secret: true,
    platforms: ['github'],
    notes: 'GitHub Actions secret. Optional for security scanning.',
  },
  {
    name: 'E2E_API_KEY',
    description: 'API key for E2E tests',
    type: 'string',
    required: false,
    scope: 'ci-only',
    exposure: 'ci-only',
    criticality: 'optional',
    environments: ['development'],
    format: 'Test API key',
    secret: true,
    platforms: ['github'],
    notes: 'GitHub Actions secret. Used for E2E test authentication.',
  },
  {
    name: 'E2E_BASE_URL',
    description: 'Base URL for E2E tests',
    type: 'string',
    required: false,
    scope: 'ci-only',
    exposure: 'ci-only',
    criticality: 'optional',
    environments: ['development'],
    format: 'HTTP/HTTPS URL',
    secret: false,
    platforms: ['github'],
    notes: 'GitHub Actions env var. Defaults to http://localhost:3000.',
  },
];

/**
 * Get environment variable spec by name
 */
export function getEnvVarSpec(name: string): EnvVarSpec | undefined {
  return ENV_VAR_SCHEMA.find((spec) => spec.name === name);
}

/**
 * Get all required environment variables for a given environment
 */
export function getRequiredEnvVars(
  environment: 'local' | 'development' | 'preview' | 'staging' | 'production'
): EnvVarSpec[] {
  return ENV_VAR_SCHEMA.filter(
    (spec) =>
      spec.required &&
      (spec.environments.includes(environment) || spec.environments.includes('local'))
  );
}

/**
 * Get all environment variables used by a specific platform
 */
export function getEnvVarsByPlatform(
  platform: 'github' | 'vercel' | 'supabase' | 'sentry' | 'local' | 'docker'
): EnvVarSpec[] {
  return ENV_VAR_SCHEMA.filter((spec) => spec.platforms.includes(platform));
}

/**
 * Get all secrets (sensitive environment variables)
 */
export function getSecrets(): EnvVarSpec[] {
  return ENV_VAR_SCHEMA.filter((spec) => spec.secret);
}

/**
 * Validate environment variable value against spec
 */
export function validateEnvVar(spec: EnvVarSpec, value: string): { valid: boolean; error?: string } {
  if (spec.required && !value) {
    return { valid: false, error: `${spec.name} is required but not set` };
  }

  if (!value && spec.defaultValue !== undefined) {
    return { valid: true }; // Will use default
  }

  if (!value) {
    return { valid: true }; // Optional and not set
  }

  // Type validation
  if (spec.type === 'number') {
    if (isNaN(Number(value))) {
      return { valid: false, error: `${spec.name} must be a number` };
    }
  } else if (spec.type === 'boolean') {
    if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
      return { valid: false, error: `${spec.name} must be a boolean (true/false)` };
    }
  } else if (spec.type === 'url') {
    try {
      new URL(value);
    } catch {
      return { valid: false, error: `${spec.name} must be a valid URL` };
    }
  } else if (spec.type === 'port') {
    const port = Number(value);
    if (isNaN(port) || port < 1 || port > 65535) {
      return { valid: false, error: `${spec.name} must be a valid port (1-65535)` };
    }
  }

  // Custom validator
  if (spec.validator && !spec.validator(value)) {
    return { valid: false, error: `${spec.name} failed custom validation` };
  }

  return { valid: true };
}
