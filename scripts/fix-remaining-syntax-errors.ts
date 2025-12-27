#!/usr/bin/env tsx
/**
 * Fix remaining TypeScript syntax errors in API routes
 * 
 * Fixes:
 * 1. Files ending with `}););` -> `}, { feature: 'METHOD API' });` or `});` for publicRoute/freeRoute
 * 2. Files missing closing `}, { feature: 'METHOD API' });` for withUniversalBillingGate
 * 3. Malformed try-catch blocks where closing is before catch
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import * as path from 'path';

const API_ROUTES_DIR = path.join(__dirname, '../packages/web/src/app/api');

async function fixFile(filePath: string): Promise<boolean> {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let modified = false;

  // Pattern 1: Fix duplicate closing parentheses `}););`
  if (content.match(/\}\);\)/)) {
    // Check if it's publicRoute or freeRoute (should end with just `});`)
    if (content.includes('publicRoute') || content.includes('freeRoute')) {
      content = content.replace(/\}\);\)/g, `});`);
      modified = true;
      console.log(`[FIX] ${filePath}: Fixed duplicate closing parentheses (publicRoute/freeRoute)`);
    } else {
      // Find the method name from the export statement
      const methodMatch = content.match(/export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate/);
      if (methodMatch) {
        const method = methodMatch[1];
        content = content.replace(/\}\);\)/g, `}, { feature: '${method} API' });`);
        modified = true;
        console.log(`[FIX] ${filePath}: Fixed duplicate closing parentheses`);
      }
    }
  }

  // Pattern 2: Fix files ending with just `}` that should have `}, { feature: 'METHOD API' });`
  // Only if they're wrapped in withUniversalBillingGate and don't already have the closing
  if (content.includes('withUniversalBillingGate')) {
    const methodMatch = content.match(/export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate/);
    if (methodMatch && !content.includes(`}, { feature: '${methodMatch[1]} API' });`)) {
      const method = methodMatch[1];
      // Check if file ends with just `}`
      const lines = content.split('\n');
      const lastNonEmptyLine = lines.filter(l => l.trim()).pop();
      if (lastNonEmptyLine && lastNonEmptyLine.trim() === '}') {
        // Count braces to ensure we're at the function level, not inside a try-catch
        const beforeLastBrace = content.substring(0, content.lastIndexOf('}'));
        const openBraces = (beforeLastBrace.match(/\{/g) || []).length;
        const closeBraces = (beforeLastBrace.match(/\}/g) || []).length;
        // If braces are balanced (or one extra open), we're at the function level
        if (openBraces - closeBraces <= 1) {
          // Replace the last `}` with `}, { feature: 'METHOD API' });`
          const lastBraceIndex = content.lastIndexOf('}');
          content = content.substring(0, lastBraceIndex) + `}, { feature: '${method} API' });`;
          modified = true;
          console.log(`[FIX] ${filePath}: Added missing closing for withUniversalBillingGate`);
        }
      }
    }
  }

  // Pattern 3: Fix malformed try-catch where `}, { feature: 'METHOD API' });` appears before `catch`
  const malformedTryCatchMatch = content.match(/(\s*)\}, \{ feature: '([A-Z]+) API' \}\); catch \(error\)/);
  if (malformedTryCatchMatch) {
    const method = malformedTryCatchMatch[2];
    // Remove the closing from before catch
    content = content.replace(/(\s*)\}, \{ feature: '([A-Z]+) API' \}\); catch \(error\)/, `$1} catch (error)`);
    // Find the end of the catch block (should be the last `}` before the final `}`)
    // The structure is: try { ... } catch { ... } } <- function closing
    // We need to add the closing after the catch block's closing brace
    const lines = content.split('\n');
    let braceCount = 0;
    let catchBlockEndLine = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += closeBraces - openBraces;
      if (braceCount === 1 && line.includes('}')) {
        catchBlockEndLine = i;
        break;
      }
    }
    if (catchBlockEndLine >= 0) {
      // Replace the catch block's closing brace
      const indent = lines[catchBlockEndLine].match(/^(\s*)/)?.[1] || '';
      lines[catchBlockEndLine] = `${indent}}, { feature: '${method} API' });`;
      content = lines.join('\n');
      modified = true;
      console.log(`[FIX] ${filePath}: Fixed malformed try-catch block`);
    }
  }

  if (modified && content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

async function main() {
  const routeFiles = await glob('**/route.ts', {
    cwd: API_ROUTES_DIR,
    absolute: true,
  });

  console.log(`Found ${routeFiles.length} route files`);

  let fixedCount = 0;
  for (const file of routeFiles) {
    if (await fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\nFixed ${fixedCount} files`);
}

main().catch(console.error);
