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

export type ReconciliationClassification =
  | "EXACT_MATCH"
  | "FUZZY_MATCH"
  | "GROUPED_MATCH"
  | "UNMATCHED_SOURCE_ONLY"
  | "UNMATCHED_TARGET_ONLY"
  | "DUPLICATE_DETECTED"
  | "TIMING_VARIANCE"
  | "FEE_VARIANCE"
  | "FX_VARIANCE"
  | "STATUS_CONFLICT"
  | "DISPUTE_RELATED"
  | "REVERSAL_RELATED"
  | "MANUAL_REVIEW";

export type MatchClass = Lowercase<ReconciliationClassification>;

export type DisputePhase = "OPENED" | "UNDER_REVIEW" | "WON" | "LOST";
export type ReversalPhase = "REQUESTED" | "POSTED" | "SETTLED";

export type ManualReviewRationaleCode =
  | "AMBIGUOUS_REFERENCE"
  | "MULTIPLE_PLAUSIBLE_MATCHES"
  | "AMOUNT_CLOSE_DATE_CLOSE"
  | "MISSING_EXTERNAL_REFERENCE"
  | "PARTIAL_GROUP_MATCH"
  | "STATUS_MISMATCH_REQUIRES_REVIEW"
  | "FX_VARIANCE_REQUIRES_REVIEW"
  | "DUPLICATE_SUSPECTED"
  | "DISPUTE_CHAIN_INCOMPLETE"
  | "INSUFFICIENT_EVIDENCE";

export interface RuntimeReconMatch {
  transaction_id: string;
  source_record_id: string;
  target_record_id: string | null;
  classification: ReconciliationClassification;
  legacy_match_class: MatchClass;
  confidence: number;
  amount_difference_minor: number;
  date_difference_days: number;
  group_id?: string;
  group_member_transaction_ids?: string[];
  source_member_record_ids?: string[];
  target_member_record_ids?: string[];
  grouped_total?: number;
  manual_review_rationale_codes: ManualReviewRationaleCode[];
  is_dispute_related: boolean;
  is_reversal_related: boolean;
  dispute_phase?: DisputePhase;
  reversal_phase?: ReversalPhase;
  linked_dispute_id?: string;
  linked_refund_id?: string;
}

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
  expected_classifications: ReconciliationClassification[];
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
  expected_summary: Record<ReconciliationClassification, number>;
  per_transaction: Record<string, ReconciliationClassification>;
  runtime_matches: RuntimeReconMatch[];
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

const CLASS_TO_LEGACY: Record<ReconciliationClassification, MatchClass> = {
  EXACT_MATCH: "exact_match",
  FUZZY_MATCH: "fuzzy_match",
  GROUPED_MATCH: "grouped_match",
  UNMATCHED_SOURCE_ONLY: "unmatched_source_only",
  UNMATCHED_TARGET_ONLY: "unmatched_target_only",
  DUPLICATE_DETECTED: "duplicate_detected",
  TIMING_VARIANCE: "timing_variance",
  FEE_VARIANCE: "fee_variance",
  FX_VARIANCE: "fx_variance",
  STATUS_CONFLICT: "status_conflict",
  DISPUTE_RELATED: "manual_review",
  REVERSAL_RELATED: "manual_review",
  MANUAL_REVIEW: "manual_review",
};

function classify(record: SyntheticRecord): ReconciliationClassification {
  if (record.metadata?.orphan_target === true) return "UNMATCHED_TARGET_ONLY";
  if (record.metadata?.orphan_source === true) return "UNMATCHED_SOURCE_ONLY";
  if (record.dispute_id) return "DISPUTE_RELATED";
  if (record.refund_id && record.status.includes("refund")) return "REVERSAL_RELATED";
  if (record.metadata?.is_duplicate === true) return "DUPLICATE_DETECTED";
  if (record.metadata?.status_conflict === true) return "STATUS_CONFLICT";
  if (record.metadata?.timing_offset_days) return "TIMING_VARIANCE";
  if (record.metadata?.fx_variance_bps) return "FX_VARIANCE";
  if (record.metadata?.fee_variance_minor) return "FEE_VARIANCE";
  if (record.metadata?.group_size && Number(record.metadata.group_size) > 1) return "GROUPED_MATCH";
  if (record.metadata?.fuzzy_hint) return "FUZZY_MATCH";
  if (record.metadata?.needs_manual_review === true) return "MANUAL_REVIEW";
  return "EXACT_MATCH";
}

