/**
 * Environment Variable Utilities
 * 
 * CTO Mode: Deployment Guardrails
 * - NEVER destructure process.env
 * - Treat all env vars as potentially undefined
 * - Throw errors early if missing
 */

/**
 * Get environment variable with validation
 * Throws error if required variable is missing
 */
export function getEnv(name: string, required = true): string {
  const value = process.env[name];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value || '';
}

/**
 * Get environment variable with default value
 */
export function getEnvWithDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Get boolean environment variable
 */
export function getEnvBoolean(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get number environment variable
 */
export function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate required environment variables for production
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  for (const name of required) {
    if (!process.env[name]) {
      errors.push(`Missing required environment variable: ${name}`);
    }
  }
  
  // Validate JWT_SECRET length if set
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }
  
  // Validate ENCRYPTION_KEY length if set
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length !== 32 && encryptionKey.length !== 64) {
    errors.push('ENCRYPTION_KEY must be exactly 32 or 64 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
