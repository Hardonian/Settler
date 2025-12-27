#!/usr/bin/env tsx
/**
 * Fix Billing Gate Syntax Errors
 * 
 * Fixes malformed billing gate wrappers that cause TypeScript errors.
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

const API_DIR = join(process.cwd(), 'packages/web/src/app/api');

async function fixSyntaxErrors() {
  console.log('🔧 Fixing billing gate syntax errors...\n');

  const routeFiles = await glob('**/route.ts', {
    cwd: API_DIR,
    absolute: true,
    ignore: ['**/*.backup'],
  });

  let fixed = 0;

  for (const file of routeFiles) {
    let content = readFileSync(file, 'utf-8');
    let modified = false;

    // Fix: export const GET = withUniversalBillingGate(export async function GET(
    // Should be: export const GET = withUniversalBillingGate(async function GET(
    const pattern1 = /export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate\(export\s+(async\s+)?function\s+\1\s*\(/g;
    if (pattern1.test(content)) {
      content = content.replace(
        /export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate\(export\s+(async\s+)?function\s+\1\s*\(/g,
        (match, method, async) => {
          return `export const ${method} = withUniversalBillingGate(${async || ''}function ${method}(`;
        }
      );
      modified = true;
    }

    // Fix: export const GET = withUniversalBillingGate(export function GET(
    const pattern2 = /export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate\(export\s+function\s+\1\s*\(/g;
    if (pattern2.test(content)) {
      content = content.replace(
        /export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate\(export\s+function\s+\1\s*\(/g,
        (match, method) => {
          return `export const ${method} = withUniversalBillingGate(function ${method}(`;
        }
      );
      modified = true;
    }

    // Fix: publicRoute(export async function GET(
    const pattern3 = /(publicRoute|freeRoute)\(export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g;
    if (pattern3.test(content)) {
      content = content.replace(
        /(publicRoute|freeRoute)\(export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g,
        (match, wrapper, async, method) => {
          return `${wrapper}(${async || ''}function ${method}(`;
        }
      );
      modified = true;
    }

    // Fix: }, { feature: 'GET API' }); at end of function
    // Make sure closing brace matches opening
    const pattern4 = /},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\);/g;
    if (pattern4.test(content)) {
      // This is correct syntax, but check if function is properly closed
      // Count braces to ensure proper closure
      const lines = content.split('\n');
      let needsFix = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('withUniversalBillingGate') && line.includes('export')) {
          // Check if next line starts with function body
          if (i + 1 < lines.length && !lines[i + 1].trim().startsWith('async') && !lines[i + 1].trim().startsWith('function')) {
            needsFix = true;
            break;
          }
        }
      }

      if (needsFix) {
        // Fix malformed wrappers
        content = content.replace(
          /export const (GET|POST|PUT|DELETE|PATCH) = (withUniversalBillingGate|publicRoute|freeRoute)\(export\s+(async\s+)?function\s+\1\s*\(/g,
          (match, method, wrapper, async) => {
            return `export const ${method} = ${wrapper}(${async || ''}function ${method}(`;
          }
        );
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(file, content, 'utf-8');
      fixed++;
      console.log(`✅ Fixed: ${file.replace(API_DIR, '')}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} files\n`);
}

fixSyntaxErrors().catch(console.error);
