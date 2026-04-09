# Settler — Product Clarity and UX Audit

## PHASE 1 — Cognitive Legibility Test

### Simulated first impressions

**Senior backend engineer (10 seconds):**
Current: "Some kind of financial data pipeline... reconciliation control plane? What does 'provable financial truth' mean concretely?"
Problem: "control plane" is infrastructure jargon. "Provable financial truth" is abstract. The engineer needs to know what it _does_, not what category it belongs to.

**Startup founder (10 seconds):**
Current: "Reconciliation software... open source... something about determinism. Is this for my finance team or my engineering team?"
Problem: The hero heading ("Reconciliation Infrastructure for Financial Operations") reads like a category label, not a value proposition. Founders need to see the problem solved.

**Finance / operations lead (10 seconds):**
Current: "This looks like a developer tool. Is it for me? What does 'deterministic' mean in practice?"
Problem: The language is engineer-facing. Finance people think in terms of "matching transactions," "finding discrepancies," and "proving the books are right." They do not think in terms of "deterministic pipelines."

### Ideal one-sentence explanation

> **Settler is the open-source engine that reconciles financial data, surfaces mismatches instantly, and proves every result is correct.**

Alternative (more technical):

> **Settler is an open-source reconciliation engine that matches financial records, detects discrepancies, and produces verifiable evidence for every run.**

### What to change

The current tagline — "open-source reconciliation control plane for provable financial truth" — has two problems:

1. **"Control plane"** is Kubernetes vocabulary. It signals infrastructure, not outcome. Replace with "engine" — concrete, familiar, accurate.
2. **"Provable financial truth"** is a philosophical claim. Replace with a concrete capability: "proves every result is correct" or "produces verifiable evidence."

---

## PHASE 2 — Pain Narrative

### The pain (Before Settler)

Teams reconcile financial data across Stripe, QuickBooks, bank feeds, internal ledgers, and ERPs. Today that looks like:

- **Spreadsheet matching.** Someone downloads CSVs from two systems and VLOOKUPs them together. Errors are invisible. Results are not reproducible.
- **One-off scripts.** An engineer writes a Python script that runs once, produces a number, and nobody can explain how it got that number three months later.
- **Silent mismatches.** A $12,000 discrepancy sits undetected until month-end close. By then, the context is gone.
- **Unexplainable results.** An auditor asks "why do these two numbers differ?" and the answer is "we don't know — the person who ran the script left."
- **Audit dread.** Every reconciliation cycle is a fire drill because there is no system of record for what was checked, when, and what the results were.

### The resolution (After Settler)

- **Reconciliation is executable.** Define matching rules in code. Run them through an API. Get structured results.
- **Mismatches surface immediately.** Discrepancies are detected, categorized, and queued for review — not buried in a spreadsheet tab.
- **Every run produces evidence.** Each reconciliation generates a verifiable evidence pack: what data went in, what rules were applied, what came out, and a cryptographic fingerprint.
- **Results are explainable.** When someone asks "why do these numbers differ?" you open the run evidence and show them exactly what happened.
- **Runs are replayable.** Re-execute the same reconciliation with the same inputs. Get the same outputs. Prove it.

---

## PHASE 3 — Developer Mental Model

### The core loop

```
1. Define rules     → Write matching rules (amount tolerance, date window, field mapping)
2. Run reconciliation → Settler executes deterministically against your data sources
3. Detect mismatches → Discrepancies are surfaced, categorized, and queued
4. Generate evidence → Every run produces a verifiable evidence pack (data + rules + results + hash)
5. Replay and verify → Re-run with identical inputs to confirm identical outputs
```

### Where this loop must appear

| Location          | Current state                                      | Recommendation                                                                  |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| README intro      | Partially present ("How it works" section)         | Good structure. Replace "Ingest and normalize" with clearer verbs. See Phase 5. |
| Docs homepage     | Present but buried                                 | Lead with the loop before the doc map                                           |
| Landing page hero | Not present — hero focuses on category positioning | Add the loop as a visual sequence below the hero                                |
| Demo walkthrough  | Present in docs/demo.md                            | Expand with expected output descriptions                                        |

### Recommended README "How it works" rewrite

