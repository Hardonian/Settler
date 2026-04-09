/**
 * Script to wrap all CREATE INDEX statements with duplicate checks
 * This ensures no duplicate indexes are created
 */

import * as fs from "fs";
import * as path from "path";

function wrapIndexStatements(filePath: string): void {
  let content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const newLines: string[] = [];
  let inDoBlock = false;
  let doBlockStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a CREATE INDEX statement
    if (line.match(/^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+IF\s+NOT\s+EXISTS\s+(\w+)\s+ON\s+(\w+)/i)) {
      const match = line.match(
        /CREATE\s+(UNIQUE\s+)?INDEX\s+IF\s+NOT\s+EXISTS\s+(\w+)\s+ON\s+(\w+)\s*(.+)/i
      );
      if (match) {
        const indexName = match[2];
        const tableName = match[3];
        const indexDef = match[4];

        // Wrap in conditional check
        newLines.push(`-- Check and create index to avoid duplicates`);
        newLines.push(`DO $$`);
        newLines.push(`BEGIN`);
        newLines.push(
          `  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${tableName}') THEN`
        );
        newLines.push(
          `    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = '${tableName}' AND indexname = '${indexName}') THEN`
        );
        newLines.push(
          `      EXECUTE 'CREATE ${match[1] || ""}INDEX ${indexName} ON ${tableName} ${indexDef.replace(/'/g, "''")}';`
        );
        newLines.push(`    END IF;`);
        newLines.push(`  END IF;`);
        newLines.push(`END $$;`);
        continue;
      }
    }

    newLines.push(line);
  }

  fs.writeFileSync(filePath, newLines.join("\n"), "utf8");
  console.log(`Wrapped indexes in ${filePath}`);
}

// Wrap indexes in the problematic migration
wrapIndexStatements("supabase/migrations/20251128193735_initial_schema.sql");
