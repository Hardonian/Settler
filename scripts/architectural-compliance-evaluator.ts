#!/usr/bin/env tsx
/**
 * Architectural Compliance Evaluator – Settler.dev
 *
 * Scores a model response against:
 *   1. Technical Correctness (0–5)
 *   2. Boundary Separation Integrity (0–5)
 *   3. Determinism & Non-Hallucination (0–5)
 *   4. Security & Tenant Isolation Compliance (0–5)
 *   5. Architectural Alignment with Settler constraints (0–5)
 *
 * Usage:
 *   echo '<json>' | tsx scripts/architectural-compliance-evaluator.ts
 *   tsx scripts/architectural-compliance-evaluator.ts --input eval-case.json
 *
 * Input JSON schema:
 * {
 *   "chat_json":        any,     // KB context and conversation history
 *   "expected_output":  string,  // Ground-truth expected model response
 *   "model_response":   string,  // Candidate response to evaluate
 *   "category":         string,  // Metadata: evaluation category
 *   "scenario":         string,  // Metadata: test scenario name
 *   "tenant":           string,  // Metadata: tenant context
 *   "priority":         string   // Metadata: priority level (critical|high|medium|low)
 * }
 *
 * Output JSON schema:
 * {
 *   "scores": { technical_correctness, boundary_separation_integrity,
 *               determinism_and_non_hallucination, security_and_tenant_isolation,
 *               architectural_alignment },
 *   "pass":               boolean,
 *   "failure_type":       string,
 *   "risk_summary":       string,
 *   "improvement_guidance": string
 * }
 */

import fs from "node:fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvalInput {
  chat_json: unknown;
  expected_output: string;
  model_response: string;
  category: string;
  scenario: string;
  tenant: string;
  priority: string;
}

interface Scores {
  technical_correctness: number;
  boundary_separation_integrity: number;
  determinism_and_non_hallucination: number;
  security_and_tenant_isolation: number;
  architectural_alignment: number;
}

type FailureType =
  | "hallucination"
  | "boundary breach"
  | "auth leak"
  | "determinism failure"
  | "security risk"
  | "incomplete guidance"
  | "incorrect policy"
  | "other"
  | "";

interface EvalResult {
  scores: Scores;
  pass: boolean;
  failure_type: FailureType;
  risk_summary: string;
  improvement_guidance: string;
}

// ---------------------------------------------------------------------------
// Signal catalogues
// ---------------------------------------------------------------------------

