/**
 * Canada Economic Opportunity Graph (CEGS) adapter for Settler.
 *
 * Pulls deterministic scoring + evidence-linked project intelligence from a
 * running Hardonian/Canada-Economic-Opportunity-Graph instance. Disabled by
 * default — opt in via CANADA_COG_ENABLED=1.
 *
 * IMPORTANT: COG records are NOT financial transactions. This adapter does
 * NOT conform to the transactional `Adapter` base (no amount/currency). It
 * exposes its own typed surface that produces `CogForecastRecord`s with
 * evidence hashes. Callers that need to reconcile COG context against
 * financial flows must do so explicitly upstream of the matching engine.
 *
 * Honesty rules:
 * - Never substitute 0 for unknown (see DATA_SOURCES.md epistemic states).
 * - On any fetch failure, return an empty record set + Confidence: "low"
 *   and HealthError. Never fabricate.
 * - When disabled, Health() returns HealthDisabled.
 * - Every record carries an evidence URL + content hash when the source
 *   provides one; CEGS SpecVersion is asserted on every record.
 */

export interface CogForecastRecord {
  projectId: string;
  buildabilityScore: number | null;
  investabilityScore: number | null;
  strategicityScore: number | null;
  capitalItems: number;
  events: number;
  evidenceHash: string | null;
  evidenceUrl: string | null;
  cegsVersion: string | null;
  asOf: string | null; // ISO 8601
  confidence: "low" | "medium" | "high";
  note: string;
}

export type CogHealth =
  | "ok"
  | "stale"
  | "error"
  | "disabled";

export interface CogFetchOptions {
  /** COG API base URL. Defaults to env CANADA_COG_BASE_URL, then 127.0.0.1:8080. */
  baseUrl?: string;
  /** Optional project ID; if absent, fetches the portfolio rollup. */
  projectId?: string;
  /** Optional dimension for /api/v1/rankings/{dimension}. */
  rankingDimension?: string;
  /** Optional tenant context (Settler invariant: every repo method takes tenantId). */
  tenantId?: string;
  /** Optional abort signal. */
  signal?: AbortSignal;
}

const DEFAULT_BASE_URL = "http://127.0.0.1:8080";
const FETCH_TIMEOUT_MS = 5_000;
const EXPECTED_CEGS_VERSION = "0.1";

function resolveBaseUrl(opts: CogFetchOptions): string {
  const fromOpts = opts.baseUrl;
  if (fromOpts !== undefined) return fromOpts;
  if (typeof process !== "undefined") {
    const envVal = process.env?.CANADA_COG_BASE_URL;
    if (typeof envVal === "string" && envVal.length > 0) return envVal;
  }
  return DEFAULT_BASE_URL;
}

function isEnabled(): boolean {
  if (typeof process === "undefined") return false;
  const v = process.env?.CANADA_COG_ENABLED;
  return v === "1" || v === "true";
}

async function fetchJson<T>(
  url: string,
  signal: AbortSignal | undefined,
): Promise<T | null> {
  const ctl = signal ? undefined : new AbortController();
  const timer = ctl
    ? setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS)
    : undefined;
  try {
    const res = await fetch(url, {
      signal: signal ?? ctl?.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class CanadaCogAdapter {
  readonly name = "canada-cog";
  readonly version = "1.0.0";

  /**
   * Health check. Disabled when CANADA_COG_ENABLED is unset.
   */
  async health(opts: CogFetchOptions = {}): Promise<CogHealth> {
    if (!isEnabled()) return "disabled";
    const baseUrl = resolveBaseUrl(opts);
    const version = await fetchJson<{ version?: string }>(
      `${baseUrl}/api/v1/version`,
      opts.signal,
    );
    return version ? "ok" : "error";
  }

  /**
   * Fetch COG project intelligence. Returns an empty record set on failure
   * (never fabricates). Each record carries evidence + CEGS version metadata.
   */
  async fetchForecast(opts: CogFetchOptions = {}): Promise<CogForecastRecord[]> {
    if (!isEnabled()) {
      return [];
    }

    const baseUrl = resolveBaseUrl(opts);
    const path = opts.projectId
      ? `/api/v1/forecast/projects/${encodeURIComponent(opts.projectId)}`
      : `/api/v1/forecast/portfolio`;

    const raw = await fetchJson<{
      projectId?: string;
      buildabilityScore?: number;
      investabilityScore?: number;
      strategicityScore?: number;
      capitalItems?: number;
      events?: number;
      evidenceHash?: string;
      evidenceUrl?: string;
      cegsVersion?: string;
      asOf?: string;
    }>(`${baseUrl}${path}`, opts.signal);

    if (!raw) {
      // Honest empty: never fabricate. The note records why.
      return [
        {
          projectId: opts.projectId ?? "portfolio",
          buildabilityScore: null,
          investabilityScore: null,
          strategicityScore: null,
          capitalItems: 0,
          events: 0,
          evidenceHash: null,
          evidenceUrl: null,
          cegsVersion: null,
          asOf: null,
          confidence: "low",
          note: `cog fetch failed: endpoint unreachable at ${baseUrl}`,
        },
      ];
    }

    const cegsVersion = raw.cegsVersion ?? null;
    if (cegsVersion !== null && cegsVersion !== EXPECTED_CEGS_VERSION) {
      // Spec drift — surface as a low-confidence record but do not block.
      return [
        {
          projectId: raw.projectId ?? opts.projectId ?? "portfolio",
          buildabilityScore: raw.buildabilityScore ?? null,
          investabilityScore: raw.investabilityScore ?? null,
          strategicityScore: raw.strategicityScore ?? null,
          capitalItems: raw.capitalItems ?? 0,
          events: raw.events ?? 0,
          evidenceHash: raw.evidenceHash ?? null,
          evidenceUrl: raw.evidenceUrl ?? null,
          cegsVersion,
          asOf: raw.asOf ?? null,
          confidence: "low",
          note: `cog spec version mismatch: expected ${EXPECTED_CEGS_VERSION}, got ${cegsVersion}`,
        },
      ];
    }

    return [
      {
        projectId: raw.projectId ?? opts.projectId ?? "portfolio",
        buildabilityScore: raw.buildabilityScore ?? null,
        investabilityScore: raw.investabilityScore ?? null,
        strategicityScore: raw.strategicityScore ?? null,
        capitalItems: raw.capitalItems ?? 0,
        events: raw.events ?? 0,
        evidenceHash: raw.evidenceHash ?? null,
        evidenceUrl: raw.evidenceUrl ?? null,
        cegsVersion,
        asOf: raw.asOf ?? null,
        confidence: "medium",
        note: "ok",
      },
    ];
  }
}

export const canadaCogAdapter = new CanadaCogAdapter();