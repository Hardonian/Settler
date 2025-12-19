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
import { glob } from 'glob';

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

async function findFrontendRoutes(): Promise<string[]> {
  const routes: string[] = [];
  
  // Find Next.js pages
  const pages = await glob('packages/web/app/**/page.tsx', { cwd: __dirname + '/..' });
  const pages2 = await glob('packages/web/pages/**/*.tsx', { cwd: __dirname + '/..' });
  
  for (const page of [...pages, ...pages2]) {
    const route = page
      .replace('packages/web/app/', '/')
      .replace('packages/web/pages/', '/')
      .replace('/page.tsx', '')
      .replace('/index.tsx', '')
      .replace('.tsx', '')
      .replace('.ts', '');
    routes.push(route || '/');
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

async function loadProductionSchema(): Promise<{
  tables: string[];
  functions: string[];
}> {
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

async function main() {
  console.log('🔍 Mapping frontend routes to backend dependencies...');
  
  const routes = await findFrontendRoutes();
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
  const schema = await loadProductionSchema();
  
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

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
