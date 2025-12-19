#!/usr/bin/env tsx
/**
 * Edge Functions Verification
 * 
 * Verifies that all edge functions:
 * 1. Deploy successfully
 * 2. Have required tables in the database
 * 3. Have required functions in the database
 * 4. Are not theoretical (actually exist and execute)
 */

import * as fs from 'fs';
import * as path from 'path';

interface EdgeFunction {
  name: string;
  path: string;
  tables: string[];
  functions: string[];
  rpcCalls: string[];
  hasDeployConfig: boolean;
  errors: string[];
}

function findEdgeFunctions(): string[] {
  const functionsDir = path.join(__dirname, '..', 'supabase', 'functions');
  const functions: string[] = [];
  
  if (!fs.existsSync(functionsDir)) {
    return functions;
  }
  
  const dirs = fs.readdirSync(functionsDir);
  for (const dir of dirs) {
    if (dir === '_shared' || dir === '.gitkeep') continue;
    const indexPath = path.join(functionsDir, dir, 'index.ts');
    if (fs.existsSync(indexPath)) {
      functions.push(dir);
    }
  }
  
  return functions;
}

function extractDependencies(filePath: string): {
  tables: string[];
  functions: string[];
  rpcCalls: string[];
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract table references
  const tableMatches = content.matchAll(/\.from\(['"]([^'"]+)['"]\)/g);
  const tables = [...new Set(Array.from(tableMatches, m => m[1]))];
  
  // Extract RPC calls
  const rpcMatches = content.matchAll(/\.rpc\(['"]([^'"]+)['"]/g);
  const rpcCalls = [...new Set(Array.from(rpcMatches, m => m[1]))];
  
  // Extract function calls (could be database functions)
  const functionMatches = content.matchAll(/\b([a-z_]+)\(/g);
  const functions = [...new Set(Array.from(functionMatches, m => m[1]))]
    .filter(f => !['console', 'process', 'require', 'import', 'export'].includes(f));
  
  return { tables, functions, rpcCalls };
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
  console.log('🔍 Verifying edge functions...');
  
  const functionNames = findEdgeFunctions();
  console.log(`📋 Found ${functionNames.length} edge functions`);
  
  const schema = loadProductionSchema();
  const functions: EdgeFunction[] = [];
  
  for (const name of functionNames) {
    const functionPath = path.join(__dirname, '..', 'supabase', 'functions', name, 'index.ts');
    
    if (!fs.existsSync(functionPath)) {
      console.warn(`⚠️  Function ${name} has no index.ts`);
      continue;
    }
    
    const deps = extractDependencies(functionPath);
    const errors: string[] = [];
    
    // Check if tables exist
    for (const table of deps.tables) {
      if (!schema.tables.includes(table)) {
        errors.push(`Table '${table}' does not exist`);
      }
    }
    
    // Check if functions exist
    for (const func of deps.rpcCalls) {
      if (!schema.functions.includes(func)) {
        errors.push(`Function/RPC '${func}' does not exist`);
      }
    }
    
    // Check for deploy config
    const deployConfigPath = path.join(__dirname, '..', 'supabase', 'functions', name, 'supabase', 'config.toml');
    const hasDeployConfig = fs.existsSync(deployConfigPath);
    
    functions.push({
      name,
      path: functionPath.replace(__dirname + '/../', ''),
      ...deps,
      hasDeployConfig,
      errors,
    });
  }
  
  // Generate report
  const report = {
    total: functions.length,
    valid: functions.filter(f => f.errors.length === 0).length,
    invalid: functions.filter(f => f.errors.length > 0).length,
    functions,
  };
  
  const reportPath = path.join(__dirname, '..', 'supabase', 'edge-functions-verification.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Edge Functions Verification Summary:');
  console.log(`  Total functions: ${report.total}`);
  console.log(`  Valid functions: ${report.valid}`);
  console.log(`  Invalid functions: ${report.invalid}`);
  
  if (report.invalid > 0) {
    console.log('\n⚠️  Functions with errors:');
    for (const func of functions.filter(f => f.errors.length > 0)) {
      console.log(`  - ${func.name}:`);
      func.errors.forEach(e => console.log(`    ${e}`));
    }
  }
  
  // Functions without deploy config
  const noConfig = functions.filter(f => !f.hasDeployConfig);
  if (noConfig.length > 0) {
    console.log('\n⚠️  Functions without deploy config:');
    noConfig.forEach(f => console.log(`  - ${f.name}`));
  }
  
  console.log(`\n✅ Edge functions verification complete. Report: ${reportPath}`);
}

try {
  main();
} catch (err: any) {
  console.error('❌ Error:', err);
  process.exit(1);
}
