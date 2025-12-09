"use strict";
/**
 * Startup Validation
 * Validates environment, dependencies, and configuration at application startup
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStartup = validateStartup;
const config_1 = require("../config");
const db_1 = require("../db");
const cache_1 = require("./cache");
const logger_1 = require("./logger");
// Import env schema functions - using require to avoid rootDir issues
const envSchema = require('../../../../config/env.schema');
const getRequiredEnvVars = envSchema.getRequiredEnvVars;
const validateEnvVar = envSchema.validateEnvVar;
/**
 * Validate environment variables at startup
 */
function validateEnvironment() {
    const results = [];
    const environment = config_1.config.nodeEnv === 'production' ? 'production' : 'development';
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
        }
        else if (!validation.valid) {
            results.push({
                name: spec.name,
                status: 'error',
                message: validation.error || 'Invalid value',
            });
        }
        else if (!value && spec.defaultValue !== undefined) {
            results.push({
                name: spec.name,
                status: 'ok',
                message: `Using default: ${spec.defaultValue}`,
            });
        }
        else {
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
async function validateDatabase() {
    try {
        await (0, db_1.initDatabase)();
        // Test query
        await Promise.resolve().then(() => __importStar(require('../db'))).then(({ query }) => query('SELECT 1'));
        return {
            name: 'database',
            status: 'ok',
            message: 'Database connection successful',
        };
    }
    catch (error) {
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
async function validateRedis() {
    const redis = (0, cache_1.getRedisClient)();
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
    }
    catch (error) {
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
function validateEncryptionKey() {
    const key = config_1.config.encryption.key;
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
function validateJwtSecret() {
    const secret = config_1.config.jwt.secret;
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
    if (secret === 'dev-secret-change-in-production' && config_1.config.nodeEnv === 'production') {
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
async function validateStartup() {
    const results = [];
    (0, logger_1.logInfo)('Running startup validations...');
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    (0, logger_1.logInfo)(`Startup validation complete: ${ok.length} OK, ${warnings.length} warnings, ${errors.length} errors`);
    if (errors.length > 0) {
        (0, logger_1.logError)('Startup validation errors:', undefined, { errors });
        for (const error of errors) {
            (0, logger_1.logError)(`  ${error.name}: ${error.message}`);
        }
    }
    if (warnings.length > 0) {
        for (const warning of warnings) {
            (0, logger_1.logWarn)(`Startup validation warning: ${warning.name} - ${warning.message}`);
        }
    }
    return {
        passed: errors.length === 0,
        results,
    };
}
//# sourceMappingURL=startup-validation.js.map