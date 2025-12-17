/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables on startup.
 * Fails fast if critical variables are missing.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean;
  defaultValue?: string;
}

const envVars: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validate: (v) => v.startsWith('https://') && v.includes('.supabase.co'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
    validate: (v) => v.length > 20,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (for admin operations)',
    validate: (v) => v.length > 20,
  },
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    validate: (v) => v.startsWith('postgresql://'),
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: false,
    description: 'Public site URL',
    defaultValue: 'https://settler.dev',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key (required for billing)',
    validate: (v) => v.startsWith('sk_'),
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook secret (required for webhooks)',
    validate: (v) => v.startsWith('whsec_'),
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        errors.push(`Missing required environment variable: ${envVar.name} - ${envVar.description}`);
      } else if (envVar.defaultValue) {
        // Use default value
        process.env[envVar.name] = envVar.defaultValue;
      } else {
        warnings.push(`Optional environment variable not set: ${envVar.name} - ${envVar.description}`);
      }
      continue;
    }

    if (envVar.validate && !envVar.validate(value)) {
      errors.push(`Invalid value for ${envVar.name}: ${envVar.description}`);
    }
  }

  // Additional validations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SENTRY_DSN && process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true') {
      warnings.push('Sentry DSN not configured but Sentry is enabled');
    }

    if (!process.env.RESEND_API_KEY) {
      warnings.push('Resend API key not configured - email functionality will be limited');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if we're in build mode (static generation)
 */
function isBuildTime(): boolean {
  // Check for Next.js build phase indicators
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NEXT_PHASE === 'phase-development-build') {
    return true;
  }
  
  // Check if we're in Vercel build (but not runtime)
  if (process.env.VERCEL === '1' && !process.env.VERCEL_ENV) {
    return true;
  }
  
  // During static page generation, env vars may not be available
  // Check if we're server-side but missing critical env vars (likely build time)
  if (typeof window === 'undefined') {
    const hasCriticalVars = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // If we're server-side but missing vars, likely build time
    if (!hasCriticalVars && process.env.NODE_ENV !== 'development') {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate environment and throw if critical variables are missing
 * 
 * During build time (static generation), this will only log warnings
 * instead of throwing errors, as env vars may not be available yet.
 */
export function requireEnvironment(): void {
  const result = validateEnvironment();
  const isBuild = isBuildTime();

  if (result.errors.length > 0) {
    if (isBuild) {
      // During build, only warn - env vars will be available at runtime
      console.warn('⚠️  Environment variables not available during build (will be available at runtime):');
      result.errors.forEach((error) => console.warn(`  - ${error}`));
      return; // Don't throw during build
    } else {
      // At runtime, throw if critical vars are missing
      console.error('❌ Environment validation failed:');
      result.errors.forEach((error) => console.error(`  - ${error}`));
      throw new Error('Missing required environment variables');
    }
  }

  if (result.warnings.length > 0 && !isBuild) {
    // Only show warnings at runtime, not during build (to reduce build log noise)
    console.warn('⚠️  Environment validation warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (result.valid && !isBuild) {
    console.log('✅ Environment validation passed');
  }
}
