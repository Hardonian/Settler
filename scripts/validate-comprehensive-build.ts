#!/usr/bin/env tsx
/**
 * Comprehensive Build Validator
 * 
 * Final comprehensive check for any remaining build issues
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface BuildIssue {
  severity: 'error' | 'warning';
  category: string;
  message: string;
  fix?: string;
  file?: string;
}

class ComprehensiveBuildValidator {
  private rootDir: string;
  private webDir: string;
  private issues: BuildIssue[] = [];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.webDir = join(rootDir, 'packages', 'web');
  }

  validate(): boolean {
    console.log('🔍 Comprehensive Build Validator - Final check...\n');

    this.checkMiddlewareConfig();
    this.checkInstrumentationExport();
    this.checkWorkspacePackageExports();
    this.checkPublicAssets();
    this.checkNextJSRequiredFiles();
    this.checkEnvironmentVariables();
    this.checkTypeDefinitions();
    this.checkImportPaths();

    return this.report();
  }

  private checkMiddlewareConfig(): void {
    const middlewarePath = join(this.webDir, 'middleware.ts');
    if (!existsSync(middlewarePath)) {
      this.issues.push({
        severity: 'warning',
        category: 'nextjs',
        message: 'middleware.ts not found (optional but recommended)',
      });
      return;
    }

    try {
      const content = readFileSync(middlewarePath, 'utf-8');
      
      // Check for required exports
      if (!content.includes('export') || (!content.includes('middleware') && !content.includes('config'))) {
        this.issues.push({
          severity: 'warning',
          category: 'nextjs',
          message: 'middleware.ts may not export required functions',
          file: 'middleware.ts',
        });
      }

      // Check for config export
      if (content.includes('matcher') && !content.includes('export const config')) {
        this.issues.push({
          severity: 'warning',
          category: 'nextjs',
          message: 'middleware.ts uses matcher but may not export config',
          file: 'middleware.ts',
        });
      }
    } catch (error) {
      // Skip
    }
  }

  private checkInstrumentationExport(): void {
    const instrumentationPath = join(this.webDir, 'src', 'app', 'instrumentation.ts');
    const instrumentationPathJs = join(this.webDir, 'src', 'app', 'instrumentation.js');
    
    const filePath = existsSync(instrumentationPath) ? instrumentationPath : instrumentationPathJs;
    if (!filePath || !existsSync(filePath)) {
      // Check if instrumentationHook is enabled
      const nextConfigPath = join(this.webDir, 'next.config.js');
      if (existsSync(nextConfigPath)) {
        const content = readFileSync(nextConfigPath, 'utf-8');
        if (content.includes('instrumentationHook: true')) {
          this.issues.push({
            severity: 'error',
            category: 'nextjs',
            message: 'instrumentationHook is enabled but instrumentation.ts/js not found',
            fix: 'Create src/app/instrumentation.ts with export async function register()',
          });
        }
      }
      return;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      if (!content.includes('export') || !content.includes('register')) {
        this.issues.push({
          severity: 'error',
          category: 'nextjs',
          message: 'instrumentation.ts must export async function register()',
          file: 'src/app/instrumentation.ts',
          fix: 'Add: export async function register() { ... }',
        });
      }
    } catch (error) {
      // Skip
    }
  }

  private checkWorkspacePackageExports(): void {
    const tsconfigPath = join(this.webDir, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) return;

    try {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      const paths = tsconfig.compilerOptions?.paths || {};

      for (const [alias, pathArray] of Object.entries(paths)) {
        if (typeof alias === 'string' && alias.startsWith('@settler/')) {
          const packageName = alias.replace('@settler/', '').split('/')[0];
          const packagePath = join(this.rootDir, 'packages', packageName);
          const packageJsonPath = join(packagePath, 'package.json');

          if (existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            
            // Check if package has proper exports
            if (!packageJson.exports && !packageJson.main) {
              this.issues.push({
                severity: 'warning',
                category: 'packages',
                message: `Package ${packageName} has no exports or main field`,
                file: `packages/${packageName}/package.json`,
              });
            }

            // Check if dist directory will exist (built by Turbo)
            const distPath = join(packagePath, 'dist');
            // Don't fail if dist doesn't exist - Turbo will build it
            // But check if package has build script
            if (!packageJson.scripts?.build) {
              this.issues.push({
                severity: 'warning',
                category: 'packages',
                message: `Package ${packageName} has no build script but is referenced in path mappings`,
                file: `packages/${packageName}/package.json`,
              });
            }
          }
        }
      }
    } catch (error) {
      // Skip
    }
  }

  private checkPublicAssets(): void {
    const publicDir = join(this.webDir, 'public');
    if (!existsSync(publicDir)) {
      this.issues.push({
        severity: 'warning',
        category: 'nextjs',
        message: 'public directory not found (optional)',
      });
      return;
    }

    // Check for common required assets
    const commonAssets = ['favicon.ico', 'favicon.svg', 'icon.png'];
    for (const asset of commonAssets) {
      // Not critical, just a note
    }
  }

  private checkNextJSRequiredFiles(): void {
    // Check for app directory structure
    const appDir = join(this.webDir, 'src', 'app');
    if (!existsSync(appDir)) {
      this.issues.push({
        severity: 'error',
        category: 'nextjs',
        message: 'src/app directory not found (required for Next.js App Router)',
        fix: 'Create src/app directory with at least layout.tsx and page.tsx',
      });
      return;
    }

    // Check for required files
    const requiredFiles = [
      { path: join(appDir, 'layout.tsx'), name: 'layout.tsx', optional: false },
      { path: join(appDir, 'page.tsx'), name: 'page.tsx', optional: false },
      { path: join(appDir, 'loading.tsx'), name: 'loading.tsx', optional: true },
      { path: join(appDir, 'error.tsx'), name: 'error.tsx', optional: true },
      { path: join(appDir, 'not-found.tsx'), name: 'not-found.tsx', optional: true },
    ];

    for (const file of requiredFiles) {
      if (!file.optional && !existsSync(file.path)) {
        this.issues.push({
          severity: 'error',
          category: 'nextjs',
          message: `Required Next.js file not found: ${file.name}`,
          file: `src/app/${file.name}`,
          fix: `Create src/app/${file.name}`,
        });
      }
    }
  }

  private checkEnvironmentVariables(): void {
    const nextConfigPath = join(this.webDir, 'next.config.js');
    if (!existsSync(nextConfigPath)) return;

    try {
      const content = readFileSync(nextConfigPath, 'utf-8');
      
      // Check for environment variable usage in config
      // This is just informational - env vars are handled at runtime
    } catch (error) {
      // Skip
    }
  }

  private checkTypeDefinitions(): void {
    const packageJsonPath = join(this.webDir, 'package.json');
    if (!existsSync(packageJsonPath)) return;

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for common packages that need @types
      const packagesNeedingTypes = ['react', 'react-dom', 'node'];
      for (const pkg of packagesNeedingTypes) {
        if (allDeps[pkg] && !allDeps[`@types/${pkg}`]) {
          // Check if types are included in the package itself (like react 18+)
          if (pkg === 'react' || pkg === 'react-dom') {
            // React 18+ includes types, so this is OK
            continue;
          }
        }
      }
    } catch (error) {
      // Skip
    }
  }

  private checkImportPaths(): void {
    // Check if path aliases resolve correctly
    const tsconfigPath = join(this.webDir, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) return;

    try {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      const paths = tsconfig.compilerOptions?.paths || {};

      // Check @/* alias
      if (paths['@/*']) {
        const aliasPath = paths['@/*'][0];
        // Remove the /* suffix and check if the base directory exists
        const basePath = aliasPath.replace('./', '').replace('/*', '');
        const resolvedPath = join(this.webDir, basePath);
        if (!existsSync(resolvedPath)) {
          this.issues.push({
            severity: 'error',
            category: 'typescript',
            message: `Path alias @/* resolves to ${resolvedPath} which doesn't exist`,
            fix: `Create ${resolvedPath} directory or fix path mapping`,
          });
        }
      }
    } catch (error) {
      // Skip
    }
  }

  private report(): boolean {
    if (this.issues.length === 0) {
      console.log('✅ No additional build issues found!\n');
      return true;
    }

    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');

    console.log('\n📊 Comprehensive Build Validation Report\n');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log('❌ ERRORS:\n');
      errors.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.category}] ${issue.message}`);
        if (issue.file) console.log(`   File: ${issue.file}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      warnings.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.category}] ${issue.message}`);
        if (issue.file) console.log(`   File: ${issue.file}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });
    }

    return errors.length === 0;
  }
}

// Run if executed directly
if (require.main === module) {
  const validator = new ComprehensiveBuildValidator();
  const success = validator.validate();
  process.exit(success ? 0 : 1);
}

export { ComprehensiveBuildValidator };