```markdown
## How it works

1. **Define rules** — write matching rules in code (amount tolerance, date windows, field mappings).
2. **Run reconciliation** — execute via API, SDK, or CLI. Same inputs always produce same outputs.
3. **Review mismatches** — discrepancies are surfaced and queued for operator review.
4. **Export evidence** — every run generates a verifiable evidence pack with cryptographic fingerprint.
5. **Replay any run** — re-execute with identical inputs to confirm identical results.
```

---

## PHASE 4 — Differentiation

### Differentiator 1: Replayable Runs

**Problem:** Reconciliation results cannot be reproduced. When an auditor asks "how did you get this number?" there is no way to re-derive it.

**Feature:** Settler records the exact inputs, rules, and configuration for every run. Any run can be replayed to produce identical outputs.

**Outcome:** You can prove that results are correct by re-running the same reconciliation and comparing fingerprints.

### Differentiator 2: Verifiable Evidence

**Problem:** Reconciliation outputs are numbers in a spreadsheet with no chain of custody.

**Feature:** Every run generates an evidence pack containing the input data snapshot, applied rules, outputs, and a SHA-256 hash chain.

**Outcome:** Each result has a cryptographic proof of what went in and what came out. Auditors can verify without re-running.

### Differentiator 3: Rules as Code

**Problem:** Reconciliation logic lives in spreadsheet formulas, undocumented scripts, or someone's head.

**Feature:** Matching rules are defined in code, version-controlled, and executed through a typed API/SDK.

**Outcome:** Reconciliation logic is reviewable in pull requests, testable in CI, and traceable through git history.

### Differentiator 4: Structured Exception Handling

**Problem:** Mismatches are discovered manually and tracked in email threads or Slack messages.

**Feature:** Settler queues mismatches into a structured review workflow with categorization, assignment, and resolution tracking.

**Outcome:** Every discrepancy has a status, an owner, and a resolution record.

### Differentiator 5: Self-Hostable Open Source Core

**Problem:** Financial reconciliation tools are closed-source SaaS products that require sending financial data to a third party.

**Feature:** Settler's core engine is open source (Apache 2.0) and designed for self-hosting.

**Outcome:** Your financial data stays in your infrastructure. You can inspect and audit the reconciliation logic itself.

### Differentiator 6: Deterministic Execution

**Problem:** Reconciliation tools that use AI/ML matching produce different results on different runs, making debugging impossible.

**Feature:** Settler's matching engine is deterministic. Same data + same rules = same results. Always.

**Outcome:** Debugging, testing, and auditing are tractable because results are reproducible.

---

## PHASE 5 — UI Language Clarity

### Current terminology audit

| Current term                    | Problem                                           | Recommended replacement                      |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| "Reconciliation control plane"  | Kubernetes jargon; unclear to non-infra engineers | "Reconciliation engine"                      |
| "Provable financial truth"      | Abstract; philosophical                           | "Verifiable reconciliation results"          |
| "Evidence artifacts"            | "Artifact" is CI/CD jargon                        | "Evidence" or "evidence pack"                |
| "Deterministic pipeline"        | Pipeline is ETL jargon                            | "Replayable workflow" or "deterministic run" |
| "Governance boundaries"         | Vague enterprise speak                            | "Access controls and audit trails"           |
| "Failure surface reduction"     | Academic risk language                            | "Fewer reconciliation errors"                |
| "Probabilistic drift"           | ML/stats jargon                                   | "Inconsistent results"                       |
| "Operational confidence"        | Vague                                             | "Reliable, repeatable results"               |
| "Reconciliation infrastructure" | Category label, not value                         | "Reconciliation engine"                      |
| "Variance sets"                 | Financial quant jargon                            | "Mismatches" or "discrepancies"              |
| "Exception operations"          | Internal process term                             | "Mismatch review"                            |
| "Tenant isolation"              | Infrastructure jargon                             | "Workspace separation"                       |
| "Policy-based access controls"  | Verbose                                           | "Role-based permissions"                     |
| "Connector payloads"            | Developer jargon                                  | "Data from connected systems"                |

### Landing page specific fixes

