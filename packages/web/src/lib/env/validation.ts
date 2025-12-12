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
 * Validate environment and throw if critical variables are missing
 */
export function requireEnvironment(): void {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error('Missing required environment variables');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (result.valid) {
    console.log('✅ Environment validation passed');
  }
}
