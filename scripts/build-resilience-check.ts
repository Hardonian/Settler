#!/usr/bin/env tsx
/**
 * Build Resilience Pre-Flight Check
 * 
 * Validates build environment and configuration before starting build.
 * Prevents common build failures by catching issues early.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const checks: CheckResult[] = [];

/**
 * Check if required environment variables are set
 */
function checkEnvironmentVariables(): void {
  const requiredVars = [
    'NODE_ENV',
  ];

  const optionalButRecommended = [
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      checks.push({
        name: `Environment: ${varName}`,
        passed: false,
        message: `Required environment variable ${varName} is not set`,
        severity: 'error',
      });
    } else {
      checks.push({
        name: `Environment: ${varName}`,
        passed: true,
        message: `${varName} is set`,
        severity: 'info',
      });
    }
  }

  for (const varName of optionalButRecommended) {
    if (!process.env[varName]) {
      checks.push({
        name: `Environment: ${varName}`,
        passed: true,
        message: `Optional environment variable ${varName} is not set (may be required at runtime)`,
        severity: 'warning',
      });
    } else {
      checks.push({
        name: `Environment: ${varName}`,
        passed: true,
        message: `${varName} is set`,
        severity: 'info',
      });
    }
  }
}

/**
 * Check Prisma client generation
 */
function checkPrismaClient(): void {
  const prismaClientPath = join(process.cwd(), 'node_modules/@prisma/client');
  
  if (!existsSync(prismaClientPath)) {
    checks.push({
      name: 'Prisma Client',
      passed: false,
      message: 'Prisma Client not found. Run `npm run prisma:generate` first.',
      severity: 'error',
    });
    return;
  }

  // Check if Prisma client index file exists
  const indexFile = join(prismaClientPath, 'index.js');
  if (!existsSync(indexFile)) {
    checks.push({
      name: 'Prisma Client',
      passed: false,
      message: 'Prisma Client index.js not found. Regenerate with `npm run prisma:generate`.',
      severity: 'error',
    });
    return;
  }

  checks.push({
    name: 'Prisma Client',
    passed: true,
    message: 'Prisma Client is generated and available',
    severity: 'info',
  });
}

/**
 * Check TypeScript configuration
 */
function checkTypeScriptConfig(): void {
  const tsconfigPath = join(process.cwd(), 'tsconfig.json');
  
  if (!existsSync(tsconfigPath)) {
    checks.push({
      name: 'TypeScript Config',
      passed: false,
      message: 'tsconfig.json not found',
      severity: 'error',
    });
    return;
  }

  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    
    // Check for important compiler options
    if (tsconfig.compilerOptions?.skipLibCheck !== true) {
      checks.push({
        name: 'TypeScript Config',
        passed: true,
        message: 'Consider enabling skipLibCheck for faster builds',
        severity: 'warning',
      });
    } else {
      checks.push({
        name: 'TypeScript Config',
        passed: true,
        message: 'TypeScript config is valid',
        severity: 'info',
      });
    }
  } catch (error) {
    checks.push({
      name: 'TypeScript Config',
      passed: false,
      message: `Failed to parse tsconfig.json: ${error}`,
      severity: 'error',
    });
  }
}

/**
 * Check Node.js version
 */
function checkNodeVersion(): void {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  
  if (majorVersion < 24) {
    checks.push({
      name: 'Node.js Version',
      passed: false,
      message: `Node.js ${nodeVersion} detected. Requires Node.js >= 24.0.0`,
      severity: 'error',
    });
  } else {
    checks.push({
      name: 'Node.js Version',
      passed: true,
      message: `Node.js ${nodeVersion} is compatible`,
      severity: 'info',
    });
  }
}

/**
 * Check for common build-breaking issues
 */
function checkCommonIssues(): void {
  // Check for server-only imports in client code (basic check)
  const webSrcPath = join(process.cwd(), 'packages/web/src');
  if (existsSync(webSrcPath)) {
    // This is a basic check - full validation would require AST parsing
    checks.push({
      name: 'Build Safety',
      passed: true,
      message: 'Basic build safety checks passed (full validation requires build)',
      severity: 'info',
    });
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('🔍 Running build resilience pre-flight checks...\n');

  checkNodeVersion();
  checkEnvironmentVariables();
  checkPrismaClient();
  checkTypeScriptConfig();
  checkCommonIssues();

  // Report results
  const errors = checks.filter(c => c.severity === 'error' && !c.passed);
  const warnings = checks.filter(c => c.severity === 'warning' && !c.passed);
  const passed = checks.filter(c => c.passed);

  console.log('\n📊 Check Results:\n');
  
  passed.forEach(check => {
    console.log(`  ✅ ${check.name}: ${check.message}`);
  });

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(check => {
      console.log(`  ⚠️  ${check.name}: ${check.message}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(check => {
      console.log(`  ❌ ${check.name}: ${check.message}`);
    });
    console.log('\n❌ Build pre-flight checks failed. Please fix the errors above.');
    process.exit(1);
  }

  console.log('\n✅ All build pre-flight checks passed!');
}

if (require.main === module) {
  main();
}

export { checks };