function rationaleCodesFor(
  classification: ReconciliationClassification,
  source: SyntheticRecord,
  target: SyntheticRecord | undefined,
  groupMembers: SyntheticRecord[]
): ManualReviewRationaleCode[] {
  const codes = new Set<ManualReviewRationaleCode>();
  if (!source.external_reference_id) codes.add("MISSING_EXTERNAL_REFERENCE");
  if (classification === "FUZZY_MATCH") codes.add("AMBIGUOUS_REFERENCE");
  if (classification === "STATUS_CONFLICT") codes.add("STATUS_MISMATCH_REQUIRES_REVIEW");
  if (classification === "FX_VARIANCE") codes.add("FX_VARIANCE_REQUIRES_REVIEW");
  if (classification === "DUPLICATE_DETECTED") codes.add("DUPLICATE_SUSPECTED");
  if (classification === "GROUPED_MATCH" && groupMembers.length > 1)
    codes.add("PARTIAL_GROUP_MATCH");
  if (["TIMING_VARIANCE", "FEE_VARIANCE"].includes(classification))
    codes.add("AMOUNT_CLOSE_DATE_CLOSE");
  if (classification === "DISPUTE_RELATED") {
    if (!source.dispute_id || source.status.includes("under_review")) {
      codes.add("DISPUTE_CHAIN_INCOMPLETE");
    }
    if (source.status.includes("lost")) {
      codes.add("INSUFFICIENT_EVIDENCE");
    }
  }
  if (!target && classification !== "UNMATCHED_TARGET_ONLY") codes.add("INSUFFICIENT_EVIDENCE");
  if (classification === "MANUAL_REVIEW") codes.add("MULTIPLE_PLAUSIBLE_MATCHES");
  return [...codes].sort();
}

function inferDisputePhase(status: string | undefined): DisputePhase | undefined {
  if (!status) return undefined;
  if (status.includes("open")) return "OPENED";
  if (status.includes("under_review")) return "UNDER_REVIEW";
  if (status.includes("won")) return "WON";
  if (status.includes("lost")) return "LOST";
  return undefined;
}

function inferReversalPhase(status: string | undefined): ReversalPhase | undefined {
  if (!status) return undefined;
  if (status.includes("requested")) return "REQUESTED";
  if (status.includes("posted")) return "POSTED";
  if (status.includes("settled")) return "SETTLED";
  return undefined;
}