| Current text                                                                          | Issue                                            | Recommended text                                                                                              |
| ------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| "Reconciliation Infrastructure for Financial Operations" (hero h1)                    | Category label, not benefit                      | "Reconcile Financial Data. Prove Every Result."                                                               |
| "Normalize data. Apply explicit rules. Surface variances for review." (hero subtitle) | Passive, jargon-heavy                            | "Match transactions across systems. Detect mismatches instantly. Generate verifiable evidence for every run." |
| "Operational Confidence Through Determinism" (section header)                         | Abstract                                         | "Same Data, Same Rules, Same Results"                                                                         |
| "Deterministic Reconciliation Engine" (badge)                                         | Fine for engineers, opaque for others            | "Open Source Reconciliation Engine"                                                                           |
| "Discuss Your Architecture" (CTA)                                                     | Presumes the visitor has an architecture problem | "Talk to Us" or "Book a Demo"                                                                                 |
| "What Mature Financial Infrastructure Evolves Toward" (section header)                | Condescending framing                            | "Why Teams Switch to Settler"                                                                                 |
| "Failure Surface Reduction" (card title)                                              | Incomprehensible to target users                 | "Fewer Reconciliation Errors"                                                                                 |

---

## PHASE 6 — Demo Story

### Canonical five-minute demo

**Setup (30 seconds):**

```bash
git clone https://github.com/settler/settler
cd settler
pnpm install
```

**Step 1 — Run the demo reconciliation (60 seconds):**

```bash
pnpm demo
```

What happens: Settler loads sample transaction data from two sources (e.g., Stripe charges and internal ledger entries), applies matching rules, and produces results.

**Step 2 — See the mismatches (60 seconds):**
Open `examples/demo-output/results.json`. Show:

- Matched transactions (amounts and dates align)
- Mismatched transactions (amount differs by $0.50)
- Unmatched transactions (exists in source A but not source B)

**Step 3 — Inspect the evidence (60 seconds):**
Open `examples/demo-output/evidence.json`. Show:

- Input data fingerprint
- Rules that were applied
- SHA-256 hash of the complete run
- Timestamp and run metadata

**Step 4 — Replay the run (60 seconds):**

```bash
pnpm settler:replay examples/demo-output/evidence.json
```

What happens: Settler re-executes the same reconciliation. The output hash matches the original. This proves the results are reproducible.

**Step 5 — View the report (30 seconds):**
Open `examples/demo-output/report.html` in a browser. Show the human-readable reconciliation summary.

**Key demo talking points:**

- "This is the same workflow you would use in production, just with sample data."
- "Every run produces evidence. Every run can be replayed."
- "The matching rules are code — you can version control them, review them in PRs, test them in CI."

---

## PHASE 7 — OSS Story

### Why open source matters for reconciliation

Financial reconciliation is a trust problem. When two systems disagree about money, someone has to determine which number is correct and prove it. That proof must be inspectable.

Closed-source reconciliation tools ask you to trust their matching logic without seeing it. When results are wrong, you cannot diagnose why. When auditors ask how results were derived, you point to a vendor's black box.

Settler is open source because reconciliation requires transparency:

- **Inspect the logic.** The matching engine is source-available. You can read exactly how two records are determined to match or not match.
- **Verify the results.** Evidence packs include cryptographic fingerprints. Anyone can verify that results correspond to specific inputs and rules.
- **Own the deployment.** Self-host in your infrastructure. Your financial data does not leave your control.
- **Extend without permission.** Write custom adapters, add matching rules, integrate with your systems. No vendor gatekeeping.

Open source is not a distribution strategy for Settler. It is a requirement of the problem domain. Financial controls demand verifiability, and verifiability demands transparency.

---

## PHASE 8 — Visual Story

### Recommended visuals

| Visual                          | Purpose                                                                                     | Where it appears                    |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Reconciliation flow diagram** | Shows data flowing from two sources → matching engine → results + evidence                  | README, landing hero, docs homepage |
| **Mismatch detail view**        | Shows a specific discrepancy: expected $100.00, got $99.50, with field-level diff           | Landing page, demo walkthrough      |
| **Evidence pack viewer**        | Shows the structure of an evidence JSON: inputs, rules, outputs, hash                       | Docs, demo walkthrough              |
| **Run timeline**                | Shows a sequence of reconciliation runs with status (matched / mismatches found / replayed) | Dashboard screenshot, landing page  |
| **Replay comparison**           | Side-by-side: original run fingerprint vs replay fingerprint (match confirmed)              | Demo walkthrough, docs              |
| **Review queue**                | Shows queued mismatches with status, assignee, and resolution                               | Landing page, product docs          |

