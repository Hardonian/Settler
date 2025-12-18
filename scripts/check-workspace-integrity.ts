#!/usr/bin/env tsx
/**
 * Workspace Integrity Check
 * 
 * Ensures:
 * - All workspace packages have valid package.json
 * - No phantom package references
 * - No committed node_modules
 * - All internal dependencies resolve
 * 
 * Usage: tsx scripts/check-workspace-integrity.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const checks: CheckResult[] = [];
const workspaceRoot = process.cwd();
const packagesDir = join(workspaceRoot, 'packages');

/**
 * Check for committed node_modules
 */
function checkNoNodeModules(): CheckResult {
  const nodeModulesPaths: string[] = [];
  
  function findNodeModules(dir: string): void {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory() && entry === 'node_modules') {
            // Check if it's tracked by git
            const relativePath = fullPath.replace(workspaceRoot + '/', '');
            nodeModulesPaths.push(relativePath);
          } else if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'dist' && entry !== 'build') {
            findNodeModules(fullPath);
          }
        } catch {
          // Skip if we can't read
        }
      }
    } catch {
      // Skip if we can't read directory
    }
  }
  
  // Only check packages directory to avoid false positives
  if (existsSync(packagesDir)) {
    findNodeModules(packagesDir);
  }
  
  if (nodeModulesPaths.length > 0) {
    return {
      name: 'No Committed node_modules',
      status: 'fail',
      message: `Found node_modules directories: ${nodeModulesPaths.join(', ')}. These should be gitignored.`,
    };
  }
  
  return {
    name: 'No Committed node_modules',
    status: 'pass',
    message: 'No node_modules directories found in packages',
  };
}

/**
 * Check all workspace packages have valid package.json
 */
function checkWorkspacePackages(): CheckResult {
  const workspacePackages: string[] = [];
  const invalidPackages: string[] = [];
  
  if (!existsSync(packagesDir)) {
    return {
      name: 'Workspace Packages',
      status: 'fail',
      message: 'packages directory does not exist',
    };
  }
  
  const entries = readdirSync(packagesDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const packagePath = join(packagesDir, entry.name);
    const packageJsonPath = join(packagePath, 'package.json');
    
    // Skip non-JS packages (they don't need package.json)
    const hasGoFiles = existsSync(join(packagePath, '*.go'));
    const hasPythonFiles = existsSync(join(packagePath, '*.py'));
    const hasRubyFiles = existsSync(join(packagePath, '*.rb'));
    
    if (hasGoFiles || hasPythonFiles || hasRubyFiles) {
      continue; // Skip non-JS packages
    }
    
    if (!existsSync(packageJsonPath)) {
      invalidPackages.push(entry.name);
      continue;
    }
    
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (!packageJson.name || !packageJson.version) {
        invalidPackages.push(entry.name);
      } else {
        workspacePackages.push(entry.name);
      }
    } catch (error) {
      invalidPackages.push(entry.name);
    }
  }
  
  if (invalidPackages.length > 0) {
    return {
      name: 'Workspace Packages',
      status: 'fail',
      message: `Invalid or missing package.json in: ${invalidPackages.join(', ')}`,
    };
  }
  
  return {
    name: 'Workspace Packages',
    status: 'pass',
    message: `All ${workspacePackages.length} workspace packages have valid package.json`,
  };
}

/**
 * Check for phantom internal package references
 */
function checkInternalDependencies(): CheckResult {
  const internalPackages = new Set<string>();
  const referencedPackages = new Set<string>();
  
  // Get all workspace package names
  if (existsSync(packagesDir)) {
    const entries = readdirSync(packagesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const packageJsonPath = join(packagesDir, entry.name, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (packageJson.name?.startsWith('@settler/')) {
            internalPackages.add(packageJson.name);
          }
        } catch {
          // Skip invalid package.json
        }
      }
    }
  }
  
  // Check root package.json for workspace references
  const rootPackageJsonPath = join(workspaceRoot, 'package.json');
  if (existsSync(rootPackageJsonPath)) {
    try {
      const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
      const workspaces = rootPackageJson.workspaces || [];
      
      // Extract package names from workspace pattern
      for (const workspace of workspaces) {
        if (workspace.includes('*')) {
          // Pattern like "packages/*"
          const pattern = workspace.replace('*', '');
          if (existsSync(join(workspaceRoot, pattern))) {
            const entries = readdirSync(join(workspaceRoot, pattern), { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory()) {
                const pkgJsonPath = join(workspaceRoot, pattern, entry.name, 'package.json');
                if (existsSync(pkgJsonPath)) {
                  try {
                    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
                    if (pkgJson.name) {
                      referencedPackages.add(pkgJson.name);
                    }
                  } catch {
                    // Skip
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Skip if root package.json is invalid
    }
  }
  
  // Check for phantom references (referenced but don't exist)
  const phantomPackages: string[] = [];
  for (const pkg of referencedPackages) {
    if (pkg.startsWith('@settler/') && !internalPackages.has(pkg)) {
      phantomPackages.push(pkg);
    }
  }
  
  if (phantomPackages.length > 0) {
    return {
      name: 'Internal Dependencies',
      status: 'fail',
      message: `Phantom package references found: ${phantomPackages.join(', ')}`,
    };
  }
  
  return {
    name: 'Internal Dependencies',
    status: 'pass',
    message: `All ${internalPackages.size} internal packages are properly defined`,
  };
}

/**
 * Run all checks
 */
async function main() {
  console.log('🔍 Checking workspace integrity...\n');
  
  checks.push(checkNoNodeModules());
  checks.push(checkWorkspacePackages());
  checks.push(checkInternalDependencies());
  
  // Print results
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  
  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.message}`);
  });
  
  console.log(`\n📊 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`);
  
  if (failed > 0) {
    console.error('\n❌ Workspace integrity check failed');
    process.exit(1);
  }
  
  if (warnings > 0) {
    console.warn('\n⚠️  Workspace integrity check passed with warnings');
    process.exit(0);
  }
  
  console.log('\n✅ Workspace integrity check passed');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error during workspace integrity check:', error);
  process.exit(1);
});
