/**
 * Script to wrap all CREATE INDEX statements in a migration file with duplicate checks
 */

import * as fs from 'fs';

const migrationFile = 'supabase/migrations/20260126000000_console_complete_setup.sql';
let content = fs.readFileSync(migrationFile, 'utf8');

// Find all CREATE INDEX IF NOT EXISTS statements and wrap them
const indexPattern = /CREATE INDEX IF NOT EXISTS (\w+) ON (\w+)\(([^)]+)\)(.*?);/g;
const matches = Array.from(content.matchAll(indexPattern));

console.log(`Found ${matches.length} CREATE INDEX statements to wrap`);

// Replace each CREATE INDEX with wrapped version
for (const match of matches) {
  const [fullMatch, indexName, tableName, columns, extras] = match;
  
  // Skip if already wrapped
  if (content.includes(`IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '${tableName}' AND indexname = '${indexName}')`)) {
    continue;
  }
  
  const wrapped = `
-- Create index conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${tableName}') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '${tableName}' AND indexname = '${indexName}') THEN
      EXECUTE 'CREATE INDEX ${indexName} ON ${tableName}(${columns})${extras}';
    END IF;
  END IF;
END $$;`;
  
  content = content.replace(fullMatch, wrapped);
}

fs.writeFileSync(migrationFile, content, 'utf8');
console.log('Wrapped all CREATE INDEX statements');
