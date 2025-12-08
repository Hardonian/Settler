#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 * 
 * Validates that all required environment variables are set and valid
 * according to the schema defined in config/env.schema.ts
 * 
 * Usage:
 *   tsx scripts/check-env.ts [environment]
 * 
 * Examples:
 *   tsx scripts/check-env.ts production
 *   tsx scripts/check-env.ts local
 */

import { ENV_VAR_SCHEMA, getRequiredEnvVars, validateEnvVar } from '../config/env.schema';

interface ValidationResult {
  name: string;
  status: 'ok' | 'missing' | 'invalid';
  error?: string;
}

interface ValidationReport {
  summary: {
    total: number;
    required: number;
    missing: number;
    invalid: number;
    ok: number;
  };
  results: ValidationResult[];
  environment: string;
}

function validateEnvironment(environment: string = 'production'): ValidationReport {
  const required = getRequiredEnvVars(
    environment as 'local' | 'development' | 'preview' | 'staging' | 'production'
  );

  const results: ValidationResult[] = [];
  let missing = 0;
  let invalid = 0;
  let ok = 0;

  for (const spec of required) {
    const value = process.env[spec.name];
    const result: ValidationResult = {
      name: spec.name,
      status: 'ok',
    };

    if (!value) {
      if (spec.defaultValue !== undefined) {
        // Has default, so it's OK
        ok++;
      } else if (spec.required) {
        result.status = 'missing';
        result.error = 'Required but not set';
        missing++;
      } else {
        // Optional and not set, that's OK
        ok++;
      }
    } else {
      // Value is set, validate it
      const validation = validateEnvVar(spec, value);
      if (!validation.valid) {
        result.status = 'invalid';
        result.error = validation.error;
        invalid++;
      } else {
        ok++;
      }
    }

    results.push(result);
  }

  return {
    summary: {
      total: required.length,
      required: required.filter((s) => s.required).length,
      missing,
      invalid,
      ok,
    },
    results,
    environment,
  };
}

function printReport(report: ValidationReport, json: boolean = false): void {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`\n🔍 Environment Validation Report (${report.environment})\n`);
  console.log(`Summary:`);
  console.log(`  Total variables checked: ${report.summary.total}`);
  console.log(`  Required: ${report.summary.required}`);
  console.log(`  ✅ OK: ${report.summary.ok}`);
  console.log(`  ❌ Missing: ${report.summary.missing}`);
  console.log(`  ⚠️  Invalid: ${report.summary.invalid}\n`);

  if (report.summary.missing > 0 || report.summary.invalid > 0) {
    console.log(`Issues:\n`);
    for (const result of report.results) {
      if (result.status === 'missing') {
        console.log(`  ❌ ${result.name}: ${result.error}`);
      } else if (result.status === 'invalid') {
        console.log(`  ⚠️  ${result.name}: ${result.error}`);
      }
    }
    console.log('');
  }

  if (report.summary.missing === 0 && report.summary.invalid === 0) {
    console.log('✅ All environment variables are valid!\n');
  }
}

// Main execution
const args = process.argv.slice(2);
const environment = args.find((arg) => !arg.startsWith('--')) || 'production';
const json = args.includes('--json');

try {
  const report = validateEnvironment(environment);
  printReport(report, json);

  // Exit with error code if validation failed
  if (report.summary.missing > 0 || report.summary.invalid > 0) {
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  console.error('❌ Validation script error:', error);
  process.exit(1);
}
