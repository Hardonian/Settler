/**
 * Showcase Demo Data Generator
 *
 * Produces deterministic, commercially realistic demo data
 * for Settler's demo mode. No database required — data is
 * generated in-memory from a seeded PRNG so every page load
 * is identical until the seed changes.
 *
 * Scenarios:
 *   1. Acme Commerce — clean high-match e-commerce environment
 *   2. Meridian Financial — mid-maturity finance ops with recurring exceptions
 *   3. Atlas Global — messy multi-source with duplicates & lagging imports
 *   4. Pulse Payments — high-volume processor mismatch environment
 *   5. Sentinel Audit Corp — tight thresholds & manual review events
 */

// ---------------------------------------------------------------------------
// Seeded PRNG (LCG)
// ---------------------------------------------------------------------------

interface SeededRng {
  next(): number;
  nextInt(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  uuid(): string;
}

function createRng(seed: number): SeededRng {
  let s = seed;
  function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  }
  return {
    next,
    nextInt(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)]!;
    },
    uuid() {
      const h = Array.from({ length: 32 }, () => Math.floor(next() * 16).toString(16)).join("");
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    },
  };
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ShowcaseTenant {
  id: string;
  name: string;
  slug: string;
  industry: string;
  description: string;
  scenarioLabel: string;
}

export interface ShowcaseRun {
  id: string;
  tenantId: string;
  name: string;
  status: "completed" | "running" | "failed" | "pending";
  statusLabel: string;
  startedAt: string;
  completedAt: string | null;
  summary: {
    total: number;
    sourceCount: number;
    targetCount: number;
    matched: number;
    unmatched: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflicts: number;
  };
  summarySemantics: {
    processed: number;
    matchedWithTolerance: number;
    exceptioned: number;
    unresolved: number;
    ignored: number;
    resolved: number;
  };
  summaryState: "success" | "review_needed" | "in_progress" | "failed" | "empty";
  isTerminal: boolean;
  progress: number;
  progressState: "completed" | "in_progress" | "not_started" | "failed";
  sourceAdapter: string;
  targetAdapter: string;
  configDrift: { status: "none" | "detected" };
}

export interface ShowcaseException {
  id: string;
  tenantId: string;
  runId: string;
  type: string;
  status: "pending" | "investigating" | "resolved" | "ignored";
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: string;
  description: string;
  statusDetail: string;
  reasonTags: string[];
  amount: number;
  currency: string;
  sourceTransactionId: string;
  targetTransactionId: string | null;
  fieldPath: string;
}

