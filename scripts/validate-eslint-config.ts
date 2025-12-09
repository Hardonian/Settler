#!/usr/bin/env tsx
/**
 * ESLint Config Dependency Validator
 * 
 * Validates that all ESLint configs referenced in extends are available
 * as dependencies. This prevents build failures when configs are missing.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

interface ESLintConfig {
  extends?: string | string[];
  [key: string]: unknown;
}

interface ValidationResult {
  packagePath: string;
  configFile: string;
  missing: string[];
  errors: string[];
}

class ESLintConfigValidator {
  private rootDir: string;
  private results: ValidationResult[] = [];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Validate all ESLint configs in the monorepo
   */
  validate(): boolean {
    console.log('🔍 Validating ESLint config dependencies...\n');

    // Check root ESLint config
    this.validateConfig(this.rootDir, '.eslintrc.js');
    this.validateConfig(this.rootDir, '.eslintrc.json');
    this.validateConfig(this.rootDir, '.eslintrc.yaml');
    this.validateConfig(this.rootDir, '.eslintrc.yml');

    // Check all packages
    const packagesDir = join(this.rootDir, 'packages');
    if (existsSync(packagesDir)) {
      const packages = readdirSync(packagesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const pkg of packages) {
        const pkgPath = join(packagesDir, pkg);
        this.validateConfig(pkgPath, '.eslintrc.js');
        this.validateConfig(pkgPath, '.eslintrc.json');
        this.validateConfig(pkgPath, '.eslintrc.yaml');
        this.validateConfig(pkgPath, '.eslintrc.yml');
      }
    }

    return this.report();
  }

  /**
   * Validate a specific ESLint config file
   */
  private validateConfig(packagePath: string, configFileName: string): void {
    const configPath = join(packagePath, configFileName);
    if (!existsSync(configPath)) {
      return;
    }

    const result: ValidationResult = {
      packagePath,
      configFile: configFileName,
      missing: [],
      errors: [],
    };

    try {
      const config = this.loadConfig(configPath);
      const extendsList = this.getExtendsList(config);

      for (const extendConfig of extendsList) {
        if (!this.isConfigAvailable(packagePath, extendConfig)) {
          result.missing.push(extendConfig);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to parse config: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (result.missing.length > 0 || result.errors.length > 0) {
      this.results.push(result);
    }
  }

  /**
   * Load ESLint config from file
   */
  private loadConfig(configPath: string): ESLintConfig {
    const content = readFileSync(configPath, 'utf-8');
    const ext = configPath.split('.').pop();

    if (ext === 'js') {
      // For JS files, we need to evaluate them
      // This is a simplified version - in production you might want to use a proper parser
      try {
        // Try to require the config
        delete require.cache[require.resolve(configPath)];
        return require(configPath);
      } catch (error) {
        // If require fails, try to parse as JSON-like
        throw new Error(`Failed to load JS config: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (ext === 'json') {
      return JSON.parse(content);
    } else if (ext === 'yaml' || ext === 'yml') {
      // Would need yaml parser - for now, skip
      return {};
    }

    return {};
  }

  /**
   * Extract extends list from config
   */
  private getExtendsList(config: ESLintConfig): string[] {
    if (!config.extends) {
      return [];
    }

    if (typeof config.extends === 'string') {
      return [config.extends];
    }

    if (Array.isArray(config.extends)) {
      return config.extends.filter((e): e is string => typeof e === 'string');
    }

    return [];
  }

  /**
   * Check if a config is available as a dependency
   */
  private isConfigAvailable(packagePath: string, configName: string): boolean {
    // Handle special configs that don't need packages
    if (
      configName === 'eslint:recommended' ||
      configName === 'eslint:all' ||
      configName.startsWith('plugin:') ||
      configName.startsWith('next/')
    ) {
      return true; // These are built-in or provided by eslint/next
    }

    // Check if it's a scoped package config (e.g., @typescript-eslint/recommended)
    // For these, we check if the base package is installed
    const basePackage = this.getBasePackage(configName);
    if (!basePackage) {
      return true; // Can't determine, assume OK
    }

    // Check package.json for the dependency
    const packageJsonPath = join(packagePath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      // Check root package.json
      const rootPackageJson = join(this.rootDir, 'package.json');
      if (existsSync(rootPackageJson)) {
        return this.hasDependency(rootPackageJson, basePackage);
      }
      return false;
    }

    return this.hasDependency(packageJsonPath, basePackage);
  }

  /**
   * Extract base package name from config name
   */
  private getBasePackage(configName: string): string | null {
    // Handle eslint-config-* packages
    if (configName.startsWith('eslint-config-')) {
      return configName;
    }

    // Handle @scope/eslint-config-* or @scope/config-*
    const scopedMatch = configName.match(/^@([^/]+)\/(?:eslint-config-)?(.+)$/);
    if (scopedMatch) {
      const [, scope, name] = scopedMatch;
      return `@${scope}/eslint-config-${name}`;
    }

    // Handle unprefixed configs (e.g., "prettier" -> "eslint-config-prettier")
    if (!configName.includes('/') && !configName.includes(':')) {
      return `eslint-config-${configName}`;
    }

    return null;
  }

  /**
   * Check if package.json has a dependency
   */
  private hasDependency(packageJsonPath: string, packageName: string): boolean {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };

      // Check exact match
      if (allDeps[packageName]) {
        return true;
      }

      // Check if it's installed in node_modules
      const nodeModulesPath = join(dirname(packageJsonPath), 'node_modules', packageName);
      if (existsSync(nodeModulesPath)) {
        return true;
      }

      // Check root node_modules
      const rootNodeModules = join(this.rootDir, 'node_modules', packageName);
      if (existsSync(rootNodeModules)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Report validation results
   */
  private report(): boolean {
    if (this.results.length === 0) {
      console.log('✅ All ESLint config dependencies are available!\n');
      return true;
    }

    console.log('❌ Found ESLint config dependency issues:\n');

    for (const result of this.results) {
      const relativePath = result.packagePath.replace(this.rootDir, '.').replace(/^\.\//, '') || 'root';
      console.log(`📦 ${relativePath}/${result.configFile}`);

      if (result.errors.length > 0) {
        console.log('  Errors:');
        result.errors.forEach(err => console.log(`    ❌ ${err}`));
      }

      if (result.missing.length > 0) {
        console.log('  Missing dependencies:');
        result.missing.forEach(missing => {
          const basePkg = this.getBasePackage(missing);
          console.log(`    ❌ ${missing}`);
          if (basePkg) {
            console.log(`       Install: npm install --save-dev ${basePkg}`);
          }
        });
      }
      console.log('');
    }

    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  const validator = new ESLintConfigValidator();
  const success = validator.validate();
  process.exit(success ? 0 : 1);
}

export { ESLintConfigValidator };
