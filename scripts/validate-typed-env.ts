#!/usr/bin/env tsx
/**
 * Typed environment validation for server/client scopes.
 */

import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import {
  CLIENT_ENV_KEYS,
  validateClientEnv,
  validateEnvScopes,
  validateServerEnv,
} from '../packages/web/src/lib/typed-env';

function loadDotEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function extractEnvKeys(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0 && !line.startsWith('#'))
    .map((line: string) => line.split('=')[0])
    .filter((key: string): key is string => Boolean(key));
}

function getMode(args: string[]): 'build' | 'runtime' {
  const modeArg = args.find((arg: string) => arg.startsWith('--mode='));
  if (modeArg) {
    const modeValue = modeArg.split('=')[1];
    if (modeValue === 'runtime') {
      return 'runtime';
    }
  }

  if (args.includes('--runtime')) {
    return 'runtime';
  }

  return 'build';
}

function main(): void {
  const args = process.argv.slice(2);
  const mode = getMode(args);

  loadDotEnv();

  console.log(`🔍 Validating typed environment variables (${mode})...`);

  const scopeCheck = validateEnvScopes();
  const clientCheck = validateClientEnv();
  const serverCheck = validateServerEnv(mode);

  const errors: string[] = [];
  const warnings: string[] = [];

  errors.push(...scopeCheck.errors, ...clientCheck.errors, ...serverCheck.errors);
  warnings.push(...clientCheck.warnings, ...serverCheck.warnings);

  const envExamplePath = path.resolve(process.cwd(), '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const exampleKeys = extractEnvKeys(envExamplePath);
    const exampleClientKeys = exampleKeys.filter((key: string) => key.startsWith('NEXT_PUBLIC_'));

    for (const key of exampleClientKeys) {
      if (!CLIENT_ENV_KEYS.includes(key as (typeof CLIENT_ENV_KEYS)[number])) {
        errors.push(`Missing client env schema for ${key} (update typed-env.ts)`);
      }
    }

    for (const key of CLIENT_ENV_KEYS) {
      if (!exampleClientKeys.includes(key)) {
        warnings.push(`Client env ${key} missing from .env.example`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    warnings.forEach((warning: string) => console.warn(`  • ${warning}`));
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach((error: string) => console.error(`  • ${error}`));
    process.exit(1);
  }

  console.log('✅ Typed environment validation passed.');
}

main();