### Visual design principles

- Use real data structures (JSON snippets, actual field names) — not abstract diagrams
- Show before/after: messy spreadsheet vs structured Settler output
- Keep colors minimal: black/white/slate with red for mismatches, green for matches

---

## PHASE 9 — Developer Attraction

### Current strengths

- Clean monorepo structure with clear package boundaries
- TypeScript SDK with good API design in the code example
- Apache 2.0 license
- Demo command exists (`pnpm demo`)
- Evidence/replay concept is genuinely differentiated

### Friction points

| Friction                                | Impact                                                            | Fix                                                                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quickstart requires Postgres + Supabase | Blocks immediate trial; most devs do not have Supabase configured | Add a zero-dependency demo mode that runs against local JSON files (the `pnpm demo` command partially does this — make it the primary entry point) |
| No `npx` or single-command start        | Developers expect `npx create-settler` or `docker compose up`     | Add a `docker compose` quickstart and/or npx scaffolding                                                                                           |
| README quickstart has 6 steps           | Too many steps before first value                                 | Reduce to 3: clone, install, `pnpm demo`                                                                                                           |
| Demo output is JSON files               | Not visual; hard to appreciate the value                          | Add a `report.html` viewer that opens automatically, or a terminal-based summary                                                                   |
| No GitHub topic tags visible            | Reduces discoverability                                           | Add topics: reconciliation, fintech, open-source, audit, financial-data                                                                            |
| README has too many doc links           | Decision paralysis                                                | Reduce to 3 links: Quickstart, API Reference, Architecture                                                                                         |
| No animated GIF or screenshot in README | Developers expect visual proof of what a tool does                | Add a terminal recording or screenshot                                                                                                             |

### Recommended README structure for developer attraction

```
1. One-sentence description
2. Screenshot or terminal recording
3. Three-step quickstart (clone → install → demo)
4. "What just happened" explanation of demo output
5. Core loop diagram
6. Three links: Quickstart, API, Architecture
7. Contributing
8. License
```

---

## PHASE 10 — Hacker News / OSS Stress Test

### Simulated HN reader scan

**Title they see:** "Settler — Open Source Reconciliation Engine"

**First 10 seconds:**

- Clicks through to GitHub
- Sees README: "open-source reconciliation control plane for provable financial truth"
- Reaction: "What is a reconciliation control plane? Is this for Kubernetes? ...No, it's financial. Okay, but what does 'provable financial truth' mean?"
- Scrolls to "How it works" — sees the 4-step loop. This is clearer.
- Looks for a demo GIF or screenshot. Does not find one.
- Checks star count and last commit date.

**Would they try it?** Probably not on first visit.

**Why not:**

1. The value proposition requires reading past the first sentence
2. No visual proof of what it does
3. Quickstart requires Supabase setup — too much friction for a "let me try this" moment
4. The name "Settler" does not self-describe (unlike "Papermark" which implies document marking)

**Improvements:**

1. Lead with a concrete problem statement: "Reconciling financial data across Stripe, QuickBooks, and your database? Settler matches records, finds discrepancies, and proves the results."
2. Add a terminal recording showing `pnpm demo` → output → replay
3. Make `pnpm demo` work with zero external dependencies
4. Add a "Show HN" narrative: "We built the reconciliation engine we wished existed when we were closing books at [company]."

---

## PHASE 11 — VC / Founder Scan

### What problem does this solve?

Every company that moves money needs to reconcile financial records across systems. Today, this is done with spreadsheets and scripts. It breaks at scale, produces unexplainable results, and fails audits. Settler makes reconciliation executable, repeatable, and verifiable.

### Who needs it?

- **Fintech companies** reconciling payment processor data against internal ledgers
- **SaaS companies** matching Stripe revenue against accounting systems
- **Financial institutions** running regulatory reconciliation
- **Any company** with month-end close processes that involve matching records across systems

### Why is it defensible?

1. **Technical moat:** Deterministic execution + cryptographic evidence chain is genuinely hard to build. The Rust kernel (settler-kernel) provides verifiable replay at the cryptographic level.
2. **OSS adoption moat:** Self-hosted reconciliation becomes embedded in financial workflows. Switching costs are high once rules and integrations are in place.
3. **Data gravity:** Once Settler is the system of record for reconciliation, historical evidence and audit trails create lock-in.
4. **Enterprise expansion:** OSS core + enterprise governance/tenancy creates a natural upgrade path.

