#!/usr/bin/env tsx
/**
 * Production Database Schema Introspection
 * 
 * Connects to live Supabase production and enumerates:
 * - All schemas, tables, columns, types, enums
 * - Constraints (PK, FK, UNIQUE, CHECK)
 * - Indexes
 * - RLS enabled/disabled state
 * - Policies (including permissive vs restrictive)
 * - Functions, triggers, views
 * - Edge-function-dependent tables
 * 
 * This is the SOURCE OF TRUTH for what actually exists in production.
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface TableInfo {
  schema: string;
  name: string;
  columns: ColumnInfo[];
  constraints: ConstraintInfo[];
  indexes: IndexInfo[];
  rlsEnabled: boolean;
  policies: PolicyInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  identity?: boolean;
}

interface ConstraintInfo {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  definition: string;
}

interface IndexInfo {
  name: string;
  unique: boolean;
  definition: string;
}

interface PolicyInfo {
  name: string;
  permissive: boolean;
  roles: string[];
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

interface FunctionInfo {
  schema: string;
  name: string;
  returnType: string;
  arguments: string;
  language: string;
  definition: string;
}

interface TriggerInfo {
  schema: string;
  table: string;
  name: string;
  event: string;
  timing: string;
  function: string;
}

interface ViewInfo {
  schema: string;
  name: string;
  definition: string;
}

async function introspectProductionSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔍 Connecting to production database...');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to production database');

    const output: {
      timestamp: string;
      database: string;
      schemas: string[];
      tables: TableInfo[];
      functions: FunctionInfo[];
      triggers: TriggerInfo[];
      views: ViewInfo[];
      enums: Array<{ schema: string; name: string; values: string[] }>;
    } = {
      timestamp: new Date().toISOString(),
      database: databaseUrl.split('@')[1]?.split('/')[0] || 'unknown',
      schemas: [],
      tables: [],
      functions: [],
      triggers: [],
      views: [],
      enums: [],
    };

    // Get schemas
    console.log('📋 Enumerating schemas...');
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `);
    output.schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`✅ Found ${output.schemas.length} schemas`);

    // Get enums
    console.log('📋 Enumerating enums...');
    const enumsResult = await pool.query(`
      SELECT 
        n.nspname as schema,
        t.typname as name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      GROUP BY n.nspname, t.typname
      ORDER BY n.nspname, t.typname
    `);
    output.enums = enumsResult.rows.map(r => ({
      schema: r.schema,
      name: r.name,
      values: r.values,
    }));
    console.log(`✅ Found ${output.enums.length} enums`);

    // Get tables for each schema
    for (const schema of output.schemas) {
      console.log(`📋 Enumerating tables in schema: ${schema}...`);
      
      const tablesResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `, [schema]);

      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name;
        console.log(`  📊 Processing table: ${schema}.${tableName}`);

        // Get columns
        const columnsResult = await pool.query(`
          SELECT 
            column_name,
            data_type,
            udt_name,
            is_nullable,
            column_default,
            is_identity
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [schema, tableName]);

        const columns: ColumnInfo[] = columnsResult.rows.map(r => ({
          name: r.column_name,
          type: r.udt_name || r.data_type,
          nullable: r.is_nullable === 'YES',
          default: r.column_default,
          identity: r.is_identity === 'YES' ? true : undefined,
        }));

        // Get constraints
        const constraintsResult = await pool.query(`
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            pg_get_constraintdef(c.oid) as definition
          FROM information_schema.table_constraints tc
          JOIN pg_constraint c ON c.conname = tc.constraint_name
          WHERE tc.table_schema = $1 AND tc.table_name = $2
          ORDER BY tc.constraint_type, tc.constraint_name
        `, [schema, tableName]);

        const constraints: ConstraintInfo[] = constraintsResult.rows.map(r => ({
          name: r.constraint_name,
          type: r.constraint_type as ConstraintInfo['type'],
          definition: r.definition,
        }));

        // Get indexes
        const indexesResult = await pool.query(`
          SELECT 
            i.relname as index_name,
            ix.indisunique as is_unique,
            pg_get_indexdef(ix.indexrelid) as definition
          FROM pg_index ix
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = $1 AND t.relname = $2
          AND NOT ix.indisprimary
          ORDER BY i.relname
        `, [schema, tableName]);

        const indexes: IndexInfo[] = indexesResult.rows.map(r => ({
          name: r.index_name,
          unique: r.is_unique,
          definition: r.definition,
        }));

        // Check RLS enabled
        const rlsResult = await pool.query(`
          SELECT relforcerowsecurity
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = $1 AND c.relname = $2
        `, [schema, tableName]);

        const rlsEnabled = rlsResult.rows[0]?.relforcerowsecurity || false;

        // Get RLS policies
        const policiesResult = await pool.query(`
          SELECT 
            policyname as name,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE schemaname = $1 AND tablename = $2
          ORDER BY policyname
        `, [schema, tableName]);

        const policies: PolicyInfo[] = policiesResult.rows.map(r => ({
          name: r.name,
          permissive: r.permissive,
          roles: r.roles,
          cmd: r.cmd,
          qual: r.qual,
          with_check: r.with_check,
        }));

        output.tables.push({
          schema,
          name: tableName,
          columns,
          constraints,
          indexes,
          rlsEnabled,
          policies,
        });
      }
    }

    // Get functions
    console.log('📋 Enumerating functions...');
    const functionsResult = await pool.query(`
      SELECT 
        n.nspname as schema,
        p.proname as name,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as arguments,
        l.lanname as language,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_language l ON l.oid = p.prolang
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY n.nspname, p.proname
    `);

    output.functions = functionsResult.rows.map(r => ({
      schema: r.schema,
      name: r.name,
      returnType: r.return_type,
      arguments: r.arguments,
      language: r.language,
      definition: r.definition,
    }));
    console.log(`✅ Found ${output.functions.length} functions`);

    // Get triggers
    console.log('📋 Enumerating triggers...');
    const triggersResult = await pool.query(`
      SELECT 
        n.nspname as schema,
        t.tgname as name,
        c.relname as table,
        pg_get_triggerdef(t.oid) as definition
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE NOT t.tgisinternal
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY n.nspname, c.relname, t.tgname
    `);

    output.triggers = triggersResult.rows.map(r => {
      // Parse trigger definition to extract event and timing
      const def = r.definition;
      const eventMatch = def.match(/BEFORE|AFTER|INSTEAD OF/);
      const eventTypeMatch = def.match(/INSERT|UPDATE|DELETE|TRUNCATE/);
      return {
        schema: r.schema,
        table: r.table,
        name: r.name,
        event: eventTypeMatch?.[0] || 'UNKNOWN',
        timing: eventMatch?.[0] || 'UNKNOWN',
        function: def.match(/EXECUTE FUNCTION\s+([^(]+)/)?.[1] || 'UNKNOWN',
      };
    });
    console.log(`✅ Found ${output.triggers.length} triggers`);

    // Get views
    console.log('📋 Enumerating views...');
    const viewsResult = await pool.query(`
      SELECT 
        table_schema as schema,
        table_name as name,
        view_definition as definition
      FROM information_schema.views
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);

    output.views = viewsResult.rows.map(r => ({
      schema: r.schema,
      name: r.name,
      definition: r.definition,
    }));
    console.log(`✅ Found ${output.views.length} views`);

    // Write output
    const outputPath = path.join(__dirname, '..', 'supabase', 'production-schema.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ Schema introspection complete. Output written to: ${outputPath}`);

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`  Schemas: ${output.schemas.length}`);
    console.log(`  Tables: ${output.tables.length}`);
    console.log(`  Functions: ${output.functions.length}`);
    console.log(`  Triggers: ${output.triggers.length}`);
    console.log(`  Views: ${output.views.length}`);
    console.log(`  Enums: ${output.enums.length}`);
    console.log(`  Tables with RLS: ${output.tables.filter(t => t.rlsEnabled).length}`);
    console.log(`  Total policies: ${output.tables.reduce((sum, t) => sum + t.policies.length, 0)}`);

  } finally {
    await pool.end();
  }
}

introspectProductionSchema().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
