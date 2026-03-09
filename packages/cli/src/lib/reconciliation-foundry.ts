import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export type SourceSystem =
  | "BANK_STATEMENT"
  | "PAYMENT_PROCESSOR"
  | "INTERNAL_LEDGER"
  | "BILLING_SYSTEM"
  | "INVOICE_SYSTEM"
  | "PAYOUT_REPORT"
  | "REFUND_DISPUTE_EVENTS"
  | "FX_RATE_TABLE";

export type ScenarioCategory =
  | "HAPPY_PATH"
  | "TIMING_MISMATCHES"
  | "FEES_NET_VS_GROSS"
  | "REFUNDS_REVERSALS"
  | "DISPUTES_CHARGEBACKS"
  | "DUPLICATES_NEAR_DUPLICATES"
  | "SPLIT_MERGED_MATCHING"
  | "FX_CURRENCY"
  | "MISSING_BROKEN_REFERENCES"
  | "STATUS_MISMATCHES"
  | "EDGE_CASE_SWAMP";

export type MatchClass =
  | "exact_match"
  | "fuzzy_match"
  | "grouped_match"
  | "unmatched_source_only"
  | "unmatched_target_only"
  | "duplicate_detected"
  | "timing_variance"
  | "fx_variance"
  | "fee_variance"
  | "status_conflict"
  | "manual_review";

