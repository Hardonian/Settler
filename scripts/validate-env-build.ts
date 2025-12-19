#!/usr/bin/env tsx
/**
 * Environment Variable Build Helper
 * 
 * Validates environment variables appropriately for build vs runtime contexts.
 * - During build: Only validates build-time required variables, skips runtime-only
 * - At runtime: Validates all required variables
 * 
 * Usage:
 *   npm run validate:env:build    # Validate for build context (non-blocking for runtime vars)
 *   npm run validate:env:runtime   # Validate for runtime context (strict)
 */

/**
 * Check if we're in a build context
 */
function isBuildContext(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    !!process.env.VERCEL ||
    process.env.CI === 'true' ||
    process.argv.includes('--build')
  );
}

/**
 * Build-time required environment variables
 * These are needed during the build process
 */
const BUILD_TIME_REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  // Add other build-time required vars here
];

/**
 * Runtime-only environment variables
 * These are NOT required during build but will be needed at runtime
 */
const RUNTIME_ONLY = [
  'DB_PASSWORD',
  'ENCRYPTION_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  // Add other runtime-only vars here
];

/**
 * Validate environment variables for build context
 */
function validateBuildEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check build-time required variables
  for (const name of BUILD_TIME_REQUIRED) {
    if (!process.env[name]) {
      errors.push(`Missing build-time required variable: ${name}`);
    }
  }
  
  // Warn about runtime-only variables that are missing (but don't fail build)
  for (const name of RUNTIME_ONLY) {
    if (!process.env[name]) {
      warnings.push(`Missing runtime-only variable (will be required at runtime): ${name}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment variables for runtime context
 */
function validateRuntimeEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allRequired = [...BUILD_TIME_REQUIRED, ...RUNTIME_ONLY];
  
  for (const name of allRequired) {
    if (!process.env[name]) {
      errors.push(`Missing required variable: ${name}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Main execution
 */
function main() {
  const isBuild = isBuildContext() || process.argv.includes('--build');
  const isRuntime = process.argv.includes('--runtime');
  
  if (isRuntime) {
    console.log('🔍 Validating environment variables for runtime...\n');
    const result = validateRuntimeEnv();
    
    if (!result.valid) {
      console.error('❌ Environment variable validation failed:\n');
      result.errors.forEach((error) => console.error(`  • ${error}`));
      console.error('\n💡 These variables should be set in Vercel/GitHub Secrets for production.\n');
      process.exit(1);
    }
    
    console.log('✅ All required environment variables are set!\n');
  } else {
    console.log('🔍 Validating environment variables for build...\n');
    const result = validateBuildEnv();
    
    if (result.warnings.length > 0) {
      console.warn('⚠️  Runtime-only variables missing (non-blocking for build):\n');
      result.warnings.forEach((warning) => console.warn(`  • ${warning}`));
      console.log('');
    }
    
    if (!result.valid) {
      console.error('❌ Build-time environment variable validation failed:\n');
      result.errors.forEach((error) => console.error(`  • ${error}`));
      console.error('\n💡 These variables are required during build.\n');
      process.exit(1);
    }
    
    console.log('✅ Build-time environment variables are valid!\n');
    if (result.warnings.length > 0) {
      console.log('ℹ️  Note: Some runtime-only variables are missing but will be required at runtime.\n');
      console.log('💡 Set these in Vercel/GitHub Secrets for production deployments.\n');
    }
  }
}

if (require.main === module) {
  main();
}

export { validateBuildEnv, validateRuntimeEnv, isBuildContext };
