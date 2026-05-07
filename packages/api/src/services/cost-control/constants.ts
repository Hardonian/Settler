import { CostDriver } from "./types";

// Cost drivers enumeration
export const COST_DRIVERS: Record<string, CostDriver> = {
  // Compute costs
  edge_function_invocations: {
    id: "edge_function_invocations",
    name: "Edge Function Invocations",
    category: "compute",
    unit: "invocations",
    baseCostPerUnit: 0.0000002, // $0.0000002 per invocation (Supabase pricing)
    scalingBehavior: "linear",
  },
  reconciliation_jobs: {
    id: "reconciliation_jobs",
    name: "Reconciliation Jobs",
    category: "compute",
    unit: "jobs",
    baseCostPerUnit: 0.001, // Estimated $0.001 per job
    scalingBehavior: "linear",
  },
  receipt_processing: {
    id: "receipt_processing",
    name: "Receipt Processing (OCR)",
    category: "external_api",
    unit: "receipts",
    baseCostPerUnit: 0.01, // $0.01 per receipt (OpenAI API)
    scalingBehavior: "linear",
  },

  // Storage costs
  database_rows: {
    id: "database_rows",
    name: "Database Rows",
    category: "storage",
    unit: "rows",
    baseCostPerUnit: 0.00000001, // $0.00000001 per row (estimated)
    scalingBehavior: "linear",
  },
  storage_gb: {
    id: "storage_gb",
    name: "Storage (GB)",
    category: "storage",
    unit: "gb",
    baseCostPerUnit: 0.021, // $0.021 per GB/month (Supabase)
    scalingBehavior: "linear",
  },

  // External API costs
  integration_syncs: {
    id: "integration_syncs",
    name: "Integration Syncs",
    category: "external_api",
    unit: "syncs",
    baseCostPerUnit: 0.0001, // Estimated cost per sync
    scalingBehavior: "linear",
  },
  webhook_deliveries: {
    id: "webhook_deliveries",
    name: "Webhook Deliveries",
    category: "external_api",
    unit: "deliveries",
    baseCostPerUnit: 0.00001, // Estimated cost per delivery
    scalingBehavior: "linear",
  },

  // Retry costs
  retry_attempts: {
    id: "retry_attempts",
    name: "Retry Attempts",
    category: "retries",
    unit: "attempts",
    baseCostPerUnit: 0.000001, // Cost of retry overhead
    scalingBehavior: "linear",
  },

  // Support costs
  support_tickets: {
    id: "support_tickets",
    name: "Support Tickets",
    category: "support",
    unit: "tickets",
    baseCostPerUnit: 10, // Estimated $10 per ticket (human time)
    scalingBehavior: "fixed",
  },
};

// Plan-based cost limits (per month)
export const PLAN_COST_LIMITS: Record<
  string,
  Record<string, { daily: number; monthly: number; burst: number }>
> = {
  free: {
    edge_function_invocations: { daily: 10000, monthly: 100000, burst: 100 },
    reconciliation_jobs: { daily: 10, monthly: 100, burst: 2 },
    receipt_processing: { daily: 10, monthly: 100, burst: 2 },
    database_rows: { daily: 100000, monthly: 1000000, burst: 10000 },
    storage_gb: { daily: 0.1, monthly: 1, burst: 0.01 },
    integration_syncs: { daily: 100, monthly: 1000, burst: 10 },
    webhook_deliveries: { daily: 1000, monthly: 10000, burst: 100 },
    retry_attempts: { daily: 1000, monthly: 10000, burst: 100 },
    support_tickets: { daily: 1, monthly: 5, burst: 1 },
  },
  starter: {
    edge_function_invocations: { daily: 100000, monthly: 1000000, burst: 1000 },
    reconciliation_jobs: { daily: 500, monthly: 5000, burst: 50 },
    receipt_processing: { daily: 500, monthly: 5000, burst: 50 },
    database_rows: { daily: 10000000, monthly: 100000000, burst: 1000000 },
    storage_gb: { daily: 10, monthly: 100, burst: 1 },
    integration_syncs: { daily: 10000, monthly: 100000, burst: 1000 },
    webhook_deliveries: { daily: 100000, monthly: 1000000, burst: 10000 },
    retry_attempts: { daily: 10000, monthly: 100000, burst: 1000 },
    support_tickets: { daily: 5, monthly: 20, burst: 2 },
  },
  growth: {
    edge_function_invocations: { daily: 1000000, monthly: 10000000, burst: 10000 },
    reconciliation_jobs: { daily: 5000, monthly: 50000, burst: 500 },
    receipt_processing: { daily: 5000, monthly: 50000, burst: 500 },
    database_rows: { daily: 100000000, monthly: 1000000000, burst: 10000000 },
    storage_gb: { daily: 100, monthly: 1000, burst: 10 },
    integration_syncs: { daily: 100000, monthly: 1000000, burst: 10000 },
    webhook_deliveries: { daily: 1000000, monthly: 10000000, burst: 100000 },
    retry_attempts: { daily: 100000, monthly: 1000000, burst: 10000 },
    support_tickets: { daily: 10, monthly: 50, burst: 5 },
  },
  scale: {
    edge_function_invocations: { daily: 10000000, monthly: 100000000, burst: 100000 },
    reconciliation_jobs: { daily: 50000, monthly: 500000, burst: 5000 },
    receipt_processing: { daily: 50000, monthly: 500000, burst: 5000 },
    database_rows: { daily: 1000000000, monthly: 10000000000, burst: 100000000 },
    storage_gb: { daily: 1000, monthly: 10000, burst: 100 },
    integration_syncs: { daily: 1000000, monthly: 10000000, burst: 100000 },
    webhook_deliveries: { daily: 10000000, monthly: 100000000, burst: 1000000 },
    retry_attempts: { daily: 1000000, monthly: 10000000, burst: 100000 },
    support_tickets: { daily: 50, monthly: 200, burst: 10 },
  },
  enterprise: {
    // Enterprise: high limits but still capped to prevent abuse
    edge_function_invocations: { daily: 100000000, monthly: 1000000000, burst: 1000000 },
    reconciliation_jobs: { daily: 500000, monthly: 5000000, burst: 50000 },
    receipt_processing: { daily: 500000, monthly: 5000000, burst: 50000 },
    database_rows: { daily: 10000000000, monthly: 100000000000, burst: 1000000000 },
    storage_gb: { daily: 10000, monthly: 100000, burst: 1000 },
    integration_syncs: { daily: 10000000, monthly: 100000000, burst: 1000000 },
    webhook_deliveries: { daily: 100000000, monthly: 1000000000, burst: 10000000 },
    retry_attempts: { daily: 10000000, monthly: 100000000, burst: 1000000 },
    support_tickets: { daily: 200, monthly: 1000, burst: 50 },
  },
};
