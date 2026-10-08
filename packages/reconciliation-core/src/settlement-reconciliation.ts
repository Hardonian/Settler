import { createHash } from "node:crypto";

export const SETTLEMENT_ENGINE_VERSION = "settlement-reconciliation/1.0.0";
export const NORMALIZATION_VERSION = "financial-record/1.0.0";
export const PROOFPACK_SCHEMA_VERSION = "settler.demo-proofpack/1.0.0";

export const CURRENCY_EXPONENTS: Readonly<Record<string, number>> = Object.freeze({
  BHD: 3,
  CAD: 2,
  CHF: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  KWD: 3,
  USD: 2,
});

export type SettlementRecordKind = "payout" | "fee" | "refund" | "dispute" | "adjustment";

export interface SettlementRecordInput {
  id: string;
  tenantId: string;
  accountId: string;
  amount: string;
  currency: string;
  date: string;
  reference: string;
  description?: string;
  kind: SettlementRecordKind;
  provenance: {
    source: "processor_csv" | "bank_csv";
    sourceRecordId: string;
  };
}

export interface NormalizedSettlementRecord extends Omit<SettlementRecordInput, "amount"> {
  amountMinor: string;
  currencyExponent: number;
  normalizedReference: string;
}

export interface SettlementRuleSet {
  version: string;
  amountToleranceMinor: string;
  dateWindowDays: number;
  requireReference: true;
}

export type SettlementDecision =
  "exact" | "tolerance" | "ambiguous" | "unmatched_source" | "unmatched_target";

export interface SettlementMatchResult {
  decision: SettlementDecision;
  sourceRecordId: string | null;
  targetRecordId: string | null;
  candidateTargetIds: string[];
  amountDeltaMinor: string | null;
  dateDeltaDays: number | null;
  reason: string;
}

export interface CanonicalSettlementRun {
  schemaVersion: "settlement-run/1.0.0";
  engineVersion: string;
  normalizationVersion: string;
  ruleVersion: string;
  tenantId: string;
  accountId: string;
  sourceRecords: NormalizedSettlementRecord[];
  targetRecords: NormalizedSettlementRecord[];
  rules: SettlementRuleSet;
  results: SettlementMatchResult[];
  summary: Record<SettlementDecision, number>;
}

export interface DemoProofpackPayload {
  schemaVersion: typeof PROOFPACK_SCHEMA_VERSION;
  runId: string;
  inputHashes: Record<string, string>;
  run: CanonicalSettlementRun;
}

export interface DemoProofpack {
  payload: DemoProofpackPayload;
  integrity: {
    algorithm: "sha256";
    commitment: string;
  };
  operationalMetadata: {
    generatedAt: string;
  };
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function currencyExponent(currency: string): number {
  const exponent = CURRENCY_EXPONENTS[currency];
  invariant(exponent !== undefined, `Unsupported currency: ${currency}`);
  return exponent;
}

export function parseDecimalToMinorUnits(amount: string, currency: string): bigint {
  const normalizedCurrency = currency.trim().toUpperCase();
  const exponent = currencyExponent(normalizedCurrency);
  const match = amount.trim().match(/^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/);
  invariant(match, `Invalid decimal amount: ${amount}`);
  const fraction = match[3] ?? "";
  invariant(
    fraction.length <= exponent,
    `Amount ${amount} exceeds ${normalizedCurrency} precision (${exponent} decimal places)`
  );
  const scale = 10n ** BigInt(exponent);
  const whole = BigInt(match[2] ?? "0");
  const fractional = BigInt((fraction + "0".repeat(exponent)).slice(0, exponent) || "0");
  const value = whole * scale + fractional;
  return match[1] === "-" ? -value : value;
}

export function getCurrencyExponent(currency: string = "USD"): number {
  const normalized = currency.trim().toUpperCase();
  return CURRENCY_EXPONENTS[normalized] ?? 2;
}

export function toMinorUnits(amount: number | string, currency: string = "USD"): bigint {
  const norm = currency.trim().toUpperCase();
  if (typeof amount === "string") {
    return parseDecimalToMinorUnits(amount, norm);
  }
  const exp = getCurrencyExponent(norm);
  const factor = 10 ** exp;
  const rounded = Math.round(amount * factor);
  return BigInt(rounded);
}

export function amountsMatchWithinTolerance(
  amount1: number | string,
  amount2: number | string,
  tolerance: number | string = 0,
  currency: string = "USD"
): boolean {
  const m1 = toMinorUnits(amount1, currency);
  const m2 = toMinorUnits(amount2, currency);
  const tol = toMinorUnits(tolerance, currency);
  const diff = m1 >= m2 ? m1 - m2 : m2 - m1;
  const absTol = tol >= 0n ? tol : -tol;
  return diff <= absTol;
}

function parseIsoDate(value: string): number {
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(value), `Date must use YYYY-MM-DD: ${value}`);
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  invariant(Number.isFinite(timestamp), `Invalid date: ${value}`);
  invariant(new Date(timestamp).toISOString().slice(0, 10) === value, `Invalid date: ${value}`);
  return timestamp;
}

