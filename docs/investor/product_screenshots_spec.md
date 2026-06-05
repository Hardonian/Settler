# Settler — Product Screenshots Specification

**Purpose:** Define the 12 screenshots needed for investor materials
**Status:** Each screenshot must be captured from the running product — no mockups, no placeholders

---

## Capture Requirements

- **Resolution:** 1920×1080 minimum (Retina preferred)
- **Browser:** Chrome, dark mode enabled (if product supports), clean browser window
- **Data:** Use demo seed data (`pnpm demo:seed`) for consistent, realistic content
- **Annotations:** Add callout boxes and arrows in post-processing (Figma, Snagit, or Cleanshot)
- **Format:** PNG (lossless) for investor materials, WebP for web

---

## Screenshot List

### 1. Console Dashboard (Landing)

- **Route:** `/console` or `/dashboard`
- **What to show:** Top-level workspace overview — recent runs, exception count, match rate trend, active integrations
- **Annotations:**
  - Circle the workspace/tenant name → "Tenant-isolated workspace"
  - Arrow to match rate → "Improving over time"
- **Investor message:** "This is the operator's home. One glance shows reconciliation health."

### 2. Data Source Configuration

- **Route:** `/integrations` or `/console/integrations`
- **What to show:** List of connected data sources — Stripe adapter configured, bank feed connected, status indicators (green = active)
- **Annotations:**
  - Callout: "25+ adapters available"
  - Arrow to credential status → "Encrypted credential storage"
- **Investor message:** "Connect once, reconcile automatically."

### 3. CSV Upload / Ingestion

- **Route:** Reconciliation run creation page
- **What to show:** Upload interface with two CSVs being uploaded, column mapping preview, normalized transaction preview
- **Annotations:**
  - Label Source A and Source B
  - Arrow to normalized view → "Adapter normalizes to common format"
- **Investor message:** "Data from any source, normalized automatically."

### 4. Reconciliation Run Configuration

- **Route:** Run setup page
- **What to show:** Tolerance settings (amount tolerance $0.50, date tolerance 3 days), policy selection, source selection
- **Annotations:**
  - Callout: "Configurable business rules"
  - Arrow to determinism indicator → "Same inputs → same output, always"
- **Investor message:** "Business logic is configurable, not hardcoded."

### 5. Reconciliation Run Results

- **Route:** Run results page (after a completed run)
- **What to show:** Summary panel with matched/unmatched/exception counts, match rate percentage, run duration, audit stage indicators
- **Annotations:**
  - Circle match rate → "92% auto-matched"
  - Arrow to exception count → "8 items need review"
  - Arrow to audit stages → "Every stage is tracked"
- **Investor message:** "92% of transactions matched automatically. 8 exceptions surfaced for review."

### 6. Exception Queue

- **Route:** Exception review page
- **What to show:** List of unmatched items with severity indicators, amount discrepancies, suggested matches, resolution actions
- **Annotations:**
  - Arrow to suggested match → "System suggests based on learned rules"
  - Callout: "Structured queue, not email threads"
- **Investor message:** "Exceptions are structured, prioritized, and actionable."

### 7. Exception Detail / Adjudication

- **Route:** Single exception detail view
- **What to show:** Side-by-side comparison of two almost-matching transactions, discrepancy highlighted, adjudication options (approve, reject, manual match), resolution history
- **Annotations:**
  - Arrow to discrepancy → "$0.35 difference — within tolerance?"
  - Arrow to resolution history → "Every decision is recorded"
  - Callout: "This creates a new matching rule"
- **Investor message:** "Every resolution becomes institutional memory."

### 8. Proofpack Export

- **Route:** Proofpack page or export modal
- **What to show:** Proofpack contents — run metadata, match summary, exception resolutions, hash chain, export/download buttons
- **Annotations:**
  - Arrow to hash chain → "Cryptographically linked — tamper-evident"
  - Arrow to export button → "One-click export for auditors"
- **Investor message:** "Audit-ready evidence, not a PDF summary."

### 9. Reconciliation History / Run List

- **Route:** `/reconciliation` or run history page
- **What to show:** List of past reconciliation runs with dates, match rates, exception counts, status (completed, in review)
- **Annotations:**
  - Arrow showing match rates improving: "85% → 88% → 91% → 93%"
  - Callout: "Compounding intelligence visible over time"
- **Investor message:** "Match rates improve with every run — that's the moat."

### 10. Rules Engine / Matching Rules

- **Route:** Rules configuration page or `reconciliation_rules` view
- **What to show:** List of custom rules with match counts, success rates, creation dates, categories
- **Annotations:**
  - Arrow to success_rate column → "Each rule tracks its own performance"
  - Callout: "47 rules, avg 91% success rate"
- **Investor message:** "Operator decisions become durable, measurable rules."

### 11. Security / Tenant Isolation

- **Route:** Settings or admin page showing RLS status, or terminal showing security verification
- **What to show:** Either (a) security settings page showing tenant isolation status, or (b) terminal output of `pnpm verify:security` passing, or (c) SECURITY_INVARIANTS.md rendered
- **Annotations:**
  - Callout: "9 invariants, all code-backed"
  - Arrow to RLS indicators → "Database-level isolation"
- **Investor message:** "Multi-tenancy isn't an afterthought — it's the foundation."

### 12. Billing / Usage Dashboard

- **Route:** `/console/usage` or `/billing`
- **What to show:** Usage metrics — transactions processed, current tier, overage tracking, billing period
- **Annotations:**
  - Arrow to transaction count → "Usage-based revenue scales with customer growth"
  - Arrow to tier indicator → "Transparent pricing"
- **Investor message:** "Revenue grows as customers process more transactions."

---

## Capture Workflow

```bash
# 1. Start the dev stack
pnpm dev:stack

# 2. Seed demo data
pnpm demo:seed

# 3. Navigate to each route and capture
# Use browser DevTools > Device Toolbar for consistent viewport
# Set viewport to 1920x1080

# 4. Save raw screenshots to:
#    docs/investor/screenshots/raw/

# 5. Add annotations (Figma/Cleanshot) and save to:
#    docs/investor/screenshots/annotated/
```

## Annotation Style Guide

- **Callout boxes:** White background, dark border, 12px Inter font
- **Arrows:** 2px solid, dark gray (#333), with arrowhead
- **Highlight circles:** 2px dashed, red (#E53E3E), no fill
- **Number badges:** Circular, blue (#3182CE), white text, 20px diameter
- **Consistent margin:** 20px from screen edges for all annotations

---

## Usage in Investor Materials

| Material               | Screenshots Used              |
| ---------------------- | ----------------------------- |
| Pitch deck (12 slides) | #1, #5, #6, #8, #9, #10       |
| One-page memo          | #5 (single hero screenshot)   |
| Demo script backup     | All 12 (for offline fallback) |
| Due diligence folder   | All 12                        |
| Blog / marketing       | #1, #3, #5, #6, #8            |
