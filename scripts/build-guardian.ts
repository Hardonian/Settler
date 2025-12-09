#!/usr/bin/env tsx
/**
 * Build Guardian - Automated Build Health Checker
 * 
 * Checks for common build issues before deployment
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ESLintConfigValidator } from './validate-eslint-config';
import { NextJSBuildValidator } from './validate-nextjs-build';

interface BuildIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  file?: string;
  fix?: string;
}

class BuildGuardian {
  private issues: BuildIssue[] = [];
  private rootDir: string;

  constructor() {
    this.rootDir = process.cwd();
  }

  /**
   * Run all checks
   */
  async check(): Promise<boolean> {
    console.log('🔍 Build Guardian - Running health checks...\n');

    this.checkPrismaGenerated();
    this.checkTypeScriptConfigs();
    this.checkPackageJson();
    this.checkVercelConfig();
    this.checkEnvFiles();
    this.checkImportPaths();
    this.checkDependencies();
    this.checkESLintConfigs();
    this.checkNextJSBuild();

    this.report();
    return this.issues.filter(i => i.severity === 'error').length === 0;
  }

  /**
   * Check if Prisma client is generated
   */
  private checkPrismaGenerated(): void {
    const prismaClientPath = join(this.rootDir, 'node_modules', '.prisma', 'client');
    if (!existsSync(prismaClientPath)) {
      this.issues.push({
        severity: 'warning',
        category: 'prisma',
        message: 'Prisma client not generated. Run: npm run prisma:generate',
        fix: 'npm run prisma:generate',
      });
    }
  }

  /**
   * Check TypeScript configs for consistency
   */
  private checkTypeScriptConfigs(): void {
    const rootTsConfig = join(this.rootDir, 'tsconfig.json');
    if (!existsSync(rootTsConfig)) {
      this.issues.push({
        severity: 'error',
        category: 'typescript',
        message: 'Root tsconfig.json missing',
      });
      return;
    }

    // Check for common TS config issues
    try {
      const config = JSON.parse(readFileSync(rootTsConfig, 'utf-8'));
      
      if (!config.compilerOptions?.strict) {
        this.issues.push({
          severity: 'warning',
          category: 'typescript',
          message: 'TypeScript strict mode not enabled in root config',
        });
      }
    } catch (error) {
      this.issues.push({
        severity: 'error',
        category: 'typescript',
        message: `Invalid tsconfig.json: ${error}`,
      });
    }
  }

  /**
   * Check package.json for issues
   */
  private checkPackageJson(): void {
    const packageJson = join(this.rootDir, 'package.json');
    if (!existsSync(packageJson)) {
      this.issues.push({
        severity: 'error',
        category: 'package',
        message: 'package.json missing',
      });
      return;
    }

    try {
      const pkg = JSON.parse(readFileSync(packageJson, 'utf-8'));
      
      // Check for build script
      if (!pkg.scripts?.build) {
        this.issues.push({
          severity: 'error',
          category: 'package',
          message: 'No build script in package.json',
        });
      }

      // Check for typecheck script
      if (!pkg.scripts?.typecheck) {
        this.issues.push({
          severity: 'warning',
          category: 'package',
          message: 'No typecheck script in package.json',
        });
      }
    } catch (error) {
      this.issues.push({
        severity: 'error',
        category: 'package',
        message: `Invalid package.json: ${error}`,
      });
    }
  }

  /**
   * Check Vercel config
   */
  private checkVercelConfig(): void {
    const vercelConfig = join(this.rootDir, 'vercel.json');
    const webVercelConfig = join(this.rootDir, 'packages', 'web', 'vercel.json');

    if (!existsSync(vercelConfig) && !existsSync(webVercelConfig)) {
      this.issues.push({
        severity: 'warning',
        category: 'vercel',
        message: 'No vercel.json found (may be using framework defaults)',
      });
    }
  }

  /**
   * Check for .env.example
   */
  private checkEnvFiles(): void {
    const envExample = join(this.rootDir, '.env.example');
    if (!existsSync(envExample)) {
      this.issues.push({
        severity: 'info',
        category: 'environment',
        message: '.env.example missing - consider adding for documentation',
      });
    }
  }

  /**
   * Check import paths
   */
  private checkImportPaths(): void {
    // This would require parsing TypeScript files
    // For now, just a placeholder
  }

  /**
   * Check dependencies
   */
  private checkDependencies(): void {
    const packageJson = join(this.rootDir, 'package.json');
    if (!existsSync(packageJson)) return;

    try {
      const pkg = JSON.parse(readFileSync(packageJson, 'utf-8'));
      
      // Check for turbo
      if (!pkg.devDependencies?.turbo && !pkg.dependencies?.turbo) {
        this.issues.push({
          severity: 'error',
          category: 'dependencies',
          message: 'Turbo not found in dependencies',
          fix: 'npm install --save-dev turbo',
        });
      }
    } catch (error) {
      // Already handled in checkPackageJson
    }
  }

  /**
   * Check ESLint config dependencies
   */
  private checkESLintConfigs(): void {
    const validatorPath = join(this.rootDir, 'scripts', 'validate-eslint-config.ts');
    if (!existsSync(validatorPath)) {
      // Script not available (e.g., in Vercel builds where scripts/ is ignored)
      return;
    }

    try {
      const validator = new ESLintConfigValidator(this.rootDir);
      const isValid = validator.validate();
      
      if (!isValid) {
        this.issues.push({
          severity: 'error',
          category: 'eslint',
          message: 'ESLint config dependencies are missing. Run: npm run validate:eslint-config',
          fix: 'npm run validate:eslint-config',
        });
      }
    } catch (error) {
      this.issues.push({
        severity: 'warning',
        category: 'eslint',
        message: `Failed to validate ESLint configs: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Check Next.js build configuration
   */
  private checkNextJSBuild(): void {
    const validatorPath = join(this.rootDir, 'scripts', 'validate-nextjs-build.ts');
    if (!existsSync(validatorPath)) {
      return;
    }

    try {
      const validator = new NextJSBuildValidator(this.rootDir);
      const isValid = validator.validate();
      
      if (!isValid) {
        this.issues.push({
          severity: 'error',
          category: 'nextjs',
          message: 'Next.js build configuration issues found. Run: npm run validate:nextjs',
          fix: 'npm run validate:nextjs',
        });
      }
    } catch (error) {
      this.issues.push({
        severity: 'warning',
        category: 'nextjs',
        message: `Failed to validate Next.js build config: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Report issues
   */
  private report(): void {
    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const infos = this.issues.filter(i => i.severity === 'info');

    console.log('\n📊 Build Health Report\n');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Info: ${infos.length}\n`);

    if (errors.length > 0) {
      console.log('❌ ERRORS:\n');
      errors.forEach(issue => {
        console.log(`  [${issue.category}] ${issue.message}`);
        if (issue.file) console.log(`    File: ${issue.file}`);
        if (issue.fix) console.log(`    Fix: ${issue.fix}`);
      });
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      warnings.forEach(issue => {
        console.log(`  [${issue.category}] ${issue.message}`);
        if (issue.fix) console.log(`    Fix: ${issue.fix}`);
      });
      console.log('');
    }

    if (infos.length > 0) {
      console.log('ℹ️  INFO:\n');
      infos.forEach(issue => {
        console.log(`  [${issue.category}] ${issue.message}`);
      });
      console.log('');
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All checks passed!\n');
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const guardian = new BuildGuardian();
  guardian.check().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { BuildGuardian };