export interface SyntheticRecord {
  source_system: SourceSystem;
  source_record_id: string;
  transaction_id: string;
  workspace_id: string;
  external_reference_id?: string;
  payout_batch_id?: string;
  invoice_id?: string;
  refund_id?: string;
  dispute_id?: string;
  transfer_id?: string;
  payment_method?: string;
  status: string;
  currency: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  tax_amount: number;
  authorized_at?: string;
  captured_at?: string;
  occurred_at: string;
  effective_date: string;
  settlement_date?: string;
  payout_date?: string;
  memo?: string;
  counterparty_reference?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ScenarioExpectation {
  scenario_id: string;
  category: ScenarioCategory;
  description: string;
  expected_match_classes: MatchClass[];
  expected_exception_categories: string[];
}

export interface ReconciliationExpectationMatrix {
  exact_matches: string[];
  fuzzy_matches: string[];
  grouped_matches: string[];
  unmatched_source: string[];
  unmatched_target: string[];
  duplicates_detected: string[];
  variance_records: string[];
  manual_review_records: string[];
}

export interface ReconciliationTruth {
  expected_summary: Record<MatchClass, number>;
  per_transaction: Record<string, MatchClass>;
  expected_results: ReconciliationExpectationMatrix;
}

export interface GeneratedSuite {
  manifest: {
    seed: number;
    profile: "smoke" | "integration" | "load" | "chaos";
    complexity: "low" | "medium" | "high";
    generated_at: string;
    workspace_id: string;
    scenario_mix: ScenarioCategory[];
  };
  sources: Record<SourceSystem, SyntheticRecord[]>;
  scenarios: ScenarioExpectation[];
  golden: ReconciliationTruth;
}

const PROFILE_ROWS: Record<GeneratedSuite["manifest"]["profile"], number> = {
  smoke: 100,
  integration: 5000,
  load: 50000,
  chaos: 10000,
};

function rng(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, values: T[]): T {
  return values[Math.floor(random() * values.length)] as T;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function id(prefix: string, index: number): string {
  return `${prefix}_${(index + 1000000).toString(36).toUpperCase()}`;
}

function classify(record: SyntheticRecord): MatchClass {
  if (record.metadata?.is_duplicate === true) return "duplicate_detected";
  if (record.metadata?.needs_manual_review === true) return "manual_review";
  if (record.metadata?.status_conflict === true) return "status_conflict";
  if (record.metadata?.timing_offset_days) return "timing_variance";
  if (record.metadata?.fx_variance_bps) return "fx_variance";
  if (record.metadata?.fee_variance_minor) return "fee_variance";
  if (record.metadata?.group_size && Number(record.metadata.group_size) > 1) return "grouped_match";
  if (record.metadata?.fuzzy_hint) return "fuzzy_match";
  if (record.metadata?.orphan_target === true) return "unmatched_target_only";
  if (record.metadata?.orphan_source === true) return "unmatched_source_only";
  return "exact_match";
}

export function generateReconciliationSuite(config: {
  seed: number;
  profile?: "smoke" | "integration" | "load" | "chaos";
  scenarioMix?: ScenarioCategory[];
}): GeneratedSuite {
  const random = rng(config.seed);
  const profile = config.profile ?? "smoke";
  const rowCount = PROFILE_ROWS[profile];
  const workspace = `ws_SYNTH_${String(config.seed).padStart(6, "0")}`;
  const categories: ScenarioCategory[] = config.scenarioMix ?? [
    "HAPPY_PATH",
    "TIMING_MISMATCHES",
    "FEES_NET_VS_GROSS",
    "REFUNDS_REVERSALS",
    "DISPUTES_CHARGEBACKS",
    "DUPLICATES_NEAR_DUPLICATES",
    "SPLIT_MERGED_MATCHING",
    "FX_CURRENCY",
    "MISSING_BROKEN_REFERENCES",
    "STATUS_MISMATCHES",
    "EDGE_CASE_SWAMP",
  ];

  const sources: Record<SourceSystem, SyntheticRecord[]> = {
    BANK_STATEMENT: [],
    PAYMENT_PROCESSOR: [],
    INTERNAL_LEDGER: [],
    BILLING_SYSTEM: [],
    INVOICE_SYSTEM: [],
    PAYOUT_REPORT: [],
    REFUND_DISPUTE_EVENTS: [],
    FX_RATE_TABLE: [],
  };

  const scenarios: ScenarioExpectation[] = [];
  const perTransaction: Record<string, MatchClass> = {};

  for (let i = 0; i < rowCount; i += 1) {
    const scenario = categories[i % categories.length] as ScenarioCategory;
    const txnId = id("txn", i);
    const processorId = id("proc", i);
    const invoiceId = `inv_2026_${String((i % 4000) + 1).padStart(5, "0")}`;
    const payoutBatchId = `payout_${(Math.floor(i / 12) + 9000).toString(36).toUpperCase()}`;
    const amount = Number((40 + random() * 760).toFixed(2));
    const fee = Number((amount * 0.029 + 0.3).toFixed(2));
    const tax = Number((amount * 0.065).toFixed(2));
    const currency = pick(random, ["USD", "USD", "USD", "CAD", "EUR"]);
    const baseTs = new Date(Date.UTC(2026, 0, 1 + (i % 27), 12 + (i % 6), i % 60, 0));
    const metadata: Record<string, string | number | boolean | null> = { scenario };
    let externalRef = `ext_${id("ref", i)}`;

    if (scenario === "DUPLICATES_NEAR_DUPLICATES") metadata.is_duplicate = i % 2 === 0;
    if (scenario === "MISSING_BROKEN_REFERENCES") {
      externalRef = i % 3 === 0 ? "" : `TRUNC-${txnId.slice(0, 8)}`;
      metadata.fuzzy_hint = true;
    }
    if (scenario === "TIMING_MISMATCHES") metadata.timing_offset_days = 1 + (i % 4);
    if (scenario === "FX_CURRENCY") metadata.fx_variance_bps = 5 + (i % 17);
    if (scenario === "FEES_NET_VS_GROSS") metadata.fee_variance_minor = (i % 5) - 2;
    if (scenario === "STATUS_MISMATCHES") metadata.status_conflict = true;
    if (scenario === "SPLIT_MERGED_MATCHING") metadata.group_size = 2 + (i % 4);
    if (scenario === "EDGE_CASE_SWAMP") metadata.needs_manual_review = true;
    if (profile === "chaos" && i % 40 === 0) metadata.orphan_source = true;
    if (profile === "chaos" && i % 53 === 0) metadata.orphan_target = true;

    const authorized = new Date(baseTs);
    const captured = new Date(
      baseTs.getTime() + (scenario === "TIMING_MISMATCHES" ? 86400000 : 600000)
    );
    const settled = new Date(
      captured.getTime() + (scenario === "TIMING_MISMATCHES" ? 2 * 86400000 : 86400000)
    );
    const payout = new Date(settled.getTime() + 86400000);

    const processor: SyntheticRecord = {
      source_system: "PAYMENT_PROCESSOR",
      source_record_id: processorId,
      transaction_id: txnId,
      workspace_id: workspace,
      external_reference_id: externalRef,
      payout_batch_id: payoutBatchId,
      invoice_id: invoiceId,
      status: scenario === "STATUS_MISMATCHES" ? "succeeded" : "captured",
      currency,
      gross_amount: amount,
      fee_amount: fee,
      net_amount: Number((amount - fee).toFixed(2)),
      tax_amount: tax,
      authorized_at: authorized.toISOString(),
      captured_at: captured.toISOString(),
      occurred_at: captured.toISOString(),
      effective_date: captured.toISOString().slice(0, 10),
      settlement_date: settled.toISOString().slice(0, 10),
      payout_date: payout.toISOString().slice(0, 10),
      payment_method: pick(random, ["card", "ach", "sepa"]),
      metadata,
    };

    const bank: SyntheticRecord = {
      ...processor,
      source_system: "BANK_STATEMENT",
      source_record_id: id("bank", i),
      status: scenario === "STATUS_MISMATCHES" ? "pending" : "posted",
      memo: `SETTLEMENT ${externalRef || txnId}`,
      settlement_date: new Date(
        settled.getTime() + (Number(metadata.timing_offset_days) || 0) * 86400000
      )
        .toISOString()
        .slice(0, 10),
      net_amount:
        scenario === "FEES_NET_VS_GROSS"
          ? Number((processor.net_amount - 0.02).toFixed(2))
          : processor.net_amount,
    };

    const ledger: SyntheticRecord = {
      ...processor,
      source_system: "INTERNAL_LEDGER",
      source_record_id: id("led", i),
      status: scenario === "STATUS_MISMATCHES" ? "pending" : "booked",
    };

    sources.PAYMENT_PROCESSOR.push(processor);
    sources.BANK_STATEMENT.push(bank);
    sources.INTERNAL_LEDGER.push(ledger);
    if (i % 2 === 0)
      sources.INVOICE_SYSTEM.push({
        ...processor,
        source_system: "INVOICE_SYSTEM",
        source_record_id: id("invsrc", i),
      });
    if (i % 3 === 0)
      sources.BILLING_SYSTEM.push({
        ...processor,
        source_system: "BILLING_SYSTEM",
        source_record_id: id("bill", i),
        transfer_id: id("trf", i),
      });
    if (i % 4 === 0)
      sources.PAYOUT_REPORT.push({
        ...processor,
        source_system: "PAYOUT_REPORT",
        source_record_id: id("pay", i),
        gross_amount: Number((processor.gross_amount * (2 + (i % 3))).toFixed(2)),
        metadata: { ...metadata, aggregated_count: 2 + (i % 3) },
      });
    if (scenario === "REFUNDS_REVERSALS" || scenario === "DISPUTES_CHARGEBACKS") {
      sources.REFUND_DISPUTE_EVENTS.push({
        ...processor,
        source_system: "REFUND_DISPUTE_EVENTS",
        source_record_id: id("evt", i),
        refund_id: `refund_${id("rf", i)}`,
        dispute_id: scenario === "DISPUTES_CHARGEBACKS" ? `disp_${id("dp", i)}` : undefined,
        status: scenario === "DISPUTES_CHARGEBACKS" ? "dispute_opened" : "refund_posted",
      });
    }
    if (scenario === "FX_CURRENCY") {
      sources.FX_RATE_TABLE.push({
        ...processor,
        source_system: "FX_RATE_TABLE",
        source_record_id: id("fx", i),
        gross_amount: 1,
        net_amount: 1,
        fee_amount: 0,
        tax_amount: 0,
        status: "published",
        metadata: { pair: `${currency}/USD`, rate: Number((1 + random() * 0.07).toFixed(6)) },
      });
    }

    const cls = classify(bank);
    perTransaction[txnId] = cls;
    if (i < categories.length) {
      scenarios.push({
        scenario_id: `scenario_${scenario.toLowerCase()}`,
        category: scenario,
        description: `Validates ${scenario.toLowerCase()} behavior across processor/bank/ledger variance paths.`,
        expected_match_classes: [cls],
        expected_exception_categories: cls === "exact_match" ? [] : [cls],
      });
    }
  }

  const summary: Record<MatchClass, number> = {
    exact_match: 0,
    fuzzy_match: 0,
    grouped_match: 0,
    unmatched_source_only: 0,
    unmatched_target_only: 0,
    duplicate_detected: 0,
    timing_variance: 0,
    fx_variance: 0,
    fee_variance: 0,
    status_conflict: 0,
    manual_review: 0,
  };

  const matrix: ReconciliationExpectationMatrix = {
    exact_matches: [],
    fuzzy_matches: [],
    grouped_matches: [],
    unmatched_source: [],
    unmatched_target: [],
    duplicates_detected: [],
    variance_records: [],
    manual_review_records: [],
  };

  for (const [txn, cls] of Object.entries(perTransaction)) {
    summary[cls] += 1;
    if (cls === "exact_match") matrix.exact_matches.push(txn);
    if (cls === "fuzzy_match") matrix.fuzzy_matches.push(txn);
    if (cls === "grouped_match") matrix.grouped_matches.push(txn);
    if (cls === "unmatched_source_only") matrix.unmatched_source.push(txn);
    if (cls === "unmatched_target_only") matrix.unmatched_target.push(txn);
    if (cls === "duplicate_detected") matrix.duplicates_detected.push(txn);
    if (["timing_variance", "fx_variance", "fee_variance", "status_conflict"].includes(cls))
      matrix.variance_records.push(txn);
    if (cls === "manual_review") matrix.manual_review_records.push(txn);
  }

  return {
    manifest: {
      seed: config.seed,
      profile,
      complexity: profile === "smoke" ? "low" : profile === "integration" ? "medium" : "high",
      generated_at: new Date().toISOString(),
      workspace_id: workspace,
      scenario_mix: categories,
    },
    sources,
    scenarios,
    golden: {
      expected_summary: summary,
      per_transaction: perTransaction,
      expected_results: matrix,
    },
  };
}

export function exportReconciliationSuite(
  suite: GeneratedSuite,
  outputRoot: string
): { path: string; hash: string } {
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, "manifest.json"), JSON.stringify(suite.manifest, null, 2));
  fs.writeFileSync(
    path.join(outputRoot, "scenarios.json"),
    JSON.stringify(suite.scenarios, null, 2)
  );
  fs.writeFileSync(path.join(outputRoot, "golden.json"), JSON.stringify(suite.golden, null, 2));
  fs.writeFileSync(
    path.join(outputRoot, "expected_results.json"),
    JSON.stringify(suite.golden.expected_results, null, 2)
  );

