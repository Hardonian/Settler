# Settler — Product Clarity & UX Audit

## Phase 1: Cognitive Legibility Test

### Three first-time readers scan the repo homepage

**Senior backend engineer (10 seconds):**
Current impression: "A reconciliation system with deterministic properties... 'control plane for provable financial truth' — what does provable financial truth mean operationally? Is this a database? An API? A workflow engine?"

Verdict: The phrase "control plane" is infrastructure jargon that obscures the actual product category. "Provable financial truth" sounds like marketing, not engineering.

**Startup founder (10 seconds):**
Current impression: "Something about financial reconciliation... deterministic... evidence... I don't reconcile things yet, do I need this? What does it replace?"

Verdict: The problem isn't stated before the solution. A founder needs to recognize their own pain before processing the product.

**Finance / operations lead (10 seconds):**
Current impression: "Control plane? Deterministic? This is engineering infrastructure, not for me."

Verdict: The landing page speaks exclusively in engineering abstractions. An ops lead who reconciles Stripe payouts against bank statements daily would not recognize this as their tool.

### Ideal one-sentence explanation

> **Settler is the open-source engine that reconciles financial data across systems, surfaces mismatches instantly, and produces verifiable evidence for every run.**

Why this works:

- "engine" — concrete, understood by engineers and non-engineers
- "reconciles financial data across systems" — the actual job
- "surfaces mismatches instantly" — the operational outcome
- "produces verifiable evidence" — the differentiator
- No jargon: no "control plane," no "provable financial truth," no "deterministic pipeline"

---

## Phase 2: Pain Narrative

### Before Settler

- Reconciliation happens in spreadsheets, one-off scripts, or manually inside accounting tools.
- Mismatches between Stripe, your bank, your ERP, and your ledger are discovered late — often during month-end close or audit prep.
- When numbers don't match, no one can explain why. The script that ran last Tuesday is gone. The spreadsheet was overwritten.
- Audit asks: "Why does this line item differ?" Answer: "We don't know, we'll re-check manually."
- Every team invents their own reconciliation process. None of them are repeatable. None of them produce evidence.

### After Settler

- Reconciliation is a defined workflow: ingest records, apply matching rules, surface mismatches, assign reviews.
- Mismatches appear the moment a run completes. No waiting for month-end to discover problems.
- Every run produces evidence: what data went in, what rules applied, what matched, what didn't, and why.
- Runs are replayable. If an auditor asks "why did this differ?" you replay the exact run and show them.
- Rules are code. They live in version control. They are reviewed in PRs. They are tested in CI.

---

## Phase 3: Developer Mental Model

### The Settler Loop

```
1. INGEST     → Pull records from Stripe, banks, ERPs, ledgers
2. RECONCILE  → Apply explicit matching rules to find agreements and mismatches
3. DETECT     → Surface mismatches with full context
4. EVIDENCE   → Generate verifiable proof of what happened in this run
5. REPLAY     → Re-run any reconciliation to verify or debug results
```

This loop must appear consistently in:

- README intro (section "How it works") ✓ Currently present, needs simplification
- Docs homepage ✓ Referenced but buried
- Landing page hero section — Missing. The hero talks about "determinism" abstractly.
- Demo walkthrough — Partially present in quickstart

### Recommended canonical phrasing

> **Ingest. Reconcile. Detect. Prove. Replay.**
>
> Settler pulls records from your financial systems, applies your matching rules, surfaces mismatches, generates evidence, and lets you replay any run to verify the results.

---

## Phase 4: Differentiation

### Differentiator 1: Replayable Runs

**Problem:** When a reconciliation reveals a mismatch, you can't go back and see what happened. The script ran, the results are what they are.

**Feature:** Settler records every run deterministically. You can replay any run with identical inputs and verify the output matches.

**Outcome:** Debugging, auditing, and incident response become tractable. "Why did this mismatch?" is answerable.

### Differentiator 2: Evidence Generation

**Problem:** Reconciliation produces results, but not proof. When an auditor asks how you arrived at a number, you reconstruct it manually.

**Feature:** Every Settler run generates an evidence pack: the input data, the rules applied, the results, and a cryptographic hash chain.

**Outcome:** Audit preparation takes minutes, not days. Evidence is machine-generated, not human-reconstructed.

### Differentiator 3: Rules as Code

**Problem:** Reconciliation logic lives in spreadsheets, someone's head, or undocumented scripts. It cannot be reviewed, tested, or versioned.

**Feature:** Settler matching rules are defined in code. They live in your repository, go through pull requests, and run in CI.

**Outcome:** Reconciliation logic gets the same rigor as application code. Changes are reviewed, tested, and traceable.

### Differentiator 4: Exception Workflow

