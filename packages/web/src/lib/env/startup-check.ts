/**
 * Startup Environment Check
 * 
 * CTO Mode: Deployment Guardrails
 * - Runs at module load time to catch configuration issues early
 * - Provides clear error messages instead of cryptic crashes
 * - Only runs in production/build time, not in development
 */

import { validateConsoleEnv } from './validate';

// Only run validation in production or during build
if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
  const validation = validateConsoleEnv();
  
  if (!validation.valid) {
    const errorMessage = [
      '❌ Environment Configuration Error',
      '',
      'Missing required environment variables:',
      ...validation.missing.map((key) => `  - ${key}`),
      '',
      'Please set these variables in your deployment environment.',
      'See .env.template for required configuration.',
      '',
      'This check runs at startup to prevent runtime errors.',
    ].join('\n');
    
    // In production builds, throw to fail fast
    // In runtime, log error but don't crash (routes will handle gracefully)
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      throw new Error(errorMessage);
    } else {
      console.error(errorMessage);
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('[Startup Check] Configuration warnings:', validation.warnings.join(', '));
  }
}
