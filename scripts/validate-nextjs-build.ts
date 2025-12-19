#!/usr/bin/env tsx
/**
 * Next.js Build Validator
 * 
 * Validates Next.js-specific build configuration and dependencies
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface BuildIssue {
  severity: 'error' | 'warning';
  category: string;
  message: string;
  fix?: string;
}

class NextJSBuildValidator {
  private rootDir: string;
  private webDir: string;
  private issues: BuildIssue[] = [];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.webDir = join(rootDir, 'packages', 'web');
  }

  validate(): boolean {
    console.log('🔍 Next.js Build Validator - Checking configuration...\n');

    this.checkNextConfig();
    this.checkTypeScriptConfig();
    this.checkDependencies();
    this.checkPathMappings();
    this.checkInstrumentation();
    this.checkPostCSSConfig();
    this.checkTailwindConfig();

    return this.report();
  }

  private checkNextConfig(): void {
    const nextConfigPath = join(this.webDir, 'next.config.js');
    if (!existsSync(nextConfigPath)) {
      this.issues.push({
        severity: 'error',
        category: 'nextjs',
        message: 'next.config.js not found',
      });
      return;
    }

    try {
      const content = readFileSync(nextConfigPath, 'utf-8');
      
      // Check for required plugins
      if (content.includes('@next/mdx')) {
        const packageJsonPath = join(this.webDir, 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (!packageJson.dependencies?.['@next/mdx'] && !packageJson.devDependencies?.['@next/mdx']) {
            this.issues.push({
              severity: 'error',
              category: 'nextjs',
              message: '@next/mdx is used in next.config.js but not in package.json',
              fix: 'npm install @next/mdx',
            });
          }
        }
      }

      if (content.includes('@next/bundle-analyzer')) {
        const packageJsonPath = join(this.webDir, 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (!packageJson.devDependencies?.['@next/bundle-analyzer']) {
            this.issues.push({
              severity: 'warning',
              category: 'nextjs',
              message: '@next/bundle-analyzer is used but not in devDependencies',
            });
          }
        }
      }

      // Check for instrumentation hook
      if (content.includes('instrumentationHook: true')) {
        const instrumentationPath = join(this.webDir, 'src', 'app', 'instrumentation.ts');
        const instrumentationPathJs = join(this.webDir, 'src', 'app', 'instrumentation.js');
        if (!existsSync(instrumentationPath) && !existsSync(instrumentationPathJs)) {
          this.issues.push({
            severity: 'error',
            category: 'nextjs',
            message: 'instrumentationHook is enabled but instrumentation.ts/js not found',
            fix: 'Create src/app/instrumentation.ts or disable instrumentationHook',
          });
        }
      }

      // Check for output: 'standalone'
      if (content.includes("output: 'standalone'")) {
        // This is fine, just a note
      }
    } catch (error) {
      this.issues.push({
        severity: 'error',
        category: 'nextjs',
        message: `Failed to parse next.config.js: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  private checkTypeScriptConfig(): void {
    const tsconfigPath = join(this.webDir, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) {
      this.issues.push({
        severity: 'error',
        category: 'typescript',
        message: 'tsconfig.json not found',
      });
      return;
    }

    try {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      
      // Check if extends root config
      if (tsconfig.extends) {
        const rootTsConfigPath = join(this.rootDir, 'tsconfig.json');
        if (!existsSync(rootTsConfigPath)) {
          this.issues.push({
            severity: 'error',
            category: 'typescript',
            message: `tsconfig.json extends ${tsconfig.extends} but file not found`,
          });
        }
      }

      // Check path mappings
      if (tsconfig.compilerOptions?.paths) {
        const paths = tsconfig.compilerOptions.paths;
        for (const [alias, pathArray] of Object.entries(paths)) {
          if (Array.isArray(pathArray)) {
            for (const pathPattern of pathArray) {
              // Check if path references dist directories
              if (pathPattern.includes('/dist')) {
                const packageName = alias.replace('@settler/', '').split('/')[0];
                const distPath = join(this.rootDir, 'packages', packageName, 'dist');
                // Don't fail if dist doesn't exist - it will be built by Turbo
                // But warn if package.json doesn't exist
                const packageJsonPath = join(this.rootDir, 'packages', packageName, 'package.json');
                if (!existsSync(packageJsonPath)) {
                  this.issues.push({
                    severity: 'error',
                    category: 'typescript',
                    message: `Path mapping ${alias} references package ${packageName} but package.json not found`,
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      this.issues.push({
        severity: 'error',
        category: 'typescript',
        message: `Failed to parse tsconfig.json: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  private checkDependencies(): void {
    const packageJsonPath = join(this.webDir, 'package.json');
    if (!existsSync(packageJsonPath)) return;

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for required Next.js dependencies
      const required = ['next', 'react', 'react-dom'];
      for (const dep of required) {
        if (!allDeps[dep]) {
          this.issues.push({
            severity: 'error',
            category: 'dependencies',
            message: `Required dependency ${dep} is missing`,
            fix: `npm install ${dep}`,
          });
        }
      }

      // Check for PostCSS/Tailwind dependencies if configs exist
      const postcssConfigPath = join(this.webDir, 'postcss.config.js');
      const tailwindConfigPath = join(this.webDir, 'tailwind.config.js');
      
      if (existsSync(postcssConfigPath) || existsSync(tailwindConfigPath)) {
        const postcssRequired = ['postcss', 'tailwindcss', 'autoprefixer'];
        for (const dep of postcssRequired) {
          if (!allDeps[dep]) {
            this.issues.push({
              severity: 'error',
              category: 'dependencies',
              message: `${dep} is required for PostCSS/Tailwind but not installed`,
              fix: `npm install ${dep}`,
            });
          }
        }
      }
    } catch (error) {
      // Already handled
    }
  }

  private checkPathMappings(): void {
    const tsconfigPath = join(this.webDir, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) return;

    try {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      const paths = tsconfig.compilerOptions?.paths || {};

      // Check that all @settler/* packages exist
      for (const [alias] of Object.entries(paths)) {
        if (alias.startsWith('@settler/')) {
          const packageName = alias.replace('@settler/', '').split('/')[0];
          const packagePath = join(this.rootDir, 'packages', packageName);
          const packageJsonPath = join(packagePath, 'package.json');

          if (!existsSync(packageJsonPath)) {
            this.issues.push({
              severity: 'error',
              category: 'typescript',
              message: `Path mapping ${alias} references non-existent package ${packageName}`,
            });
          }
        }
      }
    } catch (error) {
      // Already handled
    }
  }

  private checkInstrumentation(): void {
    const instrumentationPath = join(this.webDir, 'src', 'app', 'instrumentation.ts');
    const instrumentationPathJs = join(this.webDir, 'src', 'app', 'instrumentation.js');
    
    if (existsSync(instrumentationPath) || existsSync(instrumentationPathJs)) {
      // Check if it exports the required function
      const filePath = existsSync(instrumentationPath) ? instrumentationPath : instrumentationPathJs;
      try {
        const content = readFileSync(filePath, 'utf-8');
        if (!content.includes('export') && !content.includes('export async function')) {
          this.issues.push({
            severity: 'warning',
            category: 'nextjs',
            message: 'instrumentation.ts exists but may not export required function',
          });
        }
      } catch (error) {
        // Skip if can't read
      }
    }
  }

  private checkPostCSSConfig(): void {
    const postcssConfigPath = join(this.webDir, 'postcss.config.js');
    if (!existsSync(postcssConfigPath)) {
      // PostCSS config is optional
      return;
    }

    try {
      const content = readFileSync(postcssConfigPath, 'utf-8');
      
      // Check for tailwindcss plugin
      if (content.includes('tailwindcss')) {
        const packageJsonPath = join(this.webDir, 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (!packageJson.dependencies?.tailwindcss && !packageJson.devDependencies?.tailwindcss) {
            this.issues.push({
              severity: 'error',
              category: 'postcss',
              message: 'tailwindcss plugin used but package not installed',
              fix: 'npm install tailwindcss',
            });
          }
        }
      }

      // Check for autoprefixer plugin
      if (content.includes('autoprefixer')) {
        const packageJsonPath = join(this.webDir, 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (!packageJson.dependencies?.autoprefixer && !packageJson.devDependencies?.autoprefixer) {
            this.issues.push({
              severity: 'error',
              category: 'postcss',
              message: 'autoprefixer plugin used but package not installed',
              fix: 'npm install autoprefixer',
            });
          }
        }
      }
    } catch (error) {
      this.issues.push({
        severity: 'warning',
        category: 'postcss',
        message: `Failed to validate postcss.config.js: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  private checkTailwindConfig(): void {
    const tailwindConfigPath = join(this.webDir, 'tailwind.config.js');
    if (!existsSync(tailwindConfigPath)) {
      // Tailwind config is optional
      return;
    }

    try {
      const content = readFileSync(tailwindConfigPath, 'utf-8');
      
      // Check that content paths exist
      const contentMatch = content.match(/content:\s*\[([^\]]+)\]/);
      if (contentMatch) {
        const paths = contentMatch[1].split(',').map((p: string) => p.trim().replace(/['"]/g, ''));
        for (const pathPattern of paths) {
          // Check if any files match the pattern (simplified check)
          if (pathPattern.includes('src/') && !existsSync(join(this.webDir, 'src'))) {
            this.issues.push({
              severity: 'warning',
              category: 'tailwind',
              message: `Tailwind content path ${pathPattern} may not match any files`,
            });
          }
        }
      }
    } catch (error) {
      // Skip if can't parse
    }
  }

  private report(): boolean {
    if (this.issues.length === 0) {
      console.log('✅ No Next.js build issues found!\n');
      return true;
    }

    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');

    console.log('\n📊 Next.js Build Validation Report\n');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log('❌ ERRORS:\n');
      errors.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.category}] ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      warnings.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.category}] ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });
    }

    return errors.length === 0;
  }
}

// Run if executed directly
if (require.main === module) {
  const validator = new NextJSBuildValidator();
  const success = validator.validate();
  process.exit(success ? 0 : 1);
}

export { NextJSBuildValidator };
