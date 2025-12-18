#!/usr/bin/env tsx
/**
 * Repository Integrity Check
 * 
 * Hard-fail integrity script that ensures:
 * - All workspace folders have package.json
 * - No workspace is referenced but missing
 * - No internal dependencies (@settler/*) are imported but not defined
 * - No package.json scripts reference missing files
 * - All TypeScript packages have build/typecheck contracts
 * - No node_modules/ exists in tracked files
 * 
 * This script is AUTHORITATIVE and must pass before any merge.
 * 
 * Usage: tsx scripts/repo-integrity.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';

interface IntegrityError {
  check: string;
  severity: 'error' | 'warning';
  message: string;
  details?: string[];
}

const errors: IntegrityError[] = [];
const workspaceRoot = process.cwd();
const packagesDir = join(workspaceRoot, 'packages');

/**
 * Get all workspace package names from package.json
 */
function getWorkspacePackages(): Set<string> {
  const rootPackageJsonPath = join(workspaceRoot, 'package.json');
  if (!existsSync(rootPackageJsonPath)) {
    throw new Error('Root package.json not found');
  }

  const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
  const workspaces = rootPackageJson.workspaces || [];
  const packageNames = new Set<string>();

  for (const workspace of workspaces) {
    if (workspace.includes('*')) {
      const pattern = workspace.replace('*', '');
      const fullPath = join(workspaceRoot, pattern);
      if (existsSync(fullPath)) {
        const entries = readdirSync(fullPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const pkgJsonPath = join(fullPath, entry.name, 'package.json');
            if (existsSync(pkgJsonPath)) {
              try {
                const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
                if (pkgJson.name) {
                  packageNames.add(pkgJson.name);
                }
              } catch {
                // Skip invalid package.json
              }
            }
          }
        }
      }
    }
  }

  return packageNames;
}

/**
 * Get all directories in packages/
 */
