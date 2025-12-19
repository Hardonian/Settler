#!/usr/bin/env tsx
/**
 * Generate Refined Golden Migration
 * 
 * Compares production schema to golden migration and generates a lean migration
 * that only includes missing tables, policies, indexes, functions, etc.
 * 
 * This creates a much smaller, safer migration that only adds what's needed.
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

async function checkExists(pool: Pool, type: 'table' | 'index' | 'function' | 'policy' | 'trigger' | 'view' | 'enum', name: string, schema: string = 'public', tableName?: string): Promise<boolean> {
  try {
    if (type === 'table') {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        )
      `, [schema, name]);
      return result.rows[0].exists;
    }
    
    if (type === 'index') {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE schemaname = $1 AND tablename = $2 AND indexname = $3
        )
      `, [schema, tableName, name]);
      return result.rows[0].exists;
    }
    
    if (type === 'function') {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = $1 AND p.proname = $2
        )
      `, [schema, name]);
      return result.rows[0].exists;
    }
    
    if (type === 'policy') {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_policies 
          WHERE schemaname = $1 AND tablename = $2 AND policyname = $3
        )
      `, [schema, tableName, name]);
      return result.rows[0].exists;
    }
    
    if (type === 'trigger') {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_trigger t
          JOIN pg_class c ON c.oid = t.tgrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = $1 AND c.relname = $2 AND t.tgname = $3
        )
      `, [schema, tableName, name]);
      return result.rows[0].exists;
    }
    
    if (type === 'view') {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = $1 AND table_name = $2
        )
      `, [schema, name]);
      return result.rows[0].exists;
    }
    
    if (type === 'enum') {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = $1 AND t.typname = $2
        )
      `, [schema, name]);
      return result.rows[0].exists;
    }
    
    return false;
  } catch (err) {
    console.warn(`⚠️  Error checking ${type} ${name}:`, err);
    return false;
  }
}

async function generateRefinedMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔍 Connecting to production database...');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Load production schema
    const schemaPath = path.join(__dirname, '..', 'supabase', 'production-schema.json');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Production schema not found. Run: npm run verify:schema-introspect');
    }
    
    const productionSchema: ProductionSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    console.log(`✅ Loaded production schema: ${productionSchema.tables.length} tables, ${productionSchema.functions.length} functions`);

    const migrations: string[] = [];
    migrations.push(`-- ============================================================================
-- SETTLER.DEV REFINED GOLDEN MIGRATION
-- ============================================================================
-- This migration only includes objects that DON'T exist in production
-- Generated: ${new Date().toISOString()}
-- 
-- IMPORTANT: This is idempotent - safe to run multiple times
-- Only creates missing tables, indexes, policies, functions, etc.
-- ============================================================================

BEGIN;

`);

    // Check and create extensions
    migrations.push(`-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

`);

    // Check and create enums
    migrations.push(`-- ============================================================================
-- ENUMS
-- ============================================================================

`);
    
    for (const enumDef of productionSchema.enums) {
      const exists = await checkExists(pool, 'enum', enumDef.name, enumDef.schema);
      if (!exists) {
        const values = enumDef.values.map(v => `'${v}'`).join(', ');
        migrations.push(`CREATE TYPE ${enumDef.schema}.${enumDef.name} AS ENUM (${values});

`);
      }
    }

    // Check and create helper functions first
    migrations.push(`-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

`);
    
    const helperFunctions = [
      {
        name: 'create_index_if_not_exists',
        definition: `CREATE OR REPLACE FUNCTION create_index_if_not_exists(
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
$$ LANGUAGE plpgsql;`
      },
      {
        name: 'create_policy_if_not_exists',
        definition: `CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_policy_name TEXT,
    p_table_name TEXT,
    p_policy_definition TEXT
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
    EXECUTE format('CREATE POLICY %I ON %I %s', p_policy_name, p_table_name, p_policy_definition);
END;
$$ LANGUAGE plpgsql;`
      },
      {
        name: 'current_tenant_id',
        definition: `CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;`
      },
      {
        name: 'set_tenant_context',
        definition: `CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;`
      }
    ];

    for (const func of helperFunctions) {
      const exists = await checkExists(pool, 'function', func.name, 'public');
      if (!exists) {
        migrations.push(`${func.definition}

`);
      }
    }

    // Check and create tables
    migrations.push(`-- ============================================================================
-- TABLES
-- ============================================================================

`);
    
    let tablesCreated = 0;
    for (const table of productionSchema.tables) {
      const exists = await checkExists(pool, 'table', table.name, table.schema);
      if (!exists) {
        // Generate CREATE TABLE statement from columns
        const columns = table.columns.map(col => {
          let def = `  ${col.name} ${col.type}`;
          if (!col.nullable) def += ' NOT NULL';
          if (col.default) def += ` DEFAULT ${col.default}`;
          return def;
        }).join(',\n');
        
        migrations.push(`CREATE TABLE IF NOT EXISTS ${table.schema}.${table.name} (
${columns}
);

`);
        tablesCreated++;
      }
    }

    // Check and create indexes
    migrations.push(`-- ============================================================================
-- INDEXES
-- ============================================================================

`);
    
    let indexesCreated = 0;
    for (const table of productionSchema.tables) {
      for (const index of table.indexes) {
        const exists = await checkExists(pool, 'index', index.name, table.schema, table.name);
        if (!exists) {
          // Extract index definition (remove CREATE INDEX ... ON ...)
          const def = index.definition.replace(/CREATE\s+(UNIQUE\s+)?INDEX\s+[^\s]+\s+ON\s+[^\s]+\s+/i, '');
          migrations.push(`CREATE INDEX IF NOT EXISTS ${index.name} ON ${table.schema}.${table.name} ${def};

`);
          indexesCreated++;
        }
      }
    }

    // Check and create RLS policies
    migrations.push(`-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

`);
    
    let policiesCreated = 0;
    for (const table of productionSchema.tables) {
      if (table.rlsEnabled) {
        const rlsCheck = await pool.query(`
          SELECT relforcerowsecurity 
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = $1 AND c.relname = $2
        `, [table.schema, table.name]);
        
        if (!rlsCheck.rows[0]?.relforcerowsecurity) {
          migrations.push(`ALTER TABLE ${table.schema}.${table.name} ENABLE ROW LEVEL SECURITY;

`);
        }
        
        for (const policy of table.policies) {
          const exists = await checkExists(pool, 'policy', policy.name, table.schema, table.name);
          if (!exists) {
            const cmd = policy.cmd || 'ALL';
            const using = policy.qual ? `USING (${policy.qual})` : '';
            const withCheck = policy.with_check ? `WITH CHECK (${policy.with_check})` : '';
            migrations.push(`CREATE POLICY ${policy.name} ON ${table.schema}.${table.name}
  FOR ${cmd}
  ${using}
  ${withCheck};

`);
            policiesCreated++;
          }
        }
      }
    }

    // Check and create functions
    migrations.push(`-- ============================================================================
-- FUNCTIONS
-- ============================================================================

`);
    
    let functionsCreated = 0;
    for (const func of productionSchema.functions) {
      // Skip helper functions we already created
      if (['create_index_if_not_exists', 'create_policy_if_not_exists', 'current_tenant_id', 'set_tenant_context'].includes(func.name)) {
        continue;
      }
      
      const exists = await checkExists(pool, 'function', func.name, func.schema);
      if (!exists) {
        migrations.push(`${func.definition}

`);
        functionsCreated++;
      }
    }

    // Check and create triggers
    migrations.push(`-- ============================================================================
-- TRIGGERS
-- ============================================================================

`);
    
    let triggersCreated = 0;
    for (const trigger of productionSchema.triggers) {
      const exists = await checkExists(pool, 'trigger', trigger.name, trigger.schema, trigger.table);
      if (!exists) {
        // We need the trigger function to exist first
        const funcExists = await checkExists(pool, 'function', trigger.function, trigger.schema);
        if (funcExists) {
          migrations.push(`CREATE TRIGGER ${trigger.name}
  ${trigger.timing} ${trigger.event}
  ON ${trigger.schema}.${trigger.table}
  FOR EACH ROW
  EXECUTE FUNCTION ${trigger.schema}.${trigger.function}();

`);
          triggersCreated++;
        }
      }
    }

    migrations.push(`-- ============================================================================
-- END OF REFINED GOLDEN MIGRATION
-- ============================================================================

COMMIT;
`);

    const output = migrations.join('');
    const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', '00000000_settler_golden_schema.sql');
    fs.writeFileSync(outputPath, output);

    console.log('\n📊 Refined Migration Summary:');
    console.log(`  Tables to create: ${tablesCreated}`);
    console.log(`  Indexes to create: ${indexesCreated}`);
    console.log(`  Policies to create: ${policiesCreated}`);
    console.log(`  Functions to create: ${functionsCreated}`);
    console.log(`  Triggers to create: ${triggersCreated}`);
    console.log(`  Total size: ${(output.length / 1024).toFixed(2)} KB`);
    console.log(`\n✅ Refined golden migration written to: ${outputPath}`);

  } finally {
    await pool.end();
  }
}

generateRefinedMigration().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