  for (const [system, rows] of Object.entries(suite.sources)) {
    const jsonName = `${system.toLowerCase()}.json`;
    const csvName = `${system.toLowerCase()}.csv`;
    fs.writeFileSync(path.join(outputRoot, jsonName), JSON.stringify(rows, null, 2));
    const headers = Object.keys(rows[0] ?? { source_record_id: "" });
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => JSON.stringify((row as unknown as Record<string, unknown>)[h] ?? ""))
          .join(",")
      ),
    ].join("\n");
    fs.writeFileSync(path.join(outputRoot, csvName), `${csv}\n`);
  }

  const malformedRow =
    'source_record_id,transaction_id,currency,gross_amount\n"BROKEN","txn_missing_quote,USD,123.00\n';
  fs.writeFileSync(path.join(outputRoot, "malformed_processor_row.csv"), malformedRow);

  const hash = stableHash({ manifest: suite.manifest, golden: suite.golden });
  fs.writeFileSync(path.join(outputRoot, "integrity.sha256"), `${hash}\n`);
  return { path: outputRoot, hash };
}

export function validateSuiteDeterminism(
  seed: number,
  profile: "smoke" | "integration" | "load" | "chaos" = "smoke"
): boolean {
  const one = generateReconciliationSuite({ seed, profile });
  const two = generateReconciliationSuite({ seed, profile });
  return (
    stableHash(one.golden) === stableHash(two.golden) &&
    stableHash(one.sources) === stableHash(two.sources)
  );
}

export function runSyntheticEngineValidation(suite: GeneratedSuite): {
  processed_records: number;
  matched: number;
  unmatched: number;
  duplicates: number;
  variances: number;
} {
  const source = suite.sources.PAYMENT_PROCESSOR;
  const targetByTxn = new Map(suite.sources.BANK_STATEMENT.map((r) => [r.transaction_id, r]));
  let matched = 0;
  let unmatched = 0;

  for (const row of source) {
    const target = targetByTxn.get(row.transaction_id);
    if (!target) {
      unmatched += 1;
      continue;
    }
    const sameCurrency = row.currency === target.currency;
    const grossDiff = Math.abs(row.gross_amount - target.gross_amount);
    if (sameCurrency && grossDiff <= 0.02) matched += 1;
    else unmatched += 1;
  }

  return {
    processed_records: source.length + suite.sources.BANK_STATEMENT.length,
    matched,
    unmatched,
    duplicates: suite.golden.expected_results.duplicates_detected.length,
    variances: suite.golden.expected_results.variance_records.length,
  };
}
