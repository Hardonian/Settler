#!/usr/bin/env node
/**
 * Settler Clean-Install Script
 * 
 * Fixes EACCES permission errors and provides a clean reinstall workflow.
 * 
 * Usage:
 *   node scripts/clean-install.mjs         # Safe reinstall (skip cache)
 *   node scripts/clean-install.mjs --force  # Force clear pnpm cache
 * 
 * Or via pnpm:
 *   pnpm reinstall
 *   pnpm reinstall:force
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const args = process.argv.slice(2);
const forceClearCache = args.includes('--force') || args.includes('-f');
const dryRun = args.includes('--dry-run') || args.includes('-n');

const isWindows = process.platform === 'win32';
const rimraf = isWindows ? 'rimraf' : 'rm -rf';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logStep(step, msg) {
  console.log(`\n${colors.blue}Step ${step}:${colors.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function logWarning(msg) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function logError(msg) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function run(command, options = {}) {
  if (dryRun) {
    console.log(`[DRY RUN] Would execute: ${command}`);
    return;
  }
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: rootDir,
      ...options,
    });
    return true;
  } catch (error) {
    if (!options.continueOnError) {
      logError(`Command failed: ${command}`);
      process.exit(1);
    }
    return false;
  }
}

function deleteDirectory(dirPath, name) {
  const fullPath = path.join(rootDir, dirPath);
  if (fs.existsSync(fullPath)) {
    if (dryRun) {
      console.log(`[DRY RUN] Would delete: ${fullPath}`);
      return;
    }
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      logSuccess(`Removed ${name}: ${dirPath}`);
    } catch (error) {
      logWarning(`Could not remove ${dirPath}: ${error.message}`);
    }
  }
}

async function main() {
  console.log(`
${colors.bright}Settler Clean-Install${colors.reset}
${'='.repeat(50)}
`);

  if (dryRun) {
    logWarning('Running in DRY RUN mode - no changes will be made\n');
  }

  // Step 1: Detect platform and show info
  logStep(1, 'Detecting environment...');
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Working directory: ${rootDir}`);
  if (forceClearCache) {
    logWarning('  Cache clearing: ENABLED (--force flag)');
  } else {
    log('  Cache clearing: Disabled (use --force to enable)');
  }

  // Step 2: Remove node_modules directories
  logStep(2, 'Removing node_modules directories...');
  
  const modulesToRemove = [
    { path: 'node_modules', name: 'Root node_modules' },
    { path: 'packages/web/node_modules', name: 'Web node_modules' },
    { path: 'packages/api/node_modules', name: 'API node_modules' },
    { path: 'packages/sdk/node_modules', name: 'SDK node_modules' },
    { path: 'packages/cli/node_modules', name: 'CLI node_modules' },
    { path: 'packages/types/node_modules', name: 'Types node_modules' },
    { path: 'packages/protocol/node_modules', name: 'Protocol node_modules' },
    { path: 'packages/adapters/node_modules', name: 'Adapters node_modules' },
    { path: 'packages/edge-ai-core/node_modules', name: 'Edge AI Core node_modules' },
    { path: 'packages/edge-node/node_modules', name: 'Edge Node node_modules' },
    { path: 'packages/react-settler/node_modules', name: 'React Settler node_modules' },
  ];

  for (const { path: dirPath, name } of modulesToRemove) {
    deleteDirectory(dirPath, name);
  }

  // Step 3: Optionally clear pnpm cache
  if (forceClearCache) {
    logStep(3, 'Clearing pnpm cache...');
    try {
      run('pnpm store path', { continueOnError: true });
      run('pnpm store prune', { continueOnError: true });
      logSuccess('Cleared pnpm cache');
    } catch (e) {
      logWarning('Could not clear pnpm cache, continuing anyway');
    }
  } else {
    logStep(3, 'Skipping cache clear (use --force to clear)');
  }

  // Step 4: Reinstall dependencies
  logStep(4, 'Installing dependencies...');
  console.log('  Running: pnpm install\n');
  
  const installSuccess = run('pnpm install');
  
  if (!installSuccess) {
    logError('pnpm install failed!');
    console.log(`
${colors.yellow}Troubleshooting suggestions:${colors.reset}
1. Try running with cache cleared: pnpm reinstall:force
2. Check Node.js version: node --version (should be 24.x)
3. Check pnpm version: pnpm --version (should be 10.13+)
4. For ownership issues on Unix: sudo chown -R $(whoami) .
5. On Windows: Run PowerShell as Administrator or enable Developer Mode
`);
    process.exit(1);
  }

  logSuccess('Dependencies installed successfully!');

  // Step 5: Verify installation
  logStep(5, 'Verifying installation...');
  
  const verificationChecks = [
    { check: 'node_modules exists', test: () => fs.existsSync(path.join(rootDir, 'node_modules')) },
    { check: 'pnpm-lock.yaml exists', test: () => fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml')) },
  ];

  let allPassed = true;
  for (const { check, test } of verificationChecks) {
    if (test()) {
      logSuccess(check);
    } else {
      logError(check);
      allPassed = false;
    }
  }

  if (!allPassed) {
    logError('Some verification checks failed!');
    process.exit(1);
  }

  console.log(`
${colors.green}${'='.repeat(50)}
Clean-install completed successfully!${colors.reset}

Next steps:
  - Run: pnpm dev          (start development)
  - Run: pnpm verify       (run full verification)
  - Run: pnpm doctor       (diagnose issues)
`);
}

main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