**Problem:** Mismatches are discovered in bulk and triaged manually. Items fall through the cracks. Resolution is untracked.

**Feature:** Settler routes mismatches into a review queue with operator assignment, resolution states, and audit context.

**Outcome:** Every mismatch is tracked from detection to resolution. Nothing is silently ignored.

### Differentiator 5: Self-Hosted, Open Source

**Problem:** Financial reconciliation data is sensitive. SaaS tools require sending transaction data to third parties.

**Feature:** Settler is Apache 2.0 licensed and designed for self-hosting. Your data stays in your infrastructure.

**Outcome:** You get a production-grade reconciliation engine without data sovereignty trade-offs.

### Differentiator 6: API and SDK First

**Problem:** Reconciliation is treated as a manual task, not a programmable operation. It can't be embedded in automated workflows.

**Feature:** Settler exposes a full API and SDK. Reconciliation runs can be triggered programmatically, integrated into CI/CD, or embedded in operational pipelines.

**Outcome:** Reconciliation becomes infrastructure, not a manual process.

---

## Phase 5: UI Language Clarity

### Terminology Audit

| Current Term                                 | Problem                                               | Recommended Replacement               |
| -------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| "control plane"                              | Infrastructure jargon; obscures what the product does | "reconciliation engine"               |
| "provable financial truth"                   | Sounds like marketing; unclear operational meaning    | "verifiable reconciliation results"   |
| "deterministic pipeline"                     | Engineering abstraction                               | "replayable workflow"                 |
| "execution artifact"                         | Internal infrastructure term                          | "evidence" or "run evidence"          |
| "evaluation graph"                           | Internal term with no user meaning                    | "run history"                         |
| "policy evaluator"                           | Vague; sounds like compliance software                | "rule checks"                         |
| "artifact chain"                             | Internal data structure term                          | "evidence chain"                      |
| "governance boundaries"                      | Abstract; sounds enterprise-sales                     | "access controls and audit trails"    |
| "failure surface reduction"                  | Risk-theory language; too abstract                    | "fewer reconciliation errors"         |
| "operational confidence through determinism" | Correct but dense                                     | "reliable, repeatable reconciliation" |
| "variance sets"                              | Technical term                                        | "mismatches" or "differences"         |
| "operator leverage"                          | Internal framing                                      | "faster exception handling"           |
| "control-plane integration"                  | Jargon                                                | "API and SDK integration"             |
| "reconciliation control plane primitives"    | Triple jargon                                         | "reconciliation building blocks"      |

### Principle

Use the language your users use when describing their problem. Finance teams say "mismatches," not "variances." Engineers say "results," not "artifacts." Everyone says "evidence," not "execution artifacts."

---

## Phase 6: Demo Story

### Canonical 5-Minute Demo

**Setup (30 seconds)**

```bash
git clone https://github.com/Hardonian/Settler.git
cd Settler && pnpm install
cp .env.example .env
```

**Step 1: Run the demo reconciliation (60 seconds)**

```bash
pnpm demo
```

Show: Settler ingests sample Stripe transactions and bank records, applies matching rules, and produces results.

**Step 2: See the mismatch (60 seconds)**
Open `examples/demo-output/results.json`. Point to a mismatch: "This Stripe charge has no matching bank deposit. Settler flagged it automatically."

**Step 3: Inspect the evidence (60 seconds)**
Open `examples/demo-output/evidence.json`. Show: "Here's exactly what data went in, what rules ran, what matched, and what didn't. This is the evidence pack."

**Step 4: Replay the run (60 seconds)**

```bash
pnpm settler:replay examples/demo-output/evidence.json
```

Show: "Same inputs, same rules, same results. The run is deterministic. This is what makes it auditable."

**Step 5: Open the web console (60 seconds)**

```bash
pnpm --filter @settler/web dev
```

Open `http://localhost:3000`. Show: the mismatch in the exception queue, the evidence viewer, the run history.

**Demo takeaway:** "In five minutes, you ran a reconciliation, found a mismatch, inspected the evidence, and proved the run is repeatable. That's what Settler does."

---

## Phase 7: OSS Story

Financial reconciliation requires trust. You need to trust that the system matching your transactions is correct. You need to trust that the evidence it produces is complete. You need to trust that a replay produces the same results.

Trust in reconciliation infrastructure cannot be delegated to a black box. When an auditor, regulator, or CFO asks "how do you know these numbers are right?", the answer needs to be verifiable — not "we trust the vendor."

Settler is open source because reconciliation engines should be inspectable. The matching logic is code you can read. The evidence generation is a process you can audit. The replay mechanism is deterministic and verifiable.