function getPackageDirectories(): string[] {
  if (!existsSync(packagesDir)) {
    return [];
  }

  const entries = readdirSync(packagesDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

/**
 * Check 1: All workspace folders have package.json
 */
function checkWorkspaceFoldersHavePackageJson(): void {
  const packageDirs = getPackageDirectories();
  const missing: string[] = [];

  for (const dir of packageDirs) {
    const packagePath = join(packagesDir, dir);
    const packageJsonPath = join(packagePath, 'package.json');

    // Skip non-JS packages (Go, Python, Ruby)
    const hasGoFiles = globMatch(packagePath, '*.go');
    const hasPythonFiles = globMatch(packagePath, '*.py');
    const hasRubyFiles = globMatch(packagePath, '*.rb');

    if (hasGoFiles || hasPythonFiles || hasRubyFiles) {
      continue; // Non-JS packages don't need package.json
    }

    if (!existsSync(packageJsonPath)) {
      missing.push(dir);
    }
  }

  if (missing.length > 0) {
    errors.push({
      check: 'Workspace folders have package.json',
      severity: 'error',
      message: `Workspace folders missing package.json: ${missing.join(', ')}`,
      details: missing.map(dir => `packages/${dir}/package.json`),
    });
  }
}

/**
 * Check 2: No workspace is referenced but missing
 */
function checkNoMissingWorkspaces(): void {
  const workspacePackages = getWorkspacePackages();
  const packageDirs = getPackageDirectories();
  const referencedButMissing: string[] = [];

  // Check if any workspace package name doesn't have a corresponding directory
  for (const pkgName of workspacePackages) {
    if (pkgName.startsWith('@settler/')) {
      const expectedDir = pkgName.replace('@settler/', '');
      if (!packageDirs.includes(expectedDir)) {
        referencedButMissing.push(pkgName);
      }
    }
  }

  if (referencedButMissing.length > 0) {
    errors.push({
      check: 'No missing workspaces',
      severity: 'error',
      message: `Workspace packages referenced but missing: ${referencedButMissing.join(', ')}`,
      details: referencedButMissing,
    });
  }
}

/**
 * Check 3: No internal dependencies are imported but not defined
 */
function checkInternalDependenciesDefined(): void {
  const workspacePackages = getWorkspacePackages();
  const internalPackages = new Set<string>();
  const referencedPackages = new Set<string>();

  // Collect all defined @settler/* packages
  for (const pkgName of workspacePackages) {
    if (pkgName.startsWith('@settler/')) {
      internalPackages.add(pkgName);
    }
  }

  // Check all package.json files for @settler/* dependencies
  const packageDirs = getPackageDirectories();
  for (const dir of packageDirs) {
    const packageJsonPath = join(packagesDir, dir, 'package.json');
    if (!existsSync(packageJsonPath)) continue;

    try {
      const pkgJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...(pkgJson.dependencies || {}),
        ...(pkgJson.devDependencies || {}),
        ...(pkgJson.peerDependencies || {}),
      };

      for (const dep of Object.keys(allDeps)) {
        if (dep.startsWith('@settler/')) {
          referencedPackages.add(dep);
        }
      }
    } catch {
      // Skip invalid package.json
    }
  }

  // Find phantom references
  const phantomPackages: string[] = [];
  for (const pkg of referencedPackages) {
    if (!internalPackages.has(pkg)) {
      phantomPackages.push(pkg);
    }
  }

  if (phantomPackages.length > 0) {
    errors.push({
      check: 'Internal dependencies defined',
      severity: 'error',
      message: `Phantom internal dependencies referenced but not defined: ${phantomPackages.join(', ')}`,
      details: phantomPackages,
    });
  }
}

/**
 * Check 4: No package.json scripts reference missing files
 */
function checkScriptReferences(): void {
  const packageDirs = getPackageDirectories();
  const invalidScripts: Array<{ package: string; script: string; file: string }> = [];

  for (const dir of packageDirs) {
    const packageJsonPath = join(packagesDir, dir, 'package.json');
    if (!existsSync(packageJsonPath)) continue;

    try {
      const pkgJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = pkgJson.scripts || {};

      for (const [scriptName, scriptValue] of Object.entries(scripts)) {
        if (typeof scriptValue !== 'string') continue;

        // Extract file references from script
        const fileMatches = scriptValue.match(/(?:tsx|node|ts-node)\s+([^\s]+\.(ts|js|tsx|jsx))/g);
        if (fileMatches) {
          for (const match of fileMatches) {
            const filePath = match.replace(/^(tsx|node|ts-node)\s+/, '').trim();
            // Resolve relative paths
            let resolvedPath: string;
            if (filePath.startsWith('./') || filePath.startsWith('../')) {
              resolvedPath = join(packagesDir, dir, filePath);
            } else if (filePath.startsWith('scripts/')) {
              resolvedPath = join(workspaceRoot, filePath);
            } else {
              // Try relative to package
              resolvedPath = join(packagesDir, dir, filePath);
            }

            if (!existsSync(resolvedPath)) {
              invalidScripts.push({
                package: dir,
                script: scriptName,
                file: filePath,
              });
            }
          }
        }
      }
    } catch {
      // Skip invalid package.json
    }
  }

  // Check root package.json scripts
  const rootPackageJsonPath = join(workspaceRoot, 'package.json');
  if (existsSync(rootPackageJsonPath)) {
    try {
      const rootPkgJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
      const scripts = rootPkgJson.scripts || {};

      for (const [scriptName, scriptValue] of Object.entries(scripts)) {
        if (typeof scriptValue !== 'string') continue;

        const fileMatches = scriptValue.match(/(?:tsx|node|ts-node)\s+([^\s]+\.(ts|js|tsx|jsx))/g);
        if (fileMatches) {
          for (const match of fileMatches) {
            const filePath = match.replace(/^(tsx|node|ts-node)\s+/, '').trim();
            let resolvedPath: string;
            if (filePath.startsWith('./') || filePath.startsWith('../')) {
              resolvedPath = join(workspaceRoot, filePath);
            } else if (filePath.startsWith('scripts/')) {
              resolvedPath = join(workspaceRoot, filePath);
            } else {
              resolvedPath = join(workspaceRoot, 'scripts', filePath);
            }

            if (!existsSync(resolvedPath)) {
              invalidScripts.push({
                package: 'root',
                script: scriptName,
                file: filePath,
              });
            }
          }
        }
      }
    } catch {
      // Skip
    }
  }

  if (invalidScripts.length > 0) {
    errors.push({
      check: 'Script references valid files',
      severity: 'error',
      message: `Scripts reference missing files: ${invalidScripts.length} issues`,
      details: invalidScripts.map(
        ({ package: pkg, script, file }) => `${pkg}:${script} → ${file}`
      ),
    });
  }
}

/**
 * Check 5: TypeScript packages have build/typecheck contracts
 */
function checkTypeScriptContracts(): void {
  const packageDirs = getPackageDirectories();
  const missingContracts: Array<{ package: string; missing: string[] }> = [];

  for (const dir of packageDirs) {
    const packagePath = join(packagesDir, dir);
    const packageJsonPath = join(packagePath, 'package.json');
    const tsconfigPath = join(packagePath, 'tsconfig.json');

    if (!existsSync(packageJsonPath)) continue;
    if (!existsSync(tsconfigPath)) continue; // Not a TypeScript package

    try {
      const pkgJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = pkgJson.scripts || {};
      const missing: string[] = [];

      // Check for build script
      if (!scripts.build && !scripts['build:vercel']) {
        missing.push('build');
      }

      // Check for typecheck script
      if (!scripts.typecheck) {
        missing.push('typecheck');
      }

      if (missing.length > 0) {
        missingContracts.push({ package: dir, missing });
      }
    } catch {
      // Skip invalid package.json
    }
  }

  if (missingContracts.length > 0) {
    errors.push({
      check: 'TypeScript packages have contracts',
      severity: 'error',
      message: `TypeScript packages missing build/typecheck contracts: ${missingContracts.length} packages`,
      details: missingContracts.map(
        ({ package: pkg, missing }) => `${pkg}: missing ${missing.join(', ')}`
      ),
    });
  }
}

/**
 * Check 6: No node_modules/ in tracked files
 */
function checkNoCommittedNodeModules(): void {
  try {
    // Use git to check for tracked node_modules
    const gitFiles = execSync('git ls-files', { cwd: workspaceRoot, encoding: 'utf-8' });
    const nodeModulesFiles = gitFiles
      .split('\n')
      .filter(line => line.includes('node_modules/') && line.trim());

    if (nodeModulesFiles.length > 0) {
      errors.push({
        check: 'No committed node_modules',
        severity: 'error',
        message: `Found ${nodeModulesFiles.length} tracked node_modules files`,
        details: nodeModulesFiles.slice(0, 20), // Show first 20
      });
    }
  } catch (error) {
    // If git command fails, check filesystem as fallback
    const nodeModulesPaths: string[] = [];
    function findNodeModules(dir: string, depth = 0): void {
      if (depth > 5) return; // Limit recursion
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);
          try {
            const stat = statSync(fullPath);
            if (stat.isDirectory() && entry === 'node_modules') {
              const relativePath = relative(workspaceRoot, fullPath);
              nodeModulesPaths.push(relativePath);
            } else if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'dist' && entry !== 'build' && entry !== '.next') {
              findNodeModules(fullPath, depth + 1);
            }
          } catch {
            // Skip
          }
        }
      } catch {
        // Skip
      }
    }

    if (existsSync(packagesDir)) {
      findNodeModules(packagesDir);
    }

    if (nodeModulesPaths.length > 0) {
      errors.push({
        check: 'No committed node_modules',
        severity: 'warning',
        message: `Found ${nodeModulesPaths.length} node_modules directories (may be gitignored)`,
        details: nodeModulesPaths.slice(0, 20),
      });
    }
  }
}

