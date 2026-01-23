#!/usr/bin/env node
/**
 * Settler Clean Script - Remove Build Artifacts
 *
 * Comprehensive cleanup of all build artifacts and caches.
 * Safe to run at any time.
 *
 * Usage:
 *   node scripts/clean.mjs           # Clean build artifacts only
 *   node scripts/clean.mjs --deps    # Also remove node_modules
 *   node scripts/clean.mjs --all     # Full clean (including lock files)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const args = process.argv.slice(2);
const cleanDeps = args.includes('--deps') || args.includes('--all');
const cleanAll = args.includes('--all');

function deleteIfExists(targetPath, name) {
  const fullPath = path.join(rootDir, targetPath);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removing ${name}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`   ✅ Removed ${targetPath}`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove ${targetPath}: ${error.message}`);
    }
  }
}

console.log('🧹 Settler Clean - Removing Build Artifacts\n');

// Clean build outputs
console.log('Cleaning build artifacts...\n');
deleteIfExists('packages/web/.next', 'Next.js build');
deleteIfExists('packages/web/dist', 'Web dist');
deleteIfExists('packages/api/dist', 'API dist');
deleteIfExists('packages/sdk/dist', 'SDK dist');
deleteIfExists('packages/cli/dist', 'CLI dist');
deleteIfExists('packages/types/dist', 'Types dist');
deleteIfExists('packages/protocol/dist', 'Protocol dist');
deleteIfExists('packages/adapters/dist', 'Adapters dist');
deleteIfExists('packages/edge-ai-core/dist', 'Edge AI Core dist');
deleteIfExists('packages/edge-node/dist', 'Edge Node dist');
deleteIfExists('packages/react-settler/dist', 'React Settler dist');

// Clean TypeScript build info
console.log('\nCleaning TypeScript build info...\n');
deleteIfExists('packages/web/tsconfig.tsbuildinfo', 'Web TS build info');
deleteIfExists('packages/api/tsconfig.tsbuildinfo', 'API TS build info');

// Clean Turbo cache
console.log('\nCleaning Turbo cache...\n');
deleteIfExists('.turbo', 'Turbo cache');
deleteIfExists('node_modules/.cache', 'Node modules cache');

// Clean test coverage
console.log('\nCleaning test coverage...\n');
deleteIfExists('coverage', 'Test coverage');
deleteIfExists('packages/api/coverage', 'API coverage');
deleteIfExists('packages/sdk/coverage', 'SDK coverage');

// Clean Playwright artifacts
console.log('\nCleaning test artifacts...\n');
deleteIfExists('playwright-report', 'Playwright report');
deleteIfExists('test-results', 'Test results');

// Clean dependencies if requested
if (cleanDeps) {
  console.log('\n⚠️  Cleaning dependencies (--deps flag)...\n');
  deleteIfExists('node_modules', 'Root node_modules');

  // Clean package node_modules
  const packages = [
    'packages/web',
    'packages/api',
    'packages/sdk',
    'packages/cli',
    'packages/types',
    'packages/protocol',
    'packages/adapters',
    'packages/edge-ai-core',
    'packages/edge-node',
    'packages/react-settler',
  ];

  packages.forEach((pkg) => {
    deleteIfExists(path.join(pkg, 'node_modules'), `${pkg} node_modules`);
  });
}

// Clean lock files if requested
if (cleanAll) {
  console.log('\n⚠️  Full clean (--all flag)...\n');
  deleteIfExists('pnpm-lock.yaml', 'pnpm lock file');
  deleteIfExists('package-lock.json', 'npm lock file');
  deleteIfExists('yarn.lock', 'yarn lock file');
}

console.log('\n✅ Clean complete!\n');

if (cleanDeps) {
  console.log('⚠️  Dependencies removed. Run: pnpm install\n');
} else {
  console.log('💡 To also clean dependencies, run: node scripts/clean.mjs --deps\n');
  console.log('💡 For a full clean, run: node scripts/clean.mjs --all\n');
}
