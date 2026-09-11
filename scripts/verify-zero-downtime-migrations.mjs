import fs from "node:fs";
import path from "node:path";

/**
 * CI Verification Script: Zero-Downtime Migration Linter (#86)
 * Scans SQL migration files to assert no destructive statements exist without expand-and-contract guards.
 */
function verifyZeroDowntimeMigrations() {
  const migrationsDir = path.resolve("prisma/migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.log("✅ No pending SQL migrations directory found; schema check passed.");
    process.exit(0);
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  const sqlFiles = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = path.join(migrationsDir, entry.name, "migration.sql");
      if (fs.existsSync(subPath)) {
        sqlFiles.push(subPath);
      }
    }
  }

  const antiPatterns = [
    {
      pattern: /DROP\s+COLUMN/i,
      error: "Direct DROP COLUMN violates Phase 1 zero-downtime policy",
    },
    { pattern: /DROP\s+TABLE/i, error: "Direct DROP TABLE violates Phase 1 zero-downtime policy" },
    {
      pattern: /ADD\s+COLUMN\s+.*\s+NOT\s+NULL(?!\s+DEFAULT)/i,
      error: "ADD COLUMN NOT NULL requires a DEFAULT value to avoid full table rewrite",
    },
  ];

  let violations = 0;
  for (const file of sqlFiles) {
    const content = fs.readFileSync(file, "utf8");
    for (const { pattern, error } of antiPatterns) {
      if (pattern.test(content)) {
        console.error(`❌ Migration violation in ${file}: ${error}`);
        violations++;
      }
    }
  }

  if (violations > 0) {
    console.error(`❌ Found ${violations} zero-downtime migration violations.`);
    process.exit(1);
  }

  console.log(`✅ Zero-downtime migration check passed (${sqlFiles.length} migrations validated).`);
}

verifyZeroDowntimeMigrations();
