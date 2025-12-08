/**
 * Startup Validation
 * Validates environment, dependencies, and configuration at application startup
 */

import { config } from '../config';
import { initDatabase } from '../db';
import { getRedisClient } from './cache';
import { logInfo, logError, logWarn } from './logger';
// Import env schema functions - using require to avoid rootDir issues
const envSchema = require('../../../../config/env.schema');
const getRequiredEnvVars = envSchema.getRequiredEnvVars as (environment: 'local' | 'development' | 'preview' | 'staging' | 'production') => Array<{ name: string; required: boolean; defaultValue?: string }>;
const validateEnvVar = envSchema.validateEnvVar as (spec: { name: string; required: boolean; defaultValue?: string }, value: string) => { valid: boolean; error?: string };

export interface ValidationResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

export interface StartupValidation {
  passed: boolean;
  results: ValidationResult[];
}

/**
 * Validate environment variables at startup
 */
function validateEnvironment(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const environment = config.nodeEnv === 'production' ? 'production' : 'development';
  const required = getRequiredEnvVars(environment);

  for (const spec of required) {
    const value = process.env[spec.name];
    const validation = validateEnvVar(spec, value || '');

    if (!value && spec.required) {
      results.push({
        name: spec.name,
        status: 'error',
        message: `Required but not set`,
      });
    } else if (!validation.valid) {
      results.push({
        name: spec.name,
        status: 'error',
        message: validation.error || 'Invalid value',
      });
    } else if (!value && spec.defaultValue !== undefined) {
      results.push({
        name: spec.name,
        status: 'ok',
        message: `Using default: ${spec.defaultValue}`,
      });
    } else {
      results.push({
        name: spec.name,
        status: 'ok',
        message: 'Valid',
      });
    }
  }

  return results;
}

/**
 * Validate database connection
 */
async function validateDatabase(): Promise<ValidationResult> {
  try {
    await initDatabase();
    // Test query
    await import('../db').then(({ query }) => query('SELECT 1'));
    return {
      name: 'database',
      status: 'ok',
      message: 'Database connection successful',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      name: 'database',
      status: 'error',
      message: `Database connection failed: ${message}`,
    };
  }
}

/**
 * Validate Redis connection
 */
async function validateRedis(): Promise<ValidationResult> {
  const redis = getRedisClient();
  if (!redis) {
    return {
      name: 'redis',
      status: 'warning',
      message: 'Redis not configured, using memory cache fallback',
    };
  }

  try {
    await redis.ping();
    return {
      name: 'redis',
      status: 'ok',
      message: 'Redis connection successful',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      name: 'redis',
      status: 'warning',
      message: `Redis connection failed, using memory cache: ${message}`,
    };
  }
}

/**
 * Validate encryption key format
 */
function validateEncryptionKey(): ValidationResult {
  const key = config.encryption.key;
  if (!key) {
    return {
      name: 'encryption_key',
      status: 'error',
      message: 'ENCRYPTION_KEY is required',
    };
  }

  if (key.length !== 32 && key.length !== 64) {
    return {
      name: 'encryption_key',
      status: 'error',
      message: `ENCRYPTION_KEY must be 32 or 64 characters, got ${key.length}`,
    };
  }

  return {
    name: 'encryption_key',
    status: 'ok',
    message: 'Encryption key format valid',
  };
}

/**
 * Validate JWT secret
 */
function validateJwtSecret(): ValidationResult {
  const secret = config.jwt.secret;
  if (!secret) {
    return {
      name: 'jwt_secret',
      status: 'error',
      message: 'JWT_SECRET is required',
    };
  }

  if (secret.length < 32) {
    return {
      name: 'jwt_secret',
      status: 'error',
      message: `JWT_SECRET must be at least 32 characters, got ${secret.length}`,
    };
  }

  if (secret === 'dev-secret-change-in-production' && config.nodeEnv === 'production') {
    return {
      name: 'jwt_secret',
      status: 'error',
      message: 'JWT_SECRET must not use default value in production',
    };
  }

  return {
    name: 'jwt_secret',
    status: 'ok',
    message: 'JWT secret valid',
  };
}

/**
 * Run all startup validations
 */
export async function validateStartup(): Promise<StartupValidation> {
  const results: ValidationResult[] = [];

  logInfo('Running startup validations...');

  // Environment variables
  const envResults = validateEnvironment();
  results.push(...envResults);

  // Encryption key
  results.push(validateEncryptionKey());

  // JWT secret
  results.push(validateJwtSecret());

  // Database (async)
  try {
    const dbResult = await validateDatabase();
    results.push(dbResult);
  } catch (error: unknown) {
    results.push({
      name: 'database',
      status: 'error',
      message: `Database validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Redis (async)
  try {
    const redisResult = await validateRedis();
    results.push(redisResult);
  } catch (error: unknown) {
    results.push({
      name: 'redis',
      status: 'warning',
      message: `Redis validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Log results
  const errors = results.filter((r) => r.status === 'error');
  const warnings = results.filter((r) => r.status === 'warning');
  const ok = results.filter((r) => r.status === 'ok');

  logInfo(`Startup validation complete: ${ok.length} OK, ${warnings.length} warnings, ${errors.length} errors`);

  if (errors.length > 0) {
    logError('Startup validation errors:', undefined, { errors });
    for (const error of errors) {
      logError(`  ${error.name}: ${error.message}`);
    }
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      logWarn(`Startup validation warning: ${warning.name} - ${warning.message}`);
    }
  }

  return {
    passed: errors.length === 0,
    results,
  };
}
