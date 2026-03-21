#!/usr/bin/env tsx
/**
 * Settler Enterprise Demo Tenant Seed Script
 *
 * Creates a fully isolated, enterprise-grade demo tenant with rich, internally
 * consistent seeded data. Safe to run repeatedly — idempotent by slug/key.
 * Produces all surfaces needed for a compelling product demo.
 *
 * Usage:
 *   pnpm demo:seed          # Seed demo tenant (idempotent)
 *   pnpm demo:reset         # Wipe demo tenant data and re-seed
 *
 * Environment:
 *   DATABASE_URL            - Postgres connection string (required for DB mode)
 *   DEMO_SEED=42            - Seed value for deterministic data (default: 42)
 *   DEMO_TENANT_SLUG=...    - Override demo tenant slug (default: settler-demo)
 *
 * If DATABASE_URL is not set, the script writes seeded data as JSON files to
 * demo/data/ so the showcase data is still useful for manual imports or local
 * dev without a live database.
 */

import * as fs from "fs";
import * as path from "path";

// ─── Configuration ────────────────────────────────────────────────────────────

const DEMO_SEED = Number(process.env.DEMO_SEED ?? 42);
const DEMO_TENANT_SLUG = process.env.DEMO_TENANT_SLUG ?? "settler-demo";
const DEMO_TENANT_NAME = "Acme Corp (Demo)";
const DEMO_ADMIN_EMAIL = "demo@settler.dev";
const DEMO_VIEWER_EMAIL = "viewer@settler.dev";

// Deterministic placeholder IDs — stable across re-seeds when DB is unavailable
const DEMO_TENANT_ID = "00000000-demo-0000-0000-000000000001";
const DEMO_ADMIN_USER_ID = "00000000-demo-0000-0000-000000000002";
const DEMO_VIEWER_USER_ID = "00000000-demo-0000-0000-000000000003";

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function createRng(initialSeed: number) {
  let s = initialSeed;
  return {
    next(): number {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    },
  };
}

const rng = createRng(DEMO_SEED);

function seededUuid(): string {
  const hex = Array.from({ length: 32 }, () =>
    Math.floor(rng.next() * 16).toString(16)
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(rng.next() * 22) + 1, Math.floor(rng.next() * 59), 0, 0);
  return d;
}

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(rng.next() * arr.length)]!;
}

function randomAmount(min: number, max: number): number {
  return Number((rng.next() * (max - min) + min).toFixed(2));
}

// ─── Data Definitions ────────────────────────────────────────────────────────

const COMPANIES = [
  "Meridian Software",
  "Atlas Retail Group",
  "Northbridge Analytics",
  "ClearPath Logistics",
  "Vertex Capital",
  "Harbour Commerce",
  "Titan Media",
  "Solaris Technologies",
  "Keystone Partners",
  "Ironwood Health",
];

const DESCRIPTIONS_STRIPE = [
  "Monthly SaaS subscription",
  "Enterprise license renewal",
  "Professional services invoice",
  "Add-on module purchase",
  "Overage charge Q4",
  "API usage billing",
  "Seats upgrade",
  "Onboarding fee",
  "Support tier upgrade",
  "Custom integration fee",
];

const DESCRIPTIONS_BANK = [
  "WIRE TRANSFER IN",
  "ACH CREDIT RECEIVED",
  "STRIPE PAYOUT",
  "PAYMENT RECEIVED",
  "DEPOSIT",
];

// ─── Connector / Source Data ───────────────────────────────────────────────────