Open source is not a distribution strategy for Settler. It is a trust requirement. Financial infrastructure that cannot be independently verified is a liability.

---

## Phase 8: Visual Story

### Recommended Visuals

1. **Reconciliation Timeline** — A horizontal timeline showing: data ingested → rules applied → matches found → mismatches flagged → evidence generated. Reinforces the core loop visually.

2. **Mismatch Explanation View** — A side-by-side comparison: Stripe record on left, bank record on right, with the specific difference highlighted. Shows the "why" of a mismatch at a glance.

3. **Evidence Viewer** — A structured view of an evidence pack: input hash, rules applied, results summary, output hash. Shows that evidence is machine-generated and cryptographically anchored.

4. **Rule Check Results** — A checklist-style view: which rules ran, which passed, which flagged mismatches. Shows that reconciliation is governed by explicit, visible rules.

5. **Run Replay Comparison** — Two runs side by side with identical outputs, showing determinism visually. The "same inputs → same outputs" proof.

### Visual Placement

- Hero section: Reconciliation Timeline (shows the product at a glance)
- Features section: Mismatch Explanation + Evidence Viewer
- Demo section: Run Replay Comparison
- Docs: All five visuals in the getting-started guide

---

## Phase 9: Developer Attraction Assessment

### Current Strengths

- README is structured and scannable
- Quickstart is under 6 commands
- `pnpm demo` exists and produces inspectable output
- Evidence replay command exists
- SDK and API are documented
- Apache 2.0 license is clearly stated

### Current Friction Points

1. **Tagline is abstract.** "Control plane for provable financial truth" requires parsing. A developer should understand the product from the tagline alone.

2. **Quickstart requires Postgres/Supabase.** This is a significant barrier. A developer evaluating the project must set up a database before seeing any output. The `pnpm demo` command should work without database configuration for the demo data.

3. **Too many root-level markdown files.** The repo root has 30+ markdown files (HARDENING_SUMMARY.md, REALITY_MAP.md, GO_LIVE.md, etc.). This signals internal planning documents leaked into the public repo. It creates noise and reduces credibility.

4. **Demo video script references SaaS pricing.** The demo script mentions "$29/month" pricing tiers that may not reflect the OSS positioning. Mixed signals between OSS and SaaS.

5. **Landing page hero CTA is "Read Quickstart" and "Discuss Your Architecture."** The second CTA ("Discuss Your Architecture") is enterprise-sales language that conflicts with the OSS-first positioning. Replace with "View on GitHub" or "Try the Demo."

6. **No screenshot or GIF in README.** Developers scanning the repo have no visual preview of what the product looks like running.

### Recommended Improvements

- Simplify tagline to the one-sentence explanation from Phase 1
- Add a "zero-config demo" path that works without database setup
- Move internal planning docs to an `archive/` or `internal/` directory
- Add a screenshot or terminal recording to the README
- Replace "Discuss Your Architecture" CTA with "View on GitHub"

---

## Phase 10: Hacker News / OSS Stress Test

### Simulated HN Reader Scan

**Title:** "Show HN: Settler – Open-source reconciliation engine with replayable runs and evidence generation"

**Reader reaction (5 seconds):** "Reconciliation engine? Interesting. What does it actually do?"

**Clicks through to repo. Reads tagline:** "The open-source reconciliation control plane for provable financial truth."

**Reaction:** "Control plane for provable financial truth... that's a lot of words. What does it actually do? Is this for crypto? Is this for accounting?"

**Reads "How it works":** "Ingest, reconcile, review, replay. OK, I get it now. But I had to read past the tagline to understand."

**Scrolls to quickstart:** "Needs Postgres/Supabase. I'm not setting that up to evaluate a project. Skip."

**Checks stars, license, activity:** "Apache 2.0, monorepo, active commits. Looks serious."

### Would a developer try this project?

**Maybe, but only if they already have the reconciliation problem.** The current positioning requires the reader to already understand what financial reconciliation is and why it's painful. The project does not create recognition of the problem for developers who haven't encountered it yet.

### Recommended improvements for HN launch

1. **Title:** "Settler: Open-source engine that reconciles financial data, finds mismatches, and proves the results are correct"
2. **First line of README should describe the problem, not the product**
3. **Zero-config demo** — `npx settler demo` or equivalent that works without database setup
4. **Terminal GIF** in README showing: run demo → mismatch appears → evidence generated → replay confirms
5. **"Why I built this" narrative** in the HN post: concrete pain story from reconciling Stripe payouts

---

## Phase 11: VC / Founder Scan

### What problem does this solve?

Every company that processes payments needs to reconcile: Stripe says X, the bank says Y, the ledger says Z. When these don't match — and they always don't match — someone has to find and explain the difference. Today this happens in spreadsheets, one-off scripts, and manual processes that don't scale and can't be audited.

