#!/usr/bin/env tsx
/**
 * Generate Canonical Golden Migration
 * 
 * Creates a lean, idempotent migration that represents the canonical schema state
 * by comparing production schema to what should exist, and only including
 * what's actually needed (not Supabase system tables, not duplicates).
 * 
 * This creates a much smaller migration focused on Settler.dev application schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

interface ProductionSchema {
  tables: Array<{
    schema: string;
    name: string;
    columns: Array<{ name: string; type: string; nullable: boolean; default: string | null }>;
    constraints: Array<{ name: string; type: string; definition: string }>;
    indexes: Array<{ name: string; unique: boolean; definition: string }>;
    rlsEnabled: boolean;
    policies: Array<{ name: string; permissive: boolean; roles: string[]; cmd: string; qual: string | null; with_check: string | null }>;
  }>;
  functions: Array<{
    schema: string;
    name: string;
    returnType: string;
    arguments: string;
    language: string;
    definition: string;
  }>;
  triggers: Array<{
    schema: string;
    table: string;
    name: string;
    event: string;
    timing: string;
    function: string;
  }>;
  views: Array<{
    schema: string;
    name: string;
    definition: string;
  }>;
  enums: Array<{
    schema: string;
    name: string;
    values: string[];
  }>;
}

// Filter out Supabase system schemas and tables
function isApplicationTable(table: { schema: string; name: string }): boolean {
  const systemSchemas = ['pg_catalog', 'information_schema', 'pg_toast', 'pg_temp', 
    'realtime', 'storage', 'supabase_functions', 'vault', 'graphql', 'graphql_public',
    'pgsodium', 'pgsodium_masks', 'extensions', 'pgbouncer', 'pgmq'];
  
  if (systemSchemas.includes(table.schema)) return false;
  
  // Filter out Supabase system tables
  const systemTables = ['schema_migrations', 'migrations', 'hooks', 'secrets'];
  if (systemTables.includes(table.name)) return false;
  
  return true;
}

function isApplicationFunction(func: { schema: string; name: string }): boolean {
  const systemSchemas = ['pg_catalog', 'information_schema', 'realtime', 'storage', 
    'supabase_functions', 'vault', 'graphql', 'graphql_public', 'pgsodium', 'extensions'];
  
  if (systemSchemas.includes(func.schema)) return false;
  
  // Filter out Supabase system functions
  if (func.name.startsWith('supabase_') || func.name.startsWith('pg_')) return false;
  
  return true;
}

function generateColumnDefinition(col: { name: string; type: string; nullable: boolean; default: string | null }): string {
  let def = `  ${col.name} ${col.type}`;
  if (!col.nullable) def += ' NOT NULL';
  if (col.default && !col.default.includes('nextval')) { // Skip sequences
    def += ` DEFAULT ${col.default}`;
  }
  return def;
}

async function generateCanonicalMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔍 Loading production schema...');
  const schemaPath = path.join(__dirname, '..', 'supabase', 'production-schema.json');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Production schema not found. Run: npm run verify:schema-introspect');
  }
  
  const productionSchema: ProductionSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  
  // Filter to application tables/functions only
  const appTables = productionSchema.tables.filter(isApplicationTable);
  const appFunctions = productionSchema.functions.filter(isApplicationFunction);
  const appEnums = productionSchema.enums.filter(e => e.schema === 'public');
  
  console.log(`✅ Filtered to application schema: ${appTables.length} tables, ${appFunctions.length} functions, ${appEnums.length} enums`);

  const migrations: string[] = [];
  
  migrations.push(`-- ============================================================================
-- SETTLER.DEV CANONICAL GOLDEN MIGRATION
-- ============================================================================
-- This is the canonical, idempotent schema definition for Settler.dev
-- Generated from production introspection: ${new Date().toISOString()}
-- 
-- IMPORTANT: This migration is designed to be:
-- 1. Idempotent - safe to run multiple times (uses IF NOT EXISTS)
-- 2. Complete - defines the entire application schema
-- 3. Authoritative - this is the source of truth
-- 4. Lean - only includes application tables/functions, not Supabase system objects
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

`);

  // Enums
  if (appEnums.length > 0) {
    migrations.push(`-- ============================================================================
-- ENUMS
-- ============================================================================

`);
    
    for (const enumDef of appEnums) {
      // Parse PostgreSQL array format "{value1,value2}" or use array directly
      let values: string[];
      if (Array.isArray(enumDef.values)) {
        values = enumDef.values;
      } else if (typeof enumDef.values === 'string' && enumDef.values.startsWith('{')) {
        // Parse "{value1,value2}" format
        values = enumDef.values.slice(1, -1).split(',').map(v => v.trim());
      } else {
        values = [String(enumDef.values)];
      }
      
      const valuesStr = values.map(v => `'${v}'`).join(', ');
      migrations.push(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumDef.name}') THEN
    CREATE TYPE ${enumDef.schema}.${enumDef.name} AS ENUM (${valuesStr});
  END IF;
END $$;

`);
    }
  }

  // Helper functions
  migrations.push(`-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_index_if_not_exists(
    p_index_name TEXT,
    p_table_name TEXT,
    p_index_definition TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = p_table_name 
        AND indexname = p_index_name
    ) THEN
        EXECUTE format('CREATE INDEX %I ON %I %s', p_index_name, p_table_name, p_index_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_policy_name TEXT,
    p_table_name TEXT,
    p_policy_definition TEXT
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
    EXECUTE format('CREATE POLICY %I ON %I %s', p_policy_name, p_table_name, p_policy_definition);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  IF v_tenant_id IS NULL THEN
    BEGIN
      v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

`);

  // Tables (grouped by schema)
  const tablesBySchema = appTables.reduce((acc, table) => {
    if (!acc[table.schema]) acc[table.schema] = [];
    acc[table.schema].push(table);
    return acc;
  }, {} as Record<string, typeof appTables>);

  for (const [schema, tables] of Object.entries(tablesBySchema).sort()) {
    migrations.push(`-- ============================================================================
-- TABLES IN SCHEMA: ${schema}
-- ============================================================================

`);
    
    for (const table of tables.sort((a, b) => a.name.localeCompare(b.name))) {
      const columns = table.columns.map(generateColumnDefinition).join(',\n');
      
      // Extract primary key constraint
      const pkConstraint = table.constraints.find(c => c.type === 'PRIMARY KEY');
      const pkDef = pkConstraint ? `,\n  ${pkConstraint.definition.replace(/ALTER TABLE.*ADD CONSTRAINT /i, '').replace(/ PRIMARY KEY/, ' PRIMARY KEY')}` : '';
      
      migrations.push(`CREATE TABLE IF NOT EXISTS ${schema}.${table.name} (
${columns}${pkDef}
);

`);
      
      // Foreign key constraints
      const fkConstraints = table.constraints.filter(c => c.type === 'FOREIGN KEY');
      for (const fkConstraint of fkConstraints) {
        migrations.push(`ALTER TABLE ${schema}.${table.name} ADD CONSTRAINT IF NOT EXISTS ${fkConstraint.name} ${fkConstraint.definition.replace(/ALTER TABLE.*ADD CONSTRAINT /i, '')};

`);
      }
      
      // Unique constraints
      const uniqueConstraints = table.constraints.filter(c => c.type === 'UNIQUE' && !c.name.includes('_pkey'));
      for (const uniqueConstraint of uniqueConstraints) {
        migrations.push(`ALTER TABLE ${schema}.${table.name} ADD CONSTRAINT IF NOT EXISTS ${uniqueConstraint.name} ${uniqueConstraint.definition.replace(/ALTER TABLE.*ADD CONSTRAINT /i, '')};

`);
      }
      
      // Indexes
      for (const index of table.indexes) {
        if (index.definition.includes('CREATE UNIQUE INDEX')) {
          const def = index.definition.replace(/CREATE UNIQUE INDEX\s+[^\s]+\s+ON\s+[^\s]+\s+/i, '');
          migrations.push(`CREATE UNIQUE INDEX IF NOT EXISTS ${index.name} ON ${schema}.${table.name} ${def};

`);
        } else {
          const def = index.definition.replace(/CREATE INDEX\s+[^\s]+\s+ON\s+[^\s]+\s+/i, '');
          migrations.push(`CREATE INDEX IF NOT EXISTS ${index.name} ON ${schema}.${table.name} ${def};

`);
        }
      }
      
      // RLS
      if (table.rlsEnabled) {
        migrations.push(`ALTER TABLE ${schema}.${table.name} ENABLE ROW LEVEL SECURITY;

`);
        
        for (const policy of table.policies) {
          const cmd = policy.cmd || 'ALL';
          const using = policy.qual ? `USING (${policy.qual})` : '';
          const withCheck = policy.with_check ? `WITH CHECK (${policy.with_check})` : '';
          migrations.push(`DROP POLICY IF EXISTS ${policy.name} ON ${schema}.${table.name};
CREATE POLICY ${policy.name} ON ${schema}.${table.name}
  FOR ${cmd}
  ${using}
  ${withCheck};

`);
        }
      }
    }
  }

  // Application functions
  if (appFunctions.length > 0) {
    migrations.push(`-- ============================================================================
-- APPLICATION FUNCTIONS
-- ============================================================================

`);
    
    // Group functions by name (take latest definition if duplicates)
    const uniqueFunctions = new Map<string, typeof appFunctions[0]>();
    for (const func of appFunctions) {
      const key = `${func.schema}.${func.name}`;
      if (!uniqueFunctions.has(key) || func.definition.length > (uniqueFunctions.get(key)?.definition.length || 0)) {
        uniqueFunctions.set(key, func);
      }
    }
    
    for (const func of Array.from(uniqueFunctions.values()).sort((a, b) => a.name.localeCompare(b.name))) {
      if (func.definition && !func.definition.includes('Aggregate function')) {
        migrations.push(`${func.definition}

`);
      }
    }
  }

  migrations.push(`-- ============================================================================
-- END OF CANONICAL GOLDEN MIGRATION
-- ============================================================================

COMMIT;
`);

  const output = migrations.join('');
  const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', '00000000_settler_golden_schema.sql');
  fs.writeFileSync(outputPath, output);

  console.log('\n📊 Canonical Migration Summary:');
  console.log(`  Application tables: ${appTables.length}`);
  console.log(`  Application functions: ${appFunctions.length}`);
  console.log(`  Application enums: ${appEnums.length}`);
  console.log(`  Total size: ${(output.length / 1024).toFixed(2)} KB`);
  console.log(`  Total lines: ${output.split('\n').length}`);
  console.log(`\n✅ Canonical golden migration written to: ${outputPath}`);
}

generateCanonicalMigration().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
