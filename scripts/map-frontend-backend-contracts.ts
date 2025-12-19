#!/usr/bin/env tsx
/**
 * Frontend ↔ Backend Contract Mapping
 * 
 * Maps all frontend routes to their backend dependencies:
 * - Required tables
 * - Required functions
 * - Required RLS permissions
 * 
 * This ensures no routes reference non-existent backend resources.
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteContract {
  route: string;
  file: string;
  tables: string[];
  functions: string[];
  rpcCalls: string[];
  requiresAuth: boolean;
  requiresTenant: boolean;
}

interface ContractReport {
  routes: RouteContract[];
  orphanedTables: string[]; // Tables referenced but not in schema
  orphanedFunctions: string[]; // Functions referenced but not in schema
  routesWithoutBackend: RouteContract[]; // Routes with no backend dependencies
}

function findFiles(dir: string, pattern: RegExp, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
        findFiles(filePath, pattern, fileList);
      } else if (pattern.test(file)) {
        fileList.push(filePath);
      }
    } catch {
      // Skip files we can't read
    }
  }
  return fileList;
}

function findFrontendRoutes(): string[] {
  const routes: string[] = [];
  const baseDir = path.join(__dirname, '..');
  
  try {
    // Find Next.js pages
    const appDir = path.join(baseDir, 'packages/web/app');
    const pagesDir = path.join(baseDir, 'packages/web/pages');
    
    const appPages = fs.existsSync(appDir) ? findFiles(appDir, /page\.tsx$/) : [];
    const pagesPages = fs.existsSync(pagesDir) ? findFiles(pagesDir, /\.tsx?$/) : [];
    
    for (const page of [...appPages, ...pagesPages]) {
      const relativePath = path.relative(baseDir, page);
      let route = relativePath
        .replace(/^packages\/web\/app\//, '/')
        .replace(/^packages\/web\/pages\//, '/')
        .replace(/\/page\.tsx$/, '')
        .replace(/\/index\.tsx$/, '')
        .replace(/\.tsx$/, '')
        .replace(/\.ts$/, '');
      
      if (!route || route === '') route = '/';
      routes.push(route);
    }
  } catch (err) {
    console.warn('⚠️  Error finding frontend routes:', err);
  }
  
  return [...new Set(routes)];
}

function extractBackendDependencies(filePath: string): {
  tables: string[];
  functions: string[];
  rpcCalls: string[];
  requiresAuth: boolean;
  requiresTenant: boolean;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract table references (Supabase .from() calls)
  const tableMatches = content.matchAll(/\.from\(['"]([^'"]+)['"]\)/g);
  const tables = [...new Set(Array.from(tableMatches, m => m[1]))];
  
  // Extract RPC calls
  const rpcMatches = content.matchAll(/\.rpc\(['"]([^'"]+)['"]/g);
  const rpcCalls = [...new Set(Array.from(rpcMatches, m => m[1]))];
  
  // Extract function calls (could be edge functions or database functions)
  const functionMatches = content.matchAll(/functions\/v1\/([^'"\s]+)/g);
  const functions = [...new Set(Array.from(functionMatches, m => m[1]))];
  
  // Check for auth requirements
  const requiresAuth = /useUser|getUser|auth\.|createClient.*anon|serviceRole/i.test(content);
  const requiresTenant = /tenant|current_tenant|tenant_id/i.test(content);
  
  return {
    tables,
    functions,
    rpcCalls,
    requiresAuth,
    requiresTenant,
  };
}

function loadProductionSchema(): {
  tables: string[];
  functions: string[];
} {
  const schemaPath = path.join(__dirname, '..', 'supabase', 'production-schema.json');
  
  if (!fs.existsSync(schemaPath)) {
    console.warn('⚠️  Production schema not found. Run: npx tsx scripts/introspect-production-schema.ts');
    return { tables: [], functions: [] };
  }
  
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  
  return {
    tables: schema.tables?.map((t: any) => t.name) || [],
    functions: schema.functions?.map((f: any) => f.name) || [],
  };
}

function main() {
  console.log('🔍 Mapping frontend routes to backend dependencies...');
  
  const routes = findFrontendRoutes();
  console.log(`📋 Found ${routes.length} routes`);
  
  const contracts: RouteContract[] = [];
  
  // Analyze each route
  for (const route of routes) {
    // Find the file for this route
    const possibleFiles = [
      `packages/web/app${route === '/' ? '' : route}/page.tsx`,
      `packages/web/pages${route === '/' ? '/index' : route}.tsx`,
      `packages/web/pages${route === '/' ? '/index' : route}.ts`,
    ];
    
    let filePath: string | null = null;
    for (const file of possibleFiles) {
      const fullPath = path.join(__dirname, '..', file);
      if (fs.existsSync(fullPath)) {
        filePath = fullPath;
        break;
      }
    }
    
    if (!filePath) {
      console.warn(`⚠️  Could not find file for route: ${route}`);
      continue;
    }
    
    const deps = extractBackendDependencies(filePath);
    
    contracts.push({
      route,
      file: filePath.replace(__dirname + '/../', ''),
      ...deps,
    });
  }
  
  // Load production schema
  const schema = loadProductionSchema();
  
  // Generate report
  const report: ContractReport = {
    routes: contracts,
    orphanedTables: [],
    orphanedFunctions: [],
    routesWithoutBackend: [],
  };
  
  // Check for orphaned references
  for (const contract of contracts) {
    // Check tables
    for (const table of contract.tables) {
      if (!schema.tables.includes(table)) {
        report.orphanedTables.push(table);
      }
    }
    
    // Check functions/RPCs
    for (const func of [...contract.functions, ...contract.rpcCalls]) {
      if (!schema.functions.includes(func)) {
        report.orphanedFunctions.push(func);
      }
    }
    
    // Check for routes without backend
    if (
      contract.tables.length === 0 &&
      contract.functions.length === 0 &&
      contract.rpcCalls.length === 0
    ) {
      report.routesWithoutBackend.push(contract);
    }
  }
  
  // Write report
  const reportPath = path.join(__dirname, '..', 'supabase', 'frontend-backend-contracts.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Contract Mapping Summary:');
  console.log(`  Routes analyzed: ${contracts.length}`);
  console.log(`  Routes with backend: ${contracts.length - report.routesWithoutBackend.length}`);
  console.log(`  Routes without backend: ${report.routesWithoutBackend.length}`);
  console.log(`  Orphaned table references: ${report.orphanedTables.length}`);
  console.log(`  Orphaned function references: ${report.orphanedFunctions.length}`);
  
  if (report.orphanedTables.length > 0) {
    console.log('\n⚠️  Orphaned table references:');
    report.orphanedTables.forEach(t => console.log(`  - ${t}`));
  }
  
  if (report.orphanedFunctions.length > 0) {
    console.log('\n⚠️  Orphaned function references:');
    report.orphanedFunctions.forEach(f => console.log(`  - ${f}`));
  }
  
  if (report.routesWithoutBackend.length > 0) {
    console.log('\n📄 Routes without backend dependencies (marketing/static):');
    report.routesWithoutBackend.forEach(r => console.log(`  - ${r.route}`));
  }
  
  console.log(`\n✅ Contract mapping complete. Report: ${reportPath}`);
}

try {
  main();
} catch (err: any) {
  console.error('❌ Error:', err);
  process.exit(1);
}
