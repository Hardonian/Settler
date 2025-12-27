#!/usr/bin/env tsx
/**
 * Final Fix for All Malformed Function Signatures
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

const API_DIR = join(process.cwd(), 'packages/web/src/app/api');

async function fixAll() {
  console.log('🔧 Final fix for all malformed function signatures...\n');

  const routeFiles = await glob('**/route.ts', {
    cwd: API_DIR,
    absolute: true,
  });

  let fixed = 0;

  for (const file of routeFiles) {
    let content = readFileSync(file, 'utf-8');
    const originalContent = content;

    // Fix: { params }, { feature: 'METHOD API' });: { params: { ... } }
    // Replace with: { params }: { params: { ... } }
    content = content.replace(
      /\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\);:\s*(\{[^}]+\})/g,
      (match, method, paramsType) => {
        return `{ params }: ${paramsType}`;
      }
    );

    // Now ensure all functions wrapped with billing gate end properly
    // Find all: export const METHOD = withUniversalBillingGate(async function METHOD(...) { ... }
    const functionPattern = /export const (GET|POST|PUT|DELETE|PATCH) = (withUniversalBillingGate|publicRoute|freeRoute)\(/g;
    const matches = Array.from(content.matchAll(functionPattern));
    
    for (const match of matches.reverse()) {
      const method = match[1];
      const wrapper = match[2];
      const startPos = match.index!;
      
      // Find the function end
      let pos = startPos;
      let braceCount = 0;
      let inFunction = false;
      let parenCount = 0;
      let foundOpening = false;
      
      // Skip to the opening brace of the function body
      while (pos < content.length && pos < startPos + 500) {
        if (content[pos] === '(') parenCount++;
        if (content[pos] === ')') parenCount--;
        if (content[pos] === '{' && parenCount === 0) {
          foundOpening = true;
          braceCount = 1;
          pos++;
          break;
        }
        pos++;
      }
      
      if (!foundOpening) continue;
      
      // Now find the matching closing brace
      while (pos < content.length) {
        if (content[pos] === '{') braceCount++;
        if (content[pos] === '}') {
          braceCount--;
          if (braceCount === 0) {
            // Found function end
            const funcEnd = pos + 1;
            const afterBrace = content.substring(funcEnd, funcEnd + 50).trim();
            
            // Check if it already has the closing
            if (!afterBrace.includes("feature:") && !afterBrace.startsWith("}, {") && !afterBrace.startsWith("});")) {
              // Add feature option if needed
              if (wrapper === 'withUniversalBillingGate') {
                content = content.substring(0, funcEnd) + `, { feature: '${method} API' });` + content.substring(funcEnd);
              } else {
                content = content.substring(0, funcEnd) + `});` + content.substring(funcEnd);
              }
            }
            break;
          }
        }
        pos++;
      }
    }

    // Fix duplicate closing braces/commas
    content = content.replace(/\}\s*\}\s*\)\s*;/g, '});');
    content = content.replace(/,\s*,\s*\{/g, ', {');
    content = content.replace(/\}\s*\}\s*\}\s*\)\s*;/g, '});');

    if (content !== originalContent) {
      writeFileSync(file, content, 'utf-8');
      fixed++;
      console.log(`✅ Fixed: ${file.replace(API_DIR, '')}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} files\n`);
}

fixAll().catch(console.error);