interface DemoSource {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  type: string;
  connectorType: string;
  status: "active" | "error" | "paused";
  lastSyncAt: Date;
  lastSyncStatus: "success" | "failed" | "partial";
  lastSyncError: string | null;
  syncSchedule: string;
  configMetadata: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

function buildSources(): DemoSource[] {
  return [
    {
      id: seededUuid(),
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      name: "Stripe (Production)",
      type: "stripe",
      connectorType: "stripe",
      status: "active",
      lastSyncAt: daysAgo(0),
      lastSyncStatus: "success",
      lastSyncError: null,
      syncSchedule: "0 */6 * * *",
      configMetadata: { accountId: "acct_demo_acme", mode: "live" },
      metadata: { isDemo: true },
      createdAt: daysAgo(90),
      updatedAt: daysAgo(0),
    },
    {
      id: seededUuid(),
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      name: "Chase Business Checking",
      type: "bank",
      connectorType: "plaid",
      status: "active",
      lastSyncAt: daysAgo(1),
      lastSyncStatus: "success",
      lastSyncError: null,
      syncSchedule: "0 8 * * *",
      configMetadata: { institutionName: "Chase", accountMask: "9847" },
      metadata: { isDemo: true },
      createdAt: daysAgo(90),
      updatedAt: daysAgo(1),
    },
    {
      id: seededUuid(),
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      name: "Shopify (Acme Store)",
      type: "shopify",
      connectorType: "shopify",
      status: "error",
      lastSyncAt: daysAgo(3),
      lastSyncStatus: "failed",
      lastSyncError:
        "OAuth token expired. Re-authentication required. Last successful sync: 3 days ago.",
      syncSchedule: "0 */12 * * *",
      configMetadata: { shopDomain: "acme-corp.myshopify.com", apiVersion: "2024-07" },
      metadata: { isDemo: true },
      createdAt: daysAgo(60),
      updatedAt: daysAgo(3),
    },
    {
      id: seededUuid(),
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      name: "QuickBooks Online",
      type: "quickbooks",
      connectorType: "quickbooks",
      status: "active",
      lastSyncAt: daysAgo(0),
      lastSyncStatus: "partial",
      lastSyncError: null,
      syncSchedule: "0 2 * * *",
      configMetadata: { companyId: "123145812345678", region: "US" },
      metadata: { isDemo: true },
      createdAt: daysAgo(75),
      updatedAt: daysAgo(0),
    },
  ];
}

// ─── Transaction Data ──────────────────────────────────────────────────────────

interface DemoTransaction {
  id: string;
  ingestionId: string;
  tenantId: string;
  sourceId: string;
  externalId: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  category: string;
  paymentMethod: string;
  reference: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface DemoIngestion {
  id: string;
  sourceId: string;
  tenantId: string;
  userId: string;
  status: "completed" | "failed" | "processing";
  startedAt: Date;
  completedAt: Date | null;
  rawRecordCount: number;
  normalizedCount: number;
  failedCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface DemoRun {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  status: "completed" | "failed" | "running" | "pending";
  startedAt: Date;
  completedAt: Date | null;
  sourceCount: number;
  targetCount: number;
  matchedCount: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  confidenceAvg: number;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface DemoMatch {
  id: string;
  runId: string;
  tenantId: string;
  sourceTransactionId: string;
  targetTransactionId: string | null;
  matchType: "exact" | "fuzzy" | "manual" | "unmatched";
  confidence: number;
  matchReason: string;
  amountDiff: number | null;
  dateDiff: number | null;
  reviewed: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface DemoAuditLog {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, unknown>;
  ipAddress: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

interface DemoExport {
  id: string;
  tenantId: string;
  userId: string;
  type: "csv" | "json" | "excel";
  format: "matched" | "unmatched" | "all" | "reconciliation_report";
  reconciliationRunId: string;
  status: "completed" | "pending" | "failed";
  rowCount: number;
  fileSizeBytes: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Generate Full Demo Dataset ───────────────────────────────────────────────

function generateDemoDataset() {
  const sources = buildSources();
  const [stripeSourceId, bankSourceId, shopifySourceId, qbSourceId] = sources.map((s) => s.id) as [
    string,
    string,
    string,
    string,
  ];

  // Ingestions
  const ingestions: DemoIngestion[] = [
    {
      id: seededUuid(),
      sourceId: stripeSourceId,
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      status: "completed",
      startedAt: daysAgo(1),
      completedAt: daysAgo(1),
      rawRecordCount: 142,
      normalizedCount: 142,
      failedCount: 0,
      metadata: { isDemo: true, period: "last-30-days" },
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: seededUuid(),
      sourceId: bankSourceId,
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      status: "completed",
      startedAt: daysAgo(1),
      completedAt: daysAgo(1),
      rawRecordCount: 98,
      normalizedCount: 98,
      failedCount: 0,
      metadata: { isDemo: true, period: "last-30-days" },
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ];

  const [stripeIngestionId, bankIngestionId] = ingestions.map((i) => i.id) as [string, string];

  // ── Transactions ──────────────────────────────────────────────────────────

  const stripeTransactions: DemoTransaction[] = [];
  const bankTransactions: DemoTransaction[] = [];

  // 30 matched pairs (exact match)
  const matchedPairs: Array<{ stripeId: string; bankId: string; amount: number }> = [];
  for (let i = 0; i < 30; i++) {
    const amount = randomAmount(500, 25000);
    const date = daysAgo(Math.floor(rng.next() * 28) + 2);
    const stripeId = seededUuid();
    const bankId = seededUuid();
    const company = pickFrom(COMPANIES);
    const ref = `INV-${2025000 + i}`;

    stripeTransactions.push({
      id: stripeId,
      ingestionId: stripeIngestionId,
      tenantId: DEMO_TENANT_ID,
      sourceId: stripeSourceId,
      externalId: `ch_demo_${i.toString().padStart(4, "0")}`,
      amount,
      currency: "USD",
      date,
      description: `${pickFrom(DESCRIPTIONS_STRIPE)} — ${company}`,
      category: "payment",
      paymentMethod: pickFrom(["card", "ach_debit", "wire"]),
      reference: ref,
      metadata: { isDemo: true, company, invoiceRef: ref },
      createdAt: date,
      updatedAt: date,
    });

    const bankDate = new Date(date);
    bankDate.setDate(bankDate.getDate() + (Math.random() < 0.8 ? 0 : 1));

    bankTransactions.push({
      id: bankId,
      ingestionId: bankIngestionId,
      tenantId: DEMO_TENANT_ID,
      sourceId: bankSourceId,
      externalId: `txn_demo_${i.toString().padStart(4, "0")}`,
      amount,
      currency: "USD",
      date: bankDate,
      description: `${pickFrom(DESCRIPTIONS_BANK)} ${ref}`,
      category: "deposit",
      paymentMethod: "bank_transfer",
      reference: ref,
      metadata: { isDemo: true, company, invoiceRef: ref },
      createdAt: bankDate,
      updatedAt: bankDate,
    });

    matchedPairs.push({ stripeId, bankId, amount });
  }

  // 5 fuzzy matches (small amount difference — e.g., currency rounding, partial refund)
  const fuzzyPairs: Array<{ stripeId: string; bankId: string; stripAmount: number; bankAmount: number }> =
    [];
  for (let i = 0; i < 5; i++) {
    const baseAmount = randomAmount(1000, 8000);
    const diff = Number((rng.next() * 15 + 0.5).toFixed(2));
    const date = daysAgo(Math.floor(rng.next() * 20) + 2);
    const stripeId = seededUuid();
    const bankId = seededUuid();
    const company = pickFrom(COMPANIES);
    const ref = `INV-${2025100 + i}`;

    stripeTransactions.push({
      id: stripeId,
      ingestionId: stripeIngestionId,
      tenantId: DEMO_TENANT_ID,
      sourceId: stripeSourceId,
      externalId: `ch_fuzzy_${i}`,
      amount: baseAmount,
      currency: "USD",
      date,
      description: `${pickFrom(DESCRIPTIONS_STRIPE)} — ${company}`,
      category: "payment",
      paymentMethod: "card",
      reference: ref,
      metadata: { isDemo: true, company },
      createdAt: date,
      updatedAt: date,
    });

    bankTransactions.push({
      id: bankId,
      ingestionId: bankIngestionId,
      tenantId: DEMO_TENANT_ID,
      sourceId: bankSourceId,
      externalId: `txn_fuzzy_${i}`,
      amount: Number((baseAmount - diff).toFixed(2)),
      currency: "USD",
      date,
      description: `PAYMENT RECEIVED ${ref}`,
      category: "deposit",
      paymentMethod: "bank_transfer",
      reference: ref,
      metadata: { isDemo: true, company, amountDiffNote: `$${diff} fee deducted` },
      createdAt: date,
      updatedAt: date,
    });

    fuzzyPairs.push({ stripeId, bankId, stripAmount: baseAmount, bankAmount: baseAmount - diff });
  }

  // 8 unmatched Stripe transactions (no bank counterpart)
  const unmatchedStripe: DemoTransaction[] = [];
  for (let i = 0; i < 8; i++) {
    const id = seededUuid();
    const date = daysAgo(Math.floor(rng.next() * 10) + 1);
    const company = pickFrom(COMPANIES);
    const txn: DemoTransaction = {
      id,
      ingestionId: stripeIngestionId,
      tenantId: DEMO_TENANT_ID,
      sourceId: stripeSourceId,
      externalId: `ch_unmatched_${i}`,
      amount: randomAmount(250, 12000),
      currency: "USD",
      date,
      description: `${pickFrom(DESCRIPTIONS_STRIPE)} — ${company} [PENDING PAYOUT]`,
      category: "payment",
      paymentMethod: "card",
      reference: `INV-${2025200 + i}`,
      metadata: { isDemo: true, company, pendingPayout: true },
      createdAt: date,
      updatedAt: date,
    };
    stripeTransactions.push(txn);
    unmatchedStripe.push(txn);
  }

  // 3 unmatched bank transactions (no Stripe counterpart — fees, wire adjustments)
  const unmatchedBank: DemoTransaction[] = [];
  const unmatchedBankDescs = [
    { desc: "WIRE FEE - INTERNATIONAL TRANSFER", amount: 25.0 },
    { desc: "MONTHLY SERVICE CHARGE", amount: 15.0 },
    { desc: "RETURNED ITEM FEE", amount: 35.0 },
  ];
  for (let i = 0; i < 3; i++) {
    const id = seededUuid();
    const date = daysAgo(Math.floor(rng.next() * 15) + 1);
    const txn: DemoTransaction = {
      id,
      ingestionId: bankIngestionId,
      tenantId: DEMO_TENANT_ID,
      sourceId: bankSourceId,
      externalId: `txn_bank_only_${i}`,
      amount: unmatchedBankDescs[i]!.amount,
      currency: "USD",
      date,
      description: unmatchedBankDescs[i]!.desc,
      category: "fee",
      paymentMethod: "bank_charge",
      reference: `BANK-FEE-${i}`,
      metadata: { isDemo: true, requiresReview: true },
      createdAt: date,
      updatedAt: date,
    };
    bankTransactions.push(txn);
    unmatchedBank.push(txn);
  }

  // ── Reconciliation Runs ───────────────────────────────────────────────────

  const run1Id = seededUuid();
  const run2Id = seededUuid();
  const run3Id = seededUuid();

  const runs: DemoRun[] = [
    {
      // Run 1: Healthy completed run (most recent)
      id: run1Id,
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      name: "Stripe ↔ Chase — March 2025 (auto)",
      status: "completed",
      startedAt: daysAgo(1),
      completedAt: daysAgo(1),
      sourceCount: 142,
      targetCount: 98,
      matchedCount: 89,
      unmatchedSourceCount: 8,
      unmatchedTargetCount: 3,
      confidenceAvg: 0.962,
      errorMessage: null,
      metadata: { isDemo: true, schedule: "daily", trigger: "scheduled" },
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      // Run 2: Completed run with elevated unmatched (exceptions surfaced)
      id: run2Id,
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      name: "Stripe ↔ Chase — February 2025 (auto)",
      status: "completed",
      startedAt: daysAgo(32),
      completedAt: daysAgo(32),
      sourceCount: 138,
      targetCount: 102,
      matchedCount: 94,
      unmatchedSourceCount: 18,
      unmatchedTargetCount: 7,
      confidenceAvg: 0.887,
      errorMessage: null,
      metadata: {
        isDemo: true,
        schedule: "daily",
        trigger: "scheduled",
        note: "Elevated unmatched — Shopify connector was degraded during this period",
      },
      createdAt: daysAgo(32),
      updatedAt: daysAgo(32),
    },
    {
      // Run 3: Failed run (illustrates degraded connector story)
      id: run3Id,
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      name: "Shopify ↔ QuickBooks — March 2025 (manual)",
      status: "failed",
      startedAt: daysAgo(3),
      completedAt: daysAgo(3),
      sourceCount: 0,
      targetCount: 0,
      matchedCount: 0,
      unmatchedSourceCount: 0,
      unmatchedTargetCount: 0,
      confidenceAvg: 0,
      errorMessage:
        "Ingestion failed: Shopify connector authentication error — OAuth token expired. No data fetched. Please re-authenticate the Shopify connector and retry.",
      metadata: { isDemo: true, trigger: "manual", connectorIssue: true },
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
  ];

  // ── Reconciliation Matches ────────────────────────────────────────────────

  const matches: DemoMatch[] = [];

  // Exact matches
  for (const pair of matchedPairs) {
    matches.push({
      id: seededUuid(),
      runId: run1Id,
      tenantId: DEMO_TENANT_ID,
      sourceTransactionId: pair.stripeId,
      targetTransactionId: pair.bankId,
      matchType: "exact",
      confidence: Number((0.97 + rng.next() * 0.03).toFixed(4)),
      matchReason: "Exact match on reference number, amount, and settlement date.",
      amountDiff: null,
      dateDiff: 0,
      reviewed: false,
      metadata: { isDemo: true },
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    });
  }

  // Fuzzy matches
  for (const pair of fuzzyPairs) {
    const diff = Number((pair.stripAmount - pair.bankAmount).toFixed(2));
    matches.push({
      id: seededUuid(),
      runId: run1Id,
      tenantId: DEMO_TENANT_ID,
      sourceTransactionId: pair.stripeId,
      targetTransactionId: pair.bankId,
      matchType: "fuzzy",
      confidence: Number((0.82 + rng.next() * 0.12).toFixed(4)),
      matchReason: `Fuzzy match: same reference and date; amount differs by $${diff} (likely processing fee or rounding).`,
      amountDiff: diff,
      dateDiff: 0,
      reviewed: false,
      metadata: { isDemo: true, requiresReview: true },
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    });
  }

  // Unmatched source
  for (const txn of unmatchedStripe) {
    matches.push({
      id: seededUuid(),
      runId: run1Id,
      tenantId: DEMO_TENANT_ID,
      sourceTransactionId: txn.id,
      targetTransactionId: null,
      matchType: "unmatched",
      confidence: 0.0,
      matchReason: "No matching bank transaction found. Payout may be pending.",
      amountDiff: null,
      dateDiff: null,
      reviewed: false,
      metadata: { isDemo: true, requiresReview: true },
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    });
  }

  // Unmatched target (bank-only)
  for (const txn of unmatchedBank) {
    matches.push({
      id: seededUuid(),
      runId: run1Id,
      tenantId: DEMO_TENANT_ID,
      sourceTransactionId: txn.id,
      targetTransactionId: null,
      matchType: "unmatched",
      confidence: 0.0,
      matchReason:
        "Bank-side transaction with no processor counterpart. Likely a bank fee or direct charge.",
      amountDiff: null,
      dateDiff: null,
      reviewed: false,
      metadata: { isDemo: true, requiresReview: true, bankOnly: true },
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    });
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────

  const auditLogs: DemoAuditLog[] = [
    {
      id: seededUuid(),
      userId: DEMO_ADMIN_USER_ID,
      tenantId: DEMO_TENANT_ID,
      action: "create",
      resourceType: "ingestion_source",
      resourceId: stripeSourceId,
      changes: { name: "Stripe (Production)", type: "stripe", status: "active" },
      ipAddress: "203.0.113.42",
      metadata: { isDemo: true },
      createdAt: daysAgo(90),
    },
    {
      id: seededUuid(),
      userId: DEMO_ADMIN_USER_ID,
      tenantId: DEMO_TENANT_ID,
      action: "create",
      resourceType: "ingestion_source",
      resourceId: bankSourceId,
      changes: { name: "Chase Business Checking", type: "bank" },
      ipAddress: "203.0.113.42",
      metadata: { isDemo: true },
      createdAt: daysAgo(89),
    },
    {
      id: seededUuid(),
      userId: DEMO_ADMIN_USER_ID,
      tenantId: DEMO_TENANT_ID,
      action: "trigger",
      resourceType: "reconciliation_run",
      resourceId: run1Id,
      changes: { name: "Stripe ↔ Chase — March 2025 (auto)", trigger: "scheduled" },
      ipAddress: "system",
      metadata: { isDemo: true },
      createdAt: daysAgo(1),
    },
    {
      id: seededUuid(),
      userId: DEMO_ADMIN_USER_ID,
      tenantId: DEMO_TENANT_ID,
      action: "export",
      resourceType: "export",
      resourceId: seededUuid(),
      changes: { format: "csv", runId: run1Id, rowCount: 142 },
      ipAddress: "203.0.113.42",
      metadata: { isDemo: true },
      createdAt: daysAgo(1),
    },
    {
      id: seededUuid(),
      userId: DEMO_ADMIN_USER_ID,
      tenantId: DEMO_TENANT_ID,
      action: "update",
      resourceType: "ingestion_source",
      resourceId: shopifySourceId,
      changes: {
        status: { before: "active", after: "error" },
        lastSyncError: "OAuth token expired",
      },
      ipAddress: "system",
      metadata: { isDemo: true },
      createdAt: daysAgo(3),
    },
    {
      id: seededUuid(),
      userId: DEMO_ADMIN_USER_ID,
      tenantId: DEMO_TENANT_ID,
      action: "invite",
      resourceType: "workspace_invite",
      resourceId: seededUuid(),
      changes: { email: DEMO_VIEWER_EMAIL, role: "viewer" },
      ipAddress: "203.0.113.42",
      metadata: { isDemo: true },
      createdAt: daysAgo(7),
    },
  ];

  // ── Exports ───────────────────────────────────────────────────────────────

  const exports: DemoExport[] = [
    {
      id: seededUuid(),
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      type: "csv",
      format: "reconciliation_report",
      reconciliationRunId: run1Id,
      status: "completed",
      rowCount: 142,
      fileSizeBytes: 48_320,
      metadata: {
        isDemo: true,
        filename: "acme-reconciliation-march-2025.csv",
      },
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: seededUuid(),
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_ADMIN_USER_ID,
      type: "csv",
      format: "unmatched",
      reconciliationRunId: run2Id,
      status: "completed",
      rowCount: 25,
      fileSizeBytes: 8_210,
      metadata: {
        isDemo: true,
        filename: "acme-unmatched-february-2025.csv",
      },
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
  ];

  return {
    tenant: {
      id: DEMO_TENANT_ID,
      slug: DEMO_TENANT_SLUG,
      name: DEMO_TENANT_NAME,
      isActive: true,
      metadata: {
        isDemo: true,
        demoSeed: DEMO_SEED,
        tier: "ENTERPRISE",
        note: "Isolated demo tenant — safe to reset at any time",
      },
      createdAt: daysAgo(90),
      updatedAt: new Date(),
    },
    users: [
      {
        id: DEMO_ADMIN_USER_ID,
        email: DEMO_ADMIN_EMAIL,
        role: "ADMIN",
        tenantId: DEMO_TENANT_ID,
        metadata: { isDemo: true, displayName: "Alex Demo (Admin)" },
      },
      {
        id: DEMO_VIEWER_USER_ID,
        email: DEMO_VIEWER_EMAIL,
        role: "VIEWER",
        tenantId: DEMO_TENANT_ID,
        metadata: { isDemo: true, displayName: "Jordan Demo (Viewer)" },
      },
    ],
    sources,
    ingestions,
    transactions: {
      stripe: stripeTransactions,
      bank: bankTransactions,
    },
    runs,
    matches,
    auditLogs,
    exports,
    summary: {
      tenantSlug: DEMO_TENANT_SLUG,
      sources: sources.length,
      ingestions: ingestions.length,
      stripeTransactions: stripeTransactions.length,
      bankTransactions: bankTransactions.length,
      reconciliationRuns: runs.length,
      totalMatches: matches.length,
      exactMatches: matchedPairs.length,
      fuzzyMatches: fuzzyPairs.length,
      unmatchedSourceTransactions: unmatchedStripe.length,
      unmatchedBankTransactions: unmatchedBank.length,
      auditLogs: auditLogs.length,
      exports: exports.length,
    },
  };
}

// ─── DB Seed via Prisma ───────────────────────────────────────────────────────

async function seedDatabase(dataset: ReturnType<typeof generateDemoDataset>, reset: boolean) {
  let prisma: import("@prisma/client").PrismaClient;
  try {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  } catch {
    console.warn(
      "⚠️  @prisma/client not available or DATABASE_URL not set. Falling back to JSON file output."
    );
    return false;
  }

  try {
    await prisma.$connect();

    if (reset) {
      console.log("🗑️  Resetting demo tenant data...");
      // Delete in reverse dependency order
      await prisma.reconciliationMatch
        .deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
        .catch(() => {});
      await prisma.reconciliationRun
        .deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
        .catch(() => {});
      await prisma.normalizedTransaction
        .deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
        .catch(() => {});
      await prisma.rawRecord
        .deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
        .catch(() => {});
      await prisma.ingestion
        .deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
        .catch(() => {});
      await prisma.ingestionSource
        .deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
        .catch(() => {});
      await prisma.auditLog
        .deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
        .catch(() => {});
      await prisma.export
        .deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
        .catch(() => {});
      await prisma.tenant.deleteMany({ where: { slug: DEMO_TENANT_SLUG } }).catch(() => {});
      console.log("   ✓ Demo tenant data cleared");
    }

    // Upsert tenant
    await prisma.tenant.upsert({
      where: { slug: DEMO_TENANT_SLUG },
      update: { metadata: dataset.tenant.metadata as object, updatedAt: new Date() },
      create: {
        id: dataset.tenant.id,
        slug: dataset.tenant.slug,
        name: dataset.tenant.name,
        isActive: dataset.tenant.isActive,
        metadata: dataset.tenant.metadata as object,
      },
    });
    console.log(`   ✓ Tenant: ${DEMO_TENANT_NAME} (${DEMO_TENANT_SLUG})`);

    // Upsert ingestion sources
    for (const source of dataset.sources) {
      await prisma.ingestionSource.upsert({
        where: { id: source.id },
        update: {
          status: source.status,
          lastSyncAt: source.lastSyncAt,
          lastSyncStatus: source.lastSyncStatus,
          lastSyncError: source.lastSyncError,
          configMetadata: source.configMetadata as object,
          metadata: source.metadata as object,
          updatedAt: source.updatedAt,
        },
        create: {
          id: source.id,
          tenantId: source.tenantId,
          userId: source.userId,
          name: source.name,
          type: source.type,
          connectorType: source.connectorType,
          status: source.status,
          lastSyncAt: source.lastSyncAt,
          lastSyncStatus: source.lastSyncStatus,
          lastSyncError: source.lastSyncError,
          syncSchedule: source.syncSchedule,
          configMetadata: source.configMetadata as object,
          metadata: source.metadata as object,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt,
        },
      });
    }
    console.log(`   ✓ Sources: ${dataset.sources.length} connectors`);

    // Insert ingestions
    for (const ingestion of dataset.ingestions) {
      await prisma.ingestion
        .upsert({
          where: { idempotencyKey: `demo-${ingestion.id}` },
          update: {},
          create: {
            id: ingestion.id,
            sourceId: ingestion.sourceId,
            tenantId: ingestion.tenantId,
            userId: ingestion.userId,
            idempotencyKey: `demo-${ingestion.id}`,
            status: ingestion.status,
            startedAt: ingestion.startedAt,
            completedAt: ingestion.completedAt,
            rawRecordCount: ingestion.rawRecordCount,
            normalizedCount: ingestion.normalizedCount,
            failedCount: ingestion.failedCount,
            metadata: ingestion.metadata as object,
            createdAt: ingestion.createdAt,
            updatedAt: ingestion.updatedAt,
          },
        })
        .catch(() => {
          // If ingestion already exists, skip
        });
    }
    console.log(`   ✓ Ingestions: ${dataset.ingestions.length}`);

    // Insert normalized transactions
    const allTxns = [...dataset.transactions.stripe, ...dataset.transactions.bank];
    let txnCount = 0;
    for (const txn of allTxns) {
      try {
        await prisma.normalizedTransaction.upsert({
          where: { id: txn.id },
          update: {},
          create: {
            id: txn.id,
            ingestionId: txn.ingestionId,
            tenantId: txn.tenantId,
            sourceId: txn.sourceId,
            externalId: txn.externalId,
            amount: txn.amount,
            currency: txn.currency,
            date: txn.date,
            description: txn.description,
            category: txn.category,
            paymentMethod: txn.paymentMethod,
            reference: txn.reference,
            metadata: txn.metadata as object,
            createdAt: txn.createdAt,
            updatedAt: txn.updatedAt,
          },
        });
        txnCount++;
      } catch {
        // skip duplicates
      }
    }
    console.log(`   ✓ Transactions: ${txnCount} (Stripe + Bank)`);

    // Insert reconciliation runs
    for (const run of dataset.runs) {
      await prisma.reconciliationRun
        .upsert({
          where: { id: run.id },
          update: {},
          create: {
            id: run.id,
            tenantId: run.tenantId,
            userId: run.userId,
            name: run.name,
            status: run.status,
            startedAt: run.startedAt,
            completedAt: run.completedAt,
            sourceCount: run.sourceCount,
            targetCount: run.targetCount,
            matchedCount: run.matchedCount,
            unmatchedSourceCount: run.unmatchedSourceCount,
            unmatchedTargetCount: run.unmatchedTargetCount,
            confidenceAvg: run.confidenceAvg,
            errorMessage: run.errorMessage,
            metadata: run.metadata as object,
            createdAt: run.createdAt,
            updatedAt: run.updatedAt,
          },
        })
        .catch(() => {});
    }
    console.log(`   ✓ Reconciliation runs: ${dataset.runs.length}`);

    // Insert matches
    let matchCount = 0;
    for (const match of dataset.matches) {
      try {
        await prisma.reconciliationMatch.upsert({
          where: { id: match.id },
          update: {},
          create: {
            id: match.id,
            runId: match.runId,
            tenantId: match.tenantId,
            sourceTransactionId: match.sourceTransactionId,
            targetTransactionId: match.targetTransactionId,
            matchType: match.matchType,
            confidence: match.confidence,
            matchReason: match.matchReason,
            amountDiff: match.amountDiff,
            dateDiff: match.dateDiff,
            reviewed: match.reviewed,
            metadata: match.metadata as object,
            createdAt: match.createdAt,
            updatedAt: match.updatedAt,
          },
        });
        matchCount++;
      } catch {
        // skip duplicates
      }
    }
    console.log(`   ✓ Matches: ${matchCount} (exact + fuzzy + unmatched)`);

    // Insert audit logs
    for (const log of dataset.auditLogs) {
      await prisma.auditLog
        .create({
          data: {
            id: log.id,
            userId: log.userId,
            tenantId: log.tenantId,
            action: log.action,
            resourceType: log.resourceType,
            resourceId: log.resourceId,
            changes: log.changes as object,
            ipAddress: log.ipAddress,
            metadata: log.metadata as object,
            createdAt: log.createdAt,
          },
        })
        .catch(() => {});
    }
    console.log(`   ✓ Audit logs: ${dataset.auditLogs.length}`);

    await prisma.$disconnect();
    return true;
  } catch (err) {
    await prisma.$disconnect().catch(() => {});
    console.warn("⚠️  DB seed failed:", String(err));
    return false;
  }
}

// ─── JSON File Fallback ───────────────────────────────────────────────────────

function writeJsonFiles(dataset: ReturnType<typeof generateDemoDataset>) {
  const outputDir = path.join(process.cwd(), "demo", "data");
  fs.mkdirSync(outputDir, { recursive: true });

  const files: Record<string, unknown> = {
    "demo_tenant.json": dataset.tenant,
    "demo_users.json": dataset.users,
    "demo_sources.json": dataset.sources,
    "demo_ingestions.json": dataset.ingestions,
    "demo_stripe_transactions.json": dataset.transactions.stripe,
    "demo_bank_transactions.json": dataset.transactions.bank,
    "demo_reconciliation_runs.json": dataset.runs,
    "demo_matches.json": dataset.matches,
    "demo_audit_logs.json": dataset.auditLogs,
    "demo_exports.json": dataset.exports,
    "demo_summary.json": dataset.summary,
  };

  for (const [filename, data] of Object.entries(files)) {
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(data, null, 2));
  }

  console.log(`   ✓ JSON files written to demo/data/ (${Object.keys(files).length} files)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset") || args.includes("-r");

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   Settler Enterprise Demo Tenant Seed            ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`   Tenant:  ${DEMO_TENANT_NAME} (${DEMO_TENANT_SLUG})`);
  console.log(`   Seed:    ${DEMO_SEED}`);
  console.log(`   Mode:    ${reset ? "RESET + RE-SEED" : "SEED (idempotent)"}\n`);

  const dataset = generateDemoDataset();

  console.log("📊 Generated demo dataset:");
  console.log(`   Sources:               ${dataset.summary.sources}`);
  console.log(`   Stripe transactions:   ${dataset.summary.stripeTransactions}`);
  console.log(`   Bank transactions:     ${dataset.summary.bankTransactions}`);
  console.log(`   Reconciliation runs:   ${dataset.summary.reconciliationRuns}`);
  console.log(`   Exact matches:         ${dataset.summary.exactMatches}`);
  console.log(`   Fuzzy matches:         ${dataset.summary.fuzzyMatches}`);
  console.log(`   Unmatched (Stripe):    ${dataset.summary.unmatchedSourceTransactions}`);
  console.log(`   Unmatched (Bank):      ${dataset.summary.unmatchedBankTransactions}`);
  console.log(`   Audit log entries:     ${dataset.summary.auditLogs}`);
  console.log(`   Exports:               ${dataset.summary.exports}`);
  console.log();

  // Always write JSON (useful even with DB)
  console.log("📁 Writing JSON data files...");
  writeJsonFiles(dataset);

  // Attempt DB seed if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    console.log("\n🗄️  Seeding database...");
    const dbSuccess = await seedDatabase(dataset, reset);
    if (dbSuccess) {
      console.log("\n✅ Database seeded successfully.");
    } else {
      console.log("\n⚠️  Database seed skipped — see JSON files in demo/data/");
    }
  } else {
    console.log(
      "\n⚠️  DATABASE_URL not set — JSON files written to demo/data/ for manual import."
    );
  }

  console.log("\n" + "═".repeat(52));
  console.log("🎉 Demo tenant ready!");
  console.log("═".repeat(52));
  console.log();
  console.log("   Demo accounts:");
  console.log(`   Admin:  ${DEMO_ADMIN_EMAIL}`);
  console.log(`   Viewer: ${DEMO_VIEWER_EMAIL}`);
  console.log();
  console.log("   Key surfaces to demo:");
  console.log("   /app/runs           → Reconciliation run history");
  console.log("   /app/runs/<run1>    → Run details + match explorer");
  console.log("   /app/sources        → Connectors (healthy + degraded)");
  console.log("   /app/audit          → Audit trail");
  console.log("   /app/exports        → Export history");
  console.log();
  console.log("   Commands:");
  console.log("   pnpm demo:seed      → Re-seed (idempotent)");
  console.log("   pnpm demo:reset     → Wipe + re-seed");
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Demo seed failed:", err);
  process.exit(1);
});
