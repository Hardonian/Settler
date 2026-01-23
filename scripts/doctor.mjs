#!/usr/bin/env node
/**
 * Settler Doctor Script - Production-Ready Health Check
 *
 * Validates operational readiness without external dependencies
 * Usage: node scripts/doctor.mjs
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const results = [];

function addResult(name, status, message, fix) {
  results.push({ name, status, message, fix });
}

// ============================================================================
// CRITICAL CHECKS
// ============================================================================

function checkNodeVersion() {
  const requiredMajor = 24;
  const currentVersion = process.version;
  const majorVersion = parseInt(currentVersion.slice(1).split('.')[0]);

  if (majorVersion >= requiredMajor) {
    addResult('Node Version', 'ok', `Node ${currentVersion} meets requirement (>=${requiredMajor}.0.0)`);
  } else {
    addResult(
      'Node Version',
      'error',
      `Node ${currentVersion} does not meet requirement (>=${requiredMajor}.0.0)`,
      `CRITICAL: Upgrade to Node.js ${requiredMajor}+ immediately. Current version may cause runtime failures.`
    );
  }
}

function checkRequiredEnvVars() {
  // Load .env file if exists
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    });
  }

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const criticalVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missingRequired = requiredVars.filter(v => !process.env[v]);
  const missingCritical = criticalVars.filter(v => !process.env[v]);

  if (missingRequired.length === 0 && missingCritical.length === 0) {
    addResult('Environment Variables', 'ok', 'All critical environment variables are set');
  } else if (missingRequired.length > 0) {
    addResult(
      'Required Environment Variables',
      'error',
      `Missing: ${missingRequired.join(', ')}`,
      'Set these variables in .env file. Copy from .env.example'
    );
  }

  if (missingCritical.length > 0) {
    addResult(
      'Critical Environment Variables',
      'warning',
      `Missing for production: ${missingCritical.join(', ')}`,
      'Required for production deployment'
    );
  }

  // Check for insecure defaults
  if (process.env.JWT_SECRET?.includes('dev-secret')) {
    addResult(
      'JWT Secret Security',
      'error',
      'Using default development JWT_SECRET',
      'SECURITY RISK: Generate secure secret with: openssl rand -base64 32'
    );
  }

  if (process.env.ENCRYPTION_KEY?.includes('dev-encryption')) {
    addResult(
      'Encryption Key Security',
      'error',
      'Using default development ENCRYPTION_KEY',
      'SECURITY RISK: Generate secure key with: openssl rand -hex 16'
    );
  }
}

function checkWorkspaceIntegrity() {
  const criticalFiles = [
    { path: 'package.json', name: 'Root package.json' },
    { path: 'packages/web/package.json', name: 'Web package' },
    { path: 'packages/api/package.json', name: 'API package' },
    { path: 'tsconfig.json', name: 'TypeScript config' },
    { path: 'turbo.json', name: 'Turbo config' },
    { path: '.env.example', name: 'Environment template' },
  ];

  let allOk = true;
  for (const file of criticalFiles) {
    const fullPath = path.join(rootDir, file.path);
    if (fs.existsSync(fullPath)) {
      addResult(file.name, 'ok', `Found at ${file.path}`);
    } else {
      addResult(file.name, 'error', `Missing: ${file.path}`);
      allOk = false;
    }
  }

  // Check node_modules
  const nodeModulesPath = path.join(rootDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    addResult(
      'Dependencies',
      'error',
      'node_modules not found',
      'Run: pnpm install'
    );
  } else {
    // Check if pnpm lockfile exists
    const lockfilePath = path.join(rootDir, 'pnpm-lock.yaml');
    if (fs.existsSync(lockfilePath)) {
      addResult('Dependencies', 'ok', 'Dependencies installed (pnpm)');
    } else {
      addResult('Dependencies', 'warning', 'Lockfile missing or inconsistent');
    }
  }
}

function checkPackageManager() {
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
    addResult('Package Manager', 'ok', `pnpm ${pnpmVersion} available`);
  } catch {
    addResult(
      'Package Manager',
      'error',
      'pnpm not found',
      'Install pnpm: npm install -g pnpm@10.13.1'
    );
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: rootDir });
    if (status.trim().length === 0) {
      addResult('Git Status', 'ok', 'Working directory is clean');
    } else {
      const lines = status.trim().split('\n').length;
      addResult(
        'Git Status',
        'warning',
        `${lines} file(s) with uncommitted changes`,
        'Commit or stash changes before deployment'
      );
    }
  } catch {
    addResult('Git Status', 'warning', 'Not a git repository');
  }
}

function checkDiskSpace() {
  try {
    const df = execSync('df -h .', { encoding: 'utf-8' });
    const lines = df.split('\n');
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      const usage = parts[4];
      const usagePercent = parseInt(usage);

      if (usagePercent > 90) {
        addResult('Disk Space', 'error', `${usage} used`, 'Free up disk space');
      } else if (usagePercent > 75) {
        addResult('Disk Space', 'warning', `${usage} used`, 'Consider freeing up space');
      } else {
        addResult('Disk Space', 'ok', `${usage} used`);
      }
    }
  } catch {
    addResult('Disk Space', 'warning', 'Could not check disk space');
  }
}

function checkMemory() {
  try {
    const free = execSync('free -h', { encoding: 'utf-8' });
    const lines = free.split('\n');
    if (lines.length > 1) {
      const memLine = lines[1];
      addResult('Memory', 'ok', 'System memory checked');
    }
  } catch {
    // Not critical, skip
  }
}

// ============================================================================
// RUNTIME CHECKS
// ============================================================================

function checkDatabaseConnection() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (!dbUrl) {
    addResult(
      'Database Connection',
      'warning',
      'No DATABASE_URL configured',
      'Set DATABASE_URL to enable database connectivity check'
    );
    return;
  }

  // Don't actually connect - just validate format
  try {
    const url = new URL(dbUrl);
    if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
      addResult('Database URL Format', 'ok', 'DATABASE_URL format is valid');
    } else {
      addResult('Database URL Format', 'error', `Invalid protocol: ${url.protocol}`);
    }
  } catch (e) {
    addResult('Database URL Format', 'error', 'DATABASE_URL is malformed');
  }
}

function checkBuildArtifacts() {
  const artifacts = [
    { path: 'packages/api/dist', name: 'API build' },
    { path: 'packages/web/.next', name: 'Web build' },
  ];

  for (const artifact of artifacts) {
    const fullPath = path.join(rootDir, artifact.path);
    if (fs.existsSync(fullPath)) {
      addResult(artifact.name, 'ok', 'Build artifacts present');
    } else {
      addResult(artifact.name, 'warning', 'Not built yet', 'Run: pnpm build');
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🏥 Settler Doctor - Operational Readiness Check\n');
  console.log('Checking system health...\n');

  // Critical checks first
  checkNodeVersion();
  checkPackageManager();
  checkRequiredEnvVars();
  checkWorkspaceIntegrity();

  // Runtime checks
  checkDatabaseConnection();
  checkGitStatus();

  // Performance checks
  checkDiskSpace();
  checkMemory();

  // Build checks
  checkBuildArtifacts();

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80) + '\n');

  const errors = results.filter((r) => r.status === 'error');
  const warnings = results.filter((r) => r.status === 'warning');
  const ok = results.filter((r) => r.status === 'ok');

  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix before deployment):\n');
    errors.forEach((result) => {
      console.log(`  ${result.name}:`);
      console.log(`    Status: ${result.message}`);
      if (result.fix) {
        console.log(`    Fix: ${result.fix}`);
      }
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (recommended to fix):\n');
    warnings.forEach((result) => {
      console.log(`  ${result.name}:`);
      console.log(`    Status: ${result.message}`);
      if (result.fix) {
        console.log(`    Fix: ${result.fix}`);
      }
      console.log('');
    });
  }

  console.log(`✅ Passed: ${ok.length} / ${results.length} checks\n`);

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total checks: ${results.length}`);
  console.log(`✅ Passed: ${ok.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('❌ SYSTEM NOT READY: Fix errors before proceeding\n');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('⚠️  SYSTEM READY WITH WARNINGS: Review warnings before production deployment\n');
    process.exit(0);
  } else {
    console.log('✅ SYSTEM READY: All checks passed\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Doctor script failed:', error.message);
  process.exit(1);
});
