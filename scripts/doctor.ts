#!/usr/bin/env tsx
/**
 * Settler Doctor Script
 * 
 * Checks system health and configuration:
 * - Node version
 * - Environment variables (without printing secrets)
 * - Database connectivity
 * - Stripe configuration
 * - Workspace health
 * 
 * Usage: npm run doctor
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  fix?: string;
}

const results: CheckResult[] = [];

function addResult(name: string, status: 'ok' | 'warning' | 'error', message: string, fix?: string) {
  results.push({ name, status, message, fix });
}

function checkNodeVersion() {
  const requiredVersion = '>=24.0.0';
  const currentVersion = process.version;
  const majorVersion = parseInt(currentVersion.slice(1).split('.')[0]);

  if (majorVersion >= 24) {
    addResult('Node Version', 'ok', `Node ${currentVersion} meets requirement (${requiredVersion})`);
  } else {
    addResult(
      'Node Version',
      'error',
      `Node ${currentVersion} does not meet requirement (${requiredVersion})`,
      'Upgrade Node.js to version 24 or higher'
    );
  }
}

function checkEnvVars() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const optionalVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'DATABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    }
  }

  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    }
  }

  if (missingRequired.length === 0) {
    addResult('Required Environment Variables', 'ok', 'All required environment variables are set');
  } else {
    addResult(
      'Required Environment Variables',
      'error',
      `Missing required variables: ${missingRequired.join(', ')}`,
      `Set the following environment variables: ${missingRequired.join(', ')}`
    );
  }

  if (missingOptional.length > 0) {
    addResult(
      'Optional Environment Variables',
      'warning',
      `Missing optional variables: ${missingOptional.join(', ')}`,
      'These are recommended for full functionality'
    );
  } else {
    addResult('Optional Environment Variables', 'ok', 'All optional environment variables are set');
  }
}

async function checkDatabaseConnectivity() {
  if (!process.env.DATABASE_URL && !process.env.SUPABASE_DATABASE_URL) {
    addResult(
      'Database Connectivity',
      'warning',
      'No database URL configured',
      'Set DATABASE_URL or SUPABASE_DATABASE_URL for database checks'
    );
    return;
  }

  try {
    // Try to import Prisma client
    const { prisma } = await import('../packages/web/src/shared/db/prismaClient');
    
    // Simple query to test connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    addResult('Database Connectivity', 'ok', 'Database connection successful');
  } catch (error) {
    addResult(
      'Database Connectivity',
      'error',
      `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
      'Check DATABASE_URL and ensure database is accessible'
    );
  }
}

function checkStripeConfig() {
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

  if (hasSecretKey && hasWebhookSecret) {
    addResult('Stripe Configuration', 'ok', 'Stripe is fully configured');
  } else if (hasSecretKey) {
    addResult(
      'Stripe Configuration',
      'warning',
      'Stripe secret key is set but webhook secret is missing',
      'Set STRIPE_WEBHOOK_SECRET for webhook handling'
    );
  } else {
    addResult(
      'Stripe Configuration',
      'warning',
      'Stripe is not configured',
      'Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET for billing functionality'
    );
  }
}

function checkWorkspaceHealth() {
  const checks: Array<{ path: string; name: string; required: boolean }> = [
    { path: 'package.json', name: 'Root package.json', required: true },
    { path: 'packages/web/package.json', name: 'Web package.json', required: true },
    { path: 'packages/api/package.json', name: 'API package.json', required: true },
    { path: 'tsconfig.json', name: 'TypeScript config', required: true },
    { path: 'turbo.json', name: 'Turbo config', required: true },
  ];

  let allOk = true;
  for (const check of checks) {
    const fullPath = path.join(process.cwd(), check.path);
    if (fs.existsSync(fullPath)) {
      addResult(check.name, 'ok', `Found at ${check.path}`);
    } else {
      if (check.required) {
        addResult(check.name, 'error', `Missing required file: ${check.path}`);
        allOk = false;
      } else {
        addResult(check.name, 'warning', `Optional file missing: ${check.path}`);
      }
    }
  }

  // Check node_modules
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    addResult(
      'Dependencies',
      'warning',
      'node_modules not found',
      'Run npm ci to install dependencies'
    );
  } else {
    addResult('Dependencies', 'ok', 'node_modules directory exists');
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim().length === 0) {
      addResult('Git Status', 'ok', 'Working directory is clean');
    } else {
      addResult(
        'Git Status',
        'warning',
        'Working directory has uncommitted changes',
        'Consider committing or stashing changes'
      );
    }
  } catch (error) {
    addResult('Git Status', 'warning', 'Could not check git status (not a git repo?)');
  }
}

async function checkMigrations() {
  try {
    const { prisma } = await import('../packages/web/src/shared/db/prismaClient');
    const migrationStatus = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 5
    `.catch(() => []);

    if (migrationStatus.length === 0) {
      addResult(
        'Database Migrations',
        'warning',
        'Could not verify migrations (table might not exist)',
        'Run prisma migrate deploy to ensure migrations are applied'
      );
    } else {
      addResult(
        'Database Migrations',
        'ok',
        `${migrationStatus.length} recent migrations found`
      );
    }
  } catch (error) {
    addResult(
      'Database Migrations',
      'warning',
      `Could not check migrations: ${error instanceof Error ? error.message : String(error)}`,
      'Ensure Prisma is properly configured'
    );
  }
}

async function checkSupabaseResources() {
  const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const hasAllVars = requiredEnvVars.every((v) => process.env[v]);

  if (!hasAllVars) {
    addResult(
      'Supabase Resources',
      'warning',
      'Supabase environment variables not fully configured',
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
    return;
  }

  try {
    const { createClient } = await import('../packages/web/src/lib/supabase/server');
    const supabase = await createClient();

    // Check if core tables exist
    const { error: tenantsError } = await supabase.from('tenants').select('id').limit(1);
    const { error: jobsError } = await supabase.from('jobs' as any).select('id').limit(1).catch(() => ({ error: null }));

    if (tenantsError && !tenantsError.message.includes('permission')) {
      addResult(
        'Supabase Resources',
        'error',
        `Core tables may not exist: ${tenantsError.message}`,
        'Run database migrations: npm run db:migrate'
      );
    } else {
      addResult('Supabase Resources', 'ok', 'Core tables accessible');
    }
  } catch (error) {
    addResult(
      'Supabase Resources',
      'warning',
      `Could not verify Supabase resources: ${error instanceof Error ? error.message : String(error)}`,
      'Check Supabase connection and ensure tables exist'
    );
  }
}

async function checkDatabaseIntegrity() {
  try {
    const { prisma } = await import('../packages/web/src/shared/db/prismaClient');

    // Check if expected tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LIMIT 10
    `.catch(() => []);

    if (tables.length === 0) {
      addResult(
        'Database Integrity',
        'warning',
        'Could not verify database tables',
        'Ensure database is accessible and migrations are applied'
      );
    } else {
      addResult(
        'Database Integrity',
        'ok',
        `Database accessible, ${tables.length}+ tables found`
      );
    }
  } catch (error) {
    addResult(
      'Database Integrity',
      'warning',
      `Could not check database integrity: ${error instanceof Error ? error.message : String(error)}`,
      'Check DATABASE_URL and ensure database is accessible'
    );
  }
}

async function main() {
  console.log('🏥 Settler Doctor - System Health Check\n');

  checkNodeVersion();
  checkEnvVars();
  await checkDatabaseConnectivity();
  await checkMigrations();
  await checkSupabaseResources();
  await checkDatabaseIntegrity();
  checkStripeConfig();
  checkWorkspaceHealth();
  checkGitStatus();

  // Print results
  console.log('\n📊 Results:\n');

  const errors = results.filter((r) => r.status === 'error');
  const warnings = results.filter((r) => r.status === 'warning');
  const ok = results.filter((r) => r.status === 'ok');

  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    errors.forEach((result) => {
      console.log(`  ${result.name}: ${result.message}`);
      if (result.fix) {
        console.log(`    Fix: ${result.fix}`);
      }
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach((result) => {
      console.log(`  ${result.name}: ${result.message}`);
      if (result.fix) {
        console.log(`    Fix: ${result.fix}`);
      }
    });
    console.log('');
  }

  console.log(`✅ Passed: ${ok.length} checks\n`);

  // Summary
  const total = results.length;
  const passed = ok.length;
  const failed = errors.length;

  console.log(`\n📈 Summary: ${passed}/${total} checks passed`);

  if (failed > 0) {
    console.log(`\n❌ ${failed} error(s) found. Please fix them before proceeding.`);
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warning(s) found. Review and fix as needed.`);
    process.exit(0);
  } else {
    console.log('\n✅ All checks passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Doctor script failed:', error);
  process.exit(1);
});