### Concise explanation for founders/VCs

> Settler is to financial reconciliation what GitHub Actions is to CI/CD: it takes a manual, error-prone process and makes it executable, version-controlled, and auditable. The open-source engine handles matching and evidence generation. Enterprise features add governance, multi-tenancy, and advanced controls. Every company that processes payments needs reconciliation, and today they all do it with spreadsheets.

---

## PHASE 12 — Output

### 1. Canonical one-line description

> Settler is the open-source engine that reconciles financial data, detects mismatches, and proves every result is correct.

### 2. Thirty-second product explanation

> Financial teams reconcile data across Stripe, banks, ERPs, and internal ledgers using spreadsheets and scripts. Results are fragile, unexplainable, and fail under audit pressure.
>
> Settler is an open-source reconciliation engine. You define matching rules in code, run reconciliation through an API, and get structured results with verifiable evidence. Every run is deterministic — same data and same rules always produce the same output. Every run can be replayed to prove the results. Mismatches are surfaced and queued for review, not buried in a spreadsheet.

### 3. README intro rewrite

```markdown
# Settler

**Open-source reconciliation engine. Match financial records. Detect mismatches. Prove every result.**

Settler reconciles data across payment processors, banks, ERPs, and internal systems.
It applies explicit matching rules, surfaces discrepancies for review, and generates
verifiable evidence for every run.

## Try it in 60 seconds

\`\`\`bash
git clone https://github.com/settler/settler && cd settler
pnpm install
pnpm demo
\`\`\`

This runs a sample reconciliation against demo data. Open `examples/demo-output/` to see:

- `results.json` — matched and mismatched records
- `evidence.json` — cryptographic proof of what data, rules, and config produced these results
- `report.html` — human-readable reconciliation summary

Replay the same run to verify determinism:

\`\`\`bash
pnpm settler:replay examples/demo-output/evidence.json
\`\`\`

## How it works

1. **Define rules** — write matching rules in code (amount tolerance, date windows, field mappings).
2. **Run reconciliation** — execute via API, SDK, or CLI. Same inputs always produce same outputs.
3. **Review mismatches** — discrepancies are surfaced and queued for operator review.
4. **Export evidence** — every run generates a verifiable evidence pack with cryptographic fingerprint.
5. **Replay any run** — re-execute with identical inputs to confirm identical results.
```

### 4. Landing page hero rewrite

**Badge:** `Open Source Reconciliation Engine`

**H1:** `Reconcile Financial Data. Prove Every Result.`

**Subtitle:** `Match transactions across Stripe, banks, and ERPs. Detect mismatches instantly. Generate verifiable evidence for every reconciliation run.`

**Primary CTA:** `Try the Demo` (link to quickstart)
**Secondary CTA:** `Read the Docs` (link to documentation)

### 5. Differentiation section

See Phase 4 above. Summary:

| Differentiator          | One-line outcome                                        |
| ----------------------- | ------------------------------------------------------- |
| Replayable runs         | Re-run any reconciliation and get identical results     |
| Verifiable evidence     | Every result has a cryptographic proof chain            |
| Rules as code           | Reconciliation logic in version control, testable in CI |
| Structured exceptions   | Mismatches are queued, assigned, and tracked            |
| Self-hostable           | Your financial data stays in your infrastructure        |
| Deterministic execution | Same data + same rules = same results, always           |

### 6. Demo narrative

See Phase 6 above. Core flow:

```
pnpm demo → see mismatches → inspect evidence → replay run → verify fingerprint matches
```

Total time: under 5 minutes. Zero external dependencies for the demo path.

### 7. Developer adoption explanation

Settler is adopted by engineering teams who currently reconcile financial data with custom scripts. The adoption path:

1. **Try the demo** — `pnpm demo` runs a complete reconciliation with sample data
2. **Read the results** — structured JSON output showing matches and mismatches
3. **Connect real data** — swap demo data for your Stripe/bank/ERP sources using adapters
4. **Define your rules** — write matching rules in TypeScript, commit them to your repo
5. **Run in production** — execute via API or CLI, integrate with your deployment pipeline

The SDK is TypeScript-first with full type safety. Rules are code, so they go through the same review and CI process as application code.

