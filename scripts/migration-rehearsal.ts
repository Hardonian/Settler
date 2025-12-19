#!/usr/bin/env node
/**
 * Migration Rehearsal Tool
 * Validates migrations in sandbox before production
 */

import { execSync } from "child_process";
import * as fs from "fs";

interface MigrationResult {
  migration: string;
  status: "success" | "failed";
  duration: number;
  errors: string[];
}

/**
 * Rehearse migration in sandbox
 */
function rehearseMigration(migrationFile: string): MigrationResult {
  console.log(`Rehearsing migration: ${migrationFile}`);

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Create sandbox database
    execSync("createdb settler_sandbox", { stdio: "inherit" });

    // Run migration in sandbox
    execSync(`psql -d settler_sandbox -f ${migrationFile}`, { stdio: "inherit" });

    // Validate migration
    const validationErrors = validateMigration(migrationFile);
    errors.push(...validationErrors);

    // Cleanup
    execSync("dropdb settler_sandbox", { stdio: "inherit" });

    const duration = Date.now() - startTime;

    return {
      migration: migrationFile,
      status: errors.length === 0 ? "success" : "failed",
      duration,
      errors,
    };
  } catch (error: any) {
    errors.push(error.message);
    return {
      migration: migrationFile,
      status: "failed",
      duration: Date.now() - startTime,
      errors,
    };
  }
}

/**
 * Validate migration
 */
function validateMigration(migrationFile: string): string[] {
  const errors: string[] = [];
  const content = fs.readFileSync(migrationFile, "utf-8");

  // Check for common issues
  if (!content.includes("BEGIN;") || !content.includes("COMMIT;")) {
    errors.push("Migration missing transaction boundaries");
  }

  if (content.includes("DROP TABLE") && !content.includes("IF EXISTS")) {
    errors.push("DROP TABLE should use IF EXISTS");
  }

  if (content.includes("ALTER TABLE") && !content.includes("IF EXISTS")) {
    errors.push("ALTER TABLE should check for existence");
  }

  return errors;
}

// Run rehearsal
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error("Usage: migration-rehearsal <migration-file>");
  process.exit(1);
}

const result = rehearseMigration(migrationFile);

console.log(`\nMigration rehearsal ${result.status}`);
console.log(`Duration: ${result.duration}ms`);
if (result.errors.length > 0) {
  console.error("Errors:", result.errors);
  process.exit(1);
}
