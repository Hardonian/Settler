#!/usr/bin/env node
/**
 * Vercel Build Optimizer
 * 
 * Optimizes build environment and configuration for Vercel deployments.
 * Runs before Next.js build to ensure optimal build performance and reliability.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Build Optimizer\n');

// Set optimal environment variables for build
const optimizations = {
  // Prisma optimizations
  PRISMA_CLIENT_ENGINE_TYPE: 'binary',
  PRISMA_ENGINES_MIRROR: '',
  
  // Node.js optimizations
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
  NODE_ENV: 'production',
  
  // Next.js optimizations
  NEXT_TELEMETRY_DISABLED: '1',
  
  // Build phase indicator
  NEXT_PHASE: 'phase-production-build',
};

// Apply optimizations
Object.entries(optimizations).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
    console.log(`  ✓ Set ${key}=${value}`);
  }
});

// Verify Prisma client is available
const prismaClientPath = path.join(process.cwd(), 'node_modules/@prisma/client');
if (!fs.existsSync(prismaClientPath)) {
  console.warn('  ⚠️  Prisma Client not found. Ensure prisma:generate runs before build.');
} else {
  console.log('  ✓ Prisma Client available');
}

// Check for common issues
const issues = [];

// Check memory allocation
const nodeOptions = process.env.NODE_OPTIONS || '';
if (!nodeOptions.includes('--max-old-space-size')) {
  issues.push('Consider setting NODE_OPTIONS="--max-old-space-size=4096" for large builds');
}

if (issues.length > 0) {
  console.log('\n⚠️  Recommendations:');
  issues.forEach(issue => console.log(`  • ${issue}`));
}

console.log('\n✅ Build environment optimized for Vercel\n');
