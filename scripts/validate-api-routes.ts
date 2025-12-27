#!/usr/bin/env tsx
/**
 * API Route Validation Script
 * 
 * Ensures all API routes that use cookies are marked as dynamic
 * to prevent Next.js build-time static generation errors.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface RouteIssue {
  file: string;
  reason: string;
}

function findRouteFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      // Skip node_modules, .next, dist, etc.
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && 
            entry.name !== 'node_modules' && 
            entry.name !== 'dist' && 
            entry.name !== '.next' &&
            entry.name !== 'build') {
          findRouteFiles(fullPath, files);
        }
      } else if (entry.isFile() && entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read - skip silently
  }
  
  return files;
}

function validateApiRoutes(): { passed: boolean; issues: RouteIssue[] } {
  const issues: RouteIssue[] = [];
  const apiDir = join(process.cwd(), 'packages/web/src/app/api');
  
  if (!statSync(apiDir).isDirectory()) {
    console.log('⚠️  API directory not found, skipping validation');
    return { passed: true, issues: [] };
  }
  
  const routeFiles = findRouteFiles(apiDir);
  
  for (const routeFile of routeFiles) {
    try {
      const content = readFileSync(routeFile, 'utf-8');
      
      // Check if route uses cookies (via createClient, cookies(), or getUser)
      const usesCookies = 
        content.includes('createClient') || 
        content.includes('cookies()') ||
        content.includes('.getUser()') ||
        content.includes('auth.getUser()') ||
        content.includes('getUser()');
      
      // Check if route is marked as dynamic
      const isDynamic = 
        content.includes("export const dynamic = 'force-dynamic'") ||
        content.includes('export const dynamic = "force-dynamic"');
      
      // Check if route is marked as static (explicit opt-out)
      const isStatic = 
        content.includes("export const dynamic = 'force-static'") ||
        content.includes('export const dynamic = "force-static"');
      
      if (usesCookies && !isDynamic && !isStatic) {
        const relativePath = routeFile.replace(process.cwd() + '/', '');
        issues.push({
          file: relativePath,
          reason: 'Uses cookies but not marked as dynamic. Add: export const dynamic = \'force-dynamic\';'
        });
      }
    } catch (error) {
      // Skip files that can't be read
      console.warn(`⚠️  Could not read ${routeFile}:`, error);
    }
  }
  
  return {
    passed: issues.length === 0,
    issues,
  };
}

async function main() {
  console.log('🔍 Validating API routes...\n');
  
  const result = validateApiRoutes();
  
  if (result.issues.length > 0) {
    console.log('❌ Found API routes that need to be marked as dynamic:\n');
    result.issues.forEach((issue) => {
      console.log(`   ${issue.file}`);
      console.log(`   → ${issue.reason}\n`);
    });
    console.log('💡 Fix: Add `export const dynamic = \'force-dynamic\';` to routes that use cookies.\n');
    process.exit(1);
  }
  
  console.log('✅ All API routes are properly configured!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});