function normalizeReference(value: string): string {
  return value.trim().toLocaleUpperCase("en-US").replace(/\s+/g, " ");
}

export function normalizeSettlementRecord(
  input: SettlementRecordInput
): NormalizedSettlementRecord {
  const currency = input.currency.trim().toUpperCase();
  invariant(input.id.trim(), "Record id is required");
  invariant(input.tenantId.trim(), "tenantId is required");
  invariant(input.accountId.trim(), "accountId is required");
  invariant(input.provenance.sourceRecordId.trim(), "sourceRecordId is required");
  parseIsoDate(input.date);
  const normalizedReference = normalizeReference(input.reference);
  invariant(normalizedReference, "Reference is required by this rule version");
  const amountMinor = parseDecimalToMinorUnits(input.amount, currency).toString();
  return {
    ...input,
    id: input.id.trim(),
    currency,
    reference: input.reference.trim(),
    description: input.description?.trim(),
    amountMinor,
    currencyExponent: currencyExponent(currency),
    normalizedReference,
  };
}

type Candidate = {
  target: NormalizedSettlementRecord;
  amountDelta: bigint;
  dateDeltaDays: number;
};

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function compareCandidate(a: Candidate, b: Candidate): number {
  if (a.amountDelta !== b.amountDelta) return a.amountDelta < b.amountDelta ? -1 : 1;
  if (a.dateDeltaDays !== b.dateDeltaDays) return a.dateDeltaDays - b.dateDeltaDays;
  return a.target.id.localeCompare(b.target.id);
}

function sameRank(a: Candidate, b: Candidate): boolean {
  return a.amountDelta === b.amountDelta && a.dateDeltaDays === b.dateDeltaDays;
}

function candidateFor(
  source: NormalizedSettlementRecord,
  target: NormalizedSettlementRecord,
  rules: SettlementRuleSet
): Candidate | null {
  if (
    source.tenantId !== target.tenantId ||
    source.accountId !== target.accountId ||
    source.currency !== target.currency ||
    source.normalizedReference !== target.normalizedReference
  ) {
    return null;
  }
  const dateDeltaDays =
    Math.abs(parseIsoDate(source.date) - parseIsoDate(target.date)) / (24 * 60 * 60 * 1000);
  if (dateDeltaDays > rules.dateWindowDays) return null;
  const amountDelta = absolute(BigInt(source.amountMinor) - BigInt(target.amountMinor));
  if (amountDelta > BigInt(rules.amountToleranceMinor)) return null;
  return { target, amountDelta, dateDeltaDays };
}

