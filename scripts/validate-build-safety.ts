#!/usr/bin/env tsx
/**
 * Build Safety Validator
 * 
 * Proactively checks for build issues before they cause failures:
 * - Scripts referenced but not available (especially in Vercel)
 * - Missing dependencies
 * - Config files that might not exist
 * - Other common build failure patterns
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

interface BuildIssue {
  severity: 'error' | 'warning';
  package: string;
  script?: string;
  message: string;
  fix?: string;
  context?: string;
}

class BuildSafetyValidator {
  private rootDir: string;
  private issues: BuildIssue[] = [];
  private vercelIgnorePatterns: string[] = [];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.loadVercelIgnore();
  }

  /**
   * Load .vercelignore patterns
   */
  private loadVercelIgnore(): void {
    const vercelIgnorePath = join(this.rootDir, '.vercelignore');
    if (existsSync(vercelIgnorePath)) {
      const content = readFileSync(vercelIgnorePath, 'utf-8');
      this.vercelIgnorePatterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    }
  }

  /**
   * Check if a path would be ignored by Vercel
   */
  private isVercelIgnored(path: string): boolean {
    const relativePath = path.replace(this.rootDir + '/', '');
    return this.vercelIgnorePatterns.some(pattern => {
      // Simple pattern matching (supports basic globs)
      if (pattern.endsWith('/')) {
        return relativePath.startsWith(pattern);
      }
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(relativePath);
      }
      return relativePath === pattern || relativePath.startsWith(pattern + '/');
    });
  }

  /**
   * Run all validations
   */
  validate(): boolean {
    console.log('🔍 Build Safety Validator - Checking for potential build issues...\n');

    this.validatePackageScripts();
    this.validateDependencies();
    this.checkESLintExtendsDependencies();
    this.validateConfigFiles();
    this.validateBuildScripts();
    this.validateTranspilePackages();

    return this.report();
  }

  /**
   * Validate all package.json scripts for issues
   */
  private validatePackageScripts(): void {
    const packagesDir = join(this.rootDir, 'packages');
    if (!existsSync(packagesDir)) return;

    const packages = readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pkg of packages) {
      const packageJsonPath = join(packagesDir, pkg, 'package.json');
      if (!existsSync(packageJsonPath)) continue;

      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};

        for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
          if (typeof scriptCommand !== 'string') continue;

          // Check for script file references
          const scriptMatches = scriptCommand.match(/(?:node|tsx|bash|sh)\s+(?:\.\.\/)*scripts\/([^\s"']+)/g);
          if (scriptMatches) {
            for (const match of scriptMatches) {
              const scriptPath = match.replace(/^(node|tsx|bash|sh)\s+/, '').trim();
              const fullPath = scriptPath.startsWith('../')
                ? join(packagesDir, pkg, scriptPath)
                : join(this.rootDir, scriptPath);

              if (!existsSync(fullPath)) {
                this.issues.push({
                  severity: 'error',
                  package: `@settler/${pkg}`,
                  script: scriptName,
                  message: `Script file not found: ${scriptPath}`,
                  fix: `Ensure ${scriptPath} exists or remove the reference`,
                  context: `Command: ${scriptCommand}`,
                });
              } else if (this.isVercelIgnored(fullPath)) {
                // Check if this script runs during build
                const isBuildScript = scriptName === 'build' || 
                                     scriptName === 'prebuild' || 
                                     scriptName === 'postbuild' ||
                                     scriptName.includes('build') ||
                                     scriptName.includes('vercel');

                // Check if script has optional handling
                const hasExistenceCheck = typeof scriptCommand === 'string' && (
                  scriptCommand.includes('test -f') || 
                  scriptCommand.includes('existsSync') || 
                  scriptCommand.match(/\[ -f/)
                );
                const hasFallback = typeof scriptCommand === 'string' && (
                  scriptCommand.includes('||') || 
                  scriptCommand.includes('&& echo')
                );

                if (isBuildScript && !(hasExistenceCheck && hasFallback)) {
                  this.issues.push({
                    severity: 'error',
                    package: `@settler/${pkg}`,
                    script: scriptName,
                    message: `Script file ${scriptPath} is ignored by .vercelignore but referenced in build script`,
                    fix: `Either remove from .vercelignore, make script optional, or use a different approach`,
                    context: `Command: ${scriptCommand}`,
                  });
                }
              }
            }
          }

          // Check for missing commands/tools
          const commandMatches = scriptCommand.match(/\b(npx|node|tsx|bash|sh)\s+([^\s"']+)/g);
          if (commandMatches) {
            for (const match of commandMatches) {
              const parts = match.split(/\s+/);
              const tool = parts[1];
              
              // Check if it's a local script reference that might not exist
              if (tool.includes('scripts/') && !tool.startsWith('npx')) {
                const scriptPath = tool.replace(/^(node|tsx|bash|sh)\s+/, '');
                const fullPath = scriptPath.startsWith('../')
                  ? join(packagesDir, pkg, scriptPath)
                  : join(this.rootDir, scriptPath);

                if (!existsSync(fullPath) && this.isVercelIgnored(fullPath)) {
                  const isBuildScript = scriptName === 'build' || 
                                       scriptName === 'prebuild' || 
                                       scriptName.includes('build');
                  
                  if (isBuildScript) {
                    this.issues.push({
                      severity: 'error',
                      package: `@settler/${pkg}`,
                      script: scriptName,
                      message: `Build script references ${scriptPath} which won't be available in Vercel`,
                      fix: `Make script optional with: test -f ${scriptPath} && ... || echo 'Skipping...'`,
                      context: `Command: ${scriptCommand}`,
                    });
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        this.issues.push({
          severity: 'warning',
          package: `@settler/${pkg}`,
          message: `Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
  }

  /**
   * Validate dependencies are installed
   */
  private validateDependencies(): void {
    const packagesDir = join(this.rootDir, 'packages');
    if (!existsSync(packagesDir)) return;

    const packages = readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pkg of packages) {
      const packageJsonPath = join(packagesDir, pkg, 'package.json');
      if (!existsSync(packageJsonPath)) continue;

      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};
        
        // Check for ESLint config dependencies
        if (scripts.lint || scripts['lint:fix']) {
          const eslintConfigPath = join(packagesDir, pkg, '.eslintrc.js') ||
                                   join(packagesDir, pkg, '.eslintrc.json') ||
                                   join(packagesDir, pkg, '.eslintrc.yaml');
          
          if (existsSync(eslintConfigPath.replace('.yaml', '.js'))) {
            this.checkESLintConfigDeps(pkg, packageJson);
          }
        }
      } catch (error) {
        // Already handled
      }
    }
  }

  /**
   * Check ESLint config dependencies
   */
  private checkESLintConfigDeps(packageName: string, packageJson: any): void {
    const eslintConfigFiles = [
      join(this.rootDir, 'packages', packageName, '.eslintrc.js'),
      join(this.rootDir, 'packages', packageName, '.eslintrc.json'),
      join(this.rootDir, 'packages', packageName, '.eslintrc.yaml'),
    ];

    for (const configPath of eslintConfigFiles) {
      if (!existsSync(configPath)) continue;

      try {
        let config: any = {};
        if (configPath.endsWith('.json')) {
          config = JSON.parse(readFileSync(configPath, 'utf-8'));
        } else if (configPath.endsWith('.js')) {
          // Try to parse JS config (simplified)
          const content = readFileSync(configPath, 'utf-8');
          const extendsMatch = content.match(/extends:\s*\[([^\]]+)\]|extends:\s*"([^"]+)"/);
          if (extendsMatch) {
            const extendsList = extendsMatch[1] || extendsMatch[2];
            if (extendsList) {
              config.extends = extendsList.split(',').map((e: string) => e.trim().replace(/['"]/g, '')).filter(Boolean);
            }
          }
        }

        if (config.extends) {
          const extendsList = Array.isArray(config.extends) ? config.extends : [config.extends];
          
          for (const extend of extendsList) {
            if (typeof extend !== 'string') continue;
            
            // Skip built-in configs
            if (extend.startsWith('eslint:') || extend.startsWith('plugin:') || extend.startsWith('next/')) {
              continue;
            }

            const basePackage = this.getESLintConfigPackage(extend);
            if (basePackage && !this.hasDependency(packageJson, basePackage)) {
              // Check root package.json
              const rootPackageJsonPath = join(this.rootDir, 'package.json');
              if (existsSync(rootPackageJsonPath)) {
                const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
                if (!this.hasDependency(rootPackageJson, basePackage)) {
                  this.issues.push({
                    severity: 'error',
                    package: `@settler/${packageName}`,
                    message: `ESLint config "${extend}" requires package "${basePackage}" but it's not installed`,
                    fix: `npm install --save-dev ${basePackage}`,
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        // Skip if can't parse
      }
    }
  }

  /**
   * Get ESLint config package name
   */
  private getESLintConfigPackage(configName: string): string | null {
    if (configName.startsWith('eslint-config-')) {
      return configName;
    }
    if (!configName.includes('/') && !configName.includes(':')) {
      return `eslint-config-${configName}`;
    }
    return null;
  }

  /**
   * Check if package.json has a dependency
   */
  private hasDependency(packageJson: any, packageName: string): boolean {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };
    return !!allDeps[packageName];
  }

  /**
   * Check for packages extending root ESLint config that need prettier dependency
   */
  private checkESLintExtendsDependencies(): void {
    const packagesDir = join(this.rootDir, 'packages');
    if (!existsSync(packagesDir)) return;

    const packages = readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pkg of packages) {
      const packageJsonPath = join(packagesDir, pkg, 'package.json');
      const eslintConfigPath = join(packagesDir, pkg, '.eslintrc.js') ||
                               join(packagesDir, pkg, '.eslintrc.json');
      
      if (!existsSync(packageJsonPath) || !existsSync(eslintConfigPath.replace('.json', '.js'))) {
        continue;
      }

      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};
        
        // Only check packages that have lint scripts
        if (!scripts.lint && !scripts['lint:fix']) {
          continue;
        }

        // Check if ESLint config extends root config
        const eslintConfigContent = readFileSync(eslintConfigPath.replace('.json', '.js'), 'utf-8');
        const extendsRoot = eslintConfigContent.includes('../../.eslintrc.js') || 
                           eslintConfigContent.includes('../../.eslintrc.json');
        
        if (extendsRoot) {
          // Root config includes prettier, so this package needs eslint-config-prettier
          const hasPrettierConfig = this.hasDependency(packageJson, 'eslint-config-prettier');
          
          if (!hasPrettierConfig) {
            // Check root package.json
            const rootPackageJsonPath = join(this.rootDir, 'package.json');
            if (existsSync(rootPackageJsonPath)) {
              const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
              if (!this.hasDependency(rootPackageJson, 'eslint-config-prettier')) {
                this.issues.push({
                  severity: 'error',
                  package: `@settler/${pkg}`,
                  message: `Package extends root ESLint config (which includes prettier) but eslint-config-prettier is not installed`,
                  fix: `Add to devDependencies: "eslint-config-prettier": "^10.1.8"`,
                });
              }
            }
          }
        }
      } catch (error) {
        // Skip if can't parse
      }
    }
  }

  /**
   * Validate config files exist
   */
  private validateConfigFiles(): void {
    // Check for common config files that might be referenced
    const packagesDir = join(this.rootDir, 'packages');
    if (!existsSync(packagesDir)) return;

    const packages = readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pkg of packages) {
      const packageJsonPath = join(packagesDir, pkg, 'package.json');
      if (!existsSync(packageJsonPath)) continue;

      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};

        // Check for tsconfig references
        if (scripts.typecheck || scripts.build) {
          const tsconfigPath = join(packagesDir, pkg, 'tsconfig.json');
          if (!existsSync(tsconfigPath)) {
            this.issues.push({
              severity: 'warning',
              package: `@settler/${pkg}`,
              message: 'tsconfig.json not found but typecheck/build scripts exist',
            });
          }
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * Validate build scripts specifically
   */
  private validateBuildScripts(): void {
    const packagesDir = join(this.rootDir, 'packages');
    if (!existsSync(packagesDir)) return;

    const packages = readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pkg of packages) {
      const packageJsonPath = join(packagesDir, pkg, 'package.json');
      if (!existsSync(packageJsonPath)) continue;

      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const scripts = packageJson.scripts || {};

        // Check build scripts for problematic patterns
        const buildScripts = ['build', 'prebuild', 'postbuild', 'build:vercel'];
        for (const scriptName of buildScripts) {
          const script = scripts[scriptName];
          if (!script || typeof script !== 'string') continue;

          // Check for hard dependencies on scripts that might not exist
          // Allow scripts that check for existence first or have fallback
          const hasExistenceCheck = script.includes('test -f') || 
                                   script.includes('existsSync') || 
                                   script.match(/\[ -f/);
          const hasFallback = script.includes('||') || script.includes('&& echo');
          
          // Skip if script already has proper optional handling
          if (hasExistenceCheck && hasFallback) {
            continue;
          }
          
          // Only flag if script is required (no existence check AND no fallback)
          if (script.includes('scripts/') && !hasExistenceCheck && !hasFallback) {
            const scriptMatch = script.match(/scripts\/([^\s"']+)/);
            if (scriptMatch) {
              const scriptFile = scriptMatch[1];
              const fullPath = join(this.rootDir, 'scripts', scriptFile);
              
              if (this.isVercelIgnored(fullPath)) {
                this.issues.push({
                  severity: 'error',
                  package: `@settler/${pkg}`,
                  script: scriptName,
                  message: `Build script depends on ${scriptFile} which is ignored by Vercel`,
                  fix: `Make it optional: test -f scripts/${scriptFile} && node scripts/${scriptFile} || echo 'Skipping...'`,
                  context: `Command: ${script}`,
                });
              }
            }
          }
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * Validate Next.js transpilePackages configuration
   */
  private validateTranspilePackages(): void {
    const packagesDir = join(this.rootDir, 'packages');
    if (!existsSync(packagesDir)) return;

    const webPackageJsonPath = join(packagesDir, 'web', 'package.json');
    const nextConfigPath = join(packagesDir, 'web', 'next.config.js');
    
    if (!existsSync(webPackageJsonPath) || !existsSync(nextConfigPath)) return;

    try {
      const nextConfigContent = readFileSync(nextConfigPath, 'utf-8');
      const transpileMatch = nextConfigContent.match(/transpilePackages:\s*\[([^\]]+)\]/);
      
      if (transpileMatch) {
        const packages = transpileMatch[1]
          .split(',')
          .map((p: string) => p.trim().replace(/['"]/g, ''))
          .filter(Boolean);

        for (const pkg of packages) {
          if (pkg.startsWith('@settler/')) {
            const packageName = pkg.replace('@settler/', '');
            const packagePath = join(packagesDir, packageName);
            const packageJsonPath = join(packagePath, 'package.json');

            if (!existsSync(packageJsonPath)) {
              this.issues.push({
                severity: 'error',
                package: '@settler/web',
                message: `transpilePackages includes ${pkg} but package ${packageName} not found`,
                fix: `Remove ${pkg} from transpilePackages or create the package`,
              });
            } else {
              // Check if package has build script
              const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
              if (!packageJson.scripts?.build) {
                this.issues.push({
                  severity: 'warning',
                  package: `@settler/${packageName}`,
                  message: `Package ${pkg} is in transpilePackages but has no build script`,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      // Skip if can't parse
    }
  }

  /**
   * Report issues
   */
  private report(): boolean {
    if (this.issues.length === 0) {
      console.log('✅ No build safety issues found!\n');
      return true;
    }

    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');

    console.log('\n📊 Build Safety Report\n');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log('❌ ERRORS (will cause build failures):\n');
      errors.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.package}]${issue.script ? ` ${issue.script}` : ''}`);
        console.log(`   ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        if (issue.context) console.log(`   Context: ${issue.context}`);
        console.log('');
      });
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS (may cause issues):\n');
      warnings.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.package}]${issue.script ? ` ${issue.script}` : ''}`);
        console.log(`   ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });
    }

    return errors.length === 0;
  }
}

// Run if executed directly
if (require.main === module) {
  const validator = new BuildSafetyValidator();
  const success = validator.validate();
  process.exit(success ? 0 : 1);
}

export { BuildSafetyValidator };
