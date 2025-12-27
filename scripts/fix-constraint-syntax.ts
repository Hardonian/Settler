#!/usr/bin/env tsx
/**
 * Fix constraint syntax in golden migration
 * PostgreSQL doesn't support "ADD CONSTRAINT IF NOT EXISTS" directly
 * Need to wrap in DO blocks
 */

import * as fs from 'fs';
import * as path from 'path';

function fixConstraintSyntax(migrationPath: string) {
  let content = fs.readFileSync(migrationPath, 'utf-8');
  
  // Fix missing semicolons after function definitions
  content = content.replace(/\$function\$\s*\n\s*\n/g, '$function$;\n\n');
  
  // Replace ADD CONSTRAINT IF NOT EXISTS with DO block
  const constraintRegex = /ALTER TABLE\s+([^\s]+)\s+ADD CONSTRAINT IF NOT EXISTS\s+([^\s]+)\s+(.+?);/g;
  
  content = content.replace(constraintRegex, (match, table, constraintName, definition) => {
    return `DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}' AND conrelid = '${table}'::regclass
  ) THEN
    ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} ${definition};
  END IF;
END $$;`;
  });
  
  fs.writeFileSync(migrationPath, content);
  console.log('✅ Fixed constraint syntax and function semicolons');
}

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '00000000_settler_golden_schema.sql');
fixConstraintSyntax(migrationPath);