### 8. OSS philosophy paragraph

> Financial reconciliation is a trust problem. When two systems disagree about money, someone must determine which number is correct and prove it. That proof must be inspectable. Settler is open source because reconciliation demands transparency: the matching logic is source-available, results include cryptographic verification, and the engine runs in your infrastructure. This is not an ideological choice — it is a requirement of the problem domain.

### 9. UI language recommendations

See Phase 5 table above. Priority changes:

1. **"Control plane" → "Engine"** — everywhere in marketing copy
2. **"Provable financial truth" → "Verifiable reconciliation results"** — README, landing page
3. **"Variance / variance sets" → "Mismatches" or "discrepancies"** — all user-facing surfaces
4. **"Evidence artifacts" → "Evidence"** — remove "artifacts" from user-facing text
5. **"Deterministic pipeline" → "Replayable workflow"** — docs and marketing
6. **"Discuss Your Architecture" → "Book a Demo" or "Talk to Us"** — landing page CTA

### 10. Screenshot plan

| Screenshot              | Description                                | Priority                     |
| ----------------------- | ------------------------------------------ | ---------------------------- |
| Terminal demo recording | `pnpm demo` → output → replay              | P0 — add to README           |
| Mismatch detail         | Specific discrepancy with field-level diff | P0 — add to landing page     |
| Evidence JSON viewer    | Structured view of evidence.json           | P1 — add to docs             |
| Review queue            | List of mismatches with status/assignee    | P1 — add to landing page     |
| Reconciliation timeline | Sequence of runs with outcomes             | P2 — add to dashboard docs   |
| Replay comparison       | Original vs replay fingerprint match       | P2 — add to demo walkthrough |

### 11. Adoption friction analysis

| Friction point                       | Severity | Current state                    | Recommended fix                                                               |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------- |
| Supabase required for quickstart     | High     | Cannot try without external DB   | Make `pnpm demo` fully self-contained (it may already be — clarify in README) |
| No Docker quickstart                 | Medium   | No docker-compose for local dev  | Add `docker compose up` one-liner                                             |
| No visual in README                  | High     | Text-only README                 | Add terminal recording GIF                                                    |
| Too many doc links                   | Medium   | 7+ links in README               | Reduce to 3 primary paths                                                     |
| Name does not self-describe          | Low      | "Settler" requires explanation   | Cannot change — mitigate with clear tagline                                   |
| No TTFV metric                       | Medium   | No mention of expected demo time | Add "Try it in 60 seconds" framing                                            |
| CTA says "Discuss Your Architecture" | Medium   | Presumes architecture complexity | Change to "Book a Demo" or "Talk to Us"                                       |

### 12. Product clarity score

| Dimension                  | Score (1-10) | Notes                                                                   |
| -------------------------- | ------------ | ----------------------------------------------------------------------- |
| One-sentence clarity       | 5/10         | "Control plane for provable financial truth" requires decoding          |
| Homepage value proposition | 6/10         | Technically accurate but abstract; hero heading is a category label     |
| Developer quickstart       | 6/10         | Exists but requires Supabase; demo path is buried                       |
| Demo quality               | 7/10         | `pnpm demo` + replay is strong; lacks visual output                     |
| Technical credibility      | 8/10         | Rust kernel, SHA-256 evidence, typed SDK — genuinely differentiated     |
| Documentation structure    | 7/10         | Well-organized; good reader-path segmentation                           |
| OSS appeal                 | 6/10         | Apache 2.0 is right; OSS narrative is underdeveloped                    |
| Visual storytelling        | 3/10         | No screenshots, GIFs, or visual evidence of the product                 |
| Differentiation clarity    | 6/10         | Real differentiators exist but are expressed in infrastructure language |
| Overall adoption readiness | 6/10         | Strong engine, weak presentation layer                                  |

**Summary:** Settler has a genuinely differentiated technical core (deterministic execution, cryptographic evidence, replayable runs, Rust verification kernel). The gap is entirely in presentation: the product's value is expressed in infrastructure vocabulary instead of outcome language. The fixes are straightforward — clearer copy, visual proof, and a frictionless demo path. The engine does not need to change. The story does.

---

_This audit does not modify engine logic, APIs, or features. All recommendations target clarity, terminology, and developer experience._
