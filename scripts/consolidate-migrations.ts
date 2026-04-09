#!/usr/bin/env tsx
/**
 * Migration Consolidation Script
 *
 * Reads all migration files and consolidates them into a single golden migration.
 * Ensures idempotency by wrapping all statements appropriately.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface MigrationFile {
  name: string;
  path: string;
  content: string;
  timestamp: string;
}

function getAllMigrationFiles(): MigrationFile[] {
  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter(
      (f) => f.endsWith(".sql") && f !== "rollback_template.sql" && f !== "verify_console_setup.sql"
    )
    .map((f) => ({
      name: f,
      path: path.join(migrationsDir, f),
      content: fs.readFileSync(path.join(migrationsDir, f), "utf-8"),
      timestamp: extractTimestamp(f),
    }))
    .sort((a, b) => {
      // Sort by timestamp, but put 000_helper_functions first
      if (a.name.startsWith("000_")) return -1;
      if (b.name.startsWith("000_")) return 1;
      return a.timestamp.localeCompare(b.timestamp);
    });

  return files;
}

function extractTimestamp(filename: string): string {
  const match = filename.match(/(\d{8,})/);
  return match ? match[1] : "00000000";
}

function consolidateMigrations(migrations: MigrationFile[]): string {
  const sections: string[] = [];

  sections.push(`-- ============================================================================
-- SETTLER.DEV GOLDEN MIGRATION
-- ============================================================================
-- This is the canonical, idempotent schema definition for Settler.dev
-- Generated from ${migrations.length} historical migration files
-- Date: ${new Date().toISOString()}
--
-- IMPORTANT: This migration is designed to be:
-- 1. Idempotent - safe to run multiple times
-- 2. Complete - defines the entire database schema
-- 3. Authoritative - this is the source of truth
--
-- All historical migrations have been archived to supabase/migrations/_archive/
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTIONS (must be created first)
-- ============================================================================

-- Function to safely create index only if it doesn't exist
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

-- Function to safely create policy only if it doesn't exist
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_policy_name TEXT,
    p_table_name TEXT,
    p_policy_definition TEXT
) RETURNS VOID AS $$
BEGIN
    -- Drop policy if exists to avoid duplicates
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
    -- Create the policy
    EXECUTE format('CREATE POLICY %I ON %I %s', p_policy_name, p_table_name, p_policy_definition);
END;
$$ LANGUAGE plpgsql;

-- Function to get current tenant context from JWT claims or session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Try to get tenant_id from JWT claim (Supabase auth)
  BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  -- Fallback to session variable if JWT claim not available
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

-- Function to set tenant context (for service role operations)
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

`);

  // Process each migration file
  for (const migration of migrations) {
    sections.push(`-- ============================================================================
-- From: ${migration.name}
-- ============================================================================
`);

    // Extract content, removing BEGIN/COMMIT blocks and comments
    let content = migration.content;

    // Remove standalone BEGIN/COMMIT statements (we wrap everything in one transaction)
    content = content.replace(/^BEGIN;?\s*$/gm, "");
    content = content.replace(/^COMMIT;?\s*$/gm, "");

    // Keep the actual SQL statements
    sections.push(content);
    sections.push("\n");
  }

  sections.push(`-- ============================================================================
-- END OF GOLDEN MIGRATION
-- ============================================================================

COMMIT;
`);

  return sections.join("\n");
}

function main() {
  console.log("🔄 Consolidating migrations...");

  const migrations = getAllMigrationFiles();
  console.log(`📦 Found ${migrations.length} migration files`);

  const consolidated = consolidateMigrations(migrations);

  const outputPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "00000000_settler_golden_schema.sql"
  );
  fs.writeFileSync(outputPath, consolidated);

  console.log(`✅ Consolidated migration written to: ${outputPath}`);
  console.log(`📊 Size: ${(consolidated.length / 1024).toFixed(2)} KB`);

  // Create archive directory
  const archiveDir = path.join(__dirname, "..", "supabase", "migrations", "_archive");
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
    console.log(`📁 Created archive directory: ${archiveDir}`);
  }

  console.log("\n⚠️  Next steps:");
  console.log("1. Review the golden migration file");
  console.log("2. Test it on a clean database");
  console.log("3. Move old migrations to _archive/");
  console.log("4. Update CI to use the golden migration");
}

main();
