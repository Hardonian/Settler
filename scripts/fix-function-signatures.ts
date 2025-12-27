#!/usr/bin/env tsx
/**
 * Fix Function Signature Syntax Errors
 * 
 * Fixes malformed function signatures where { feature: ... } was placed incorrectly.
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

const API_DIR = join(process.cwd(), 'packages/web/src/app/api');

async function fixSignatures() {
  console.log('🔧 Fixing function signature syntax errors...\n');

  const routeFiles = await glob('**/route.ts', {
    cwd: API_DIR,
    absolute: true,
    ignore: ['**/*.backup'],
  });

  let fixed = 0;

  for (const file of routeFiles) {
    let content = readFileSync(file, 'utf-8');
    let modified = false;

    // Fix pattern: { params }, { feature: 'GET API' });: { params: { ... } }
    // Should be: { params }: { params: { ... } }
    // And move }, { feature: 'GET API' }); to end
    
    const malformedPattern = /\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\);:\s*(\{[^}]+\})/g;
    
    if (malformedPattern.test(content)) {
      // Find all matches and fix them
      const matches = Array.from(content.matchAll(malformedPattern));
      
      for (const match of matches.reverse()) {
        const fullMatch = match[0];
        const method = match[1];
        const paramsType = match[2];
        const startPos = match.index!;
        const endPos = startPos + fullMatch.length;
        
        // Replace with correct syntax
        const replacement = `{ params }: ${paramsType}`;
        content = content.substring(0, startPos) + replacement + content.substring(endPos);
        modified = true;
        
        // Now find the function end and add the feature option
        // Look for the closing brace of this function
        let pos = startPos + replacement.length;
        let braceCount = 0;
        let foundOpening = false;
        
        while (pos < content.length) {
          if (content[pos] === '{') {
            braceCount++;
            foundOpening = true;
          } else if (content[pos] === '}') {
            braceCount--;
            if (foundOpening && braceCount === 0) {
              // Found function end - check if it already has feature option
              const afterBrace = content.substring(pos + 1, pos + 50).trim();
              if (!afterBrace.includes("feature:") && !afterBrace.startsWith("}, {")) {
                // Add feature option
                content = content.substring(0, pos + 1) + `, { feature: '${method} API' });` + content.substring(pos + 1);
                // Remove any duplicate closing
                content = content.replace(/\}\s*\}\s*\)\s*;/g, '});');
                modified = true;
              }
              break;
            }
          }
          pos++;
        }
      }
    }

    // Fix pattern: function GET(_request: NextRequest, { params }, { feature: 'GET API' });: { params: { ... } }
    const malformedPattern2 = /function\s+(GET|POST|PUT|DELETE|PATCH)\([^,]+,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})/g;
    if (malformedPattern2.test(content)) {
      content = content.replace(
        malformedPattern2,
        (match, method1, method2, paramsType) => {
          modified = true;
          return `function ${method1}(_request: NextRequest, { params }: ${paramsType}`;
        }
      );
    }

    // Fix: withUniversalBillingGate(function GET(request: NextRequest, { params }, { feature: 'GET API' });: { params: { ... } })
    const malformedPattern3 = /withUniversalBillingGate\(function\s+(GET|POST|PUT|DELETE|PATCH)\([^,]+,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g;
    if (malformedPattern3.test(content)) {
      content = content.replace(
        malformedPattern3,
        (match, method1, method2, paramsType) => {
          modified = true;
          return `withUniversalBillingGate(function ${method1}(request: NextRequest, { params }: ${paramsType})`;
        }
      );
    }

    // Fix: export const GET = withUniversalBillingGate(function GET(request: NextRequest, { params }, { feature: 'GET API' });: { params: { ... } })
    const malformedPattern4 = /export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate\(function\s+\1\([^,]+,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g;
    if (malformedPattern4.test(content)) {
      content = content.replace(
        malformedPattern4,
        (match, method1, method2, paramsType) => {
          modified = true;
          return `export const ${method1} = withUniversalBillingGate(function ${method1}(request: NextRequest, { params }: ${paramsType})`;
        }
      );
    }

    // Fix: withUniversalBillingGate(async function GET(request: NextRequest, { params }, { feature: 'GET API' });: { params: { ... } })
    const malformedPattern5 = /withUniversalBillingGate\(async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\([^,]+,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g;
    if (malformedPattern5.test(content)) {
      content = content.replace(
        malformedPattern5,
        (match, method1, method2, paramsType) => {
          modified = true;
          return `withUniversalBillingGate(async function ${method1}(request: NextRequest, { params }: ${paramsType})`;
        }
      );
    }

    // Fix: export const GET = withUniversalBillingGate(async function GET(request: NextRequest, { params }, { feature: 'GET API' });: { params: { ... } })
    const malformedPattern6 = /export const (GET|POST|PUT|DELETE|PATCH) = withUniversalBillingGate\(async\s+function\s+\1\([^,]+,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g;
    if (malformedPattern6.test(content)) {
      content = content.replace(
        malformedPattern6,
        (match, method1, method2, paramsType) => {
          modified = true;
          return `export const ${method1} = withUniversalBillingGate(async function ${method1}(request: NextRequest, { params }: ${paramsType})`;
        }
      );
    }

    // Fix: function GET(_request: NextRequest, { params }, { feature: 'GET API' });: { params: { snapshotId: string } })
    const malformedPattern7 = /function\s+(GET|POST|PUT|DELETE|PATCH)\((_request|request):\s*NextRequest,\s*\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\)\);:\s*(\{[^}]+\})\)/g;
    if (malformedPattern7.test(content)) {
      content = content.replace(
        malformedPattern7,
        (match, method1, reqParam, method2, paramsType) => {
          modified = true;
          return `function ${method1}(${reqParam}: NextRequest, { params }: ${paramsType})`;
        }
      );
    }

    if (modified) {
      // Ensure functions end with }, { feature: ... }); if they don't already
      // This is a simplified fix - we'll handle edge cases manually if needed
      writeFileSync(file, content, 'utf-8');
      fixed++;
      console.log(`✅ Fixed: ${file.replace(API_DIR, '')}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} files\n`);
}

fixSignatures().catch(console.error);