function buildRuntimeMatches(
  suiteSources: Record<SourceSystem, SyntheticRecord[]>
): RuntimeReconMatch[] {
  const source = suiteSources.PAYMENT_PROCESSOR;
  const targetByTxn = new Map(suiteSources.BANK_STATEMENT.map((r) => [r.transaction_id, r]));
  const groupMembersByKey = new Map<string, SyntheticRecord[]>();
  for (const row of source) {
    const key = String(row.metadata?.group_key ?? "");
    if (!key) continue;
    const bucket = groupMembersByKey.get(key) ?? [];
    bucket.push(row);
    groupMembersByKey.set(key, bucket);
  }

  return source.map((row) => {
    const target = targetByTxn.get(row.transaction_id);
    const groupKey = String(row.metadata?.group_key ?? "");
    const groupMembers = groupKey ? (groupMembersByKey.get(groupKey) ?? []) : [];
    const classification = classify(row);
    const amountDiff = target
      ? Number(((row.gross_amount - target.gross_amount) * 100).toFixed(0))
      : 0;
    const dateDiff = target
      ? Math.round(
          Math.abs(new Date(row.occurred_at).getTime() - new Date(target.occurred_at).getTime()) /
            86_400_000
        )
      : 0;

    const groupId = groupMembers.length
      ? `grp_${stableHash({ workspace: row.workspace_id, groupKey }).slice(0, 12)}`
      : undefined;

    return {
      transaction_id: row.transaction_id,
      source_record_id: row.source_record_id,
      target_record_id: target?.source_record_id ?? null,
      classification,
      legacy_match_class: CLASS_TO_LEGACY[classification],
      confidence: target ? (classification === "EXACT_MATCH" ? 1 : 0.82) : 0,
      amount_difference_minor: amountDiff,
      date_difference_days: dateDiff,
      group_id: groupId,
      group_member_transaction_ids: groupMembers.map((member) => member.transaction_id).sort(),
      source_member_record_ids: groupMembers.map((member) => member.source_record_id).sort(),
      target_member_record_ids: groupMembers
        .map((member) => targetByTxn.get(member.transaction_id)?.source_record_id)
        .filter((v): v is string => Boolean(v))
        .sort(),
      grouped_total: groupMembers.length
        ? Number(groupMembers.reduce((sum, member) => sum + member.gross_amount, 0).toFixed(2))
        : undefined,
      manual_review_rationale_codes: rationaleCodesFor(classification, row, target, groupMembers),
      is_dispute_related: Boolean(row.dispute_id),
      is_reversal_related: Boolean(row.refund_id),
      dispute_phase: inferDisputePhase(row.status),
      reversal_phase: inferReversalPhase(row.status),
      linked_dispute_id: row.dispute_id,
      linked_refund_id: row.refund_id,
    };
  });
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
  const perTransaction: Record<string, ReconciliationClassification> = {};

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
    if (scenario === "SPLIT_MERGED_MATCHING") {
      metadata.group_size = 2 + (i % 4);
      metadata.group_key = `split_${Math.floor(i / 44)}`;
    }
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
      refund_id: scenario === "REFUNDS_REVERSALS" ? `refund_${txnId}` : undefined,
      dispute_id: scenario === "DISPUTES_CHARGEBACKS" ? `disp_${txnId}` : undefined,
      status:
        scenario === "STATUS_MISMATCHES"
          ? "succeeded"
          : scenario === "REFUNDS_REVERSALS"
            ? i % 3 === 0
              ? "refund_requested"
              : i % 3 === 1
                ? "refund_posted"
                : "refund_settled"
            : scenario === "DISPUTES_CHARGEBACKS"
              ? i % 4 === 0
                ? "dispute_opened"
                : i % 4 === 1
                  ? "dispute_under_review"
                  : i % 4 === 2
                    ? "dispute_won"
                    : "dispute_lost"
              : "captured",
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
      status:
        scenario === "STATUS_MISMATCHES"
          ? "pending"
          : scenario === "REFUNDS_REVERSALS"
            ? processor.status
            : scenario === "DISPUTES_CHARGEBACKS"
              ? processor.status
              : "posted",
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
        expected_classifications: [cls],
        expected_exception_categories: cls === "EXACT_MATCH" ? [] : [cls],
      });
    }
  }

  const summary: Record<ReconciliationClassification, number> = {
    EXACT_MATCH: 0,
    FUZZY_MATCH: 0,
    GROUPED_MATCH: 0,
    UNMATCHED_SOURCE_ONLY: 0,
    UNMATCHED_TARGET_ONLY: 0,
    DUPLICATE_DETECTED: 0,
    TIMING_VARIANCE: 0,
    FEE_VARIANCE: 0,
    FX_VARIANCE: 0,
    STATUS_CONFLICT: 0,
    DISPUTE_RELATED: 0,
    REVERSAL_RELATED: 0,
    MANUAL_REVIEW: 0,
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
    if (cls === "EXACT_MATCH") matrix.exact_matches.push(txn);
    if (cls === "FUZZY_MATCH") matrix.fuzzy_matches.push(txn);
    if (cls === "GROUPED_MATCH") matrix.grouped_matches.push(txn);
    if (cls === "UNMATCHED_SOURCE_ONLY") matrix.unmatched_source.push(txn);
    if (cls === "UNMATCHED_TARGET_ONLY") matrix.unmatched_target.push(txn);
    if (cls === "DUPLICATE_DETECTED") matrix.duplicates_detected.push(txn);
    if (["TIMING_VARIANCE", "FX_VARIANCE", "FEE_VARIANCE", "STATUS_CONFLICT"].includes(cls))
      matrix.variance_records.push(txn);
    if (cls === "MANUAL_REVIEW") matrix.manual_review_records.push(txn);
  }

  const runtimeMatches = buildRuntimeMatches(sources);

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
      runtime_matches: runtimeMatches,
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
  classification_summary: Record<ReconciliationClassification, number>;
} {
  const runtimeMatches = suite.golden.runtime_matches;
  const matched = runtimeMatches.filter((m) => !m.classification.startsWith("UNMATCHED")).length;
  const unmatched = runtimeMatches.length - matched;
  const classificationSummary = runtimeMatches.reduce<Record<ReconciliationClassification, number>>(
    (acc, match) => {
      acc[match.classification] += 1;
      return acc;
    },
    {
      EXACT_MATCH: 0,
      FUZZY_MATCH: 0,
      GROUPED_MATCH: 0,
      UNMATCHED_SOURCE_ONLY: 0,
      UNMATCHED_TARGET_ONLY: 0,
      DUPLICATE_DETECTED: 0,
      TIMING_VARIANCE: 0,
      FEE_VARIANCE: 0,
      FX_VARIANCE: 0,
      STATUS_CONFLICT: 0,
      DISPUTE_RELATED: 0,
      REVERSAL_RELATED: 0,
      MANUAL_REVIEW: 0,
    }
  );

  return {
    processed_records: suite.sources.PAYMENT_PROCESSOR.length + suite.sources.BANK_STATEMENT.length,
    matched,
    unmatched,
    duplicates: suite.golden.expected_results.duplicates_detected.length,
    variances: suite.golden.expected_results.variance_records.length,
    classification_summary: classificationSummary,
  };
}

