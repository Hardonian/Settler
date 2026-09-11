/**
 * Fuzzy String Matcher for Bank Statement Descriptors
 *
 * Deterministic Jaro-Winkler and Levenshtein similarity matcher for raw,
 * noisy bank statement narratives (e.g. ACH / Wire lines).
 *
 * Enforces zero floating-point drift by computing all similarity scores
 * in basis points (0 - 10000 bps, where 10000 bps = 100.00% exact match).
 */

export interface DescriptorMatchResult {
  candidate: string;
  normalizedSource: string;
  normalizedCandidate: string;
  similarityBps: number;
  isMatch: boolean;
}

const COMMON_FINANCIAL_NOISE_WORDS = new Set([
  "payment",
  "payments",
  "pymt",
  "transfer",
  "transfers",
  "trf",
  "dir",
  "direct",
  "deposit",
  "deposits",
  "dep",
  "edi",
  "pymnts",
  "des",
  "indn",
  "co",
  "id",
  "orig",
  "ach",
  "wire",
  "web",
  "pos",
  "debit",
  "credit",
  "inc",
  "llc",
  "corp",
  "ltd",
  "holdings",
  "checkout",
]);

/**
 * Normalizes raw statement descriptors:
 * - Lowercases and strips non-alphanumeric chars (except spaces)
 * - Removes common noise banking tokens
 * - Trims and canonicalizes whitespace
 */
export function normalizeDescriptor(raw: string): string {
  if (!raw) return "";

  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0 && !COMMON_FINANCIAL_NOISE_WORDS.has(token));

  return tokens.join(" ").trim();
}

/**
 * Computes exact Levenshtein distance between two strings using dynamic programming.
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP optimization
  let prevRow: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  let currRow: number[] = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const aChar = a[i - 1];

    for (let j = 1; j <= n; j++) {
      const bChar = b[j - 1];
      const cost = aChar === bChar ? 0 : 1;

      currRow[j] = Math.min(
        currRow[j - 1]! + 1, // insertion
        prevRow[j]! + 1, // deletion
        prevRow[j - 1]! + cost // substitution
      );
    }

    // Swap rows
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n]!;
}

/**
 * Computes Jaro similarity scaled to basis points (0 - 10000 bps).
 */
export function computeJaroBps(s1: string, s2: string): number {
  if (s1 === s2) return 10000;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) {
      k++;
    }
    if (s1[i] !== s2[k]) {
      transpositions++;
    }
    k++;
  }

  const halfTrans = Math.floor(transpositions / 2);

  // jaro = (m/|s1| + m/|s2| + (m - t)/m) / 3
  // Scaled directly into integer basis points (0 - 10000)
  const term1 = Math.floor((matches * 10000) / s1.length);
  const term2 = Math.floor((matches * 10000) / s2.length);
  const term3 = Math.floor(((matches - halfTrans) * 10000) / matches);

  return Math.floor((term1 + term2 + term3) / 3);
}

/**
 * Computes Jaro-Winkler similarity in basis points (0 - 10000 bps).
 * Uses common prefix scaling factor of p = 0.1 (1000 bps per prefix match, max 4 chars).
 */
export function computeJaroWinklerBps(s1: string, s2: string): number {
  const jaroBps = computeJaroBps(s1, s2);
  if (jaroBps >= 10000) return 10000;

  // Determine common prefix length up to 4 chars
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  if (prefix === 0) return jaroBps;

  // jaroWinkler = jaro + prefix * p * (1 - jaro)
  // In bps: prefix * 1000 * (10000 - jaroBps) / 10000
  const bonus = Math.floor((prefix * (10000 - jaroBps)) / 10);
  return Math.min(10000, jaroBps + bonus);
}

/**
 * Matches a noisy statement descriptor against a whitelist of known merchant names or references.
 */
export function matchDescriptorToCandidates(
  tenantId: string,
  rawDescriptor: string,
  candidates: string[],
  thresholdBps: number = 8500 // 85% match default
): DescriptorMatchResult[] {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Tenant isolation invariant violation: tenantId is required");
  }

  const normalizedSource = normalizeDescriptor(rawDescriptor);
  const results: DescriptorMatchResult[] = [];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeDescriptor(candidate);
    const similarityBps = computeJaroWinklerBps(normalizedSource, normalizedCandidate);

    results.push({
      candidate,
      normalizedSource,
      normalizedCandidate,
      similarityBps,
      isMatch: similarityBps >= thresholdBps,
    });
  }

  // Sort by highest similarity descending, then candidate name
  return results.sort((a, b) => {
    if (b.similarityBps !== a.similarityBps) {
      return b.similarityBps - a.similarityBps;
    }
    return a.candidate.localeCompare(b.candidate);
  });
}
