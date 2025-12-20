#!/usr/bin/env tsx
/**
 * Supabase Schema Validation Script
 * 
 * Validates all tables and functions in Supabase backend against:
 * 1. Prisma schema (expected models)
 * 2. Codebase references (what's actually used)
 * 3. Migration files (what's defined)
 * 
 * Outputs a ranked list of missing tables/functions by importance
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface TableInfo {
  name: string;
  schema: string;
  source: 'prisma' | 'migration' | 'codebase';
  importance: number;
  reason: string;
}

interface FunctionInfo {
  name: string;
  schema: string;
  source: 'migration' | 'codebase';
  importance: number;
  reason: string;
}

const PRISMA_SCHEMA_PATH = join(__dirname, '../prisma/schema.prisma');
const SUPABASE_MIGRATIONS_DIR = join(__dirname, '../supabase/migrations');
const CODEBASE_DIR = join(__dirname, '..');

// Extract table names from Prisma schema
function extractPrismaTables(): Set<string> {
  const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
  const tables = new Set<string>();
  
  // Match model definitions: model TableName { ... }
  const modelRegex = /model\s+(\w+)\s*\{/g;
  let match;
  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1];
    // Convert PascalCase to snake_case for table name
    const tableName = modelName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    tables.add(tableName);
  }
  
  return tables;
}

// Extract tables and functions from migration files
function extractMigrationObjects(): {
  tables: Map<string, { schema: string; file: string }>;
  functions: Map<string, { schema: string; file: string }>;
} {
  const tables = new Map<string, { schema: string; file: string }>();
  const functions = new Map<string, { schema: string; file: string }>();
  
  function scanDirectory(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('_')) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.sql')) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Extract CREATE TABLE statements
          const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)/gi;
          let match;
          while ((match = tableRegex.exec(content)) !== null) {
            const schema = match[1] || 'public';
            const tableName = match[2];
            const key = `${schema}.${tableName}`;
            if (!tables.has(key)) {
              tables.set(key, { schema, file: entry.name });
            }
          }
          
          // Extract CREATE FUNCTION statements
          const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:(\w+)\.)?(\w+)\s*\(/gi;
          while ((match = functionRegex.exec(content)) !== null) {
            const schema = match[1] || 'public';
            const funcName = match[2];
            const key = `${schema}.${funcName}`;
            if (!functions.has(key)) {
              functions.set(key, { schema, file: entry.name });
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }
  }
  
  scanDirectory(SUPABASE_MIGRATIONS_DIR);
  return { tables, functions };
}

// Search codebase for table/function references
function extractCodebaseReferences(): {
  tables: Set<string>;
  functions: Set<string>;
} {
  const tables = new Set<string>();
  const functions = new Set<string>();
  
  // Common patterns for table references
  const tablePatterns = [
    /FROM\s+['"]?(\w+)['"]?/gi,
    /JOIN\s+['"]?(\w+)['"]?/gi,
    /INTO\s+['"]?(\w+)['"]?/gi,
    /UPDATE\s+['"]?(\w+)['"]?/gi,
    /DELETE\s+FROM\s+['"]?(\w+)['"]?/gi,
    /\.from\(['"](\w+)['"]\)/gi,
    /\.table\(['"](\w+)['"]\)/gi,
    /table\(['"](\w+)['"]\)/gi,
  ];
  
  // Common patterns for function references
  const functionPatterns = [
    /\.rpc\(['"](\w+)['"]/gi,
    /SELECT\s+(\w+)\s*\(/gi,
    /CALL\s+(\w+)\s*\(/gi,
  ];
  
  function scanDirectory(dir: string, depth = 0) {
    if (depth > 10) return; // Limit recursion depth
    
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip common directories
        if (entry.name.startsWith('.') || 
            entry.name === 'node_modules' ||
            entry.name === '.turbo' ||
            entry.name === 'dist' ||
            entry.name === 'build') {
          continue;
        }
        
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath, depth + 1);
        } else if (entry.isFile() && 
                   (entry.name.endsWith('.ts') || 
                    entry.name.endsWith('.tsx') || 
                    entry.name.endsWith('.js') ||
                    entry.name.endsWith('.jsx') ||
                    entry.name.endsWith('.sql'))) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            
            // Extract table references
            for (const pattern of tablePatterns) {
              let match;
              while ((match = pattern.exec(content)) !== null) {
                const tableName = match[1];
                // Filter out common false positives
                if (!['select', 'where', 'group', 'order', 'limit', 'offset'].includes(tableName.toLowerCase())) {
                  tables.add(tableName);
                }
              }
            }
            
            // Extract function references
            for (const pattern of functionPatterns) {
              let match;
              while ((match = pattern.exec(content)) !== null) {
                functions.add(match[1]);
              }
            }
          } catch (err) {
            // Skip files that can't be read
          }
        }
      }
    } catch (err) {
      // Skip directories that can't be read
    }
  }
  
  // Scan key directories
  const keyDirs = [
    join(CODEBASE_DIR, 'packages'),
    join(CODEBASE_DIR, 'supabase', 'functions'),
  ];
  
  for (const dir of keyDirs) {
    try {
      scanDirectory(dir);
    } catch (err) {
      // Skip if directory doesn't exist
    }
  }
  
  return { tables, functions };
}

// Calculate importance score
function calculateImportance(
  name: string,
  source: 'prisma' | 'migration' | 'codebase',
  isReferenced: boolean,
  isInPrisma: boolean
): { importance: number; reason: string } {
  let importance = 0;
  const reasons: string[] = [];
  
  // Base importance
  if (isInPrisma) {
    importance += 10;
    reasons.push('Defined in Prisma schema (core model)');
  }
  
  if (isReferenced) {
    importance += 8;
    reasons.push('Referenced in codebase');
  }
  
  if (source === 'migration') {
    importance += 5;
    reasons.push('Exists in migration files');
  }
  
  // Critical tables get bonus
  const criticalTables = [
    'billing_accounts', 'subscriptions', 'tenants', 'users',
    'recon_jobs', 'recon_results', 'usage_events', 'receipts'
  ];
  if (criticalTables.some(t => name.includes(t))) {
    importance += 5;
    reasons.push('Critical business table');
  }
  
  // Missing from Prisma but referenced = high importance
  if (!isInPrisma && isReferenced) {
    importance += 7;
    reasons.push('Used in code but missing from Prisma');
  }
  
  return {
    importance,
    reason: reasons.join('; ')
  };
}

// Main validation function
function validateSchema() {
  console.log('🔍 Validating Supabase schema...\n');
  
  // Extract data from all sources
  console.log('📊 Extracting Prisma tables...');
  const prismaTables = extractPrismaTables();
  console.log(`   Found ${prismaTables.size} tables in Prisma schema`);
  
  console.log('📊 Extracting migration objects...');
  const { tables: migrationTables, functions: migrationFunctions } = extractMigrationObjects();
  console.log(`   Found ${migrationTables.size} tables in migrations`);
  console.log(`   Found ${migrationFunctions.size} functions in migrations`);
  
  console.log('📊 Extracting codebase references...');
  const { tables: codebaseTables, functions: codebaseFunctions } = extractCodebaseReferences();
  console.log(`   Found ${codebaseTables.size} table references in codebase`);
  console.log(`   Found ${codebaseFunctions.size} function references in codebase`);
  
  // Find missing tables
  console.log('\n🔎 Analyzing missing tables...\n');
  const missingTables: TableInfo[] = [];
  
  // Check Prisma tables against migrations
  for (const tableName of prismaTables) {
    const found = Array.from(migrationTables.keys()).some(key => 
      key.endsWith(`.${tableName}`) || key === tableName
    );
    
    if (!found) {
      const isReferenced = codebaseTables.has(tableName);
      const { importance, reason } = calculateImportance(
        tableName,
        'prisma',
        isReferenced,
        true
      );
      missingTables.push({
        name: tableName,
        schema: 'public',
        source: 'prisma',
        importance,
        reason
      });
    }
  }
  
  // Check codebase references against migrations
  for (const tableName of codebaseTables) {
    const found = Array.from(migrationTables.keys()).some(key => 
      key.endsWith(`.${tableName}`) || key === tableName
    );
    const isInPrisma = prismaTables.has(tableName);
    
    if (!found && !isInPrisma) {
      const { importance, reason } = calculateImportance(
        tableName,
        'codebase',
        true,
        false
      );
      missingTables.push({
        name: tableName,
        schema: 'public',
        source: 'codebase',
        importance,
        reason
      });
    }
  }
  
  // Find missing functions
  console.log('🔎 Analyzing missing functions...\n');
  const missingFunctions: FunctionInfo[] = [];
  
  for (const funcName of codebaseFunctions) {
    const found = Array.from(migrationFunctions.keys()).some(key => 
      key.endsWith(`.${funcName}`) || key === funcName
    );
    
    if (!found) {
      missingFunctions.push({
        name: funcName,
        schema: 'public',
        source: 'codebase',
        importance: 6,
        reason: 'Referenced in codebase but not found in migrations'
      });
    }
  }
  
  // Sort by importance
  missingTables.sort((a, b) => b.importance - a.importance);
  missingFunctions.sort((a, b) => b.importance - a.importance);
  
  // Generate report
  console.log('='.repeat(80));
  console.log('📋 SUPABASE SCHEMA VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log();
  
  if (missingTables.length === 0 && missingFunctions.length === 0) {
    console.log('✅ No missing tables or functions found!');
    return;
  }
  
  if (missingTables.length > 0) {
    console.log(`⚠️  MISSING TABLES (${missingTables.length}):\n`);
    missingTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name} (Importance: ${table.importance})`);
      console.log(`   Source: ${table.source}`);
      console.log(`   Reason: ${table.reason}`);
      console.log();
    });
  }
  
  if (missingFunctions.length > 0) {
    console.log(`⚠️  MISSING FUNCTIONS (${missingFunctions.length}):\n`);
    missingFunctions.forEach((func, index) => {
      console.log(`${index + 1}. ${func.name} (Importance: ${func.importance})`);
      console.log(`   Source: ${func.source}`);
      console.log(`   Reason: ${func.reason}`);
      console.log();
    });
  }
  
  // Summary statistics
  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Prisma tables: ${prismaTables.size}`);
  console.log(`Total migration tables: ${migrationTables.size}`);
  console.log(`Total codebase table references: ${codebaseTables.size}`);
  console.log(`Missing tables: ${missingTables.length}`);
  console.log(`Missing functions: ${missingFunctions.length}`);
  console.log();
  
  // Export to JSON for further processing
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      prismaTables: prismaTables.size,
      migrationTables: migrationTables.size,
      codebaseTableReferences: codebaseTables.size,
      missingTables: missingTables.length,
      missingFunctions: missingFunctions.length,
    },
    missingTables: missingTables,
    missingFunctions: missingFunctions,
  };
  
  const reportPath = join(__dirname, '../supabase-validation-report.json');
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}`);
}

// Run validation
if (require.main === module) {
  validateSchema();
}

export { validateSchema };
