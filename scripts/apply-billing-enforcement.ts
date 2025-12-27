#!/usr/bin/env tsx
/**
 * Apply Billing Enforcement to Routes
 * 
 * Systematically adds billing gates to routes that need them.
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

const API_DIR = join(process.cwd(), 'packages/web/src/app/api');

// Routes that should be PUBLIC (no billing)
const PUBLIC_ROUTES = [
  '/api/status',
  '/api/status/health',
  '/api/public',
  '/api/v1/route', // Base API info
  '/api/docs/openapi',
  '/api/oss/stats',
];

// Routes that should be FREE (usage-limited, no subscription)
const FREE_ROUTES = [
  '/api/v1/convert', // Utility conversion
];

// Routes that need BILLING (paid features)
const BILLING_REQUIRED_PATTERNS = [
  '/api/v1/recon',
  '/api/v1/receipts',
  '/api/v1/feature-flags',
  '/api/console',
  '/api/integrations',
  '/api/data',
  '/api/exports',
  '/api/stripe/checkout',
  '/api/stripe/portal',
];

async function getRouteFiles(): Promise<string[]> {
  const files = await glob('**/route.ts', { cwd: API_DIR, absolute: true });
  return files;
}

function isPublicRoute(filePath: string): boolean {
  const relativePath = filePath.replace(API_DIR, '').replace('/route.ts', '');
  return PUBLIC_ROUTES.some(route => relativePath.includes(route.replace('/api', '')));
}

function isFreeRoute(filePath: string): boolean {
  const relativePath = filePath.replace(API_DIR, '').replace('/route.ts', '');
  return FREE_ROUTES.some(route => relativePath.includes(route.replace('/api', '')));
}

function needsBilling(filePath: string): boolean {
  const relativePath = filePath.replace(API_DIR, '').replace('/route.ts', '');
  
  // Skip public/free routes
  if (isPublicRoute(filePath) || isFreeRoute(filePath)) {
    return false;
  }
  
  // Check if matches billing required patterns
  return BILLING_REQUIRED_PATTERNS.some(pattern => 
    relativePath.includes(pattern.replace('/api', ''))
  );
}

function hasBillingEnforcement(content: string): boolean {
  return (
    content.includes('requireActiveSubscription') ||
    content.includes('withBillingEnforcement') ||
    content.includes('withSubscriptionGate') ||
    content.includes('withUniversalBillingGate') ||
    content.includes('publicRoute') ||
    content.includes('freeRoute')
  );
}

async function addBillingGate(filePath: string, isPublic: boolean, isFree: boolean): Promise<void> {
  const content = await readFile(filePath, 'utf-8');
  
  // Skip if already has enforcement
  if (hasBillingEnforcement(content)) {
    return;
  }
  
  // Determine which wrapper to use
  let wrapper: string;
  let importStatement: string;
  
  if (isPublic) {
    wrapper = 'publicRoute';
    importStatement = "import { publicRoute } from '@/middleware/billing-gate-universal';";
  } else if (isFree) {
    wrapper = 'freeRoute';
    importStatement = "import { freeRoute } from '@/middleware/billing-gate-universal';";
  } else {
    wrapper = 'withUniversalBillingGate';
    importStatement = "import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';";
  }
  
  // Find export functions
  const exportRegex = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g;
  const matches = Array.from(content.matchAll(exportRegex));
  
  if (matches.length === 0) {
    return; // No handlers to wrap
  }
  
  // Add import at top (after other imports)
  const importSectionEnd = content.lastIndexOf("import");
  const lastImportLine = content.substring(0, importSectionEnd).lastIndexOf('\n');
  const beforeImports = content.substring(0, lastImportLine + 1);
  const afterImports = content.substring(lastImportLine + 1);
  
  // Check if import already exists
  if (!content.includes(importStatement)) {
    const newContent = beforeImports + importStatement + '\n' + afterImports;
    content = newContent;
  }
  
  // Wrap each export function
  let modifiedContent = content;
  for (const match of matches.reverse()) { // Reverse to maintain positions
    const funcStart = match.index!;
    const funcName = match[2]; // GET, POST, etc.
    
    // Find the function body end (simplified - assumes single function)
    const funcBodyStart = content.indexOf('{', funcStart);
    let braceCount = 1;
    let pos = funcBodyStart + 1;
    while (braceCount > 0 && pos < content.length) {
      if (content[pos] === '{') braceCount++;
      if (content[pos] === '}') braceCount--;
      pos++;
    }
    
    const funcEnd = pos;
    const funcDef = content.substring(funcStart, funcEnd);
    
    // Wrap the function
    const wrappedFunc = isPublic || isFree
      ? `export const ${funcName} = ${wrapper}(${funcDef});`
      : `export const ${funcName} = ${wrapper}(${funcDef}, { feature: '${funcName} API' });`;
    
    modifiedContent = modifiedContent.substring(0, funcStart) + wrappedFunc + modifiedContent.substring(funcEnd);
  }
  
  await writeFile(filePath, modifiedContent, 'utf-8');
  console.log(`✅ Added ${wrapper} to ${filePath.replace(API_DIR, '')}`);
}

async function main() {
  console.log('🔒 Applying billing enforcement to routes...\n');
  
  const files = await getRouteFiles();
  let processed = 0;
  let skipped = 0;
  
  for (const file of files) {
    const isPublic = isPublicRoute(file);
    const isFree = isFreeRoute(file);
    const needsBillingGate = needsBilling(file);
    
    if (needsBillingGate || isPublic || isFree) {
      if (!hasBillingEnforcement(await readFile(file, 'utf-8'))) {
        await addBillingGate(file, isPublic, isFree);
        processed++;
      } else {
        skipped++;
      }
    }
  }
  
  console.log(`\n✅ Processed: ${processed} routes`);
  console.log(`⏭️  Skipped (already has enforcement): ${skipped} routes`);
}

main().catch(console.error);
