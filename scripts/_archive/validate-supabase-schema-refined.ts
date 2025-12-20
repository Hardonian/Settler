#!/usr/bin/env tsx
/**
 * Refined Supabase Schema Validation Script
 * 
 * Validates all tables and functions in Supabase backend against:
 * 1. Prisma schema (expected models with @@map annotations)
 * 2. Migration files (what's actually defined)
 * 3. Codebase references (what's actually used)
 * 
 * Outputs a ranked list of missing tables/functions by importance
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

interface MissingItem {
  name: string;
  schema: string;
  source: 'prisma' | 'codebase';
  importance: number;
  reason: string;
  category: 'table' | 'function';
}

const PRISMA_SCHEMA_PATH = join(__dirname, '../prisma/schema.prisma');
const PRISMA_SCHEMA_ADDITIONS_PATH = join(__dirname, '../prisma/schema-additions.prisma');
const SUPABASE_MIGRATIONS_DIR = join(__dirname, '../supabase/migrations');

// Extract actual table names from Prisma schema using @@map annotations
function extractPrismaTables(): Set<string> {
  const tables = new Set<string>();
  
  function parseSchemaFile(filePath: string) {
    if (!existsSync(filePath)) return;
    
    const schema = readFileSync(filePath, 'utf-8');
    
    // Match model definitions with @@map annotations
    const modelRegex = /model\s+(\w+)\s*\{[\s\S]*?@@map\(["'](\w+)["']\)/g;
    let match;
    while ((match = modelRegex.exec(schema)) !== null) {
      const tableName = match[2]; // Use the @@map value
      tables.add(tableName);
    }
    
    // Also check for models without @@map (use snake_case conversion)
    const allModelsRegex = /model\s+(\w+)\s*\{/g;
    while ((match = allModelsRegex.exec(schema)) !== null) {
      const modelName = match[1];
      const tableName = modelName
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
      tables.add(tableName);
    }
  }
  
  parseSchemaFile(PRISMA_SCHEMA_PATH);
  parseSchemaFile(PRISMA_SCHEMA_ADDITIONS_PATH);
  
  return tables;
}

// Extract tables and functions from migration files
function extractMigrationObjects(): {
  tables: Set<string>;
  functions: Set<string>;
} {
  const tables = new Set<string>();
  const functions = new Set<string>();
  
  function scanDirectory(dir: string) {
    if (!existsSync(dir)) return;
    
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('_')) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.sql')) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Extract CREATE TABLE statements - more precise pattern
          const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)\s*\(/gi;
          let match;
          while ((match = tableRegex.exec(content)) !== null) {
            const schema = match[1] || 'public';
            const tableName = match[2];
            // Only add if it's a real table name (not a keyword)
            if (tableName && tableName.length > 1 && !['select', 'where', 'from', 'join'].includes(tableName.toLowerCase())) {
              tables.add(`${schema}.${tableName}`);
              tables.add(tableName); // Also add without schema
            }
          }
          
          // Extract CREATE FUNCTION statements
          const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:(\w+)\.)?(\w+)\s*\(/gi;
          while ((match = functionRegex.exec(content)) !== null) {
            const schema = match[1] || 'public';
            const funcName = match[2];
            if (funcName && funcName.length > 1) {
              functions.add(`${schema}.${funcName}`);
              functions.add(funcName);
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

// Search codebase for actual table/function references (more precise)
function extractCodebaseReferences(): {
  tables: Set<string>;
  functions: Set<string>;
} {
  const tables = new Set<string>();
  const functions = new Set<string>();
  
  // Known valid table patterns from Supabase/PostgREST
  const validTablePatterns = [
    /\.from\(['"]([a-z_][a-z0-9_]*?)['"]\)/gi,
    /\.table\(['"]([a-z_][a-z0-9_]*?)['"]\)/gi,
    /table\(['"]([a-z_][a-z0-9_]*?)['"]\)/gi,
    /FROM\s+['"]?([a-z_][a-z0-9_]*?)['"]?\s+/gi,
    /JOIN\s+['"]?([a-z_][a-z0-9_]*?)['"]?\s+/gi,
    /INTO\s+['"]?([a-z_][a-z0-9_]*?)['"]?\s+/gi,
    /UPDATE\s+['"]?([a-z_][a-z0-9_]*?)['"]?\s+/gi,
  ];
  
  // Known valid function patterns
  const validFunctionPatterns = [
    /\.rpc\(['"]([a-z_][a-z0-9_]*?)['"]/gi,
    /SELECT\s+([a-z_][a-z0-9_]*?)\s*\(/gi,
  ];
  
  // Common false positives to exclude
  const excludeList = new Set([
    'select', 'where', 'from', 'join', 'into', 'update', 'delete',
    'the', 'and', 'or', 'as', 'is', 'in', 'on', 'at', 'to', 'for',
    'pg', 'uuid', 'json', 'text', 'bool', 'int', 'date', 'time',
    'request', 'response', 'status', 'error', 'user', 'password',
    'express', 'crypto', 'shared', 'external', 'provider', 'transaction',
    'payment', 'purchase', 'stripe', 'paypal', 'google', 'facebook',
    'test', 'supertest', 'non_existent_table', 'information_schema',
    'pg_indexes', 'pg_tables', 'pg_policies'
  ]);
  
  function scanFile(filePath: string) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Extract table references
      for (const pattern of validTablePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const tableName = match[1];
          if (tableName && !excludeList.has(tableName.toLowerCase())) {
            tables.add(tableName);
          }
        }
      }
      
      // Extract function references
      for (const pattern of validFunctionPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const funcName = match[1];
          if (funcName && !excludeList.has(funcName.toLowerCase())) {
            functions.add(funcName);
          }
        }
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
  
  function scanDirectory(dir: string, depth = 0) {
    if (depth > 8 || !existsSync(dir)) return;
    
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
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
                    entry.name.endsWith('.jsx'))) {
          scanFile(fullPath);
        }
      }
    } catch (err) {
      // Skip directories that can't be read
    }
  }
  
  // Scan key directories
  const keyDirs = [
    join(__dirname, '../packages'),
    join(__dirname, '../supabase/functions'),
  ];
  
  for (const dir of keyDirs) {
    scanDirectory(dir);
  }
  
  return { tables, functions };
}

// Calculate importance score
function calculateImportance(
  name: string,
  source: 'prisma' | 'codebase',
  isReferenced: boolean,
  isInPrisma: boolean,
  category: 'table' | 'function'
): { importance: number; reason: string } {
  let importance = 0;
  const reasons: string[] = [];
  
  // Base importance
  if (isInPrisma) {
    importance += 10;
    reasons.push('Defined in Prisma schema');
  }
  
  if (isReferenced) {
    importance += 8;
    reasons.push('Referenced in codebase');
  }
  
  // Critical tables get bonus
  const criticalTables = [
    'billing_accounts', 'subscriptions', 'tenants', 'users',
    'recon_jobs', 'recon_results', 'usage_events', 'receipts',
    'ingestion_sources', 'normalized_transactions'
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
  
  // Functions are generally less critical than tables
  if (category === 'function') {
    importance = Math.max(1, importance - 2);
  }
  
  return {
    importance,
    reason: reasons.join('; ') || 'Found in analysis'
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
  console.log(`   Found ${migrationTables.size} table references in migrations`);
  console.log(`   Found ${migrationFunctions.size} function references in migrations`);
  
  console.log('📊 Extracting codebase references...');
  const { tables: codebaseTables, functions: codebaseFunctions } = extractCodebaseReferences();
  console.log(`   Found ${codebaseTables.size} table references in codebase`);
  console.log(`   Found ${codebaseFunctions.size} function references in codebase`);
  
  // Find missing tables
  console.log('\n🔎 Analyzing missing tables...\n');
  const missingItems: MissingItem[] = [];
  
  // Check Prisma tables against migrations
  for (const tableName of prismaTables) {
    const found = migrationTables.has(tableName) || migrationTables.has(`public.${tableName}`);
    const isReferenced = codebaseTables.has(tableName);
    
    if (!found) {
      const { importance, reason } = calculateImportance(
        tableName,
        'prisma',
        isReferenced,
        true,
        'table'
      );
      missingItems.push({
        name: tableName,
        schema: 'public',
        source: 'prisma',
        importance,
        reason,
        category: 'table'
      });
    }
  }
  
  // Check codebase references against migrations and Prisma
  for (const tableName of codebaseTables) {
    const found = migrationTables.has(tableName) || migrationTables.has(`public.${tableName}`);
    const isInPrisma = prismaTables.has(tableName);
    
    if (!found && !isInPrisma) {
      const { importance, reason } = calculateImportance(
        tableName,
        'codebase',
        true,
        false,
        'table'
      );
      missingItems.push({
        name: tableName,
        schema: 'public',
        source: 'codebase',
        importance,
        reason,
        category: 'table'
      });
    }
  }
  
  // Find missing functions
  console.log('🔎 Analyzing missing functions...\n');
  
  for (const funcName of codebaseFunctions) {
    const found = migrationFunctions.has(funcName) || migrationFunctions.has(`public.${funcName}`);
    
    if (!found) {
      missingItems.push({
        name: funcName,
        schema: 'public',
        source: 'codebase',
        importance: 6,
        reason: 'Referenced in codebase but not found in migrations',
        category: 'function'
      });
    }
  }
  
  // Sort by importance
  missingItems.sort((a, b) => b.importance - a.importance);
  
  // Filter to top 50 most important
  const topMissing = missingItems.slice(0, 50);
  
  // Generate report
  console.log('='.repeat(80));
  console.log('📋 SUPABASE SCHEMA VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log();
  
  if (topMissing.length === 0) {
    console.log('✅ No critical missing tables or functions found!');
    return;
  }
  
  const missingTables = topMissing.filter(item => item.category === 'table');
  const missingFunctions = topMissing.filter(item => item.category === 'function');
  
  if (missingTables.length > 0) {
    console.log(`⚠️  MISSING TABLES (Top ${missingTables.length}):\n`);
    missingTables.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (Importance: ${item.importance})`);
      console.log(`   Source: ${item.source}`);
      console.log(`   Reason: ${item.reason}`);
      console.log();
    });
  }
  
  if (missingFunctions.length > 0) {
    console.log(`⚠️  MISSING FUNCTIONS (Top ${missingFunctions.length}):\n`);
    missingFunctions.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (Importance: ${item.importance})`);
      console.log(`   Source: ${item.source}`);
      console.log(`   Reason: ${item.reason}`);
      console.log();
    });
  }
  
  // Summary statistics
  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Prisma tables: ${prismaTables.size}`);
  console.log(`Total migration table references: ${migrationTables.size}`);
  console.log(`Total codebase table references: ${codebaseTables.size}`);
  console.log(`Missing tables (top 50): ${missingTables.length}`);
  console.log(`Missing functions (top 50): ${missingFunctions.length}`);
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
    missingItems: topMissing,
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