export function reconcileSettlementRecords(input: {
  sourceRecords: SettlementRecordInput[];
  targetRecords: SettlementRecordInput[];
  rules: SettlementRuleSet;
}): CanonicalSettlementRun {
  invariant(input.sourceRecords.length > 0, "At least one source record is required");
  invariant(input.targetRecords.length > 0, "At least one target record is required");
  invariant(/^\d+$/.test(input.rules.amountToleranceMinor), "Tolerance must be minor units");
  invariant(
    Number.isInteger(input.rules.dateWindowDays) && input.rules.dateWindowDays >= 0,
    "Invalid date window"
  );

  const sourceRecords = input.sourceRecords
    .map(normalizeSettlementRecord)
    .sort((a, b) => a.id.localeCompare(b.id));
  const targetRecords = input.targetRecords
    .map(normalizeSettlementRecord)
    .sort((a, b) => a.id.localeCompare(b.id));
  const scope = sourceRecords[0];
  invariant(scope, "Missing source scope");
  for (const record of [...sourceRecords, ...targetRecords]) {
    invariant(record.tenantId === scope.tenantId, "Tenant mismatch");
    invariant(record.accountId === scope.accountId, "Account mismatch");
  }

  const eligibleBySource = new Map<string, Candidate[]>();
  for (const source of sourceRecords) {
    const candidates = targetRecords
      .map((target) => candidateFor(source, target, input.rules))
      .filter((candidate): candidate is Candidate => candidate !== null)
      .sort(compareCandidate);
    eligibleBySource.set(source.id, candidates);
  }

  const contestedTargets = new Map<string, string[]>();
  for (const source of sourceRecords) {
    const candidates = eligibleBySource.get(source.id) ?? [];
    const best = candidates[0];
    if (!best || (candidates[1] && sameRank(best, candidates[1]))) continue;
    const claimants = contestedTargets.get(best.target.id) ?? [];
    claimants.push(source.id);
    contestedTargets.set(best.target.id, claimants);
  }

  const usedTargets = new Set<string>();
  const results: SettlementMatchResult[] = [];
  for (const source of sourceRecords) {
    const candidates = eligibleBySource.get(source.id) ?? [];
    const best = candidates[0];
    const tied = best ? candidates.filter((candidate) => sameRank(candidate, best)) : [];
    const sourceClaimants = best ? (contestedTargets.get(best.target.id) ?? []) : [];
    if (best && (tied.length > 1 || sourceClaimants.length > 1)) {
      results.push({
        decision: "ambiguous",
        sourceRecordId: source.id,
        targetRecordId: null,
        candidateTargetIds:
          tied.length > 1 ? tied.map((candidate) => candidate.target.id) : [best.target.id],
        amountDeltaMinor: best.amountDelta.toString(),
        dateDeltaDays: best.dateDeltaDays,
        reason:
          tied.length > 1
            ? "Multiple target records have the same best rule rank; operator review is required."
            : "Multiple source records claim the same best target; operator review is required.",
      });
      continue;
    }
    if (best && !usedTargets.has(best.target.id)) {
      usedTargets.add(best.target.id);
      results.push({
        decision: best.amountDelta === 0n ? "exact" : "tolerance",
        sourceRecordId: source.id,
        targetRecordId: best.target.id,
        candidateTargetIds: [best.target.id],
        amountDeltaMinor: best.amountDelta.toString(),
        dateDeltaDays: best.dateDeltaDays,
        reason:
          best.amountDelta === 0n
            ? "Reference, currency, account, and amount match within the configured date window."
            : `Reference, currency, and account match; amount delta ${best.amountDelta.toString()} minor unit(s) is allowed by rule ${input.rules.version}.`,
      });
      continue;
    }

    const sameReference = targetRecords.filter(
      (target) =>
        target.currency === source.currency &&
        target.normalizedReference === source.normalizedReference
    );
    results.push({
      decision: "unmatched_source",
      sourceRecordId: source.id,
      targetRecordId: null,
      candidateTargetIds: [],
      amountDeltaMinor: null,
      dateDeltaDays: null,
      reason:
        sameReference.length > 0
          ? "Reference and currency exist on the bank side, but amount or date is outside the configured rule boundary."
          : "No bank record shares the required reference and currency.",
    });
  }

  for (const target of targetRecords) {
    const isCandidate = results.some((result) => result.candidateTargetIds.includes(target.id));
    if (!usedTargets.has(target.id) && !isCandidate) {
      results.push({
        decision: "unmatched_target",
        sourceRecordId: null,
        targetRecordId: target.id,
        candidateTargetIds: [],
        amountDeltaMinor: null,
        dateDeltaDays: null,
        reason:
          "No processor settlement record satisfies the configured reference, currency, amount, and date rules.",
      });
    }
  }

  results.sort((a, b) =>
    `${a.sourceRecordId ?? "~"}:${a.targetRecordId ?? "~"}:${a.decision}`.localeCompare(
      `${b.sourceRecordId ?? "~"}:${b.targetRecordId ?? "~"}:${b.decision}`
    )
  );
  const summary: Record<SettlementDecision, number> = {
    exact: 0,
    tolerance: 0,
    ambiguous: 0,
    unmatched_source: 0,
    unmatched_target: 0,
  };
  for (const result of results) summary[result.decision] += 1;

  return {
    schemaVersion: "settlement-run/1.0.0",
    engineVersion: SETTLEMENT_ENGINE_VERSION,
    normalizationVersion: NORMALIZATION_VERSION,
    ruleVersion: input.rules.version,
    tenantId: scope.tenantId,
    accountId: scope.accountId,
    sourceRecords,
    targetRecords,
    rules: { ...input.rules },
    results,
    summary,
  };
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createDemoProofpack(
  run: CanonicalSettlementRun,
  inputHashes: Record<string, string>,
  generatedAt = new Date().toISOString()
): DemoProofpack {
  const semanticIdentity = sha256(canonicalJson({ inputHashes, run }));
  const payload: DemoProofpackPayload = {
    schemaVersion: PROOFPACK_SCHEMA_VERSION,
    runId: `run_${semanticIdentity.slice(0, 24)}`,
    inputHashes: Object.fromEntries(
      Object.entries(inputHashes).sort(([a], [b]) => a.localeCompare(b))
    ),
    run,
  };
  return {
    payload,
    integrity: { algorithm: "sha256", commitment: sha256(canonicalJson(payload)) },
    operationalMetadata: { generatedAt },
  };
}

export function verifyDemoProofpack(proofpack: DemoProofpack): {
  valid: boolean;
  replayed: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (proofpack.payload.schemaVersion !== PROOFPACK_SCHEMA_VERSION) {
    errors.push(`Unsupported proofpack schema: ${String(proofpack.payload.schemaVersion)}`);
  }
  if (proofpack.integrity.algorithm !== "sha256") errors.push("Unsupported integrity algorithm");
  const expectedCommitment = sha256(canonicalJson(proofpack.payload));
  if (expectedCommitment !== proofpack.integrity.commitment) errors.push("Commitment mismatch");
  const run = proofpack.payload.run;
  if (run.engineVersion !== SETTLEMENT_ENGINE_VERSION) {
    errors.push(`Engine version unavailable: ${run.engineVersion}`);
  }
  if (run.normalizationVersion !== NORMALIZATION_VERSION) {
    errors.push(`Normalization version unavailable: ${run.normalizationVersion}`);
  }
  let replayed = false;
  if (errors.length === 0) {
    const toInput = (record: NormalizedSettlementRecord): SettlementRecordInput => ({
      id: record.id,
      tenantId: record.tenantId,
      accountId: record.accountId,
      amount: formatMinorUnits(record.amountMinor, record.currencyExponent),
      currency: record.currency,
      date: record.date,
      reference: record.reference,
      description: record.description,
      kind: record.kind,
      provenance: record.provenance,
    });
    const replay = reconcileSettlementRecords({
      sourceRecords: run.sourceRecords.map(toInput),
      targetRecords: run.targetRecords.map(toInput),
      rules: run.rules,
    });
    replayed = canonicalJson(replay) === canonicalJson(run);
    if (!replayed) errors.push("Replay result mismatch");
  }
  return { valid: errors.length === 0, replayed, errors };
}

export function formatMinorUnits(value: string, exponent: number): string {
  const amount = BigInt(value);
  const negative = amount < 0n;
  const absoluteAmount = absolute(amount)
    .toString()
    .padStart(exponent + 1, "0");
  const whole = exponent === 0 ? absoluteAmount : absoluteAmount.slice(0, -exponent);
  const fraction = exponent === 0 ? "" : `.${absoluteAmount.slice(-exponent)}`;
  return `${negative ? "-" : ""}${whole}${fraction}`;
}
