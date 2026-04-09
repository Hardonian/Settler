#!/usr/bin/env tsx
/**
 * Get API Service Tables
 *
 * Returns only tables related to Settler's core API services:
 * - Receipts API
 * - Reconciliation API
 * - Feature Flags API
 * - Webhooks
 * - API Keys & Authentication
 */

import * as fs from "fs";
import * as path from "path";

// Tables related to core API services
const API_SERVICE_TABLES = [
  // Receipts API
  "receipt_uploads",
  "receipts",
  "receipt_items",

  // Reconciliation API
  "recon_jobs",
  "recon_results",
  "recon_templates",
  "recon_audits",
  "recon_runs",
  "mapping_templates",
  "transform_recipes",
  "validation_rules",
  "contract_versions",
  "drift_events",
  "workflow_runs",

  // Feature Flags API
  "feature_flags",
  "feature_flag_environments",
  "feature_flag_overrides",

  // Webhooks
  "webhooks",
  "webhook_deliveries",

  // API Keys & Authentication
  "api_keys",
  "idempotency_keys",

  // Usage Tracking (for API services)
  "usage_events",
  "usage_aggregate_daily",
  "usage_counters",

  // Billing (for API services)
  "billing_accounts",
  "subscriptions",
  "add_ons",
  "add_on_purchases",

  // Ingestion Pipeline (for reconciliation)
  "ingestion_sources",
  "ingestions",
  "raw_records",
  "normalized_transactions",
  "reconciliation_runs",
  "reconciliation_matches",
  "exports",
];

function main() {
  const output = {
    apiServiceTables: API_SERVICE_TABLES,
    count: API_SERVICE_TABLES.length,
  };

  const outputPath = path.join(__dirname, "..", "supabase", "api-service-tables.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`✅ API Service Tables: ${API_SERVICE_TABLES.length} tables`);
  console.log(`📋 Tables: ${API_SERVICE_TABLES.join(", ")}`);
  console.log(`\n✅ Output: ${outputPath}`);
}

main();