export interface ReconciliationContractDiff {
  transaction_id: string;
  expected_classification?: ReconciliationClassification;
  actual_classification?: ReconciliationClassification;
  expected_group_members?: string[];
  actual_group_members?: string[];
  expected_dispute_related?: boolean;
  actual_dispute_related?: boolean;
  expected_reversal_related?: boolean;
  actual_reversal_related?: boolean;
  expected_rationale_codes?: ManualReviewRationaleCode[];
  actual_rationale_codes?: ManualReviewRationaleCode[];
}

export function verifyReconciliationContract(suite: GeneratedSuite): {
  ok: boolean;
  diffs: ReconciliationContractDiff[];
  summaryDiffs: Array<{
    classification: ReconciliationClassification;
    expected: number;
    actual: number;
  }>;
} {
  const actual = buildRuntimeMatches(suite.sources);
  const expectedByTxn = new Map(suite.golden.runtime_matches.map((m) => [m.transaction_id, m]));
  const diffs: ReconciliationContractDiff[] = [];

  for (const match of actual) {
    const expected = expectedByTxn.get(match.transaction_id);
    if (!expected) {
      diffs.push({
        transaction_id: match.transaction_id,
        actual_classification: match.classification,
      });
      continue;
    }

    const expectedMembers = [...(expected.group_member_transaction_ids ?? [])].sort();
    const actualMembers = [...(match.group_member_transaction_ids ?? [])].sort();
    const expectedCodes = [...(expected.manual_review_rationale_codes ?? [])].sort();
    const actualCodes = [...(match.manual_review_rationale_codes ?? [])].sort();

    if (
      expected.classification !== match.classification ||
      JSON.stringify(expectedMembers) != JSON.stringify(actualMembers) ||
      expected.is_dispute_related !== match.is_dispute_related ||
      expected.is_reversal_related !== match.is_reversal_related ||
      JSON.stringify(expectedCodes) != JSON.stringify(actualCodes)
    ) {
      diffs.push({
        transaction_id: match.transaction_id,
        expected_classification: expected.classification,
        actual_classification: match.classification,
        expected_group_members: expectedMembers,
        actual_group_members: actualMembers,
        expected_dispute_related: expected.is_dispute_related,
        actual_dispute_related: match.is_dispute_related,
        expected_reversal_related: expected.is_reversal_related,
        actual_reversal_related: match.is_reversal_related,
        expected_rationale_codes: expectedCodes,
        actual_rationale_codes: actualCodes,
      });
    }
  }

  const actualSummary = actual.reduce<Record<ReconciliationClassification, number>>(
    (acc, item) => {
      acc[item.classification] += 1;
      return acc;
    },
    {
      EXACT_MATCH: 0,
      FUZZY_MATCH: 0,
      GROUPED_MATCH: 0,
      UNMATCHED_SOURCE_ONLY: 0,
      UNMATCHED_TARGET_ONLY: 0,
      DUPLICATE_DETECTED: 0,
      TIMING_VARIANCE: 0,
      FEE_VARIANCE: 0,
      FX_VARIANCE: 0,
      STATUS_CONFLICT: 0,
      DISPUTE_RELATED: 0,
      REVERSAL_RELATED: 0,
      MANUAL_REVIEW: 0,
    }
  );

  const summaryDiffs = (
    Object.keys(suite.golden.expected_summary) as ReconciliationClassification[]
  )
    .filter(
      (classification) =>
        suite.golden.expected_summary[classification] !== actualSummary[classification]
    )
    .map((classification) => ({
      classification,
      expected: suite.golden.expected_summary[classification],
      actual: actualSummary[classification],
    }));

  return { ok: diffs.length === 0 && summaryDiffs.length === 0, diffs, summaryDiffs };
}
