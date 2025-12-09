#!/usr/bin/env node
/**
 * Vercel Build Optimizer
 * 
 * Pre-build validation and optimization checks for Vercel deployments.
 * Ensures build will succeed and provides helpful error messages.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'packages', 'web');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNodeVersion() {
  log('\n🔍 Checking Node.js version...', 'cyan');
  const nodeVersion = process.version;
  const requiredMajor = 24;
  const currentMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (currentMajor < requiredMajor) {
    log(`❌ Node.js ${nodeVersion} is too old. Required: >=${requiredMajor}.0.0`, 'red');
    log('   Set NODE_VERSION=24 in Vercel project settings', 'yellow');
    return false;
  }
  
  log(`✅ Node.js ${nodeVersion} is compatible`, 'green');
  return true;
}

function checkDependencies() {
  log('\n🔍 Checking dependencies...', 'cyan');
  
  const packageJsonPath = path.join(WEB_DIR, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found', 'red');
    return false;
  }
  
  const nodeModulesPath = path.join(WEB_DIR, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('⚠️  node_modules not found - will be installed during build', 'yellow');
    return true;
  }
  
  log('✅ Dependencies present', 'green');
  return true;
}

function checkTypeScriptConfig() {
  log('\n🔍 Checking TypeScript configuration...', 'cyan');
  
  const tsconfigPath = path.join(WEB_DIR, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    log('❌ tsconfig.json not found', 'red');
    return false;
  }
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    if (!tsconfig.compilerOptions.incremental) {
      log('⚠️  Incremental compilation not enabled - build may be slower', 'yellow');
    }
    
    if (tsconfig.compilerOptions.skipLibCheck !== true) {
      log('⚠️  skipLibCheck should be true for faster builds', 'yellow');
    }
    
    log('✅ TypeScript configuration valid', 'green');
    return true;
  } catch (error) {
    log(`❌ Invalid tsconfig.json: ${error.message}`, 'red');
    return false;
  }
}

function checkWorkspaceDependencies() {
  log('\n🔍 Checking workspace dependencies...', 'cyan');
  
  const requiredPackages = ['@settler/api', '@settler/sdk', '@settler/types', '@settler/protocol', '@settler/react-settler'];
  const missing = [];
  
  for (const pkg of requiredPackages) {
    const pkgPath = path.join(ROOT_DIR, 'packages', pkg.replace('@settler/', ''), 'dist');
    if (!fs.existsSync(pkgPath)) {
      missing.push(pkg);
    }
  }
  
  if (missing.length > 0) {
    log(`⚠️  Workspace packages not built: ${missing.join(', ')}`, 'yellow');
    log('   These will be built by Turbo before web build', 'yellow');
    return true; // Not a blocker - Turbo will handle it
  }
  
  log('✅ Workspace dependencies ready', 'green');
  return true;
}

function checkEnvironmentVariables() {
  log('\n🔍 Checking environment variables...', 'cyan');
  
  const required = ['NODE_VERSION'];
  const recommended = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  
  const missing = required.filter(key => !process.env[key]);
  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log(`❌ Missing required env vars: ${missing.join(', ')}`, 'red');
    return false;
  }
  
  if (missingRecommended.length > 0) {
    log(`⚠️  Missing recommended env vars: ${missingRecommended.join(', ')}`, 'yellow');
    log('   App may not function correctly at runtime', 'yellow');
  }
  
  log('✅ Environment variables check passed', 'green');
  return true;
}

function checkBuildCache() {
  log('\n🔍 Checking build cache...', 'cyan');
  
  const cacheDirs = ['.next', 'dist', 'out'];
  const found = cacheDirs.filter(dir => {
    const dirPath = path.join(WEB_DIR, dir);
    return fs.existsSync(dirPath);
  });
  
  if (found.length > 0) {
    log(`ℹ️  Found cache directories: ${found.join(', ')}`, 'blue');
    log('   These will be cleaned before build', 'blue');
  } else {
    log('✅ No stale cache found', 'green');
  }
  
  return true;
}

function runQuickTypeCheck() {
  log('\n🔍 Running quick type check...', 'cyan');
  
  try {
    // Quick check - just verify TypeScript can parse files
    execSync('npx tsc --noEmit --skipLibCheck', {
      cwd: WEB_DIR,
      stdio: 'pipe',
      timeout: 30000, // 30 second timeout
    });
    log('✅ Type check passed', 'green');
    return true;
  } catch (error) {
    log('❌ Type check failed', 'red');
    log('   Run "npm run typecheck" locally to see errors', 'yellow');
    return false;
  }
}

function main() {
  log('🚀 Vercel Build Optimizer', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  const checks = [
    { name: 'Node.js Version', fn: checkNodeVersion, critical: true },
    { name: 'Dependencies', fn: checkDependencies, critical: false },
    { name: 'TypeScript Config', fn: checkTypeScriptConfig, critical: true },
    { name: 'Workspace Dependencies', fn: checkWorkspaceDependencies, critical: false },
    { name: 'Environment Variables', fn: checkEnvironmentVariables, critical: true },
    { name: 'Build Cache', fn: checkBuildCache, critical: false },
    { name: 'Type Check', fn: runQuickTypeCheck, critical: true },
  ];
  
  const results = [];
  let hasErrors = false;
  
  for (const check of checks) {
    try {
      const result = check.fn();
      results.push({ name: check.name, passed: result, critical: check.critical });
      if (!result && check.critical) {
        hasErrors = true;
      }
    } catch (error) {
      log(`❌ ${check.name} check failed: ${error.message}`, 'red');
      results.push({ name: check.name, passed: false, critical: check.critical });
      if (check.critical) {
        hasErrors = true;
      }
    }
  }
  
  log('\n' + '='.repeat(50), 'cyan');
  log('\n📊 Summary:', 'cyan');
  
  for (const result of results) {
    const icon = result.passed ? '✅' : (result.critical ? '❌' : '⚠️');
    const color = result.passed ? 'green' : (result.critical ? 'red' : 'yellow');
    log(`${icon} ${result.name}`, color);
  }
  
  if (hasErrors) {
    log('\n❌ Build validation failed. Fix errors above before deploying.', 'red');
    process.exit(1);
  }
  
  log('\n✅ All checks passed! Build should succeed.', 'green');
  log('\n💡 Tips for faster builds:', 'cyan');
  log('   - Enable Turbo remote caching', 'blue');
  log('   - Use incremental TypeScript compilation', 'blue');
  log('   - Cache node_modules between builds', 'blue');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { main };
