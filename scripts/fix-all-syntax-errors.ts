#!/usr/bin/env tsx
/**
 * Fix All Syntax Errors from Billing Gate Application
 * 
 * Fixes malformed function signatures and wrapper syntax.
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

const API_DIR = join(process.cwd(), 'packages/web/src/app/api');

async function fixAllErrors() {
  console.log('🔧 Fixing all syntax errors...\n');

  const routeFiles = await glob('**/route.ts', {
    cwd: API_DIR,
    absolute: true,
    ignore: ['**/*.backup'],
  });

  let fixed = 0;

  for (const file of routeFiles) {
    let content = readFileSync(file, 'utf-8');
    let modified = false;

    // Fix: withUniversalBillingGate(export async function
    content = content.replace(
      /withUniversalBillingGate\(export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g,
      (match, async, method) => {
        modified = true;
        return `withUniversalBillingGate(${async || ''}function ${method}(`;
      }
    );

    // Fix: publicRoute(export async function
    content = content.replace(
      /(publicRoute|freeRoute)\(export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g,
      (match, wrapper, async, method) => {
        modified = true;
        return `${wrapper}(${async || ''}function ${method}(`;
      }
    );

    // Fix malformed function signatures with params and feature in wrong place
    // Pattern: { params }, { feature: 'POST API' });: { params: { providerId: string } }
    content = content.replace(
      /(\s+)(\{[^}]*params[^}]*\}),\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\);:\s*(\{[^}]*params[^}]*\})/g,
      (match, indent, params1, method, params2) => {
        modified = true;
        // Use params2 (the type annotation) and move feature to end
        return `${indent}${params2}`;
      }
    );

    // Fix: Missing closing brace and feature option
    // Find functions that end with } but don't have }, { feature: ... })
    const lines = content.split('\n');
    let newLines: string[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Check if this is a function wrapped with billing gate that might be missing closing
      if (line.includes('withUniversalBillingGate') && line.includes('function')) {
        // Look ahead to find the function end
        let braceCount = 0;
        let foundOpening = false;
        let j = i;
        
        while (j < lines.length) {
          const currentLine = lines[j];
          braceCount += (currentLine.match(/\{/g) || []).length;
          braceCount -= (currentLine.match(/\}/g) || []).length;
          
          if (braceCount > 0) foundOpening = true;
          
          if (foundOpening && braceCount === 0 && currentLine.trim() === '}') {
            // Check if next line has the feature option
            if (j + 1 >= lines.length || !lines[j + 1].includes("feature:")) {
              // Add the feature option
              lines[j] = `}, { feature: '${line.match(/function\s+(GET|POST|PUT|DELETE|PATCH)/)?.[1] || 'API'} API' });`;
              modified = true;
            }
            break;
          }
          j++;
        }
      }
      
      newLines.push(line);
      i++;
    }
    
    if (modified) {
      content = newLines.join('\n');
    }

    // Fix specific malformed patterns
    // Pattern: { params }, { feature: 'POST API' });: { params: { providerId: string } }
    const malformedPattern = /\{\s*params\s*\},\s*\{\s*feature:\s*['"](GET|POST|PUT|DELETE|PATCH)\s+API['"]\s*\}\);:\s*(\{[^}]+\})/g;
    if (malformedPattern.test(content)) {
      content = content.replace(
        malformedPattern,
        (match, method, paramsType) => {
          modified = true;
          return `${paramsType}`;
        }
      );
    }

    // Fix functions that end with } but should end with }, { feature: ... })
    // Look for: export const METHOD = wrapper(async function METHOD(...) { ... }
    const functionEndPattern = /export const (GET|POST|PUT|DELETE|PATCH) = (withUniversalBillingGate|publicRoute|freeRoute)\(/g;
    let functionEndMatch;
    const newContentParts: string[] = [];
    let lastIndex = 0;
    
    while ((functionEndMatch = functionEndPattern.exec(content)) !== null) {
      const startPos = functionEndMatch.index;
      const method = functionEndMatch[1];
      const wrapper = functionEndMatch[2];
      
      // Add content before this function
      newContentParts.push(content.substring(lastIndex, startPos));
      
      // Find the function end
      let pos = startPos;
      let braceCount = 0;
      let inFunction = false;
      
      while (pos < content.length) {
        if (content[pos] === '{') {
          braceCount++;
          inFunction = true;
        } else if (content[pos] === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            // Found function end
            const funcEnd = pos + 1;
            const funcContent = content.substring(startPos, funcEnd);
            
            // Check if it already has the closing
            if (!funcContent.includes("}, { feature:") && !funcContent.includes("});")) {
              // Add the closing
              const beforeClosing = content.substring(startPos, funcEnd - 1);
              const closing = wrapper === 'publicRoute' || wrapper === 'freeRoute' 
                ? '});'
                : `}, { feature: '${method} API' });`;
              
              newContentParts.push(beforeClosing + closing);
              lastIndex = funcEnd;
              modified = true;
            } else {
              newContentParts.push(funcContent);
              lastIndex = funcEnd;
            }
            break;
          }
        }
        pos++;
      }
    }
    
    if (newContentParts.length > 0) {
      newContentParts.push(content.substring(lastIndex));
      content = newContentParts.join('');
    }

    if (modified) {
      writeFileSync(file, content, 'utf-8');
      fixed++;
      console.log(`✅ Fixed: ${file.replace(API_DIR, '')}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} files\n`);
}

fixAllErrors().catch(console.error);
