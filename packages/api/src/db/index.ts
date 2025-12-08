import { Pool, PoolClient } from 'pg';
import { config } from '../config';

// Database connection pool with proper configuration
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: config.database.poolMax,
  min: config.database.poolMin,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: config.database.connectionTimeout,
  statement_timeout: config.database.statementTimeout,
  query_timeout: config.database.statementTimeout,
  ssl: config.database.ssl ? {
    rejectUnauthorized: config.nodeEnv === 'production' || config.nodeEnv === 'preview',
  } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: (string | number | boolean | null | Date)[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Initialize database schema
export async function initDatabase(): Promise<void> {
  const { runMigrations } = require('./migrate');
  
  try {
    // Run all migrations in order
    await runMigrations();
  } catch (error: unknown) {
    // Fallback to basic schema if migration runner fails
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Migration runner failed, falling back to basic schema:', message);
    
    const fs = require('fs');
    const path = require('path');
    
    // Run consolidated initial schema migration
    const migrationPath = path.join(__dirname, 'migrations', '001-initial-schema.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      // Split by semicolon and execute each statement
      const statements = migrationSQL.split(';').filter((s: string) => s.trim().length > 0);
      for (const statement of statements) {
        if (statement.trim() && !statement.trim().startsWith('--')) {
          try {
            await query(statement);
          } catch (error: unknown) {
            // Ignore "already exists" errors (idempotent migration)
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.includes('already exists') && 
                !errorMessage.includes('duplicate') &&
                !errorMessage.includes('already enabled')) {
              console.warn('Migration warning:', errorMessage);
            }
          }
        }
      }
    } else {
      // Fallback: create basic tables if migration file doesn't exist
      await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'developer',
      data_residency_region VARCHAR(10) DEFAULT 'us',
      data_retention_days INTEGER DEFAULT 365,
      deleted_at TIMESTAMP,
      deletion_scheduled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tenant_id, email)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_prefix VARCHAR(20) NOT NULL,
      key_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      scopes TEXT[] DEFAULT ARRAY['jobs:read', 'jobs:write', 'reports:read'],
      rate_limit INTEGER DEFAULT 1000,
      ip_whitelist TEXT[],
      revoked_at TIMESTAMP,
      expires_at TIMESTAMP,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at);

    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      source_adapter VARCHAR(100) NOT NULL,
      source_config_encrypted TEXT NOT NULL,
      target_adapter VARCHAR(100) NOT NULL,
      target_config_encrypted TEXT NOT NULL,
      rules JSONB NOT NULL,
      schedule VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(user_id) WHERE status = 'active';

    CREATE TABLE IF NOT EXISTS executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'running',
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      error TEXT,
      summary JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_executions_job_id ON executions(job_id);
    CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

    CREATE TABLE IF NOT EXISTS matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      source_id VARCHAR(255) NOT NULL,
      target_id VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2),
      currency VARCHAR(10),
      confidence DECIMAL(3, 2),
      matched_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_matches_job_id ON matches(job_id);
    CREATE INDEX IF NOT EXISTS idx_matches_execution_id ON matches(execution_id);
    CREATE INDEX IF NOT EXISTS idx_matches_source_id ON matches(source_id);
    CREATE INDEX IF NOT EXISTS idx_matches_target_id ON matches(target_id);
    CREATE INDEX IF NOT EXISTS idx_matches_job_status ON matches(job_id, confidence);

    CREATE TABLE IF NOT EXISTS unmatched (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      source_id VARCHAR(255),
      target_id VARCHAR(255),
      amount DECIMAL(10, 2),
      currency VARCHAR(10),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_unmatched_job_id ON unmatched(job_id);
    CREATE INDEX IF NOT EXISTS idx_unmatched_execution_id ON unmatched(execution_id);

    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
      date_range_start TIMESTAMP,
      date_range_end TIMESTAMP,
      summary JSONB NOT NULL,
      generated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reports_job_id ON reports(job_id);
    CREATE INDEX IF NOT EXISTS idx_reports_execution_id ON reports(execution_id);

    CREATE TABLE IF NOT EXISTS webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url VARCHAR(2048) NOT NULL,
      events TEXT[] NOT NULL,
      secret VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
    CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);

    CREATE TABLE IF NOT EXISTS webhook_payloads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      adapter VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL,
      signature VARCHAR(255),
      received_at TIMESTAMP DEFAULT NOW(),
      processed BOOLEAN DEFAULT FALSE,
      processed_at TIMESTAMP,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_payloads_adapter ON webhook_payloads(adapter);
    CREATE INDEX IF NOT EXISTS idx_webhook_payloads_processed ON webhook_payloads(processed, received_at);

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
      url VARCHAR(2048) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(50),
      status_code INTEGER,
      response_body TEXT,
      attempts INTEGER DEFAULT 0,
      next_retry_at TIMESTAMP,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'failed';

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event VARCHAR(100) NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
      ip VARCHAR(45),
      user_agent TEXT,
      method VARCHAR(10),
      path VARCHAR(500),
      status_code INTEGER,
      metadata JSONB,
      timestamp TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key VARCHAR(255) NOT NULL,
      response JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_user_key ON idempotency_keys(user_id, key);
    CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

    CREATE TABLE IF NOT EXISTS webhook_configs (
      adapter VARCHAR(100) PRIMARY KEY,
      secret VARCHAR(255) NOT NULL,
      signature_algorithm VARCHAR(50) DEFAULT 'hmac-sha256',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
      `);
    }
  }
}