export interface ShowcaseAlert {
  id: string;
  tenantId: string;
  type: "threshold_breach" | "sync_failure" | "anomaly" | "sla_warning";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface ShowcaseIntegration {
  id: string;
  tenantId: string;
  name: string;
  adapter: string;
  status: "connected" | "degraded" | "disconnected" | "pending";
  lastSyncAt: string | null;
  recordsSynced: number;
  errorCount: number;
  category: string;
}

export interface ShowcaseAuditEntry {
  id: string;
  tenantId: string;
  action: string;
  actor: string;
  actorRole: string;
  target: string;
  detail: string;
  timestamp: string;
}

export interface ShowcaseMetrics {
  tenantId: string;
  matchRate: number;
  exceptionRate: number;
  avgRunDurationMs: number;
  totalRecordsProcessed: number;
  totalRunsCompleted: number;
  openExceptions: number;
  resolvedExceptions: number;
  activeIntegrations: number;
  trendMatchRate: number[]; // last 12 data points
  trendExceptions: number[];
  trendVolume: number[];
}

export interface ShowcaseDataset {
  tenants: ShowcaseTenant[];
  runs: ShowcaseRun[];
  exceptions: ShowcaseException[];
  alerts: ShowcaseAlert[];
  integrations: ShowcaseIntegration[];
  auditTrail: ShowcaseAuditEntry[];
  metrics: ShowcaseMetrics[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEED = 20260301;

const EXCEPTION_TYPES = [
  "amount_mismatch",
  "missing_counterpart",
  "duplicate_detected",
  "timing_difference",
  "field_discrepancy",
  "threshold_breach",
  "currency_mismatch",
  "reference_conflict",
] as const;

const EXCEPTION_DESCRIPTIONS: Record<string, string[]> = {
  amount_mismatch: [
    "Source amount ${{amt}} differs from target by ${{diff}} ({{pct}}% variance)",
    "Invoice total does not match payment received — delta ${{diff}}",
    "Settlement amount off by ${{diff}}, exceeds tolerance of $0.50",
  ],
  missing_counterpart: [
    "No matching target record found for source transaction {{ref}}",
    "Bank deposit {{ref}} has no corresponding processor payout",
    "ERP journal entry {{ref}} missing bank-side confirmation",
  ],
  duplicate_detected: [
    "Potential duplicate: records {{ref}} and {{ref2}} share amount and date",
    "Two charges on same card ending {{last4}} within 60 seconds",
    "Duplicate payout reference detected across settlement batches",
  ],
  timing_difference: [
    "Transaction posted {{days}} business days after expected settlement window",
    "Bank posting date {{bankDate}} is {{days}} days after processor date",
    "Settlement lag exceeds 3-day SLA by {{days}} days",
  ],
  field_discrepancy: [
    "Merchant name mismatch: '{{a}}' vs '{{b}}'",
    "Currency code discrepancy: source=USD, target=CAD",
    "Reference ID format differs between source and target systems",
  ],
  threshold_breach: [
    "Unmatched rate {{pct}}% exceeds 5% threshold for this run",
    "Conflict count {{n}} exceeds configured limit of 10",
    "Exception volume spiked {{pct}}% compared to prior period",
  ],
  currency_mismatch: [
    "Source records in USD, target in EUR — no FX rate configured",
    "Multi-currency settlement contains mixed GBP/EUR without conversion rules",
  ],
  reference_conflict: [
    "Reference {{ref}} maps to multiple target records",
    "Ambiguous match: 3 candidates within tolerance for {{ref}}",
  ],
};

const AUDIT_ACTIONS = [
  "exception.resolved",
  "exception.escalated",
  "exception.ignored",
  "run.started",
  "run.completed",
  "rule.updated",
  "threshold.changed",
  "integration.connected",
  "integration.disconnected",
  "user.invited",
  "export.generated",
  "report.downloaded",
] as const;

const ACTOR_NAMES = [
  "Sarah Chen",
  "James Rodriguez",
  "Priya Patel",
  "Marcus Thompson",
  "Lisa Wang",
  "system",
] as const;

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

function relativeDate(daysAgo: number, rng: SeededRng): string {
  const now = new Date();
  const d = new Date(now.getTime() - daysAgo * 86400000 + rng.nextInt(0, 86400000));
  return d.toISOString();
}

function generateRuns(
  tenantId: string,
  count: number,
  profile: {
    matchRateRange: [number, number];
    failRate: number;
    sourceAdapter: string;
    targetAdapter: string;
    volumeRange: [number, number];
  },
  rng: SeededRng
): ShowcaseRun[] {
  const runs: ShowcaseRun[] = [];
  for (let i = 0; i < count; i++) {
    const total = rng.nextInt(profile.volumeRange[0], profile.volumeRange[1]);
    const sourceCount = Math.round(total * (0.48 + rng.next() * 0.04));
    const targetCount = total - sourceCount;
    const matchRate =
      profile.matchRateRange[0] +
      rng.next() * (profile.matchRateRange[1] - profile.matchRateRange[0]);
    const matched = Math.round(Math.min(sourceCount, targetCount) * matchRate);
    const unmatched = Math.min(sourceCount, targetCount) - matched;
    const unmatchedSource = Math.round(unmatched * (0.4 + rng.next() * 0.2));
    const unmatchedTarget = unmatched - unmatchedSource;
    const conflicts = rng.nextInt(0, Math.max(1, Math.round(unmatched * 0.1)));
    const isFailed = rng.next() < profile.failRate;
    const isRunning = !isFailed && i === 0 && rng.next() < 0.15;
    const status: ShowcaseRun["status"] = isFailed ? "failed" : isRunning ? "running" : "completed";
    const daysAgo = i * 2 + rng.nextInt(0, 1);
    const startedAt = relativeDate(daysAgo, rng);
    const durationMs = rng.nextInt(3000, 45000);
    const completedAt =
      status === "running"
        ? null
        : new Date(new Date(startedAt).getTime() + durationMs).toISOString();

    const exceptioned = rng.nextInt(0, Math.max(1, unmatchedSource));
    const unresolved = rng.nextInt(0, exceptioned);
    const resolved = exceptioned - unresolved;
    const toleranceMatched = rng.nextInt(0, Math.round(matched * 0.08));
    const ignored = rng.nextInt(0, Math.max(1, Math.round(unmatched * 0.05)));

    const summaryState: ShowcaseRun["summaryState"] =
      status === "failed"
        ? "failed"
        : status === "running"
          ? "in_progress"
          : unresolved > 0
            ? "review_needed"
            : "success";

    runs.push({
      id: rng.uuid(),
      tenantId,
      name: `${profile.sourceAdapter}↔${profile.targetAdapter} daily ${i > 0 ? `(${daysAgo}d ago)` : "latest"}`,
      status,
      statusLabel:
        status === "completed"
          ? "Completed"
          : status === "running"
            ? "Running"
            : status === "failed"
              ? "Failed — timeout"
              : "Pending",
      startedAt,
      completedAt,
      summary: {
        total,
        sourceCount,
        targetCount,
        matched,
        unmatched,
        unmatchedSourceCount: unmatchedSource,
        unmatchedTargetCount: unmatchedTarget,
        conflicts,
      },
      summarySemantics: {
        processed: status === "running" ? Math.round(total * 0.6) : total,
        matchedWithTolerance: toleranceMatched,
        exceptioned,
        unresolved,
        ignored,
        resolved,
      },
      summaryState,
      isTerminal: status !== "running",
      progress:
        status === "completed" || status === "failed"
          ? 100
          : status === "running"
            ? rng.nextInt(40, 85)
            : 0,
      progressState:
        status === "completed"
          ? "completed"
          : status === "running"
            ? "in_progress"
            : status === "failed"
              ? "failed"
              : "not_started",
      sourceAdapter: profile.sourceAdapter,
      targetAdapter: profile.targetAdapter,
      configDrift: { status: rng.next() < 0.08 ? "detected" : "none" },
    });
  }
  return runs;
}

function generateExceptions(
  tenantId: string,
  runs: ShowcaseRun[],
  density: number,
  rng: SeededRng
): ShowcaseException[] {
  const exceptions: ShowcaseException[] = [];
  for (const run of runs) {
    if (run.status === "pending") continue;
    const count = Math.round(run.summarySemantics.exceptioned * density);
    for (let i = 0; i < count; i++) {
      const type = rng.pick(EXCEPTION_TYPES);
      const templates = EXCEPTION_DESCRIPTIONS[type] || ["Exception detected"];
      const template = rng.pick(templates);
      const amt = (rng.next() * 5000 + 10).toFixed(2);
      const diff = (rng.next() * 50 + 0.5).toFixed(2);
      const pct = (rng.next() * 8 + 0.1).toFixed(1);
      const ref = `TXN-${rng.nextInt(10000, 99999)}`;
      const description = template
        .replace("{{amt}}", amt)
        .replace("{{diff}}", diff)
        .replace("{{pct}}", pct)
        .replace("{{ref}}", ref)
        .replace("{{ref2}}", `TXN-${rng.nextInt(10000, 99999)}`)
        .replace("{{last4}}", `${rng.nextInt(1000, 9999)}`)
        .replace("{{days}}", `${rng.nextInt(1, 7)}`)
        .replace("{{bankDate}}", relativeDate(rng.nextInt(1, 5), rng).slice(0, 10))
        .replace("{{a}}", "ACME INC")
        .replace("{{b}}", "Acme Inc.")
        .replace("{{n}}", `${rng.nextInt(11, 30)}`);

      const statusRoll = rng.next();
      const status: ShowcaseException["status"] =
        statusRoll < 0.35
          ? "pending"
          : statusRoll < 0.55
            ? "investigating"
            : statusRoll < 0.85
              ? "resolved"
              : "ignored";

      const severityRoll = rng.next();
      const severity: ShowcaseException["severity"] =
        severityRoll < 0.1
          ? "critical"
          : severityRoll < 0.35
            ? "high"
            : severityRoll < 0.7
              ? "medium"
              : "low";

      const reasonTags = [type.replace(/_/g, " ")];
      if (severity === "critical" || severity === "high") {
        reasonTags.push("needs review");
      }
      if (type === "duplicate_detected") {
        reasonTags.push("auto-flagged");
      }

      exceptions.push({
        id: rng.uuid(),
        tenantId,
        runId: run.id,
        type,
        status,
        severity,
        detectedAt: run.startedAt,
        description,
        statusDetail:
          status === "resolved"
            ? "Resolved by operator after manual review"
            : status === "investigating"
              ? "Under investigation — assigned to finance team"
              : status === "ignored"
                ? "Marked as noise — below materiality threshold"
                : "Awaiting operator review",
        reasonTags,
        amount: parseFloat(amt),
        currency: "USD",
        sourceTransactionId: ref,
        targetTransactionId:
          type === "missing_counterpart" ? null : `TXN-${rng.nextInt(10000, 99999)}`,
        fieldPath:
          type === "amount_mismatch"
            ? "amount"
            : type === "field_discrepancy"
              ? "merchant_name"
              : type === "currency_mismatch"
                ? "currency"
                : "reference_id",
      });
    }
  }
  return exceptions;
}

function generateAlerts(tenantId: string, count: number, rng: SeededRng): ShowcaseAlert[] {
  const alerts: ShowcaseAlert[] = [];
  const alertTemplates: Array<{
    type: ShowcaseAlert["type"];
    severity: ShowcaseAlert["severity"];
    title: string;
    message: string;
  }> = [
    {
      type: "threshold_breach",
      severity: "warning",
      title: "Unmatched rate above threshold",
      message:
        "The unmatched rate for the latest Stripe↔Bank run is 6.2%, exceeding the 5% threshold. Review the exception queue.",
    },
    {
      type: "sync_failure",
      severity: "critical",
      title: "QuickBooks sync failed",
      message:
        "The scheduled QuickBooks data pull failed with a 401 Unauthorized error. Re-authenticate the integration.",
    },
    {
      type: "anomaly",
      severity: "warning",
      title: "Unusual spike in duplicate detections",
      message:
        "12 duplicate transactions flagged in the last run — 4x the rolling average. Investigate source data quality.",
    },
    {
      type: "sla_warning",
      severity: "info",
      title: "Settlement SLA approaching deadline",
      message:
        "3 unresolved exceptions are within 2 hours of the 24-hour resolution SLA. Escalate or resolve promptly.",
    },
    {
      type: "threshold_breach",
      severity: "critical",
      title: "Conflict count exceeded limit",
      message:
        "15 conflicts detected in the latest run, exceeding the configured limit of 10. Run paused for manual review.",
    },
    {
      type: "anomaly",
      severity: "info",
      title: "New adapter version available",
      message:
        "Stripe adapter v2.4.0 is available with improved payout matching. Current version: v2.3.1.",
    },
  ];
  for (let i = 0; i < count; i++) {
    const tpl = alertTemplates[i % alertTemplates.length]!;
    alerts.push({
      id: rng.uuid(),
      tenantId,
      ...tpl,
      createdAt: relativeDate(rng.nextInt(0, 7), rng),
      acknowledged: rng.next() < 0.4,
    });
  }
  return alerts;
}

function generateIntegrations(
  tenantId: string,
  adapters: string[],
  rng: SeededRng
): ShowcaseIntegration[] {
  const categories: Record<string, string> = {
    stripe: "Payment Processor",
    shopify: "E-Commerce",
    quickbooks: "Accounting",
    xero: "Accounting",
    "bank-of-america": "Banking",
    "wells-fargo": "Banking",
    square: "Payment Processor",
    paypal: "Payment Processor",
    adyen: "Payment Processor",
    netsuite: "ERP",
  };
  return adapters.map((adapter) => {
    const statusRoll = rng.next();
    const status: ShowcaseIntegration["status"] =
      statusRoll < 0.7
        ? "connected"
        : statusRoll < 0.85
          ? "degraded"
          : statusRoll < 0.95
            ? "disconnected"
            : "pending";
    return {
      id: rng.uuid(),
      tenantId,
      name: adapter.charAt(0).toUpperCase() + adapter.slice(1).replace(/-/g, " "),
      adapter,
      status,
      lastSyncAt: status === "disconnected" ? null : relativeDate(rng.nextInt(0, 2), rng),
      recordsSynced: status === "pending" ? 0 : rng.nextInt(500, 50000),
      errorCount:
        status === "degraded"
          ? rng.nextInt(1, 15)
          : status === "disconnected"
            ? rng.nextInt(5, 30)
            : 0,
      category: categories[adapter] || "Other",
    };
  });
}

function generateAuditTrail(tenantId: string, count: number, rng: SeededRng): ShowcaseAuditEntry[] {
  const entries: ShowcaseAuditEntry[] = [];
  for (let i = 0; i < count; i++) {
    const action = rng.pick(AUDIT_ACTIONS);
    const actor = rng.pick(ACTOR_NAMES);
    const isSystem = actor === "system";
    entries.push({
      id: rng.uuid(),
      tenantId,
      action,
      actor,
      actorRole: isSystem ? "system" : rng.pick(["admin", "operator", "viewer"]),
      target: `${action.split(".")[0]}-${rng.uuid().slice(0, 8)}`,
      detail: describeAuditAction(action, rng),
      timestamp: relativeDate(i * 0.3, rng),
    });
  }
  return entries;
}

function describeAuditAction(action: string, rng: SeededRng): string {
  const map: Record<string, string> = {
    "exception.resolved": "Exception resolved after manual review — root cause: timing variance",
    "exception.escalated": "Exception escalated to finance lead for approval",
    "exception.ignored": "Exception marked as noise — amount below $1.00 materiality threshold",
    "run.started": "Reconciliation run initiated via scheduled job",
    "run.completed": `Run completed — ${rng.nextInt(90, 99)}% match rate`,
    "rule.updated": "Tolerance rule updated: amount threshold changed from $0.50 to $1.00",
    "threshold.changed": "Unmatched rate alert threshold changed from 5% to 3%",
    "integration.connected": "New integration connected and initial sync completed",
    "integration.disconnected": "Integration disconnected — credentials expired",
    "user.invited": "Team member invited with operator role",
    "export.generated": "CSV export generated for completed run",
    "report.downloaded": "Monthly reconciliation summary report downloaded",
  };
  return map[action] || action;
}

function generateMetrics(
  tenantId: string,
  runs: ShowcaseRun[],
  exceptions: ShowcaseException[],
  integrations: ShowcaseIntegration[],
  rng: SeededRng
): ShowcaseMetrics {
  const completedRuns = runs.filter((r) => r.status === "completed");
  const totalRecords = completedRuns.reduce((s, r) => s + r.summary.total, 0);
  const totalMatched = completedRuns.reduce((s, r) => s + r.summary.matched, 0);
  const matchRate = totalRecords > 0 ? Math.round((totalMatched / totalRecords) * 10000) / 100 : 0;
  const openExceptions = exceptions.filter(
    (e) => e.status === "pending" || e.status === "investigating"
  ).length;
  const resolvedExceptions = exceptions.filter((e) => e.status === "resolved").length;
  const avgDuration =
    completedRuns.length > 0
      ? completedRuns.reduce((s, r) => {
          const d = new Date(r.completedAt!).getTime() - new Date(r.startedAt).getTime();
          return s + d;
        }, 0) / completedRuns.length
      : 0;

  // Generate trends (12 points)
  const trendMatchRate: number[] = [];
  const trendExceptions: number[] = [];
  const trendVolume: number[] = [];
  let base = matchRate - rng.nextInt(2, 8);
  for (let i = 0; i < 12; i++) {
    base += rng.next() * 1.5 - 0.3;
    trendMatchRate.push(Math.min(100, Math.max(80, Math.round(base * 10) / 10)));
    trendExceptions.push(rng.nextInt(2, Math.max(3, Math.round(openExceptions * 1.5))));
    trendVolume.push(rng.nextInt(Math.round(totalRecords * 0.6), Math.round(totalRecords * 1.4)));
  }

  return {
    tenantId,
    matchRate,
    exceptionRate:
      totalRecords > 0 ? Math.round((exceptions.length / totalRecords) * 10000) / 100 : 0,
    avgRunDurationMs: Math.round(avgDuration),
    totalRecordsProcessed: totalRecords,
    totalRunsCompleted: completedRuns.length,
    openExceptions,
    resolvedExceptions,
    activeIntegrations: integrations.filter((i) => i.status === "connected").length,
    trendMatchRate,
    trendExceptions,
    trendVolume,
  };
}

// ---------------------------------------------------------------------------
// Tenant scenario definitions
// ---------------------------------------------------------------------------

interface ScenarioProfile {
  tenant: Omit<ShowcaseTenant, "id">;
  runCount: number;
  matchRateRange: [number, number];
  failRate: number;
  sourceAdapter: string;
  targetAdapter: string;
  volumeRange: [number, number];
  exceptionDensity: number;
  alertCount: number;
  auditCount: number;
  extraAdapters: string[];
}

const SCENARIOS: ScenarioProfile[] = [
  {
    tenant: {
      name: "Acme Commerce Inc.",
      slug: "acme-commerce",
      industry: "E-Commerce / Retail",
      description:
        "Clean, high-match e-commerce environment reconciling Stripe payments against Shopify orders and QuickBooks journal entries.",
      scenarioLabel: "Clean High-Match",
    },
    runCount: 8,
    matchRateRange: [0.95, 0.99],
    failRate: 0.02,
    sourceAdapter: "stripe",
    targetAdapter: "shopify",
    volumeRange: [800, 3000],
    exceptionDensity: 0.6,
    alertCount: 3,
    auditCount: 20,
    extraAdapters: ["quickbooks"],
  },
  {
    tenant: {
      name: "Meridian Financial Services",
      slug: "meridian-financial",
      industry: "Financial Services",
      description:
        "Mid-maturity finance ops environment with recurring exceptions from multi-entity ERP reconciliations and bank settlements.",
      scenarioLabel: "Mid-Maturity FinOps",
    },
    runCount: 12,
    matchRateRange: [0.88, 0.95],
    failRate: 0.05,
    sourceAdapter: "netsuite",
    targetAdapter: "bank-of-america",
    volumeRange: [2000, 8000],
    exceptionDensity: 0.8,
    alertCount: 5,
    auditCount: 35,
    extraAdapters: ["wells-fargo", "xero"],
  },
  {
    tenant: {
      name: "Atlas Global Trading",
      slug: "atlas-global",
      industry: "International Trade",
      description:
        "Messy multi-source environment with cross-border transactions, duplicate detections, lagging imports, and currency mismatches.",
      scenarioLabel: "Multi-Source Complex",
    },
    runCount: 15,
    matchRateRange: [0.78, 0.9],
    failRate: 0.1,
    sourceAdapter: "adyen",
    targetAdapter: "xero",
    volumeRange: [3000, 15000],
    exceptionDensity: 1.0,
    alertCount: 6,
    auditCount: 40,
    extraAdapters: ["paypal", "stripe", "bank-of-america"],
  },
  {
    tenant: {
      name: "Pulse Payments Corp",
      slug: "pulse-payments",
      industry: "Payments / FinTech",
      description:
        "High-volume payment processor environment reconciling daily settlements across multiple acquiring banks.",
      scenarioLabel: "High-Volume Payments",
    },
    runCount: 10,
    matchRateRange: [0.92, 0.97],
    failRate: 0.03,
    sourceAdapter: "square",
    targetAdapter: "wells-fargo",
    volumeRange: [10000, 50000],
    exceptionDensity: 0.5,
    alertCount: 4,
    auditCount: 25,
    extraAdapters: ["stripe", "adyen"],
  },
  {
    tenant: {
      name: "Sentinel Audit Corp",
      slug: "sentinel-audit",
      industry: "Audit & Compliance",
      description:
        "Tight-threshold audit environment with manual review requirements, strict SLAs, and comprehensive provenance tracking.",
      scenarioLabel: "Audit-Sensitive",
    },
    runCount: 6,
    matchRateRange: [0.96, 0.995],
    failRate: 0.01,
    sourceAdapter: "quickbooks",
    targetAdapter: "bank-of-america",
    volumeRange: [500, 2000],
    exceptionDensity: 1.2,
    alertCount: 4,
    auditCount: 50,
    extraAdapters: ["xero"],
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let _cachedDataset: ShowcaseDataset | null = null;

export function getShowcaseDataset(): ShowcaseDataset {
  if (_cachedDataset) return _cachedDataset;

  const rng = createRng(SEED);
  const allTenants: ShowcaseTenant[] = [];
  const allRuns: ShowcaseRun[] = [];
  const allExceptions: ShowcaseException[] = [];
  const allAlerts: ShowcaseAlert[] = [];
  const allIntegrations: ShowcaseIntegration[] = [];
  const allAudit: ShowcaseAuditEntry[] = [];
  const allMetrics: ShowcaseMetrics[] = [];

  for (const scenario of SCENARIOS) {
    const tenantId = rng.uuid();
    const tenant: ShowcaseTenant = { id: tenantId, ...scenario.tenant };
    allTenants.push(tenant);

    const runs = generateRuns(
      tenantId,
      scenario.runCount,
      {
        matchRateRange: scenario.matchRateRange,
        failRate: scenario.failRate,
        sourceAdapter: scenario.sourceAdapter,
        targetAdapter: scenario.targetAdapter,
        volumeRange: scenario.volumeRange,
      },
      rng
    );
    allRuns.push(...runs);

    const exceptions = generateExceptions(tenantId, runs, scenario.exceptionDensity, rng);
    allExceptions.push(...exceptions);

    const adapters = [scenario.sourceAdapter, scenario.targetAdapter, ...scenario.extraAdapters];
    const integrations = generateIntegrations(tenantId, [...new Set(adapters)], rng);
    allIntegrations.push(...integrations);

    const alerts = generateAlerts(tenantId, scenario.alertCount, rng);
    allAlerts.push(...alerts);

    const audit = generateAuditTrail(tenantId, scenario.auditCount, rng);
    allAudit.push(...audit);

    const metrics = generateMetrics(tenantId, runs, exceptions, integrations, rng);
    allMetrics.push(metrics);
  }

  _cachedDataset = {
    tenants: allTenants,
    runs: allRuns,
    exceptions: allExceptions,
    alerts: allAlerts,
    integrations: allIntegrations,
    auditTrail: allAudit,
    metrics: allMetrics,
  };

  return _cachedDataset;
}

/** Get the default showcase tenant (Acme Commerce) */
export function getDefaultShowcaseTenant(): ShowcaseTenant {
  return getShowcaseDataset().tenants[0]!;
}

/** Get data scoped to a single tenant */
export function getShowcaseForTenant(tenantId: string) {
  const ds = getShowcaseDataset();
  return {
    tenant: ds.tenants.find((t) => t.id === tenantId),
    runs: ds.runs.filter((r) => r.tenantId === tenantId),
    exceptions: ds.exceptions.filter((e) => e.tenantId === tenantId),
    alerts: ds.alerts.filter((a) => a.tenantId === tenantId),
    integrations: ds.integrations.filter((i) => i.tenantId === tenantId),
    auditTrail: ds.auditTrail.filter((a) => a.tenantId === tenantId),
    metrics: ds.metrics.find((m) => m.tenantId === tenantId),
  };
}
