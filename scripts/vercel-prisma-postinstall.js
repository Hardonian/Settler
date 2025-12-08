#!/usr/bin/env node
/**
 * Prisma Postinstall Guard
 * 
 * Safely runs Prisma generate only when:
 * 1. Prisma schema exists
 * 2. Not in a CI/build environment that will handle it separately
 * 3. Node modules are properly installed
 * 
 * This prevents SIGKILL errors from Prisma trying to download binaries
 * during Vercel builds when dependencies aren't fully resolved.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PRISMA_SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const IS_VERCEL = process.env.VERCEL === '1';
const IS_CI = process.env.CI === 'true' || process.env.CI === '1';
const NODE_ENV = process.env.NODE_ENV || 'development';

function checkPrismaSchema() {
  return fs.existsSync(PRISMA_SCHEMA_PATH);
}

function checkNodeModules() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  const prismaPath = path.join(nodeModulesPath, '@prisma', 'client');
  return fs.existsSync(nodeModulesPath) && fs.existsSync(prismaPath);
}

function shouldRunPrismaGenerate() {
  // In Vercel, Prisma generate should run during build, not postinstall
  if (IS_VERCEL) {
    console.log('⏭️  Skipping Prisma generate in Vercel build (will run during build step)');
    return false;
  }

  // In CI, let the build process handle it
  if (IS_CI && NODE_ENV === 'production') {
    console.log('⏭️  Skipping Prisma generate in CI (will run during build step)');
    return false;
  }

  // Check if schema exists
  if (!checkPrismaSchema()) {
    console.log('⏭️  Skipping Prisma generate (schema.prisma not found)');
    return false;
  }

  // Check if node_modules are installed
  if (!checkNodeModules()) {
    console.log('⏭️  Skipping Prisma generate (node_modules not installed)');
    return false;
  }

  return true;
}

function runPrismaGenerate() {
  try {
    console.log('🔧 Running Prisma generate...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        // Prevent Prisma from trying to download platform-specific binaries
        PRISMA_SKIP_POSTINSTALL_GENERATE: 'false',
      },
    });
    console.log('✅ Prisma generate completed successfully');
  } catch (error) {
    // Don't fail the install if Prisma generate fails
    // It will be retried during the build step
    console.warn('⚠️  Prisma generate failed (non-fatal):', error.message);
    console.warn('   This will be retried during the build step');
  }
}

function main() {
  if (shouldRunPrismaGenerate()) {
    runPrismaGenerate();
  }
}

if (require.main === module) {
  main();
}

module.exports = { shouldRunPrismaGenerate, runPrismaGenerate };
