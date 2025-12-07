#!/usr/bin/env node
/**
 * Schema Drift Detection & Alerting
 * Detects differences between expected and actual database schema
 */

import { execSync } from "child_process";
import * as fs from "fs";

interface SchemaDiff {
  table: string;
  expected: string[];
  actual: string[];
  missing: string[];
  extra: string[];
}

/**
 * Detect schema drift
 */
function detectSchemaDrift(): SchemaDiff[] {
  const expectedSchema = loadExpectedSchema();
  const actualSchema = getActualSchema();

  const diffs: SchemaDiff[] = [];

  for (const [table, expectedColumns] of Object.entries(expectedSchema)) {
    const actualColumns = actualSchema[table] || [];
    const missing = expectedColumns.filter((col) => !actualColumns.includes(col));
    const extra = actualColumns.filter((col) => !expectedColumns.includes(col));

    if (missing.length > 0 || extra.length > 0) {
      diffs.push({
        table,
        expected: expectedColumns,
        actual: actualColumns,
        missing,
        extra,
      });
    }
  }

  return diffs;
}

/**
 * Load expected schema from migration files
 */
function loadExpectedSchema(): Record<string, string[]> {
  // In production, parse migration files
  // For now, return mock schema
  return {
    users: ["id", "email", "created_at"],
    reconciliation_jobs: ["id", "user_id", "name", "created_at"],
    subscriptions: ["id", "user_id", "status", "amount"],
  };
}

/**
 * Get actual schema from database
 */
function getActualSchema(): Record<string, string[]> {
  // In production, query database information_schema
  // For now, return mock schema
  try {
    const output = execSync("psql -c '\\d users'", { encoding: "utf-8" });
    // Parse output to extract columns
    return {
      users: ["id", "email", "created_at"],
      reconciliation_jobs: ["id", "user_id", "name", "created_at"],
    };
  } catch (error) {
    console.error("Failed to get actual schema:", error);
    return {};
  }
}

/**
 * Alert on schema drift
 */
function alertOnDrift(diffs: SchemaDiff[]): void {
  if (diffs.length === 0) {
    console.log("✅ No schema drift detected");
    return;
  }

  console.error("⚠️ Schema drift detected!");
  for (const diff of diffs) {
    console.error(`\nTable: ${diff.table}`);
    if (diff.missing.length > 0) {
      console.error(`  Missing columns: ${diff.missing.join(", ")}`);
    }
    if (diff.extra.length > 0) {
      console.error(`  Extra columns: ${diff.extra.join(", ")}`);
    }
  }

  // In production, send alert (email, Slack, PagerDuty)
  // sendAlert("Schema drift detected", diffs);
}

// Run detection
const diffs = detectSchemaDrift();
alertOnDrift(diffs);

if (diffs.length > 0) {
  process.exit(1);
}
