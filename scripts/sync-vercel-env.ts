#!/usr/bin/env tsx
/**
 * Vercel Environment Variable Sync Guide Generator
 * 
 * This script generates a guide for syncing environment variables from
 * GitHub secrets to Vercel. It cannot directly modify Vercel (requires API access),
 * but it generates a comprehensive guide and JSON file that can be used
 * with Vercel CLI or dashboard.
 * 
 * Usage:
 *   tsx scripts/sync-vercel-env.ts
 * 
 * This will generate:
 * - docs/vercel-env-sync-guide.md (manual sync guide)
 * - scripts/vercel-env-vars.json (JSON for Vercel CLI import)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface VercelEnvVar {
  key: string;
  value: string;
  type: 'encrypted' | 'plain';
  target: ('production' | 'preview' | 'development')[];
  gitBranch?: string;
  comment?: string;
}

interface EnvVarMapping {
  githubSecret: string;
  vercelKey: string;
  isPublic: boolean;
  required: boolean;
  environments: string[];
  description: string;
}

// Mapping of GitHub secrets to Vercel environment variables
const ENV_MAPPINGS: EnvVarMapping[] = [
  // Core Supabase - Server-side only
  {
    githubSecret: 'SUPABASE_URL',
    vercelKey: 'SUPABASE_URL',
    isPublic: false,
    required: true,
    environments: ['production', 'preview', 'development'],
    description: 'Supabase project URL',
  },
  {
    githubSecret: 'SUPABASE_ANON_KEY',
    vercelKey: 'SUPABASE_ANON_KEY',
    isPublic: false,
    required: true,
    environments: ['production', 'preview', 'development'],
    description: 'Supabase anonymous key (server-side)',
  },
  {
    githubSecret: 'SUPABASE_SERVICE_ROLE_KEY',
    vercelKey: 'SUPABASE_SERVICE_ROLE_KEY',
    isPublic: false,
    required: true,
    environments: ['production', 'preview', 'development'],
    description: 'Supabase service role key (NEVER expose to client)',
  },
  // Client-side Supabase (NEXT_PUBLIC_)
  {
    githubSecret: 'SUPABASE_URL',
    vercelKey: 'NEXT_PUBLIC_SUPABASE_URL',
    isPublic: true,
    required: true,
    environments: ['production', 'preview', 'development'],
    description: 'Supabase URL exposed to client (use same value as SUPABASE_URL)',
  },
  {
    githubSecret: 'SUPABASE_ANON_KEY',
    vercelKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    isPublic: true,
    required: true,
    environments: ['production', 'preview', 'development'],
    description: 'Supabase anonymous key exposed to client (use same value as SUPABASE_ANON_KEY)',
  },
  // Database
  {
    githubSecret: 'DATABASE_URL',
    vercelKey: 'DATABASE_URL',
    isPublic: false,
    required: true,
    environments: ['production', 'preview', 'development'],
    description: 'PostgreSQL connection string',
  },
  {
    githubSecret: 'DIRECT_URL',
    vercelKey: 'DIRECT_URL',
    isPublic: false,
    required: false,
    environments: ['production', 'preview'],
    description: 'Direct database connection (bypass pooler)',
  },
  // Security
  {
    githubSecret: 'JWT_SECRET',
    vercelKey: 'JWT_SECRET',
    isPublic: false,
    required: true,
    environments: ['production', 'preview'],
    description: 'JWT token signing secret (32+ characters)',
  },
  {
    githubSecret: 'ENCRYPTION_KEY',
    vercelKey: 'ENCRYPTION_KEY',
    isPublic: false,
    required: true,
    environments: ['production', 'preview'],
    description: 'AES-256-GCM encryption key (exactly 32 characters)',
  },
  // Redis
  {
    githubSecret: 'UPSTASH_REDIS_REST_URL',
    vercelKey: 'UPSTASH_REDIS_REST_URL',
    isPublic: false,
    required: false,
    environments: ['production', 'preview'],
    description: 'Upstash Redis REST API URL',
  },
  {
    githubSecret: 'UPSTASH_REDIS_REST_TOKEN',
    vercelKey: 'UPSTASH_REDIS_REST_TOKEN',
    isPublic: false,
    required: false,
    environments: ['production', 'preview'],
    description: 'Upstash Redis REST API token',
  },
  {
    githubSecret: 'REDIS_URL',
    vercelKey: 'REDIS_URL',
    isPublic: false,
    required: false,
    environments: ['production', 'preview'],
    description: 'Redis connection URL (fallback)',
  },
  // Email
  {
    githubSecret: 'RESEND_API_KEY',
    vercelKey: 'RESEND_API_KEY',
    isPublic: false,
    required: true,
    environments: ['production', 'preview'],
    description: 'Resend API key for transactional emails',
  },
  {
    githubSecret: 'RESEND_FROM_EMAIL',
    vercelKey: 'RESEND_FROM_EMAIL',
    isPublic: false,
    required: false,
    environments: ['production', 'preview'],
    description: 'Default sender email address',
  },
  // Payment
  {
    githubSecret: 'STRIPE_SECRET_KEY',
    vercelKey: 'STRIPE_SECRET_KEY',
    isPublic: false,
    required: true,
    environments: ['production', 'preview'],
    description: 'Stripe secret key (NEVER expose to client)',
  },
  {
    githubSecret: 'STRIPE_WEBHOOK_SECRET',
    vercelKey: 'STRIPE_WEBHOOK_SECRET',
    isPublic: false,
    required: false,
    environments: ['production', 'preview'],
    description: 'Stripe webhook secret for verification',
  },
  // Observability
  {
    githubSecret: 'SENTRY_DSN',
    vercelKey: 'SENTRY_DSN',
    isPublic: false,
    required: false,
    environments: ['production', 'preview'],
    description: 'Sentry DSN for error tracking',
  },
  {
    githubSecret: 'SENTRY_DSN',
    vercelKey: 'NEXT_PUBLIC_SENTRY_DSN',
    isPublic: true,
    required: false,
    environments: ['production', 'preview'],
    description: 'Sentry DSN for client-side error tracking (use same value as SENTRY_DSN)',
  },
  // Public URLs
  {
    githubSecret: 'NEXT_PUBLIC_SITE_URL',
    vercelKey: 'NEXT_PUBLIC_SITE_URL',
    isPublic: true,
    required: false,
    environments: ['production', 'preview'],
    description: 'Public site URL (e.g., https://settler.dev)',
  },
  {
    githubSecret: 'NEXT_PUBLIC_APP_URL',
    vercelKey: 'NEXT_PUBLIC_APP_URL',
    isPublic: true,
    required: false,
    environments: ['production', 'preview'],
    description: 'Public app URL (e.g., https://settler.dev)',
  },
  // Optional analytics
  {
    githubSecret: 'NEXT_PUBLIC_GA4_MEASUREMENT_ID',
    vercelKey: 'NEXT_PUBLIC_GA4_MEASUREMENT_ID',
    isPublic: true,
    required: false,
    environments: ['production'],
    description: 'Google Analytics 4 measurement ID',
  },
  {
    githubSecret: 'NEXT_PUBLIC_POSTHOG_KEY',
    vercelKey: 'NEXT_PUBLIC_POSTHOG_KEY',
    isPublic: true,
    required: false,
    environments: ['production'],
    description: 'PostHog API key',
  },
];

function generateSyncGuide(): string {
  const guide = `# Vercel Environment Variable Sync Guide

This guide helps you sync environment variables from GitHub secrets to Vercel.

## Overview

- **GitHub Secrets**: Used for CI/CD workflows and server-side operations
- **Vercel Environment Variables**: Used for runtime application configuration
- **NEXT_PUBLIC_ Variables**: Must be set in Vercel (exposed to client-side)

## Quick Sync Methods

### Method 1: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. For each variable below, click **Add** and enter:
   - **Key**: Variable name
   - **Value**: Copy from GitHub secrets (see mapping below)
   - **Environment**: Select appropriate environments (Production, Preview, Development)

### Method 2: Vercel CLI

\`\`\`bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Import environment variables from JSON file
vercel env pull .env.local
# Then manually add each variable using:
vercel env add VARIABLE_NAME production
\`\`\`

### Method 3: GitHub Integration (Auto-sync)

If GitHub integration is enabled in Vercel:
- Some variables may auto-sync from GitHub secrets
- However, \`NEXT_PUBLIC_\` variables typically need manual setup
- Review this guide to ensure all variables are properly configured

## Required Variables

### 🔴 Critical (Must Have)

${ENV_MAPPINGS
  .filter(m => m.required)
  .map(m => `- **${m.vercelKey}** (${m.isPublic ? 'Public' : 'Private'})
  - Source: GitHub secret \`${m.githubSecret}\`
  - Environments: ${m.environments.join(', ')}
  - Description: ${m.description}`)
  .join('\n\n')}

### 🟡 Important (Recommended)

${ENV_MAPPINGS
  .filter(m => !m.required)
  .map(m => `- **${m.vercelKey}** (${m.isPublic ? 'Public' : 'Private'})
  - Source: GitHub secret \`${m.githubSecret}\`
  - Environments: ${m.environments.join(', ')}
  - Description: ${m.description}`)
  .join('\n\n')}

## Special Notes

### NEXT_PUBLIC_ Variables

Variables prefixed with \`NEXT_PUBLIC_\` are exposed to the browser. These should:
1. Use the same values as their server-side counterparts (e.g., \`NEXT_PUBLIC_SUPABASE_URL\` = \`SUPABASE_URL\`)
2. Be set in Vercel dashboard (not GitHub secrets)
3. Only contain non-sensitive configuration (never secrets!)

### Security Best Practices

- ✅ **DO** set server-side secrets in Vercel (encrypted)
- ✅ **DO** use \`NEXT_PUBLIC_\` prefix only for non-sensitive config
- ❌ **DON'T** expose secret keys with \`NEXT_PUBLIC_\` prefix
- ❌ **DON'T** commit environment variables to git

### Variable Mapping

| GitHub Secret | Vercel Key | Public? | Required |
|--------------|------------|---------|----------|
${ENV_MAPPINGS
  .map(m => `| \`${m.githubSecret}\` | \`${m.vercelKey}\` | ${m.isPublic ? 'Yes' : 'No'} | ${m.required ? 'Yes' : 'No'} |`)
  .join('\n')}

## Verification

After syncing variables:

1. **Check Vercel Dashboard**: Verify all variables are set correctly
2. **Test Deployment**: Trigger a new deployment and check build logs
3. **Runtime Check**: Use \`/api/health\` endpoint to verify environment configuration
4. **Client Check**: Verify \`NEXT_PUBLIC_\` variables are accessible in browser console

## Troubleshooting

### Variables not syncing from GitHub

- Check GitHub integration is enabled in Vercel project settings
- Some variables (especially \`NEXT_PUBLIC_\`) may need manual setup
- Verify GitHub secrets are set in repository settings

### Build failures due to missing variables

- Check Vercel build logs for specific missing variable names
- Ensure variables are set for the correct environment (Production/Preview)
- Verify variable names match exactly (case-sensitive)

### Client-side variables not accessible

- Ensure \`NEXT_PUBLIC_\` prefix is used correctly
- Check variable is set in Vercel dashboard (not just GitHub)
- Verify deployment includes the variable (may need to redeploy)

## Next Steps

1. ✅ Sync all critical variables using Method 1 (Vercel Dashboard)
2. ✅ Verify variables are set correctly
3. ✅ Test deployment to ensure everything works
4. ✅ Document any custom variables specific to your setup

For complete list of all environment variables, see \`docs/github-secrets-checklist.md\`.
`;

  return guide;
}

function generateVercelEnvJson(): VercelEnvVar[] {
  // This generates a template JSON file
  // Users will need to fill in actual values from GitHub secrets
  return ENV_MAPPINGS.map(m => ({
    key: m.vercelKey,
    value: `[REPLACE_WITH_VALUE_FROM_GITHUB_SECRET_${m.githubSecret}]`,
    type: m.isPublic ? 'plain' : 'encrypted',
    target: m.environments as ('production' | 'preview' | 'development')[],
    comment: m.description,
  }));
}

function main() {
  console.log('📝 Generating Vercel Environment Variable Sync Guide...\n');
  
  // Generate markdown guide
  const guide = generateSyncGuide();
  const guidePath = 'docs/vercel-env-sync-guide.md';
  writeFileSync(guidePath, guide);
  console.log(`✅ Generated: ${guidePath}`);
  
  // Generate JSON template
  const jsonTemplate = generateVercelEnvJson();
  const jsonPath = 'scripts/vercel-env-vars-template.json';
  writeFileSync(jsonPath, JSON.stringify(jsonTemplate, null, 2));
  console.log(`✅ Generated: ${jsonPath}`);
  
  console.log('\n📋 Summary:');
  console.log(`   Total variables to sync: ${ENV_MAPPINGS.length}`);
  console.log(`   Required variables: ${ENV_MAPPINGS.filter(m => m.required).length}`);
  console.log(`   Public (NEXT_PUBLIC_) variables: ${ENV_MAPPINGS.filter(m => m.isPublic).length}`);
  console.log(`   Private variables: ${ENV_MAPPINGS.filter(m => !m.isPublic).length}`);
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Review docs/vercel-env-sync-guide.md');
  console.log('   2. Use Vercel dashboard to add environment variables');
  console.log('   3. Copy values from GitHub secrets to Vercel');
  console.log('   4. Verify deployment works correctly');
}

if (require.main === module) {
  main();
}

export { generateSyncGuide, generateVercelEnvJson, ENV_MAPPINGS };
