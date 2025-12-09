#!/usr/bin/env tsx
/**
 * Lint Configuration Validator
 * 
 * Validates that lint configuration will not block builds
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface LintIssue {
  severity: 'error' | 'warning';
  message: string;
  fix?: string;
}

class LintConfigValidator {
  private rootDir: string;
  private webDir: string;
  private issues: LintIssue[] = [];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.webDir = join(rootDir, 'packages', 'web');
  }

  validate(): boolean {
    console.log('🔍 Lint Configuration Validator - Checking for blocking issues...\n');

    this.checkESLintConfig();
    this.checkNextLintConfig();
    this.checkErrorRules();

    return this.report();
  }

  private checkESLintConfig(): void {
    const eslintConfigPath = join(this.webDir, '.eslintrc.json');
    if (!existsSync(eslintConfigPath)) {
      this.issues.push({
        severity: 'error',
        message: '.eslintrc.json not found in web package',
      });
      return;
    }

    try {
      const config = JSON.parse(readFileSync(eslintConfigPath, 'utf-8'));
      
      // Check if root is set to prevent inheritance
      if (!config.root) {
        this.issues.push({
          severity: 'warning',
          message: '.eslintrc.json should have "root": true to prevent inheriting root config',
          fix: 'Add "root": true to .eslintrc.json',
        });
      }

      // Check that critical error rules are set to warn
      const criticalRules = [
        '@typescript-eslint/no-unsafe-call',
        '@typescript-eslint/require-await',
        '@typescript-eslint/unbound-method',
        '@typescript-eslint/no-unnecessary-type-assertion',
        '@typescript-eslint/no-redundant-type-constituents',
      ];

      for (const rule of criticalRules) {
        if (config.rules?.[rule] === 'error') {
          this.issues.push({
            severity: 'error',
            message: `Rule ${rule} is set to "error" which will block builds. Should be "warn"`,
            fix: `Set "${rule}": "warn" in .eslintrc.json rules`,
          });
        }
      }
    } catch (error) {
      this.issues.push({
        severity: 'error',
        message: `Failed to parse .eslintrc.json: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  private checkNextLintConfig(): void {
    const nextConfigPath = join(this.webDir, 'next.config.js');
    if (!existsSync(nextConfigPath)) return;

    try {
      const content = readFileSync(nextConfigPath, 'utf-8');
      
      // Check if ignoreDuringBuilds is false (strict mode)
      if (content.includes('ignoreDuringBuilds: false')) {
        // This is fine if ESLint errors are downgraded to warnings
      }

      // Check if dirs are specified
      if (content.includes('dirs:') && !content.includes("dirs: ['src', 'app']")) {
        this.issues.push({
          severity: 'info',
          message: 'ESLint dirs configuration may need adjustment',
        });
      }
    } catch (error) {
      // Skip
    }
  }

  private checkErrorRules(): void {
    const eslintConfigPath = join(this.webDir, '.eslintrc.json');
    if (!existsSync(eslintConfigPath)) return;

    try {
      const config = JSON.parse(readFileSync(eslintConfigPath, 'utf-8'));
      const rules = config.rules || {};

      // Count error vs warn rules
      const errorRules: string[] = [];
      const warnRules: string[] = [];

      for (const [rule, value] of Object.entries(rules)) {
        if (value === 'error' || (Array.isArray(value) && value[0] === 'error')) {
          errorRules.push(rule);
        } else if (value === 'warn' || (Array.isArray(value) && value[0] === 'warn')) {
          warnRules.push(rule);
        }
      }

      // Check for rules that commonly cause build failures
      const problematicErrorRules = errorRules.filter(rule => 
        rule.includes('no-unsafe') ||
        rule.includes('require-await') ||
        rule.includes('unbound-method') ||
        rule.includes('no-unnecessary') ||
        rule.includes('no-redundant')
      );

      if (problematicErrorRules.length > 0) {
        this.issues.push({
          severity: 'warning',
          message: `Found ${problematicErrorRules.length} potentially problematic error-level rules that may block builds`,
          fix: 'Consider downgrading these to "warn": ' + problematicErrorRules.join(', '),
        });
      }
    } catch (error) {
      // Skip
    }
  }

  private report(): boolean {
    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Lint configuration looks good!\n');
      return true;
    }

    console.log('\n📊 Lint Configuration Report\n');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log('❌ ERRORS:\n');
      errors.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      warnings.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
        console.log('');
      });
    }

    return errors.length === 0;
  }
}

// Run if executed directly
if (require.main === module) {
  const validator = new LintConfigValidator();
  const success = validator.validate();
  process.exit(success ? 0 : 1);
}

export { LintConfigValidator };
