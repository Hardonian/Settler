#!/usr/bin/env tsx
/**
 * Comprehensive Fix for All Malformed Function Signatures
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

const API_DIR = join(process.cwd(), 'packages/web/src/app/api');

async function fixAll() {
  console.log('🔧 Fixing all malformed function signatures...\n');

  const routeFiles = await glob('**/route.ts', {
    cwd: API_DIR,
    absolute: true,
  });

  let fixed = 0;

  for (const file of routeFiles) {
    let content = readFileSync(file, 'utf-8');
    const originalContent = content;

    // Pattern 1: { params }, { feature: 'METHOD API' });: { params: { ... } }
    // Replace with: { params }: { params: { ... } }
    content = content.replace(
      /\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\);:\s*(\{[^}]+\})/g,
      (match, method, paramsType) => {
        return `{ params }: ${paramsType}`;
      }
    );

    // Pattern 2: function METHOD(_request: NextRequest, { params }, { feature: 'METHOD API' });: { params: { ... } })
    content = content.replace(
      /function\s+(GET|POST|PUT|DELETE|PATCH)\((_request|request):\s*NextRequest,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g,
      (match, method, reqParam, method2, paramsType) => {
        return `function ${method}(${reqParam}: NextRequest, { params }: ${paramsType})`;
      }
    );

    // Pattern 3: withUniversalBillingGate(function METHOD(request: NextRequest, { params }, { feature: 'METHOD API' });: { params: { ... } })
    content = content.replace(
      /withUniversalBillingGate\(function\s+(GET|POST|PUT|DELETE|PATCH)\((_request|request):\s*NextRequest,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g,
      (match, method, reqParam, method2, paramsType) => {
        return `withUniversalBillingGate(function ${method}(${reqParam}: NextRequest, { params }: ${paramsType})`;
      }
    );

    // Pattern 4: withUniversalBillingGate(async function METHOD(request: NextRequest, { params }, { feature: 'METHOD API' });: { params: { ... } })
    content = content.replace(
      /withUniversalBillingGate\(async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\((_request|request):\s*NextRequest,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g,
      (match, method, reqParam, method2, paramsType) => {
        return `withUniversalBillingGate(async function ${method}(${reqParam}: NextRequest, { params }: ${paramsType})`;
      }
    );

    // Pattern 5: export const METHOD = withUniversalBillingGate(function METHOD(request: NextRequest, { params }, { feature: 'METHOD API' });: { params: { ... } })
    content = content.replace(
      /export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate\(function\s+\1\((_request|request):\s*NextRequest,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g,
      (match, method, reqParam, method2, paramsType) => {
        return `export const ${method} = withUniversalBillingGate(function ${method}(${reqParam}: NextRequest, { params }: ${paramsType})`;
      }
    );

    // Pattern 6: export const METHOD = withUniversalBillingGate(async function METHOD(request: NextRequest, { params }, { feature: 'METHOD API' });: { params: { ... } })
    content = content.replace(
      /export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate\(async\s+function\s+\1\((_request|request):\s*NextRequest,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g,
      (match, method, reqParam, method2, paramsType) => {
        return `export const ${method} = withUniversalBillingGate(async function ${method}(${reqParam}: NextRequest, { params }: ${paramsType})`;
      }
    );

    // Now fix functions that don't have the closing }, { feature: ... });
    // Find all functions wrapped with billing gate
    const functionMatches = Array.from(content.matchAll(/export const (GET|POST|PUT|DELETE|PATCH) = (withUniversalBillingGate|publicRoute|freeRoute)\(/g));
    
    for (const match of functionMatches.reverse()) {
      const method = match[1];
      const wrapper = match[2];
      const startPos = match.index!;
      
      // Find the function end
      let pos = startPos;
      let braceCount = 0;
      let inFunction = false;
      let funcStart = -1;
      
      while (pos < content.length) {
        if (content[pos] === '{') {
          if (!inFunction) funcStart = pos;
          braceCount++;
          inFunction = true;
        } else if (content[pos] === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
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

    if (content !== originalContent) {
      writeFileSync(file, content, 'utf-8');
      fixed++;
      console.log(`✅ Fixed: ${file.replace(API_DIR, '')}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} files\n`);
}

fixAll().catch(console.error);