### Who needs it?

- **Immediately:** Any company processing 1,000+ transactions/month across multiple financial systems (Stripe + bank + ERP). This includes e-commerce, SaaS with usage billing, fintech, and marketplaces.
- **At scale:** Any company where reconciliation accuracy is a compliance, audit, or operational requirement.

### Why is it defensible?

1. **Domain depth:** Reconciliation is a specific, deeply technical problem. The matching rules, evidence generation, and replay mechanism are not trivially replicated by a generic data pipeline tool.
2. **Trust moat:** Financial teams that adopt a reconciliation engine and build their rules on it do not switch easily. The rules, evidence history, and audit trail create lock-in through value, not contracts.
3. **OSS adoption → enterprise conversion:** The open-source engine gets adopted by engineering teams. The enterprise tier (governance, advanced controls, managed hosting) is sold to the organization. This is the proven OSS commercialization model.

### Concise explanation for a founder/VC

> Settler is an open-source reconciliation engine. Companies use it to automatically match financial records across Stripe, banks, ERPs, and ledgers — then find and explain every mismatch. Every run produces cryptographic evidence and can be replayed for audit. Think of it as the reconciliation infrastructure that finance and engineering teams build on instead of spreadsheets and scripts. Open-source core with enterprise extensions.

---

## Phase 12: Output

### 1. Canonical one-line description

> Settler is the open-source engine that reconciles financial data across systems, surfaces mismatches, and produces verifiable evidence for every run.

### 2. 30-second product explanation

> Companies reconcile Stripe payouts against bank deposits, invoices against ledger entries, orders against payments. Today this happens in spreadsheets and scripts that can't explain their results.
>
> Settler is an open-source reconciliation engine. You define matching rules in code, run reconciliation against your data sources, and Settler surfaces every mismatch with full context. Every run generates evidence — what went in, what rules applied, what matched, what didn't. Runs are replayable: same inputs and rules always produce the same results.
>
> Self-host it, version-control your rules, and answer "why don't these numbers match?" in minutes instead of days.

### 3. README intro rewrite

See implementation in README.md — applied directly to file.

### 4. Landing page hero rewrite

See implementation in page.tsx — applied directly to file.

### 5. Differentiation section

See Phase 4 above. Six differentiators with Problem → Feature → Outcome structure.

### 6. Demo narrative

See Phase 6 above. Five-step, five-minute canonical demo.

### 7. Developer adoption explanation

Settler is designed for engineers who are tired of writing reconciliation scripts that break, produce unexplainable results, and can't be audited. Install the SDK, define matching rules in TypeScript, run reconciliation via API or CLI, and inspect evidence in JSON. Rules are code — version-controlled, testable, reviewable. The engine is deterministic — same inputs always produce same outputs. Evidence is generated automatically — no manual audit prep.

### 8. OSS philosophy paragraph

See Phase 7 above. Financial reconciliation requires inspectable infrastructure. Settler is open source because reconciliation engines should be verifiable, not trusted on faith.

### 9. UI language recommendations

See Phase 5 above. 14 terminology replacements from infrastructure jargon to operational language.

### 10. Screenshot plan

Five visuals: Reconciliation Timeline, Mismatch Explanation View, Evidence Viewer, Rule Check Results, Run Replay Comparison. See Phase 8 for descriptions and placement guidance.

### 11. Adoption friction analysis

See Phase 9. Key friction points: abstract tagline, database requirement for demo, root-level doc clutter, enterprise-sales CTAs in OSS context, no visual preview in README.

### 12. Product clarity score

| Dimension                | Score (1-10) | Notes                                                         |
| ------------------------ | ------------ | ------------------------------------------------------------- |
| Tagline clarity          | 5/10         | "Control plane for provable financial truth" requires parsing |
| Problem recognition      | 6/10         | Pain narrative exists but is buried below the fold            |
| Solution clarity         | 7/10         | "How it works" section is solid                               |
| Demo accessibility       | 5/10         | Requires database setup; no zero-config path                  |
| Technical credibility    | 8/10         | Evidence chain, replay, determinism are strong                |
| Visual communication     | 3/10         | No screenshots, no GIFs, no visual previews                   |
| Developer onboarding     | 6/10         | Quickstart exists but has friction                            |
| OSS positioning          | 7/10         | Apache 2.0, self-host messaging is clear                      |
| Enterprise clarity       | 7/10         | OSS vs Enterprise boundary is documented                      |
| Overall first impression | 6/10         | Serious but requires effort to understand                     |

**Overall product clarity score: 6/10**

Target after implementing recommendations: 8.5/10