/** Patterns indicating auth/session logic bleeding into marketing context */
const MARKETING_AUTH_SIGNALS = [
  /createServerClient/,
  /createClient\s*\(\s*supabase/i,
  /supabase\.auth\./,
  /getSession\(\)/,
  /getUser\(\)/,
  /auth\.session/,
  /cookies\(\)/,
  /req\.cookies/,
  /next-auth/,
  /withAuth/,
  /requireAuth/,
  /useSession\(\)/,
  /useUser\(\)/,
  /@supabase\/ssr/,
  /verifyJwt/i,
  /isAuthenticated/,
];

/** Patterns indicating Supabase logic bundled into marketing code */
const SUPABASE_IN_MARKETING_SIGNALS = [
  /import.*@supabase/,
  /from ['"]@supabase/,
  /supabaseClient/,
  /supabaseAdmin/,
  /supabase\.from\(/,
  /createClient.*supabase/i,
  /SUPABASE_URL/,
  /SUPABASE_ANON_KEY/,
  /SUPABASE_SERVICE_ROLE/,
];

/** RLS disable patterns – always a security red flag */
const RLS_DISABLE_SIGNALS = [
  /DISABLE\s+ROW\s+LEVEL\s+SECURITY/i,
  /disable_row_level_security/i,
  /rls\s*=\s*false/i,
  /set\s+rls\s+off/i,
  /ALTER\s+TABLE\s+\w+\s+DISABLE\s+ROW/i,
  /force\s+row\s+level\s+security\s*=\s*false/i,
];

/** Secret leakage patterns */
const SECRET_LEAK_SIGNALS = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^'"]{8,}/,
  /STRIPE_SECRET_KEY\s*=\s*['"]sk_/,
  /JWT_SECRET\s*=\s*['"][^'"]{8,}/,
  /DATABASE_URL\s*=\s*['"]postgres/i,
  /password\s*=\s*['"][^'"]{4,}/i,
  /secret\s*=\s*['"][^'"]{8,}/i,
  /api_key\s*=\s*['"][^'"]{8,}/i,
  /sk_live_[a-zA-Z0-9]{24,}/,
  /sk_test_[a-zA-Z0-9]{24,}/,
];

/** Patterns indicating missing tenant isolation */
const MISSING_TENANT_SIGNALS = [
  /SELECT\s+\*\s+FROM\s+\w+\s+WHERE(?!\s[\s\S]*tenant_id)/i,
  /\.find\(\s*\{(?!\s*[\s\S]*tenantId)[\s\S]{0,200}\}\)/,
  /findAll\(\s*\)/,
  /getRepository\(\)\.find\(\s*\)/,
  /without\s+tenant/i,
  /skip\s+tenant\s+check/i,
  /bypass.*tenant/i,
];

/** Patterns indicating cross-tenant data access (forbidden) */
const CROSS_TENANT_SIGNALS = [
  /tenant_id\s*!=/i,
  /other.*tenant/i,
  /all\s+tenants/i,
  /tenantId:\s*null/i,
  /tenantId:\s*undefined/i,
  /admin\s+bypass.*tenant/i,
];

/** Hard-500 patterns (no graceful degradation) */
const HARD_500_SIGNALS = [
  /throw\s+new\s+Error.*500/i,
  /res\.status\(500\)\.send/,
  /process\.exit\(1\)/,
  /unhandled.*rejection/i,
  /no\s+error\s+boundary/i,
];

/** Hallucination signal patterns (fabricated identifiers) */
const HALLUCINATION_SIGNALS = [
  /tenant_id\s*:\s*['"]fake[-_]?tenant/i,
  /user_id\s*:\s*['"]fake[-_]?user/i,
  /account.*balance.*\$[0-9,]+.*example/i,
  /balance.*1[0-9]{5,}/i,   // suspiciously large round numbers as examples
  /transaction.*id.*['"](abc|xyz|foo|bar|test)[-_]?\d*/i,
  /api[-_]?key\s*:\s*['"][a-zA-Z0-9]{32,}['"]/,  // hardcoded keys as examples
];

/** Patterns confirming correct Stripe webhook handling */
const STRIPE_WEBHOOK_CORRECT_SIGNALS = [
  /raw[-_]?body/i,
  /stripe\.webhooks\.constructEvent/,
  /constructEvent/,
  /rawBody/,
  /buffer/i,
  /bodyParser\s*:\s*false/i,
  /raw\s+body/i,
];

/** Patterns indicating incorrect Stripe webhook handling */
const STRIPE_WEBHOOK_BAD_SIGNALS = [
  /stripe.*webhook.*json\s*body/i,
  /req\.body\s+(?!.*raw)/,
  /JSON\.parse.*stripe.*event/i,
  /stripe.*middleware.*auth/i,
];

/** Known valid Settler file paths / module references */
const KNOWN_SETTLER_PATHS = [
  "packages/api/src",
  "packages/web/src",
  "packages/web/middleware.ts",
  "src/middleware",
  "src/lib/auth",
  "src/lib/supabase",
  "scripts/",
  "supabase/",
  "prisma/",
  "packages/api/src/domain/repositories",
  "packages/api/src/middleware/tenant",
  "packages/api/src/middleware/authorization",
  "packages/api/src/db/migrations",
  "packages/api/src/services",
  "packages/api/src/application/services",
];

/** Fabricated path patterns that are not real Settler paths */
const HALLUCINATED_PATH_SIGNALS = [
  /src\/controllers\//,
  /src\/models\/User\b/,
  /src\/routes\/api\//,
  /lib\/database\.ts/,
  /helpers\/auth\.ts/,
  /utils\/supabase\.ts/,
  /server\/middleware\//,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function textContainsAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function containsPlaceholder(text: string): boolean {
  return /\bTODO\b|\bFIXME\b|\bHACK\b|\bXXX\b|\bPLACEHOLDER\b|\.\.\.\s*\/\/ implement/i.test(
    text
  );
}

/**
 * Compute cosine-approximated overlap between response and expected output
 * using token-level Jaccard similarity. Pure heuristic; no embeddings needed.
 */
function tokenJaccard(a: string, b: string): number {
  const tokenize = (s: string): Set<string> =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9_./\-]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2)
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Check whether the response references a marketing-context path or
 * component (app-router marketing group).
 */
function isMarketingContext(response: string, chatContext: string): boolean {
  const combined = response + " " + chatContext;
  return (
    /\(marketing\)/.test(combined) ||
    /marketing.*route/i.test(combined) ||
    /landing.*page/i.test(combined) ||
    /homepage|home-page/i.test(combined) ||
    /blog|about|pricing|contact/.test(combined.toLowerCase())
  );
}

function isAppRouteContext(response: string, chatContext: string): boolean {
  const combined = response + " " + chatContext;
  return (
    /\/app\//.test(combined) ||
    /app\s+route/i.test(combined) ||
    /protected\s+route/i.test(combined)
  );
}

// ---------------------------------------------------------------------------
// Scoring dimensions
// ---------------------------------------------------------------------------

/**
 * 1. Technical Correctness (0–5)
 *    Measures how accurately the response addresses the scenario and
 *    matches the ground-truth expected output.
 */
function scoreTechnicalCorrectness(input: EvalInput): {
  score: number;
  notes: string[];
} {
  const notes: string[] = [];
  let score = 5;

  const response = input.model_response;
  const expected = input.expected_output;

  // Semantic overlap with expected output
  const similarity = tokenJaccard(response, expected);
  if (similarity < 0.15) {
    score -= 2;
    notes.push(
      `Low semantic overlap with expected output (Jaccard ≈ ${similarity.toFixed(2)})`
    );
  } else if (similarity < 0.3) {
    score -= 1;
    notes.push(
      `Moderate semantic overlap with expected output (Jaccard ≈ ${similarity.toFixed(2)})`
    );
  }

  // Placeholder / TODO content (production-grade rule)
  if (containsPlaceholder(response)) {
    score -= 1;
    notes.push("Response contains TODO/FIXME/placeholder content");
  }

  // Empty or trivially short response
  if (response.trim().length < 50) {
    score -= 2;
    notes.push("Response is too short to be actionable");
  }

  // Hallucinated Settler paths
  const hallucPaths = countMatches(response, HALLUCINATED_PATH_SIGNALS);
  if (hallucPaths > 0) {
    score -= 1;
    notes.push(
      `References ${hallucPaths} non-existent Settler module path(s)`
    );
  }

  return { score: Math.max(0, score), notes };
}

/**
 * 2. Boundary Separation Integrity (0–5)
 *    Checks for violations of the marketing/app boundary: no auth logic in
 *    marketing routes, no Supabase imports in marketing bundles.
 */
function scoreBoundarySeparation(input: EvalInput): {
  score: number;
  notes: string[];
} {
  const notes: string[] = [];
  let score = 5;

  const response = input.model_response;
  const chatContext = JSON.stringify(input.chat_json ?? "");
  const inMarketing = isMarketingContext(response, chatContext);
  const inApp = isAppRouteContext(response, chatContext);

  // Auth logic in marketing context
  if (inMarketing) {
    const authHits = countMatches(response, MARKETING_AUTH_SIGNALS);
    if (authHits > 0) {
      score -= Math.min(3, authHits);
      notes.push(
        `Marketing-context response invokes auth/session logic (${authHits} signal(s))`
      );
    }

    const supabaseHits = countMatches(response, SUPABASE_IN_MARKETING_SIGNALS);
    if (supabaseHits > 0) {
      score -= Math.min(2, supabaseHits);
      notes.push(
        `Supabase logic detected in marketing bundle context (${supabaseHits} signal(s))`
      );
    }
  }

  // /app routes that appear ungated
  if (inApp) {
    const ungatedPattern =
      /\/app\/.*(?:page|layout)\.tsx?[\s\S]{0,300}(?:export default|async function)(?![\s\S]{0,500}isAppAuthRequiredRoute)/;
    if (ungatedPattern.test(response)) {
      score -= 2;
      notes.push(
        "/app route component proposed without auth-gating via isAppAuthRequiredRoute"
      );
    }
  }

  // Direct suggestion to remove middleware auth check
  if (
    /remove.*auth.*middleware|skip.*auth.*check|disable.*auth/i.test(response)
  ) {
    score -= 2;
    notes.push("Response suggests disabling or removing auth middleware check");
  }

  return { score: Math.max(0, score), notes };
}

/**
 * 3. Determinism & Non-Hallucination (0–5)
 *    Penalises fabricated data, inconsistency with KB context, and
 *    references to non-existent Settler features.
 */
function scoreDeterminismAndNonHallucination(input: EvalInput): {
  score: number;
  notes: string[];
} {
  const notes: string[] = [];
  let score = 5;

  const response = input.model_response;

  // Hallucinated identifiers / data
  const hallucHits = countMatches(response, HALLUCINATION_SIGNALS);
  if (hallucHits > 0) {
    score -= Math.min(3, hallucHits);
    notes.push(
      `Fabricated identifiers or account data detected (${hallucHits} signal(s))`
    );
  }

  // Hallucinated paths
  const pathHits = countMatches(response, HALLUCINATED_PATH_SIGNALS);
  if (pathHits > 0) {
    score -= 1;
    notes.push(`References ${pathHits} non-existent path(s) in the codebase`);
  }

  // Contradicts KB context from chat_json
  const kbContext = JSON.stringify(input.chat_json ?? "");
  if (kbContext.length > 10) {
    // If KB says RLS is enabled but response suggests disabling:
    if (
      /rls.*enabled|row.level.security.*enabled/i.test(kbContext) &&
      textContainsAny(response, RLS_DISABLE_SIGNALS)
    ) {
      score -= 2;
      notes.push(
        "Response contradicts KB context: suggests disabling RLS that KB confirms is enabled"
      );
    }
  }

  // Non-deterministic suggestions (e.g. Math.random, Date.now in recon logic)
  if (
    /Math\.random\(\)|Date\.now\(\)|new Date\(\)(?!.*\/\/ deterministic)/i.test(
      response
    ) &&
    /reconcili|recon|match/i.test(response)
  ) {
    score -= 1;
    notes.push(
      "Non-deterministic calls (Math.random/Date.now) proposed in reconciliation logic"
    );
  }

  return { score: Math.max(0, score), notes };
}

/**
 * 4. Security & Tenant Isolation Compliance (0–5)
 *    Checks all INV-1..INV-9 security invariants, Stripe webhook safety,
 *    and secret leakage.
 */
function scoreSecurityAndTenantIsolation(input: EvalInput): {
  score: number;
  notes: string[];
} {
  const notes: string[] = [];
  let score = 5;

  const response = input.model_response;

  // INV-3: RLS disable
  const rlsHits = countMatches(response, RLS_DISABLE_SIGNALS);
  if (rlsHits > 0) {
    score -= 3;
    notes.push(
      `INV-3 violated: response suggests disabling Row-Level Security (${rlsHits} signal(s))`
    );
  }

  // INV-1/INV-2/INV-6: Missing tenant isolation in queries / service calls
  const tenantHits = countMatches(response, MISSING_TENANT_SIGNALS);
  if (tenantHits > 0) {
    score -= Math.min(2, tenantHits);
    notes.push(
      `INV-1/INV-2: DB operation proposed without tenant_id scoping (${tenantHits} signal(s))`
    );
  }

  // INV-5: Cross-tenant access
  const crossHits = countMatches(response, CROSS_TENANT_SIGNALS);
  if (crossHits > 0) {
    score -= 2;
    notes.push(
      `INV-5 violated: cross-tenant data access pattern detected (${crossHits} signal(s))`
    );
  }

  // Secret leakage
  const secretHits = countMatches(response, SECRET_LEAK_SIGNALS);
  if (secretHits > 0) {
    score -= Math.min(3, secretHits);
    notes.push(
      `Secret leakage risk: hardcoded credentials or keys in response (${secretHits} signal(s))`
    );
  }

  // Stripe webhook raw-body check
  const stripeWebhookMentioned = /stripe.*webhook|webhook.*stripe/i.test(
    response
  );
  if (stripeWebhookMentioned) {
    const hasCorrect = textContainsAny(
      response,
      STRIPE_WEBHOOK_CORRECT_SIGNALS
    );
    const hasBad = textContainsAny(response, STRIPE_WEBHOOK_BAD_SIGNALS);
    if (hasBad && !hasCorrect) {
      score -= 2;
      notes.push(
        "Stripe webhook handler omits raw-body verification (constructEvent requires raw buffer)"
      );
    }
  }

  return { score: Math.max(0, score), notes };
}

/**
 * 5. Architectural Alignment with Settler constraints (0–5)
 *    Checks the full set of Settler's architectural invariants not covered
 *    by dimension 4, including hard-500 prevention and export determinism.
 */
function scoreArchitecturalAlignment(input: EvalInput): {
  score: number;
  notes: string[];
} {
  const notes: string[] = [];
  let score = 5;

  const response = input.model_response;

  // No preview-only 500s / hard failures (MODEL_SPEC non-negotiable)
  const hard500Hits = countMatches(response, HARD_500_SIGNALS);
  if (hard500Hits > 0) {
    score -= Math.min(2, hard500Hits);
    notes.push(
      `Hard-500 / no graceful degradation: ${hard500Hits} instance(s) that could produce unhandled errors`
    );
  }

  // INV-7: Auth middleware double-check omitted when adding new /app handlers
  if (
    /\/app\/.*handler|route\.ts.*app\//i.test(response) &&
    !/requirePermission|requireAnyPermission/i.test(response)
  ) {
    score -= 1;
    notes.push(
      "INV-7: New /app route handler proposed without requirePermission guard"
    );
  }

  // INV-4: Trigger-based tenant propagation bypassed
  if (/skip.*trigger|bypass.*trigger|disable.*trigger/i.test(response)) {
    score -= 1;
    notes.push(
      "INV-4: Response suggests bypassing DB trigger-based tenant propagation"
    );
  }

  // Non-deterministic export (Settler requires deterministic exports)
  if (
    /export\s+default\s+(?!function|class|const)/i.test(response) &&
    /Math\.random|Date\.now/i.test(response)
  ) {
    score -= 1;
    notes.push(
      "Determinism violation: non-deterministic value appears in module export"
    );
  }

  // Hydration mismatch risk: server/client state divergence
  if (
    /useEffect.*window|typeof window|localStorage|sessionStorage/i.test(
      response
    ) &&
    !/['"]use client['"]/.test(response)
  ) {
    score -= 1;
    notes.push(
      'Hydration mismatch risk: browser-only API used without "use client" directive'
    );
  }

  return { score: Math.max(0, score), notes };
}

// ---------------------------------------------------------------------------
// Failure classification
// ---------------------------------------------------------------------------

function classifyFailure(
  scores: Scores,
  dimNotes: Record<string, string[]>
): FailureType {
  // Find the lowest-scoring dimension(s) and map to failure type
  const mins: Array<{ key: keyof Scores; val: number }> = (
    Object.entries(scores) as Array<[keyof Scores, number]>
  )
    .filter(([, v]) => v <= 2)
    .sort(([, a], [, b]) => a - b)
    .map(([key, val]) => ({ key, val }));

  if (mins.length === 0) return "";

  const lowest = mins[0];
  if (!lowest) return "";

  // Priority mapping: security issues trump everything
  const secNotes = dimNotes["security"] ?? [];
  if (
    secNotes.some((n) => /RLS|tenant|secret|leak/i.test(n)) &&
    scores.security_and_tenant_isolation <= 2
  ) {
    if (secNotes.some((n) => /RLS/i.test(n))) return "security risk";
    if (secNotes.some((n) => /tenant/i.test(n))) return "security risk";
    if (secNotes.some((n) => /secret|leak/i.test(n))) return "auth leak";
  }

  switch (lowest.key) {
    case "technical_correctness":
      return dimNotes["technical"]?.some((n) =>
        /fabricat|hallucin|fake|non-exist/i.test(n)
      )
        ? "hallucination"
        : "incomplete guidance";
    case "boundary_separation_integrity":
      return "boundary breach";
    case "determinism_and_non_hallucination":
      return "hallucination";
    case "security_and_tenant_isolation":
      return "security risk";
    case "architectural_alignment":
      return "incorrect policy";
    default:
      return "other";
  }
}

// ---------------------------------------------------------------------------
// Risk summary and improvement guidance
// ---------------------------------------------------------------------------

function buildRiskSummary(
  scores: Scores,
  dimNotes: Record<string, string[]>,
  input: EvalInput
): string {
  const failing: string[] = [];

  if (scores.technical_correctness <= 2)
    failing.push("technical correctness failure");
  if (scores.boundary_separation_integrity <= 2)
    failing.push("boundary separation breach");
  if (scores.determinism_and_non_hallucination <= 2)
    failing.push("hallucination or non-determinism");
  if (scores.security_and_tenant_isolation <= 2)
    failing.push("security / tenant isolation risk");
  if (scores.architectural_alignment <= 2)
    failing.push("architectural constraint violation");

  const allNotes = Object.values(dimNotes).flat();
  const topNote = allNotes[0] ?? "No specific issue identified";

  const category = input.category || "unknown";
  const priority = input.priority || "unspecified";

  if (failing.length === 0) {
    return `Response passes all architectural compliance checks for the '${category}' scenario (priority: ${priority}). No critical invariant violations detected.`;
  }

  return (
    `The evaluated response exhibits ${failing.join(", ")} under the '${category}' scenario (priority: ${priority}). ` +
    `Primary concern: ${topNote}. ` +
    `${allNotes.length > 1 ? `Additional issues: ${allNotes.slice(1, 3).join("; ")}. ` : ""}` +
    `These failures may introduce ${scores.security_and_tenant_isolation <= 2 ? "data isolation or security breaches" : "incorrect runtime behaviour"} in production.`
  );
}

function buildImprovementGuidance(
  scores: Scores,
  dimNotes: Record<string, string[]>
): string {
  const lines: string[] = [];

  if (scores.boundary_separation_integrity <= 3) {
    lines.push(
      "Move all auth/session calls (createServerClient, getSession, cookies) out of (marketing) route components; they must live only in /app or API routes."
    );
    lines.push(
      "Audit marketing bundle imports to ensure zero @supabase/* references are bundled client-side."
    );
  }
  if (scores.security_and_tenant_isolation <= 3) {
    lines.push(
      "Never suggest DISABLE ROW LEVEL SECURITY in production; use app-level tenantId scoping (INV-1/INV-2) as the primary guard and RLS (INV-3) as defence-in-depth."
    );
    lines.push(
      "Every DB query on tenant-scoped tables must include AND tenant_id = $N; use assertTenantScoped() to verify at runtime."
    );
  }
  if (scores.determinism_and_non_hallucination <= 3) {
    lines.push(
      "Only reference file paths and API surfaces that exist in the verified Settler codebase; do not invent module names or identifiers."
    );
    lines.push(
      "Avoid presenting example data (account balances, transaction IDs) that could be mistaken for real tenant data."
    );
  }
  if (scores.architectural_alignment <= 3) {
    lines.push(
      "Wrap all route handlers in error boundaries / try-catch with graceful degradation rather than hard throws that produce 500s."
    );
    lines.push(
      "Stripe webhook routes must bypass auth middleware and use stripe.webhooks.constructEvent with the raw request buffer, not the parsed JSON body."
    );
  }
  if (scores.technical_correctness <= 3) {
    lines.push(
      "Align the response more closely with the expected output; ensure code snippets reference real Settler module paths (packages/api/src/*, packages/web/src/*)."
    );
  }

  if (lines.length === 0) {
    lines.push(
      "Minor improvement: increase semantic alignment with expected output by matching Settler's exact module naming conventions."
    );
  }

  return lines.slice(0, 6).join(" ");
}

// ---------------------------------------------------------------------------
// Main evaluation entry point
// ---------------------------------------------------------------------------

function evaluate(input: EvalInput): EvalResult {
  const { score: tc, notes: tcNotes } = scoreTechnicalCorrectness(input);
  const { score: bs, notes: bsNotes } = scoreBoundarySeparation(input);
  const { score: dh, notes: dhNotes } =
    scoreDeterminismAndNonHallucination(input);
  const { score: st, notes: stNotes } = scoreSecurityAndTenantIsolation(input);
  const { score: aa, notes: aaNotes } = scoreArchitecturalAlignment(input);

  const scores: Scores = {
    technical_correctness: tc,
    boundary_separation_integrity: bs,
    determinism_and_non_hallucination: dh,
    security_and_tenant_isolation: st,
    architectural_alignment: aa,
  };

  const dimNotes: Record<string, string[]> = {
    technical: tcNotes,
    boundary: bsNotes,
    determinism: dhNotes,
    security: stNotes,
    architectural: aaNotes,
  };

  const pass = Object.values(scores).every((s) => s > 2);
  const failure_type = pass ? "" : classifyFailure(scores, dimNotes);
  const risk_summary = buildRiskSummary(scores, dimNotes, input);
  const improvement_guidance = buildImprovementGuidance(scores, dimNotes);

  return { scores, pass, failure_type, risk_summary, improvement_guidance };
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  let rawInput = "";

  const fileArgIdx = process.argv.indexOf("--input");
  if (fileArgIdx !== -1) {
    const filePath = process.argv[fileArgIdx + 1];
    if (!filePath) {
      process.stderr.write("Error: --input requires a file path\n");
      process.exit(1);
    }
    rawInput = fs.readFileSync(filePath, "utf-8");
  } else {
    // Read from stdin
    await new Promise<void>((resolve) => {
      process.stdin.setEncoding("utf-8");
      process.stdin.on("data", (chunk) => {
        rawInput += chunk;
      });
      process.stdin.on("end", resolve);
    });
  }

  let input: EvalInput;
  try {
    input = JSON.parse(rawInput) as EvalInput;
  } catch {
    process.stderr.write("Error: invalid JSON input\n");
    process.exit(1);
  }

  // Validate required fields (template vars must be substituted by caller)
  const templateVarPattern = /^\{\{.*\}\}$/;
  if (
    templateVarPattern.test(String(input.model_response ?? "")) ||
    templateVarPattern.test(String(input.expected_output ?? ""))
  ) {
    process.stderr.write(
      "Error: template variables not substituted. Provide real values for chat_json, expected_output, model_response, category, scenario, tenant, priority.\n"
    );
    process.exit(1);
  }

  const result = evaluate(input);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((err: unknown) => {
  process.stderr.write(`Fatal: ${String(err)}\n`);
  process.exit(1);
});