/**
 * Helper: Simple glob matching
 */
function globMatch(dir: string, pattern: string): boolean {
  try {
    const entries = readdirSync(dir);
    const ext = pattern.replace('*.', '');
    return entries.some(entry => entry.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Running repository integrity checks...\n');

  checkWorkspaceFoldersHavePackageJson();
  checkNoMissingWorkspaces();
  checkInternalDependenciesDefined();
  checkScriptReferences();
  checkTypeScriptContracts();
  checkNoCommittedNodeModules();

  // Print results
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  if (errors.length > 0) {
    console.log('\n❌ Integrity Check Results:\n');
    errors.forEach(error => {
      const icon = error.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${error.check}: ${error.message}`);
      if (error.details && error.details.length > 0) {
        error.details.slice(0, 5).forEach(detail => {
          console.log(`   - ${detail}`);
        });
        if (error.details.length > 5) {
          console.log(`   ... and ${error.details.length - 5} more`);
        }
      }
      console.log('');
    });

    console.log(`\n📊 Summary: ${errorCount} errors, ${warningCount} warnings\n`);

    if (errorCount > 0) {
      console.error('❌ Repository integrity check FAILED');
      console.error('   CI will block merge until these issues are resolved.\n');
      process.exit(1);
    }
  } else {
    console.log('✅ All integrity checks passed\n');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error during integrity check:', error);
  process.exit(1);
});
